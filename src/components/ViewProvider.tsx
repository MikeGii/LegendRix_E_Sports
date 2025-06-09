'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { usePathname } from 'next/navigation'

type ViewMode = 'admin' | 'user'

interface ViewContextType {
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void
  canSwitchView: boolean
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

export function ViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [currentView, setCurrentView] = useState<ViewMode>('admin')

  // Only admins can switch views
  const canSwitchView = user?.role === 'admin'

  // Auto-switch view based on route and load saved preferences
  useEffect(() => {
    if (user?.role === 'admin') {
      // Auto-switch to admin view for admin routes
      if (pathname === '/admin-dashboard' || pathname === '/rally-creation') {
        console.log('🔄 ViewProvider - Auto-switching admin to admin view for route:', pathname)
        setCurrentView('admin')
        localStorage.setItem('admin_view_mode', 'admin')
      }
      // Auto-switch to user view for user routes  
      else if (pathname === '/user-dashboard' || pathname === '/registration') {
        console.log('🔄 ViewProvider - Auto-switching admin to user view for route:', pathname)
        setCurrentView('user')
        localStorage.setItem('admin_view_mode', 'user')
      }
      // For other routes, use saved preference
      else {
        const savedView = localStorage.getItem('admin_view_mode') as ViewMode
        if (savedView && ['admin', 'user'].includes(savedView)) {
          setCurrentView(savedView)
        } else {
          setCurrentView('admin') // Default to admin view
        }
      }
    } else {
      setCurrentView('user') // Regular users always see user view
    }
  }, [user, pathname])

  // Save view preference when manually changed
  const handleSetCurrentView = (view: ViewMode) => {
    console.log('🔄 ViewProvider - Manual view change to:', view)
    setCurrentView(view)
    if (user?.role === 'admin') {
      localStorage.setItem('admin_view_mode', view)
    }
  }

  console.log('🔄 ViewProvider - Current state:', {
    pathname,
    userRole: user?.role,
    currentView,
    canSwitchView
  })

  return (
    <ViewContext.Provider value={{
      currentView,
      setCurrentView: handleSetCurrentView,
      canSwitchView
    }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useView() {
  const context = useContext(ViewContext)
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider')
  }
  return context
}