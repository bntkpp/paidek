import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-lg text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
            <p>
              Recopilamos información que nos proporcionas directamente cuando te registras en nuestra plataforma, 
              realizas una compra o te comunicas con nosotros. Esto puede incluir tu nombre, dirección de correo electrónico, 
              información de pago y datos sobre tu progreso en los cursos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Uso de la Información</h2>
            <p>
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
              <li>Procesar transacciones y enviar confirmaciones de compra.</li>
              <li>Enviar notificaciones técnicas, actualizaciones de seguridad y mensajes administrativos.</li>
              <li>Responder a tus comentarios y preguntas.</li>
              <li>Personalizar tu experiencia de aprendizaje.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Protección de Datos</h2>
            <p>
              Implementamos medidas de seguridad razonables para proteger tu información personal contra pérdida, robo, 
              uso indebido y acceso no autorizado. Sin embargo, ninguna transmisión de datos por Internet es 100% segura.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cookies</h2>
            <p>
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia en nuestra plataforma, 
              analizar el uso del sitio y recordar tus preferencias. Puedes configurar tu navegador para rechazar todas las cookies, 
              pero esto podría limitar algunas funcionalidades del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Compartir Información</h2>
            <p>
              No vendemos ni alquilamos tu información personal a terceros. Solo compartimos información con proveedores de servicios 
              que nos ayudan a operar nuestra plataforma (como procesadores de pagos), siempre bajo estrictos acuerdos de confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Tus Derechos</h2>
            <p>
              Tienes derecho a acceder, corregir o eliminar tu información personal. Puedes gestionar la mayoría de tus datos 
              directamente desde tu perfil de usuario o contactándonos para solicitar asistencia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra Política de Privacidad, contáctanos en: colegiopaideiaonline@gmail.com
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
