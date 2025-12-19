import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-lg text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar la plataforma educativa Paidek, aceptas estar sujeto a estos Términos y Condiciones. 
              Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
            <p>
              Paidek proporciona una plataforma de aprendizaje en línea diseñada para la preparación de exámenes libres. 
              Nuestros servicios incluyen acceso a cursos, material de estudio, evaluaciones y seguimiento del progreso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Cuentas de Usuario</h2>
            <p>
              Para acceder a la mayoría de las funciones de la plataforma, debes registrarte y crear una cuenta. 
              Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. La cuenta es personal e intransferible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Pagos y Reembolsos</h2>
            <p>
              Los cursos y materiales se ofrecen mediante pago único o suscripción, según se indique. 
              Todos los pagos se procesan de forma segura. Las políticas de reembolso se evaluarán caso a caso 
              dentro de los primeros 10 días de la compra, siempre que no se haya consumido más del 20% del contenido.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Propiedad Intelectual</h2>
            <p>
              Todo el contenido disponible en Paidek, incluyendo textos, gráficos, logotipos, imágenes, videos y software, 
              es propiedad de Paidek o de sus licenciantes y está protegido por las leyes de derechos de autor. 
              Está prohibida la reproducción, distribución o venta no autorizada de cualquier material.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Modificaciones del Servicio</h2>
            <p>
              Nos reservamos el derecho de modificar o discontinuar, temporal o permanentemente, el servicio (o cualquier parte del mismo) 
              con o sin previo aviso. No seremos responsables ante ti ni ante terceros por ninguna modificación, suspensión o interrupción del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contacto</h2>
            <p>
              Si tienes alguna pregunta sobre estos Términos, por favor contáctanos a través de nuestro correo electrónico: colegiopaideiaonline@gmail.com
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
