"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Plus, Trash2, Package, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Course {
  id: string
  title: string
}

interface CourseAddon {
  id: string
  course_id: string
  addon_course_id: string
  order_index: number
  price: number | null
  addon_course: Course & { one_time_price: number | null }
}

interface AdminCourseAddonsProps {
  courseId: string
  courseTitle: string
}

export function AdminCourseAddons({ courseId, courseTitle }: AdminCourseAddonsProps) {
  const [addons, setAddons] = useState<CourseAddon[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingAddon, setEditingAddon] = useState<CourseAddon | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [courseId])

  const loadData = async () => {
    setIsLoading(true)

    // Cargar add-ons configurados
    const { data: addonData } = await supabase
      .from("course_addons")
      .select(`
        *,
        addon_course:courses!course_addons_addon_course_id_fkey(id, title, one_time_price)
      `)
      .eq("course_id", courseId)
      .order("order_index", { ascending: true })

    if (addonData) {
      setAddons(addonData as any)
    }

    // Cargar cursos disponibles (solo packs de preguntas o complementos, excluir el curso actual y los ya agregados)
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .neq("id", courseId)
      .order("title", { ascending: true })

    if (courses) {
      // Filtrar cursos que ya están agregados como add-ons
      const addedAddonIds = addonData?.map(a => a.addon_course_id) || []
      const availableCoursesList = courses.filter(c => !addedAddonIds.includes(c.id))
      setAvailableCourses(availableCoursesList)
    }

    setIsLoading(false)
  }

  const addAddon = async (addonCourseId: string) => {
    // Calcular siguiente order_index
    const maxOrder = addons.reduce((max, r) => Math.max(max, r.order_index), -1)

    const { error } = await supabase
      .from("course_addons")
      .insert({
        course_id: courseId,
        addon_course_id: addonCourseId,
        order_index: maxOrder + 1
      })

    if (error) {
      console.error("Error al agregar add-on:", error)
      
      // Mensaje de error más específico
      let errorMessage = error.message
      if (error.code === '23505') {
        errorMessage = "Este complemento ya está agregado a este curso"
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
    } else {
      toast({
        title: "Complemento agregado",
        description: "El pack aparecerá como opción de compra adicional en el checkout"
      })
      loadData()
      router.refresh()
    }
  }

  const removeAddon = async (addonId: string) => {
    const { error } = await supabase
      .from("course_addons")
      .delete()
      .eq("id", addonId)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } else {
      toast({
        title: "Complemento eliminado",
        description: "El pack ya no aparecerá como opción adicional"
      })
      loadData()
      router.refresh()
    }
  }

  const updatePrice = async () => {
    if (!editingAddon) return

    const priceValue = editPrice === '' ? null : parseFloat(editPrice)
    
    if (priceValue !== null && (isNaN(priceValue) || priceValue < 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa un precio válido"
      })
      return
    }

    const { error } = await supabase
      .from("course_addons")
      .update({ price: priceValue })
      .eq("id", editingAddon.id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } else {
      toast({
        title: "Precio actualizado",
        description: "El precio se actualizó correctamente"
      })
      setEditingAddon(null)
      setEditPrice('')
      loadData()
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-purple-50/60 via-purple-500/10 to-transparent dark:from-purple-950/30 dark:via-purple-500/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg mb-2">
              <ShoppingCart className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <span>Complementos Opcionales (Add-ons)</span>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Packs adicionales que se ofrecen como compra opcional junto a este curso
            </CardDescription>
          </div>
          <AddAddonDialog
            availableCourses={availableCourses.filter(
              c => !addons.some(r => r.addon_course_id === c.id)
            )}
            onAdd={addAddon}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando...
          </div>
        ) : addons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Package className="h-8 w-8 text-purple-600/50" />
            </div>
            <p className="font-medium text-base mb-1">No hay complementos configurados</p>
            <p className="text-sm">Agrega packs de preguntas u otros complementos opcionales</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addons.map((addon, index) => (
              <div
                key={addon.id}
                className="group relative flex items-start gap-4 p-4 border rounded-lg bg-gradient-to-r from-purple-50/30 to-transparent dark:from-purple-950/20 hover:from-purple-50/60 dark:hover:from-purple-950/40 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base leading-tight mb-2 text-foreground">
                        {addon.addon_course.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs font-medium">
                          Orden: {addon.order_index}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:bg-purple-950/30">
                          💰 Compra opcional
                        </Badge>
                        <Badge className="text-xs font-bold bg-green-600 hover:bg-green-700">
                          ${(addon.price ?? addon.addon_course.one_time_price ?? 0).toLocaleString('es-CL')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAddon(addon)
                          setEditPrice((addon.price ?? addon.addon_course.one_time_price ?? 0).toString())
                        }}
                        className="text-xs"
                      >
                        Editar Precio
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAddon(addon.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Eliminar complemento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Diálogo para editar precio */}
      <Dialog open={!!editingAddon} onOpenChange={(open) => !open && setEditingAddon(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Precio del Complemento</DialogTitle>
            <DialogDescription>
              {editingAddon?.addon_course.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio (CLP)</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="25000"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Precio original del curso: ${(editingAddon?.addon_course.one_time_price ?? 0).toLocaleString('es-CL')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAddon(null)}>
              Cancelar
            </Button>
            <Button onClick={updatePrice} className="bg-purple-600 hover:bg-purple-700">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function AddAddonDialog({
  availableCourses,
  onAdd
}: {
  availableCourses: Course[]
  onAdd: (courseId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")

  const handleAdd = () => {
    if (selectedCourse) {
      onAdd(selectedCourse)
      setOpen(false)
      setSelectedCourse("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700 shadow-md flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span>Agregar Complemento Opcional</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            Selecciona un pack que se ofrecerá como compra adicional en el checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Seleccionar Pack/Complemento</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full h-auto min-h-[44px] py-3">
                <SelectValue placeholder="Busca y selecciona un pack..." />
              </SelectTrigger>
              <SelectContent className="max-w-[90vw] sm:max-w-[560px]">
                {availableCourses.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No hay más packs disponibles
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Todos los complementos ya están agregados
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {availableCourses.map(course => (
                      <SelectItem 
                        key={course.id} 
                        value={course.id} 
                        className="py-3 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Package className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-snug break-words">
                              {course.title}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-1">
                  💰 Compra Opcional
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                  Este pack aparecerá en el checkout como una opción adicional que el usuario puede agregar al carrito y comprar junto con el curso principal.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} className="min-w-[100px]">
            Cancelar
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={!selectedCourse} 
            className="bg-purple-600 text-white hover:bg-purple-700 min-w-[100px] shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
