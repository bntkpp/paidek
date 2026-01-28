"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CreditCard, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface PaymentWithDetails {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  status: string
  mercadopago_payment_id: string | null
  payment_method: string | null
  payment_type: string | null
  created_at: string
  user: {
    full_name: string
    email: string
  }
  course: {
    title: string
  }
}

interface AdminPaymentsManagerProps {
  initialPayments: PaymentWithDetails[]
}

export function AdminPaymentsManager({ initialPayments }: AdminPaymentsManagerProps) {
  const [payments] = useState(initialPayments)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPayments = payments.filter(
    (payment) =>
      payment.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.mercadopago_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Estadísticas
  const totalRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0)
  const approvedPayments = payments.filter((p) => p.status === "approved").length
  const pendingPayments = payments.filter((p) => p.status === "pending").length
  const approvedRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Aprobado</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodName = (method: string | null) => {
    if (!method) return "N/A"
    const methods: Record<string, string> = {
      visa: "Visa",
      master: "Mastercard",
      amex: "American Express",
      debvisa: "Visa Débito",
      debmaster: "Mastercard Débito",
    }
    return methods[method] || method
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString("es-CL")}</div>
            <p className="text-xs text-muted-foreground">
              {payments.length} {payments.length === 1 ? "pago" : "pagos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Ingresos Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${approvedRevenue.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedPayments} {approvedPayments === 1 ? "aprobado" : "aprobados"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Pagos Aprobados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPayments}</div>
            <p className="text-xs text-muted-foreground">
              {((approvedPayments / payments.length) * 100 || 0).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">En proceso</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Pagos</CardTitle>
          <CardDescription>
            <Input
              placeholder="Buscar por nombre, email, curso o ID de pago..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>ID Pago</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{payment.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <div className="truncate">{payment.course.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${payment.amount.toLocaleString("es-CL")}
                    </div>
                    <div className="text-xs text-muted-foreground">{payment.currency}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {getPaymentMethodName(payment.payment_method)}
                    </div>
                    {payment.payment_type && (
                      <div className="text-xs text-muted-foreground capitalize">
                        {payment.payment_type.replace("_", " ")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    {payment.mercadopago_payment_id ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {payment.mercadopago_payment_id}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(payment.created_at).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(payment.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron pagos" : "No hay pagos registrados aún"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}