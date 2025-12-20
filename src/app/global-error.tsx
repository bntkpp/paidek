"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { GeistSans } from "geist/font/sans"
import "./globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="es" className={GeistSans.variable}>
      <body className="font-sans min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full mb-6">
          <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">Error Crítico del Sistema</h1>
        
        <p className="text-lg text-muted-foreground max-w-md mb-8 text-center">
          Ha ocurrido un error grave que impide cargar la aplicación. Por favor, intenta recargar la página.
        </p>

        <Button onClick={() => reset()} size="lg" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Recargar aplicación
        </Button>
      </body>
    </html>
  )
}
