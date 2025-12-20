"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Opcional: Registrar el error en un servicio de reporte de errores
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full mb-6">
        <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400" />
      </div>
      
      <h1 className="text-4xl font-bold mb-4 text-foreground">¡Ups! Algo salió mal</h1>
      
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Ha ocurrido un error inesperado en nuestros servidores. No te preocupes, ya hemos sido notificados.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => reset()} size="lg" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Intentar de nuevo
        </Button>
        
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-muted rounded-lg max-w-2xl w-full text-left overflow-auto">
          <p className="font-mono text-xs text-red-500 mb-2">Error Details (Dev Only):</p>
          <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
            {error.message}
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  )
}
