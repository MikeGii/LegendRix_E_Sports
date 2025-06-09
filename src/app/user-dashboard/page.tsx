'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SmartDashboard } from '@/components/SmartDashboard'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function UserDashboardPage() {
  console.log('🔧 UserDashboardPage - Component loaded')
  
  return (
    <ProtectedRoute 
      // No role requirement - admins can access this in any view mode
      requireEmailVerified={false}
      requireAdminApproved={false}
    >
      <DashboardLayout>
        <SmartDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  )
}