// src/app/user-dashboard/page.tsx
'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { UserDashboard } from '@/components/UserDashboard'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function UserDashboardPage() {
  return (
    <ProtectedRoute 
      requiredRole="user"
      requireEmailVerified={false} // Allow users to see their status
      requireAdminApproved={false}  // Allow users to see pending approval status
    >
      <DashboardLayout>
        <UserDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  )
}