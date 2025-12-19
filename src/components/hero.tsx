"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, GraduationCap } from "lucide-react"
import { motion } from "framer-motion"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-20 md:py-32">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-6 will-change-transform"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <GraduationCap className="h-4 w-4" />
              Plataforma Educativa Online
            </motion.div>

            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-balance leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Prepárate para tus <span className="text-primary">Exámenes Libres</span> con Confianza
            </motion.h1>

            <motion.p 
              className="text-lg text-muted-foreground text-balance leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Accede a cursos completos, material de estudio actualizado y apoyo personalizado para alcanzar tus
              objetivos académicos.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button size="lg" asChild className="text-base">
                <Link href="#courses">
                  Explorar Cursos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                <Link href="/auth/sign-up">Comenzar Gratis</Link>
              </Button>
            </motion.div>

            <motion.div 
              className="flex flex-wrap gap-8 pt-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-foreground">+30</span>
                <span>Estudiantes</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-foreground">5+</span>
                <span>Cursos</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl border border-border">
              <iframe
                src="https://www.youtube.com/embed/0NUo6CJOWtY"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Introducción a Paidek"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
