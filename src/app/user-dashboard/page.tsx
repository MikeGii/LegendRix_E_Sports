'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SmartDashboard } from '@/components/SmartDashboard'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useView } from '@/components/ViewProvider'
import { useAuth } from '@/components/AuthProvider'

export default function UserDashboardPage() {
  const { user } = useAuth()
  const { currentView } = useView()
  
  console.log('🔧 UserDashboardPage - Component loaded', {
    userRole: user?.role,
    currentView
  })
  
  return (
    <ProtectedRoute 
      requiredRole="user"
      requireEmailVerified={false}
      requireAdminApproved={false}
    >
      <DashboardLayout>
        <SmartDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  )
}