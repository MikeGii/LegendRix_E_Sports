// src/app/page.tsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState } from 'react'
import { LoginForm } from '@/components/LoginForm'
import { RegisterForm } from '@/components/RegisterForm'
import { UserDashboard } from '@/components/UserDashboard'
import { AdminDashboard } from '@/components/AdminDashboard'

type AuthView = 'login' | 'register'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')

  // Debug logging
  console.log('🔍 HomePage Debug:', {
    user,
    isLoading,
    userRole: user?.role,
    userEmail: user?.email,
    authView
  })

  // Loading state
  if (isLoading) {
    console.log('⏳ Showing loading state')
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // User is logged in - show appropriate dashboard
  if (user) {
    console.log('👤 User logged in, showing dashboard for role:', user.role)
    
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">🏁 E-WRC Rally Registration</h1>
              <span className="text-blue-200 text-sm">
                {user.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-200">Welcome, {user.name}</span>
              <button
                onClick={() => {
                  console.log('🚪 Logging out...')
                  localStorage.removeItem('auth_token')
                  window.location.reload()
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            🔍 Debug Info: Rendering {user.role} dashboard for {user.email}
          </div>
          {user.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <UserDashboard />
          )}
        </main>
      </div>
    )
  }

  // User is not logged in - show dark auth page
  console.log('🔐 No user, showing auth page')
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-800/30">
          {/* Logo Placeholder */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500 text-xs font-mono border border-gray-800">
              LOGO
              <br />
              .png
            </div>
          </div>

          {authView === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
          )}
        </div>
      </div>
    </div>
  )
}