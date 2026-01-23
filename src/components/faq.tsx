"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "¿Cómo funcionan los cursos?",
    answer:
      "Los cursos están organizados en módulos con videos, material de lectura y ejercicios prácticos. Puedes avanzar a tu propio ritmo y acceder al contenido 24/7.",
  },
  {
    question: "¿Necesito conocimientos previos?",
    answer:
      "No, nuestros cursos están diseñados para todos los niveles. Comenzamos desde lo básico y avanzamos gradualmente.",
  },
  {
    question: "¿Cuánto tiempo tengo acceso al curso?",
    answer:
      "Una vez que te inscribes en un curso, tienes acceso  por el periodo que compraste y todas las actualizaciones futuras.",
  },
  {
    question: "¿Puedo hacer preguntas sobre el contenido?",
    answer:
      "Sí, cada curso incluye un asistente virtual inteligente disponible 24/7 que puede responder tus dudas y ayudarte con cualquier tema del curso.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos todos los métodos de pago a través de Webpay: tarjetas de crédito, débito y transferencias.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Preguntas Frecuentes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Encuentra respuestas a las preguntas más comunes
          </p>
        </motion.div>

        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="border rounded-lg px-6 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300"
                >
                  <AccordionTrigger className="text-left hover:text-primary hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
