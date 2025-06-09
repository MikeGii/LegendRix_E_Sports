// src/components/AuthProvider.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

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
    user?: User
    needsApproval?: boolean // Add this for better UX
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
        console.log('🔐 AuthProvider - login successful, setting tokens and user state')
        
        // Store token in localStorage
        localStorage.setItem('auth_token', data.data.token)
        
        // Set cookie properly for middleware
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        const cookieValue = `auth_token=${data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`
        document.cookie = cookieValue
        
        console.log('🔐 AuthProvider - tokens set, updating user state')
        
        // Wait a tiny bit to ensure tokens are set, then update user state
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Set user state to trigger redirect
        setUser(data.data.user)
        
        console.log('🔐 AuthProvider - user state updated successfully')
        
        // Return user data for navigation
        return { success: true, message: data.message, user: data.data.user }
      } else {
        console.log('🔐 AuthProvider - login failed:', data.error)
        
        // Handle specific approval-related errors
        if (response.status === 403) {
          const errorMessage = data.error || 'Access denied'
          
          // Check if it's an approval-related issue
          const isApprovalIssue = errorMessage.toLowerCase().includes('approval') || 
                                 errorMessage.toLowerCase().includes('pending') ||
                                 errorMessage.toLowerCase().includes('verify')
          
          return { 
            success: false, 
            message: errorMessage,
            needsApproval: isApprovalIssue
          }
        }
        
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