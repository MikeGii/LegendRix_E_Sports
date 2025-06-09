'use client'

import { useAuth } from './AuthProvider'
import { useView } from './ViewProvider'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const { currentView, setCurrentView, canSwitchView } = useView()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Top Navigation */}
      <nav className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🏁</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">LegendRix E-Sports</h1>
                  <p className="text-xs text-slate-400 -mt-1">
                    {currentView === 'admin' ? 'Admin Panel' : 'Sõitja portaal'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Switcher for Admins */}
              {canSwitchView && (
                <div className="hidden md:flex bg-slate-700/50 rounded-xl p-1">
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentView === 'admin'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>👑</span>
                      <span>Admin</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setCurrentView('user')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentView === 'user'
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🏁</span>
                      <span>Driver</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Mobile View Switcher */}
              {canSwitchView && (
                <div className="md:hidden">
                  <button
                    onClick={() => setCurrentView(currentView === 'admin' ? 'user' : 'admin')}
                    className="p-2 bg-slate-700/50 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all duration-200"
                  >
                    {currentView === 'admin' ? '🏁' : '👑'}
                  </button>
                </div>
              )}
              
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">
                    {user.role === 'admin' && currentView === 'admin' ? 'Administrator' : 
                     user.role === 'admin' && currentView === 'user' ? 'Admin as Driver' : 
                     'Driver'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}