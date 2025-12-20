import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertTriangle, Server, Database, CreditCard, Mail, Globe, ShieldCheck } from "lucide-react"
import { FixStorageButton } from "./fix-storage-button"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface StatusCheck {
  name: string
  status: "healthy" | "degraded" | "down"
  message: string
  icon: any
}

export default async function AdminStatusPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Create Admin Client for system checks (bypasses RLS)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // 1. Check Database Connection
  let dbStatus: StatusCheck = {
    name: "Base de Datos (Supabase)",
    status: "healthy",
    message: "Conexión establecida correctamente",
    icon: Database,
  }

  try {
    const { error } = await supabase.from("users").select("count", { count: "exact", head: true })
    if (error) throw error
  } catch (error: any) {
    dbStatus = {
      name: "Base de Datos (Supabase)",
      status: "down",
      message: `Error de conexión: ${error.message}`,
      icon: Database,
    }
  }

  // 2. Check Storage
  let storageStatus: StatusCheck = {
    name: "Almacenamiento (Storage)",
    status: "healthy",
    message: "Buckets accesibles",
    icon: Server,
  }

  try {
    // Use admin client to check storage existence
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
    if (error) throw error
    
    const requiredBuckets = ["courses", "ebooks"]
    const missingBuckets = requiredBuckets.filter(rb => !buckets?.find(b => b.name === rb))

    if (missingBuckets.length > 0) {
        storageStatus = {
            name: "Almacenamiento (Storage)",
            status: "degraded",
            message: `Faltan buckets: ${missingBuckets.join(", ")}`,
            icon: Server,
        }
    }
  } catch (error: any) {
    storageStatus = {
      name: "Almacenamiento (Storage)",
      status: "down",
      message: `Error al listar buckets: ${error.message}`,
      icon: Server,
    }
  }

  // 3. Check MercadoPago
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN
  let mpStatus: StatusCheck = {
    name: "MercadoPago",
    status: mpToken ? "healthy" : "down",
    message: mpToken ? "Token de acceso configurado" : "Falta token de acceso (MERCADO_PAGO_ACCESS_TOKEN)",
    icon: CreditCard,
  }

  // 4. Check Email (Resend/SMTP)
  // Assuming Resend based on typical Next.js stacks, or checking generic env vars
  const resendKey = process.env.RESEND_API_KEY
  let emailStatus: StatusCheck = {
    name: "Servicio de Email",
    status: resendKey ? "healthy" : "degraded",
    message: resendKey ? "API Key configurada" : "No se detectó configuración de email (RESEND_API_KEY)",
    icon: Mail,
  }

  // 5. Check General Configuration
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  let configStatus: StatusCheck = {
    name: "Configuración General",
    status: baseUrl ? "healthy" : "degraded",
    message: baseUrl ? `URL Base: ${baseUrl}` : "Falta NEXT_PUBLIC_BASE_URL",
    icon: Globe,
  }
  
  // 6. Check Facebook Pixel
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  let pixelStatus: StatusCheck = {
    name: "Meta Pixel (Facebook Ads)",
    status: pixelId ? "healthy" : "degraded",
    message: pixelId ? `ID: ${pixelId}` : "No configurado (Opcional)",
    icon: ShieldCheck,
  }

  const checks = [dbStatus, storageStatus, mpStatus, emailStatus, configStatus, pixelStatus]
  const systemHealth = checks.every(c => c.status === "healthy") 
    ? "healthy" 
    : checks.some(c => c.status === "down") 
        ? "down" 
        : "degraded"

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estado del Sistema</h1>
            <p className="text-muted-foreground">
              Monitoreo de servicios y configuraciones críticas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Estado Global:</span>
            <Badge 
                variant={systemHealth === "healthy" ? "default" : systemHealth === "degraded" ? "secondary" : "destructive"}
                className={`text-base px-4 py-1 ${
                    systemHealth === "healthy" ? "bg-green-600 hover:bg-green-700" : 
                    systemHealth === "degraded" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : 
                    "bg-red-600 hover:bg-red-700"
                }`}
            >
                {systemHealth === "healthy" ? "Operativo" : systemHealth === "degraded" ? "Advertencia" : "Crítico"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checks.map((check, index) => (
            <Card key={index} className={`border-l-4 ${
                check.status === "healthy" ? "border-l-green-500" : 
                check.status === "degraded" ? "border-l-yellow-500" : 
                "border-l-red-500"
            }`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {check.name}
                </CardTitle>
                <check.icon className={`h-4 w-4 ${
                    check.status === "healthy" ? "text-green-500" : 
                    check.status === "degraded" ? "text-yellow-500" : 
                    "text-red-500"
                }`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mt-2">
                    {check.status === "healthy" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : check.status === "degraded" ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div className="text-2xl font-bold">
                        {check.status === "healthy" ? "OK" : check.status === "degraded" ? "Revisar" : "Error"}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {check.message}
                </p>
                {check.name === "Almacenamiento (Storage)" && check.status !== "healthy" && (
                    <FixStorageButton />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Información del Entorno</CardTitle>
                <CardDescription>Detalles técnicos para mantenimiento</CardDescription>
            </CardHeader>
            <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col">
                        <dt className="text-sm font-medium text-muted-foreground">Node.js Version</dt>
                        <dd className="text-lg font-semibold">{process.version}</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="text-sm font-medium text-muted-foreground">Plataforma</dt>
                        <dd className="text-lg font-semibold">{process.platform} ({process.arch})</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="text-sm font-medium text-muted-foreground">Entorno (NODE_ENV)</dt>
                        <dd className="text-lg font-semibold">{process.env.NODE_ENV}</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="text-sm font-medium text-muted-foreground">Timezone</dt>
                        <dd className="text-lg font-semibold">{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
