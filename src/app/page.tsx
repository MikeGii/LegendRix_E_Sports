// Fix 1: Update src/app/page.tsx to prevent redirect loops
// src/app/page.tsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/LoginForm'
import { RegisterForm } from '@/components/RegisterForm'

type AuthView = 'login' | 'register'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')
  const [hasRedirected, setHasRedirected] = useState(false)
  const router = useRouter()

  // Debug logging
  console.log('🏠 HomePage - user:', user, 'isLoading:', isLoading, 'hasRedirected:', hasRedirected)

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (!isLoading && user && !hasRedirected) {
      console.log('🔄 HomePage - Redirecting user:', user.email, 'role:', user.role)
      setHasRedirected(true)
      
      if (user.role === 'admin') {
        router.replace('/admin-dashboard')
      } else {
        router.replace('/user-dashboard')
      }
    }
  }, [user, isLoading, hasRedirected, router])

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

  // Show redirecting message for authenticated users
  if (user) {
    console.log('👤 HomePage - User authenticated, showing redirect message')
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to dashboard...</p>
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