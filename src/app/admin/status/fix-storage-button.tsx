"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Wrench } from "lucide-react"
import { fixStorage } from "./actions"
import { useToast } from "@/hooks/use-toast"

export function FixStorageButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFix = async () => {
    setIsLoading(true)
    try {
      const result = await fixStorage()
      if (result.success) {
        toast({
          title: "Almacenamiento reparado",
          description: "Los buckets necesarios han sido creados o verificados.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo reparar el almacenamiento.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al intentar reparar.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleFix} 
      disabled={isLoading}
      className="mt-2 w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 dark:border-yellow-700 dark:text-yellow-500 dark:hover:bg-yellow-950"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Reparando...
        </>
      ) : (
        <>
          <Wrench className="mr-2 h-4 w-4" />
          Intentar Reparación Automática
        </>
      )}
    </Button>
  )
}
