'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState } from 'react'
import { LoginForm } from '@/components/LoginForm'
import { RegisterForm } from '@/components/RegisterForm'

type AuthView = 'login' | 'register'

export default function HomePage() {
  const { user, isLoading, logout } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')

  console.log('🏠 HomePage - user:', user?.email, 'role:', user?.role, 'isLoading:', isLoading)

  // Loading state
  if (isLoading) {
    console.log('⏳ HomePage - Showing loading state')
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, show navigation options
  if (user) {
    console.log('👤 HomePage - User authenticated:', user.role)
    
    const handleDashboardClick = (dashboardType: 'admin' | 'user') => {
      const url = dashboardType === 'admin' ? '/admin-dashboard' : '/user-dashboard'
      console.log('🔄 HomePage - Navigating to:', url)
      
      // Simple navigation - let ProtectedRoute handle the protection
      window.location.href = url
    }

    const handleLogout = () => {
      console.log('🚪 HomePage - Logging out')
      logout()
      window.location.reload()
    }

    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
          <p className="text-gray-400 mb-2">You are logged in as: <span className="text-green-400 font-semibold">{user.role}</span></p>
          <p className="text-gray-400 mb-6">Email: {user.email}</p>
          
          <div className="space-y-4">
            {user.role === 'admin' ? (
              <button 
                onClick={() => handleDashboardClick('admin')}
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Go to Admin Dashboard
              </button>
            ) : (
              <button 
                onClick={() => handleDashboardClick('user')}
                className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Go to User Dashboard
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="block w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show login/register forms for unauthenticated users
  console.log('🔐 HomePage - Showing auth forms')
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