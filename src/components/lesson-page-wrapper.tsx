"use client"

import { useState, useEffect } from "react"
import { CourseSidebar } from "@/components/course-sidebar"
import { LessonPageClient } from "@/components/lesson-page-client"
import { ChatbotWidget } from "@/components/chatbot-widget"

interface LessonPageWrapperProps {
  courseId: string
  courseTitle: string
  lesson: any
  isLessonCompleted: boolean
  isCourseCompleted: boolean
  hasExistingReview: boolean
  userId: string
  previousLesson: { id: string; title: string } | null
  nextLesson: { id: string; title: string } | null
  modules: any[]
  progressPercentage: number
}

export function LessonPageWrapper(props: LessonPageWrapperProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="flex flex-col md:flex-row h-full">
        <CourseSidebar
          courseId={props.courseId}
          modules={props.modules}
          progress={props.progressPercentage}
          onOpenChat={() => setChatOpen(true)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <LessonPageClient
            courseId={props.courseId}
            courseTitle={props.courseTitle}
            lesson={props.lesson}
            isLessonCompleted={props.isLessonCompleted}
            isCourseCompleted={props.isCourseCompleted}
            hasExistingReview={props.hasExistingReview}
            userId={props.userId}
            previousLesson={props.previousLesson}
            nextLesson={props.nextLesson}
          />
        </main>
      </div>

      {/* Chatbot - solo renderizar UNA instancia según viewport */}
      {isMobile ? (
        <ChatbotWidget
          courseId={props.courseId}
          courseName={props.courseTitle}
          isOpen={chatOpen}
          onOpenChange={setChatOpen}
          isMobile={true}
        />
      ) : (
        <ChatbotWidget
          courseId={props.courseId}
          courseName={props.courseTitle}
        />
      )}
    </div>
  )
}
