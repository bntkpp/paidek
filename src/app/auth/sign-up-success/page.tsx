import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Mail, Home } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
              </div>
              <CardTitle className="text-2xl">¡Registro exitoso!</CardTitle>
              <CardDescription>Revisa tu correo electrónico para confirmar tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Te hemos enviado un correo electrónico de confirmación. Por favor, haz clic en el enlace de verificación para activar tu cuenta antes de iniciar sesión.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ir al Inicio
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/auth/login">
                    Ir a Iniciar Sesión
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
