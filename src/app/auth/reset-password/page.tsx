"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, ArrowLeft, KeyRound } from "lucide-react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })

      if (error) throw error

      setSuccess(true)
      setEmail("")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <Card className="border-none shadow-xl">
              <CardHeader className="text-center space-y-2">
                <div className="flex justify-center mb-2">
                  <div className="p-3 rounded-full bg-primary/10">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
                <CardDescription className="text-base">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-2 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">¡Correo enviado!</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full h-11">
                      <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a Inicio de Sesión
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <div className="flex flex-col gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="nombre@ejemplo.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                        {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                      </Button>
                    </div>
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      ¿Recordaste tu contraseña?{" "}
                      <Link href="/auth/login" className="text-primary font-medium hover:underline underline-offset-4">
                        Iniciar Sesión
                      </Link>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
