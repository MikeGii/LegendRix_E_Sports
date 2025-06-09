// src/components/DashboardLayout.tsx
'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

    const handleLogout = () => {
    logout()
    router.push('/') // Go to login page instead of reload
    }

  if (!user) return null

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
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}