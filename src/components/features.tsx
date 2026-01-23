"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const features = [
	{
		title: "Material Completo",
		description:
			"Accede a contenido actualizado, videos explicativos y ejercicios prácticos para cada materia.",
		gradient: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-200 dark:border-blue-900",
		numberColor: "text-blue-500/10 dark:text-blue-500/20",
		colSpan: "md:col-span-2"
	},
	{
		title: "Asistente IA",
		description:
			"Chatbot inteligente disponible 24/7 para resolver tus dudas de inmediato.",
		gradient: "from-purple-500/10 via-purple-500/5 to-transparent border-purple-200 dark:border-purple-900",
		numberColor: "text-purple-500/10 dark:text-purple-500/20",
		colSpan: "md:col-span-1"
	},
	{
		title: "A tu Ritmo",
		description: "Estudia cuando quieras, desde donde quieras. Acceso 24/7.",
		gradient: "from-pink-500/10 via-pink-500/5 to-transparent border-pink-200 dark:border-pink-900",
		numberColor: "text-pink-500/10 dark:text-pink-500/20",
		colSpan: "md:col-span-1"
	},
	{
		title: "Evaluaciones Prácticas",
		description:
			"Pruebas personalizadas basadas en planes oficiales para reforzar tu aprendizaje.",
		gradient: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 dark:border-amber-900",
		numberColor: "text-amber-500/10 dark:text-amber-500/20",
		colSpan: "md:col-span-2"
	},
]

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1
		}
	}
}

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 }
}

export function Features() {
	return (
		<section id="features" className="py-24 bg-gray-50/50 dark:bg-background relative overflow-hidden">
			{/* Decorative background blobs for depth */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
				<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl opacity-50" />
				<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl opacity-50" />
			</div>

			<div className="container mx-auto px-4 relative z-10">
				<motion.div 
					className="max-w-3xl mx-auto text-center mb-16"
					initial={{ opacity: 0, y: -20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
				>
					<h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
						¿Por qué elegir Paidek?
					</h2>
					<p className="text-xl text-muted-foreground leading-relaxed text-balance">
						Ofrecemos una experiencia educativa superior, combinando tecnología avanzada con metodologías efectivas.
					</p>
				</motion.div>

				<motion.div 
					className="grid grid-cols-1 md:grid-cols-3 gap-6"
					variants={container}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
				>
					{features.map((feature, index) => (
						<motion.div 
							key={index} 
							variants={item}
							className={cn("group h-full", feature.colSpan)}
						>
							<div className={cn(
								"relative h-full overflow-hidden rounded-3xl border transition-all duration-500",
								"hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
								"bg-white dark:bg-slate-950 shadow-sm",
								feature.gradient
							)}>
								<div className="p-8 h-full flex flex-col justify-between relative z-10">
									<div>
										<h3 className="text-2xl font-bold mb-3 tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
											{feature.title}
										</h3>
										<p className="text-muted-foreground leading-relaxed text-lg">
											{feature.description}
										</p>
									</div>
								</div>

								{/* Huge decorative number for depth/texture without icons */}
								<div className={cn(
									"absolute -bottom-12 -right-6 text-[180px] font-black leading-none select-none transition-transform duration-700 ease-out group-hover:-translate-y-4 group-hover:rotate-3 opacity-80",
									feature.numberColor
								)}>
									0{index + 1}
								</div>
								
								{/* Subtle glow effect */}
								<div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
