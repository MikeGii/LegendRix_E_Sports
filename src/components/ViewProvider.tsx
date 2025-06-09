'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthProvider'

type ViewMode = 'admin' | 'user'

interface ViewContextType {
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void
  canSwitchView: boolean
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

export function ViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<ViewMode>('admin')

  // Only admins can switch views
  const canSwitchView = user?.role === 'admin'

  // Load saved view preference or default to admin for admins
  useEffect(() => {
    if (user?.role === 'admin') {
      const savedView = localStorage.getItem('admin_view_mode') as ViewMode
      if (savedView && ['admin', 'user'].includes(savedView)) {
        setCurrentView(savedView)
      } else {
        setCurrentView('admin') // Default to admin view
      }
    } else {
      setCurrentView('user') // Regular users always see user view
    }
  }, [user])

  // Save view preference when it changes
  const handleSetCurrentView = (view: ViewMode) => {
    setCurrentView(view)
    if (user?.role === 'admin') {
      localStorage.setItem('admin_view_mode', view)
    }
  }

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