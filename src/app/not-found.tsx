import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <div className="bg-muted/30 p-6 rounded-full mb-6">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold mb-4">Página no encontrada</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Button asChild size="lg">
        <Link href="/">
          Volver al inicio
        </Link>
      </Button>
    </div>
  )
}
