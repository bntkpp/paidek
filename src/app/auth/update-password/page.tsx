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
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { CheckCircle2, AlertCircle, Lock, ArrowLeft } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Verificar si es una sesión de recuperación
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const isRecovery = hashParams.get('type') === 'recovery'
      
      setHasSession(!!(session || isRecovery))
      
      if (!session && !isRecovery) {
        setError("El enlace ha expirado o es inválido. Solicita un nuevo enlace de recuperación.")
      }
    }
    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      
      // Sign out to clear the recovery session
      await supabase.auth.signOut()
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
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
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
                <CardDescription className="text-base">
                  Ingresa tu nueva contraseña para asegurar tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-4 p-6 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full animate-in zoom-in duration-300">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">¡Contraseña Actualizada!</h3>
                      <p className="text-green-700 dark:text-green-300">
                        Serás redirigido al inicio de sesión en unos segundos...
                      </p>
                    </div>
                  </div>
                ) : !hasSession ? (
                  <div className="space-y-6">
                    <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-800 dark:text-red-200 ml-2">
                        {error || "El enlace ha expirado o es inválido."}
                      </AlertDescription>
                    </Alert>
                    <Button asChild className="w-full h-11" variant="outline">
                      <Link href="/auth/reset-password">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Solicitar Nuevo Enlace
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword}>
                    <div className="flex flex-col gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Repite tu contraseña"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
                      </Button>
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
