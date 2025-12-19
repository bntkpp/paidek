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
import { CheckCircle2, ArrowLeft } from "lucide-react"

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
                <CardDescription>
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="space-y-4">
                    <Alert className="border-green-500/50 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        ¡Correo enviado! Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                      </AlertDescription>
                    </Alert>
                    <Button asChild variant="outline" className="w-full">
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
                          placeholder="correo@ejemplo.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                      </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                      ¿Recordaste tu contraseña?{" "}
                      <Link href="/auth/login" className="underline underline-offset-4">
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
