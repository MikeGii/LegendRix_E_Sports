'use client'

import { useAuth } from './AuthProvider'
import { useState } from 'react'
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // User is logged in - show appropriate dashboard
  if (user) {
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
          {user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
        </main>
      </div>
    )
  }

  // User is not logged in - show dark auth page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50">
          {/* Logo Placeholder */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-xs font-mono">
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