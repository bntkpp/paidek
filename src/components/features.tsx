"use client"

import { BookOpen, Users, Award, Clock, FileCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const features = [
	{
		icon: BookOpen,
		title: "Material Completo",
		description:
			"Accede a contenido actualizado, videos explicativos y ejercicios prácticos para cada materia.",
	},
	{
		icon: Users,
		title: "Asistente Virtual IA",
		description:
			"Chatbot inteligente disponible 24/7 para resolver tus dudas sobre cualquier tema del curso.",
	},
	{
		icon: Clock,
		title: "Aprende a tu Ritmo",
		description: "Estudia cuando quieras, desde donde quieras. Acceso 24/7 a todos los materiales.",
	},
	{
		icon: FileCheck,
		title: "Evaluaciones Prácticas",
		description:
			"Pruebas personalizadas basadas en planes de MINEDUC y para reforzar tu aprendizaje.",
	},
]

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.2
		}
	}
}

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 }
}

export function Features() {
	return (
		<section id="about" className="py-20 bg-muted/30">
			<div className="container mx-auto px-4">
				<motion.div 
					className="text-center mb-12"
					initial={{ opacity: 0, y: -20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
				>
					<h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
						¿Por qué elegir Paidek?
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
						Ofrecemos una experiencia de aprendizaje completa diseñada para tu éxito
						académico
					</p>
				</motion.div>

				<motion.div 
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
					variants={container}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
				>
					{features.map((feature, index) => (
						<motion.div key={index} variants={item}>
							<Card className="border-border h-full hover:shadow-lg transition-shadow hover:-translate-y-1 duration-300">
								<CardContent className="pt-6">
									<div className="flex flex-col items-center text-center gap-4">
										<motion.div 
											className="rounded-full bg-primary/10 p-3"
											whileHover={{ scale: 1.1, rotate: 5 }}
											transition={{ type: "spring", stiffness: 300 }}
										>
											<feature.icon className="h-6 w-6 text-primary" />
										</motion.div>
										<h3 className="text-xl font-semibold">{feature.title}</h3>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{feature.description}
										</p>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
