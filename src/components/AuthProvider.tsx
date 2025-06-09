// src/components/AuthProvider.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  status: 'pending_email' | 'pending_approval' | 'approved' | 'rejected'
  emailVerified: boolean
  adminApproved: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    message: string; 
    user?: User  // Add optional user property
  }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      refreshUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthProvider - attempting login for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('🔐 AuthProvider - login response:', data)

      if (response.ok && data.success) {
        console.log('🔐 AuthProvider - login successful, setting tokens')
        
        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)
        
        // FIXED: Set cookie properly for middleware
        // Remove any existing auth_token cookie first
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        
        // Set new cookie with proper format
        const cookieValue = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`
        document.cookie = cookieValue
        
        console.log('🔐 AuthProvider - setting cookie:', cookieValue)
        
        // Wait a moment for cookie to be set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Verify cookie was set
        const cookieCheck = document.cookie.includes('auth_token')
        console.log('🔐 AuthProvider - cookie verification:', cookieCheck)
        console.log('🔐 AuthProvider - all cookies:', document.cookie)
        
        setUser(data.user)
        
        // Return user data for navigation
        return { success: true, message: data.message, user: data.user }
      } else {
        console.log('🔐 AuthProvider - login failed:', data.error)
        return { success: false, message: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('🔐 AuthProvider - login error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    // Remove cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('🔄 AuthProvider - No token found')
        setIsLoading(false)
        return
      }

      console.log('🔄 AuthProvider - Refreshing user with token')
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔄 AuthProvider - User refreshed:', data.user.email)
        setUser(data.user)
      } else {
        console.log('🔄 AuthProvider - Token invalid, clearing auth')
        // Token is invalid, remove it
        localStorage.removeItem('auth_token')
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        setUser(null)
      }
    } catch (error) {
      console.error('🔄 AuthProvider - Refresh error:', error)
      localStorage.removeItem('auth_token')
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}