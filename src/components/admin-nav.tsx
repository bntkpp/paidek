"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Star,
  LogOut,
  Home,
  Layers3,
  LibraryBig,
  GraduationCap,
  FolderTree,
  FileText,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
  { href: "/admin/structure", label: "Estructura", icon: FolderTree },
  { href: "/admin/enrollments", label: "Inscripciones", icon: GraduationCap },
  { href: "/admin/intake-forms", label: "Fichas de Alumnos", icon: FileText },
  { href: "/admin/payments", label: "Pagos", icon: CreditCard },
  { href: "/admin/reviews", label: "Reseñas", icon: Star },
  { href: "/admin/status", label: "Estado del Sistema", icon: Activity },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="w-full md:w-64 bg-card border-r border-border p-4 space-y-2">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <BookOpen className="h-6 w-6 text-primary" />
          <span>Paidek Admin</span>
        </Link>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </div>

      <div className="pt-4 mt-4 border-t border-border space-y-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Ir al sitio
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </nav>
  )
}