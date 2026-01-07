"use client"

import { useState } from "react"
import { CourseCard } from "@/components/course-card"
import { CourseFilters } from "@/components/course-filters"

interface Course {
  id: string
  title: string
  description: string
  short_description: string | null
  image_url: string | null
  payment_type: string | null
  one_time_price: number | null
  duration_hours: number | null
  level: string | null
  published: boolean
  type?: string // 'course', 'ebook'
}

interface SubscriptionPlan {
  id: string
  duration_months: number
  price: number
  name: string | null
  is_popular: boolean
  course_id: string
}

interface CoursesCatalogProps {
  courses: Course[]
  plans: Record<string, SubscriptionPlan[]>
}

export function CoursesCatalog({ courses, plans }: CoursesCatalogProps) {
  const [levelFilter, setLevelFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCourses = courses.filter((course) => {
    // Filter by level
    if (levelFilter !== "all" && course.level !== levelFilter) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const titleMatch = course.title.toLowerCase().includes(query)
      const descMatch = (course.short_description || course.description || "").toLowerCase().includes(query)
      if (!titleMatch && !descMatch) {
         return false
      }
    }
    
    return true
  })

  return (
    <div className="space-y-8">
      <CourseFilters onLevelChange={setLevelFilter} onSearchChange={setSearchQuery} />

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground text-lg">No se encontraron cursos con los filtros seleccionados.</p>
            <p className="text-sm text-muted-foreground mt-2">Intenta ajustar tus filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="h-full">
              <CourseCard
                id={course.id}
                title={course.title}
                description={course.short_description || course.description}
                image_url={course.image_url}
                payment_type={course.payment_type}
                one_time_price={course.one_time_price}
                duration_hours={course.duration_hours}
                level={course.level}
                type={course.type}
                initialPlans={plans[course.id] || []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
