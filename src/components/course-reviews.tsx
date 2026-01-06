"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star, ThumbsUp } from "lucide-react" // Import icons
import { ReviewForm } from "./review-form"
import { Button } from "./ui/button"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_id: string
  profiles: {
    full_name: string | null
    email: string | null
  } | null
}

interface CourseReviewsProps {
  courseId: string
  userId?: string | null
  isEnrolled?: boolean
}

export function CourseReviews({ courseId, userId, isEnrolled }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles:reviews_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching reviews:", JSON.stringify(error, null, 2))
      } else {
        setReviews(data as any[] || []) // Cast needed due to complex join types
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmitted = () => {
    setShowForm(false)
    fetchReviews()
  }

  // Calculate statistics
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
    : 0
  
  const ratingCounts = [0, 0, 0, 0, 0] // 1, 2, 3, 4, 5 stars
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++
    }
  })

  // Check if user already reviewed
  const userHasReviewed = userId ? reviews.some(r => r.user_id === userId) : false

  if (loading) {
    return <div className="py-8 text-center">Cargando reseñas...</div>
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Statistics Column */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Valoraciones de estudiantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating)
                          ? "fill-accent text-accent"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Basado en {totalReviews} reseña{totalReviews !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-3 font-medium">{rating}</span>
                    <Star className="h-3 w-3 text-muted-foreground" />
                    <Progress
                      value={totalReviews > 0 ? (ratingCounts[rating - 1] / totalReviews) * 100 : 0}
                      className="h-2"
                    />
                    <span className="w-8 text-right text-muted-foreground text-xs">
                      {Math.round(totalReviews > 0 ? (ratingCounts[rating - 1] / totalReviews) * 100 : 0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {userId && isEnrolled && !userHasReviewed && !showForm && (
            <Button 
              className="w-full" 
              onClick={() => setShowForm(true)}
            >
              Escribir una reseña
            </Button>
          )}

          {showForm && userId && (
             <div className="mt-4">
                <ReviewForm 
                  courseId={courseId} 
                  userId={userId} 
                  onReviewSubmitted={handleReviewSubmitted} 
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
             </div>
          )}
        </div>

        {/* Reviews List Column */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xl font-bold">Reseñas ({totalReviews})</h3>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                Este curso aún no tiene reseñas. ¡Sé el primero en compartir tu experiencia!
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {(review.profiles?.full_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">
                          {review.profiles?.full_name || "Estudiante de Paidek"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("es-CL", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
