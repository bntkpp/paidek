"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { deleteReview, updateReview } from "@/app/admin/actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Star, Pencil, Trash2, Calendar, User, BookOpen, Loader2 } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: {
    full_name: string | null
    email: string | null
  } | null
  courses: {
    title: string | null
  } | null
}

interface AdminReviewsManagerProps {
  initialReviews: Review[]
}

export function AdminReviewsManager({ initialReviews }: AdminReviewsManagerProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const reviewsList = reviews || []

  const filteredReviews = reviewsList.filter(review => {
    const searchLower = searchTerm.toLowerCase()
    const userName = review.profiles?.full_name?.toLowerCase() || ""
    const userEmail = review.profiles?.email?.toLowerCase() || ""
    const courseTitle = review.courses?.title?.toLowerCase() || ""
    const comment = review.comment?.toLowerCase() || ""
    
    return userName.includes(searchLower) || 
           userEmail.includes(searchLower) || 
           courseTitle.includes(searchLower) || 
           comment.includes(searchLower)
  })

  const handleReviewUpdated = (updatedReview: any) => {
    // Preserve the original joined data because the update returns only the review fields
    setReviews(prev => prev.map(r => {
      if (r.id === updatedReview.id) {
        return {
          ...r,
          rating: updatedReview.rating,
          comment: updatedReview.comment
        }
      }
      return r
    }))
    router.refresh()
  }

  const handleReviewDeleted = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative max-w-sm w-full">
            <Input 
                placeholder="Buscar por usuario, curso o comentario..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredReviews.length} reseña{filteredReviews.length !== 1 ? 's' : ''} encontrada{filteredReviews.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">No se encontraron reseñas</p>
              </CardContent>
            </Card>
        ) : (
            filteredReviews.map((review) => (
            <ReviewCard 
                key={review.id} 
                review={review} 
                onUpdated={handleReviewUpdated}
                onDeleted={handleReviewDeleted}
            />
            ))
        )}
      </div>
    </div>
  )
}

function ReviewCard({ 
    review, 
    onUpdated, 
    onDeleted 
}: { 
    review: Review, 
    onUpdated: (review: any) => void,
    onDeleted: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{review.courses?.title || 'Curso desconocido'}</span>
            </div>
            <div className="flex items-center gap-2">
                 <User className="h-3.5 w-3.5 text-muted-foreground" />
                 <span className="font-medium text-sm">
                    {review.profiles?.full_name || review.profiles?.email || 'Usuario desconocido'}
                 </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-md border border-yellow-100 dark:border-yellow-900/50">
             {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                    key={i} 
                    className={`h-3.5 w-3.5 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300 dark:text-gray-600"}`} 
                />
             ))}
             <span className="ml-1 text-xs font-bold text-yellow-700 dark:text-yellow-500">{review.rating}.0</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {review.comment ? (
            <div className="bg-muted/30 p-3 rounded-md text-sm italic border-l-2 border-primary/20">
                "{review.comment}"
            </div>
        ) : (
            <span className="text-sm text-muted-foreground italic">Sin comentario escrito</span>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between border-t bg-muted/5 p-3 mt-2">
        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
            <Calendar className="h-3 w-3" />
            {new Date(review.created_at).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })}
        </div>
        <div className="flex gap-2">
            <EditReviewDialog review={review} onUpdated={onUpdated} />
            <DeleteReviewDialog review={review} onDeleted={onDeleted} />
        </div>
      </CardFooter>
    </Card>
  )
}

function EditReviewDialog({ review, onUpdated }: { review: Review, onUpdated: (data: any) => void }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [rating, setRating] = useState(review.rating.toString())
    const [comment, setComment] = useState(review.comment || "")
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const result = await updateReview(review.id, {
                rating: parseInt(rating),
                comment: comment
            })
            
            onUpdated(result)
            setOpen(false)
            toast({ title: "Reseña actualizada correctamente" })
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Error al actualizar", 
                description: error.message 
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Editar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Reseña</DialogTitle>
                    <DialogDescription>
                        Modifica la calificación o el comentario de esta reseña.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Calificación</Label>
                        <Select value={rating} onValueChange={setRating}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Estrella</SelectItem>
                                <SelectItem value="2">2 Estrellas</SelectItem>
                                <SelectItem value="3">3 Estrellas</SelectItem>
                                <SelectItem value="4">4 Estrellas</SelectItem>
                                <SelectItem value="5">5 Estrellas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Comentario</Label>
                        <Textarea 
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                            rows={4}
                            placeholder="Comentario de la reseña..."
                        />
                         <p className="text-xs text-muted-foreground">
                            Puedes corregir faltas de ortografía o eliminar lenguaje ofensivo.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function DeleteReviewDialog({ review, onDeleted }: { review: Review, onDeleted: (id: string) => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            await deleteReview(review.id)
            onDeleted(review.id)
            toast({ title: "Reseña eliminada correctamente" })
        } catch (error: any) {
             toast({ 
                variant: "destructive", 
                title: "Error al eliminar", 
                description: error.message 
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-8">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Eliminar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar esta reseña?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. La reseña del usuario <strong>{review.profiles?.full_name || review.profiles?.email}</strong> será eliminada permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Eliminar Reseña
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
