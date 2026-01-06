import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 30

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { messages, courseId, courseName } = await req.json()

    // Verificar autenticación
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores
            }
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar inscripción si hay courseId
    if (courseId) {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("is_active", true)
        .single()

      if (!enrollment) {
        return Response.json(
          { error: "No estás inscrito en este curso" },
          { status: 403 }
        )
      }
    }

    const systemPrompt = courseId
      ? `Eres un profesor virtual experto"${courseName}". 

INSTRUCCIONES IMPORTANTES:
- Explica conceptos de forma clara y estructurada
- Usa formato markdown para mejorar la legibilidad:
  * Usa **negrita** para términos importantes
  * Usa listas numeradas o con viñetas cuando sea apropiado
  * Usa bloques de código para fórmulas matemáticas o código
  * Usa saltos de línea para separar párrafos
- Para fórmulas matemáticas, usa notación LaTeX entre $$ (ej: $$x^2 + y^2 = z^2$$)
- Proporciona ejemplos prácticos cuando sea apropiado
- Sé paciente y educativo
- Responde siempre en español

Ejemplo de buena respuesta:
**Concepto**: [Explicación clara]

**Ejemplo**:
\`\`\`
Código o fórmula aquí
\`\`\`

**Aplicación práctica**: [Ejemplo del mundo real]`
      : `Eres un asistente virtual educativo de Paidek. 

Ayuda a los estudiantes con:
- Información sobre lo que pregunten
- Consejos de aprendizaje

Usa formato markdown para mejorar la presentación. Sé amigable y profesional. Responde siempre en español.`

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", 
      systemInstruction: systemPrompt,
    })

    // Convertir mensajes al formato de Google
    const chatHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        topP: 0.95,
        topK: 40,
      },
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.content)

    // Crear stream de respuesta
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error: any) {
    console.error("Chat API error:", error)
    
    // Manejo específico de errores de cuota
    if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("rate limit")) {
      return Response.json(
        { 
          error: "El servicio de chat ha alcanzado su límite temporal. Por favor, intenta nuevamente en unos minutos."
        },
        { status: 429 }
      )
    }
    
    return Response.json(
      { error: error.message || "Error inesperado en el servicio de chat. Por favor, intenta más tarde." },
      { status: 500 }
    )
  }
}