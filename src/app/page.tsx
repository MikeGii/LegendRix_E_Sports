'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { LoginForm } from '@/components/LoginForm'
import { RegisterForm } from '@/components/RegisterForm'
import { UserDashboard } from '@/components/UserDashboard'
import { AdminDashboard } from '@/components/AdminDashboard'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is logged in, show appropriate dashboard
  if (user) {
    if (user.role === 'admin') {
      return <AdminDashboard />
    } else {
      return <UserDashboard />
    }
  }

  // If no user, show login/register forms
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏁 E-WRC Rally Registration
        </h1>
        <p className="text-lg text-gray-600">
          Join the premier e-sports rally championship community
        </p>
      </div>

      {showRegister ? (
        <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  )
}