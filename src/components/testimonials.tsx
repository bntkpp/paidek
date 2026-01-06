"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import { motion } from "framer-motion"

const testimonials = [
  {
    name: "Ilmary",
    role: "Estudiante",
    content:
      "Agradezco por el tiempo y la enseñanza brindada, el entusiasmo y la dedicación del profesor por educar ha hecho que sea entretenido, explica de manera clara y concisa y recibi conformemente todo el material brindado.",
    rating: 5,
  },
  {
    name: "Diego Andrades",
    role: "Estudiante",
    content: "Todo excelente y agradable proceso para estudiar, recomendado.",
    rating: 5,
  },
  {
    name: "Myrtha Fevrier",
    role: "Estudiante",
    content: "Recomiendo esta pagina y en especial al profesor por su paciencia, su forma de enseñarme, transmitir el conocimiento y confiar en mi, pude rendir una buena prueba de mi cuardo medio laboral.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Lo que dicen nuestros estudiantes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Miles de estudiantes han alcanzado sus objetivos con Paidek
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-4 right-4 opacity-10 transition-transform duration-300 group-hover:scale-110">
                  <Quote className="h-16 w-16 text-primary" />
                </div>
                <CardContent className="pt-6 relative">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">&quot;{testimonial.content}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
