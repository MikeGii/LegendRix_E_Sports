'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminDashboard } from '@/components/AdminDashboard'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function AdminDashboardPage() {
  console.log('🔧 AdminDashboardPage - Component loaded')
  
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  )
}