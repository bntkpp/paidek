import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { CoursePreview } from "@/components/course-preview"
import { Testimonials } from "@/components/testimonials"
import { FAQ } from "@/components/faq"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <CoursePreview />
      <Features />
      <Testimonials />
      <FAQ />
      <ContactSection />
      <Footer />
    </main>
  )
}
