// src/components/MainApp.tsx
'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { UserDashboard } from './UserDashboard'
import { AdminDashboard } from './AdminDashboard'

type AuthView = 'login' | 'register'

export function MainApp() {
  const { user, isLoading } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // User is logged in - show appropriate dashboard
  if (user) {
    if (user.role === 'admin') {
      return <AdminDashboard />
    } else {
      return <UserDashboard />
    }
  }

  // User is not logged in - show auth forms
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏁 E-WRC Rally Registration
          </h1>
          <p className="text-gray-600">
            E-Sports Rally Championship Registration System
          </p>
        </div>

        {/* Auth Forms */}
        {authView === 'login' ? (
          <LoginForm onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">🏆 About E-WRC Registration</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Register for upcoming e-sports rally championships</p>
            <p>• Professional driver management system</p>
            <p>• Secure approval process with email verification</p>
            <p>• Track your racing history and achievements</p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>🔐 Registration Process:</strong><br />
              1. Create account → 2. Verify email → 3. Admin approval → 4. Access granted
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">🧪 Demo Credentials</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Admin:</strong> admin@ewrc.com / admin123</p>
            <p><strong>Note:</strong> Create a new user account to test the full registration flow</p>
          </div>
        </div>
      </div>
    </div>
  )
}