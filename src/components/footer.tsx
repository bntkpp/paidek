"use client"

import Link from "next/link"
import { BookOpen, Mail, Phone, MapPin } from "lucide-react"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <footer id="contact" className="bg-gradient-to-b from-muted/30 to-muted/60 border-t border-border relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <BookOpen className="h-6 w-6 text-primary" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Paidek
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu plataforma de confianza para preparación de exámenes libres.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold mb-4">Cursos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/courses/31eef3bc-3e05-478c-8be5-c1477b1fea55" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Primer Ciclo Enseñanza Media
                </Link>
              </li>
              <li>
                <Link href="/courses/256d57dc-2344-4af7-9b0e-037093e0944e" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Segundo Ciclo Enseñanza Media 
                </Link>
              </li>
              <li>
                <Link href="/courses/ed7a5eb0-6a56-4569-b8cc-6448bd81bfa9" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Tercer Ciclo Enseñanza Básica
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Ver todos
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#about" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="https://open.spotify.com/show/4qiKLjHFmZCYcU7Ko0N23K?si=OeieiuKAQQKyNUQ3tW8nxA" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Podcast
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>colegiopaideiaonline@gmail.com</span>
              </li>
              <li className="flex items-center gap-2 hover:text-primary transition-colors">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Santiago, Chile</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div 
          className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>&copy; 2025 Paidek. Todos los derechos reservados.</p>
        </motion.div>
      </div>
    </footer>
  )
}
