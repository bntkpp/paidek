"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      // Pequeño retraso para que la animación se vea suave al cargar
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setIsVisible(false)
    // Aquí podrías activar scripts de analítica adicionales si fuera necesario
  }

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg transition-transform duration-500 ease-in-out transform translate-y-0",
      !isVisible && "translate-y-full"
    )}>
      <div className="container max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 mr-4">
          <h3 className="text-lg font-semibold mb-1">🍪 Valoramos tu privacidad</h3>
          <p className="text-sm text-muted-foreground">
            Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y mostrarte contenido personalizado. 
            Al continuar navegando, aceptas nuestra <a href="/privacy" className="underline hover:text-primary">Política de Privacidad</a>.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={declineCookies} className="w-full md:w-auto">
            Rechazar
          </Button>
          <Button size="sm" onClick={acceptCookies} className="w-full md:w-auto">
            Aceptar todas
          </Button>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 md:hidden text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>
    </div>
  )
}
