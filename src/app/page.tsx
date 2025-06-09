'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState, useEffect, useRef } from 'react'
import { LoginForm } from '@/components/LoginForm'
import { RegisterForm } from '@/components/RegisterForm'

type AuthView = 'login' | 'register'

export default function HomePage() {
  const { user, isLoading, logout } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(3)
  const hasRedirected = useRef(false)

  console.log('🏠 HomePage - user:', user?.email, 'role:', user?.role, 'isLoading:', isLoading, 'isLoggingIn:', isLoggingIn)

  // Auto-redirect when user is authenticated
  useEffect(() => {
    if (!isLoading && user && !hasRedirected.current) {
      console.log('🔄 HomePage - Starting redirect process for authenticated user')
      hasRedirected.current = true
      
      // Start countdown
      const countdown = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown)
            const targetUrl = user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'
            console.log('🔄 HomePage - Redirecting to:', targetUrl)
            window.location.href = targetUrl
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Cleanup function
      return () => {
        clearInterval(countdown)
      }
    }
  }, [user, isLoading])

  // Reset redirect state when user changes
  useEffect(() => {
    if (!user) {
      hasRedirected.current = false
      setRedirectCountdown(3)
      setIsLoggingIn(false)
    }
  }, [user])

  // Loading state
  if (isLoading) {
    console.log('⏳ HomePage - Showing auth loading state')
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-blue-300 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse' }}></div>
          </div>
          <p className="text-gray-400 font-medium">Loading your account...</p>
        </div>
      </div>
    )
  }

  // Login process loading state
  if (isLoggingIn) {
    console.log('🔐 HomePage - Showing login process loading')
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-blue-300 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-white text-lg font-medium">Authenticating...</p>
            <p className="text-gray-400">Verifying your credentials</p>
          </div>
          <div className="mt-6">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated user - show redirect countdown
  if (user && hasRedirected.current) {
    console.log('👤 HomePage - User authenticated, showing redirect countdown')
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-400">{redirectCountdown}</span>
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <p className="text-white text-xl font-medium">✅ Login Successful!</p>
            <p className="text-gray-400">
              Redirecting to {user.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}...
            </p>
          </div>
          
          {/* User Info Card */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 max-w-sm mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-slate-400 text-sm">{user.role === 'admin' ? 'Administrator' : 'Driver'}</p>
              </div>
            </div>
          </div>

          {/* Manual redirect button as backup */}
          <button
            onClick={() => {
              const targetUrl = user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'
              window.location.href = targetUrl
            }}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            Continue Manually
          </button>
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
            <LoginForm 
              onSwitchToRegister={() => setAuthView('register')}
              onLoginStart={() => setIsLoggingIn(true)}
              onLoginError={() => setIsLoggingIn(false)}
            />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
          )}
        </div>
      </div>
    </div>
  )
}