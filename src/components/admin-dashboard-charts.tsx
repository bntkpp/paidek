"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart, CartesianGrid } from "recharts"

interface RevenuePoint {
  period: string
  revenue: number
}

interface CoursePoint {
  course: string
  enrollments: number
}

interface FunnelPoint {
  stage: string
  value: number
}

interface GrowthPoint {
  period: string
  users: number
  enrollments: number
}

interface RevenueCoursePoint {
  course: string
  revenue: number
}

interface AdminDashboardChartsProps {
  revenueSeries: RevenuePoint[]
  topCourses: CoursePoint[]
  funnelSeries?: FunnelPoint[]
  topRevenueCourses?: RevenueCoursePoint[]
  growthSeries?: GrowthPoint[]
}

export function AdminDashboardCharts({
  revenueSeries,
  topCourses,
  funnelSeries = [],
  topRevenueCourses = [],
  growthSeries = [],
}: AdminDashboardChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-2 hover:border-primary/20 transition-colors">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600"></div>
              Ingresos por Mes
            </CardTitle>
            <CardDescription>Últimos 6 meses (Pagos confirmados)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="period" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '2px solid rgb(245, 158, 11)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Ingresos']}
                  cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#revenueGradient)" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Courses Chart */}
        <Card className="border-2 hover:border-primary/20 transition-colors">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
              Cursos Más Populares
            </CardTitle>
            <CardDescription>Por número de inscripciones</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCourses} layout="vertical">
                <defs>
                  <linearGradient id="coursesGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  dataKey="course" 
                  type="category" 
                  width={150}
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '2px solid rgb(168, 85, 247)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
                  }}
                  formatter={(value: number) => [value, 'Inscripciones']}
                  cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
                />
                <Bar 
                  dataKey="enrollments" 
                  fill="url(#coursesGradient)" 
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="border-2 hover:border-primary/20 transition-colors">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
              Crecimiento de la Plataforma
            </CardTitle>
            <CardDescription>Nuevos usuarios vs Inscripciones</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthSeries}>
                <defs>
                  <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="enrollmentsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  name="Nuevos Usuarios"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#usersGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="enrollments" 
                  name="Nuevas Inscripciones"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#enrollmentsGradient)" 
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Revenue Courses */}
        <Card className="border-2 hover:border-primary/20 transition-colors">
          <CardHeader className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>
              Cursos con Mayores Ingresos
            </CardTitle>
            <CardDescription>Top 5 cursos por facturación</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRevenueCourses} layout="vertical">
                <defs>
                  <linearGradient id="revenueCourseGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                />
                <YAxis 
                  dataKey="course" 
                  type="category" 
                  width={150}
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '2px solid rgb(16, 185, 129)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Ingresos']}
                  cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#revenueCourseGradient)" 
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="border-2 hover:border-primary/20 transition-colors">
        <CardHeader className="bg-gradient-to-r from-slate-500/10 via-slate-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-slate-500 to-slate-600"></div>
            Embudo de Conversión
          </CardTitle>
          <CardDescription>Flujo de usuarios en la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelSeries}>
              <defs>
                <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#64748b" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#475569" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="stage" 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '2px solid #64748b',
                  borderRadius: '12px',
                }}
                cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#funnelGradient)" 
                radius={[8, 8, 0, 0]}
                label={{ position: 'top', fill: '#64748b', fontSize: 12 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}