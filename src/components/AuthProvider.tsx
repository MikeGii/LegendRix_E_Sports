'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

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
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Changed to false for testing

  const login = async (email: string, password: string) => {
    // Temporary mock - no API call yet
    return { success: false, message: 'API not connected yet' }
  }

  const register = async (email: string, password: string, name: string) => {
    // Temporary mock - no API call yet
    return { success: false, message: 'API not connected yet' }
  }

  const logout = () => {
    setUser(null)
  }

  const refreshUser = async () => {
    // Temporary mock
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