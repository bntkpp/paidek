"use client"

import { Mail, ArrowRight, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ContactSection() {
  return (
    <section id="contacto" className="py-24 relative overflow-hidden bg-white/50">
        {/* Background gradient/image */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 z-0" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

        {/* Blobs */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />


      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100/50 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {/* Inner shine */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="text-left space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm font-medium mb-6">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Soporte 24/7</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                                ¿Tienes alguna duda? <br />
                                <span className="text-gray-400">Conversemos.</span>
                            </h2>
                            <p className="text-gray-500 text-lg leading-relaxed max-w-md">
                                Estamos aquí para guiarte en tu proceso de aprendizaje. 
                                Si necesitas ayuda con la plataforma o tienes preguntas sobre los cursos, no dudes en escribirnos.
                            </p>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="flex items-center gap-6 pt-4 text-sm text-gray-400"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_1px_rgba(34,197,94,0.4)]" />
                                <span className="text-gray-600 font-medium">Respuesta rápida</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                            <div className="text-gray-600 font-medium">Equipo dedicado</div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="relative"
                    >
                        {/* Decorative glow behind card */}
                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl -z-10 rounded-full transform scale-75" />

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 hover:border-blue-500/20 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-gray-50 rounded-xl text-gray-900 shadow-sm group-hover:bg-blue-50 transition-colors duration-300 flex-shrink-0">
                                    <Mail className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="space-y-3 flex-1">
                                    <h3 className="font-bold text-gray-900 text-xl">Escríbenos un correo</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Para consultas generales, problemas de acceso o información sobre inscripciones.
                                    </p>
                                    
                                    <div className="pt-4">
                                        <a 
                                            href="mailto:colegiopaideiaonline@gmail.com" 
                                            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 gap-2 shadow-md shadow-gray-900/5"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span>colegiopaideiaonline@gmail.com</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
      </div>
    </section>
  )
}
