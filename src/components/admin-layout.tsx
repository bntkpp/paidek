"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  LogOut,
  Settings,
  Home,
  CreditCard,
  FolderTree,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Usuarios", href: "/admin/users", icon: Users },
  { name: "Cursos", href: "/admin/courses", icon: BookOpen },
  { name: "Estructura", href: "/admin/structure", icon: FolderTree },
  { name: "Inscripciones", href: "/admin/enrollments", icon: GraduationCap },
  { name: "Fichas de Alumnos", href: "/admin/intake-forms", icon: FileText },
  { name: "Pagos", href: "/admin/payments", icon: CreditCard },
  { name: "Reseñas", href: "/admin/reviews", icon: Settings },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const NavigationContent = () => (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t bg-muted/50 space-y-2">
        <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-background transition-colors">
          <Link href="/">
            <Home className="h-5 w-5 mr-3" />
            Ir al sitio
          </Link>
        </Button>
        <Button 
          onClick={handleLogout}
          variant="ghost" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Cerrar sesión
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold">P</span>
          </div>
          <span className="font-bold text-lg">Paidek Admin</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <SheetDescription className="sr-only">
              Navegación principal del panel de administración
            </SheetDescription>
            <div className="flex flex-col h-full">
              <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-transparent">
                <Link href="/admin" className="flex items-center gap-2 group">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                    <span className="text-primary-foreground font-bold text-lg">P</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl block">Paidek</span>
                    <span className="text-xs text-muted-foreground">Panel Admin</span>
                  </div>
                </Link>
              </div>
              <NavigationContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r flex-col shadow-sm sticky top-0 h-screen">
        <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-transparent flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <div>
              <span className="font-bold text-xl block">Paidek</span>
              <span className="text-xs text-muted-foreground">Panel Admin</span>
            </div>
          </Link>
        </div>
        <NavigationContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
