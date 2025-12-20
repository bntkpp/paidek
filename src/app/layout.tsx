import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import FacebookPixel from "@/components/facebook-pixel"
import { CookieBanner } from "@/components/cookie-banner"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://www.institutopaidek.com"),
  title: {
    default: "Paidek - Plataforma Educativa",
    template: "%s | Paidek"
  },
  description: "Preparación integral para exámenes libres. Cursos online, material de estudio y seguimiento personalizado para tu éxito académico.",
  keywords: ["exámenes libres", "educación online", "chile", "preparación exámenes", "paidek", "instituto paidek"],
  authors: [{ name: "Instituto Paidek" }],
  creator: "Instituto Paidek",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://www.institutopaidek.com",
    title: "Paidek - Plataforma Educativa",
    description: "Preparación integral para exámenes libres. Cursos online, material de estudio y seguimiento personalizado.",
    siteName: "Instituto Paidek",
    images: [
      {
        url: "/og-image.jpg", // Asegúrate de subir una imagen de 1200x630px a public/
        width: 1200,
        height: 630,
        alt: "Instituto Paidek - Plataforma Educativa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paidek - Plataforma Educativa",
    description: "Preparación integral para exámenes libres. Cursos online y seguimiento personalizado.",
    images: ["/og-image.jpg"],
    creator: "@institutopaidek",
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <FacebookPixel />
        <CookieBanner />
      </body>
    </html>
  )
}