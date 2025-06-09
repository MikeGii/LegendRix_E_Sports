// Clean and Minimal User Dashboard
// src/components/UserDashboard.tsx

'use client'

import { useAuth } from './AuthProvider'
import { useView } from './ViewProvider'

export function UserDashboard() {
  const { user } = useAuth()
  const { currentView, canSwitchView } = useView()

  if (!user) return null

  // Check if this is an admin viewing as user
  const isAdminAsUser = user.role === 'admin' && currentView === 'user'

  const getStatusMessage = () => {
    // Admins viewing as users are always "approved"
    if (isAdminAsUser) {
      return {
        type: 'success',
        message: 'Administrator access - all features unlocked',
        icon: '👑',
        color: 'green'
      }
    }

    if (!user.emailVerified) {
      return {
        type: 'warning',
        message: 'Please verify your email to access rally features',
        icon: '📧',
        color: 'yellow'
      }
    }
    
    if (!user.adminApproved) {
      return {
        type: 'info',
        message: 'Account pending approval - you will be notified when ready',
        icon: '⏳',
        color: 'blue'
      }
    }
    
    return {
      type: 'success',
      message: 'Account verified - ready to compete!',
      icon: '✅',
      color: 'green'
    }
  }

  const status = getStatusMessage()
  const canAccessRallies = isAdminAsUser || (user.emailVerified && user.adminApproved)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isAdminAsUser ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30' : 'bg-blue-500/20'
              }`}>
                <span className="text-blue-400 text-2xl font-bold">
                  {isAdminAsUser ? '👑' : user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome, {user.name}!
                  {isAdminAsUser && <span className="text-purple-400 ml-2">(Admin)</span>}
                </h1>
                <p className="text-slate-400 mt-1">
                  {isAdminAsUser ? 'Administrator • Driver Mode' : 'E-WRC Rally Championship'}
                </p>
              </div>
            </div>
            
            {/* Admin Badge */}
            {isAdminAsUser && (
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">👑</span>
                  <span className="text-purple-300 font-medium">Admin Driver</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">Rally Dashboard</h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            
            {/* Register for Rally Button */}
            <button 
              disabled={!canAccessRallies}
              className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 ${
                canAccessRallies 
                  ? 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 shadow-lg hover:shadow-green-500/25 hover:scale-105 cursor-pointer' 
                  : 'bg-slate-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  canAccessRallies ? 'bg-white/20' : 'bg-slate-600/30'
                }`}>
                  <span className="text-3xl">🏁</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Register for Rally</h3>
                <p className={`text-sm ${canAccessRallies ? 'text-green-100' : 'text-slate-400'}`}>
                  {canAccessRallies 
                    ? 'Join upcoming championships and compete with drivers worldwide'
                    : 'Complete account verification to access rally registration'
                  }
                </p>
              </div>
              
              {/* Animated background effect for enabled button */}
              {canAccessRallies && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
            </button>

            {/* Results Table Button */}
            <button 
              disabled={!canAccessRallies}
              className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 ${
                canAccessRallies 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-blue-500/25 hover:scale-105 cursor-pointer' 
                  : 'bg-slate-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  canAccessRallies ? 'bg-white/20' : 'bg-slate-600/30'
                }`}>
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Results & Stats</h3>
                <p className={`text-sm ${canAccessRallies ? 'text-blue-100' : 'text-slate-400'}`}>
                  {canAccessRallies 
                    ? 'View championship results, rankings, and your performance history'
                    : 'Results and statistics will be available after account approval'
                  }
                </p>
              </div>
              
              {/* Animated background effect for enabled button */}
              {canAccessRallies && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
            </button>
          </div>

          {/* Action needed for non-approved users */}
          {!canAccessRallies && (
            <div className="mt-8 text-center">
              {!user.emailVerified ? (
                <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-yellow-500/25">
                  <div className="flex items-center space-x-2">
                    <span>📧</span>
                    <span>Resend Verification Email</span>
                  </div>
                </button>
              ) : (
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-slate-300">
                    Your account is under review. You'll receive an email notification once approved.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Admin Switch (only for admins in user mode) */}
        {canSwitchView && currentView === 'user' && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Administrator Tools</h3>
                <p className="text-slate-400 text-sm">Switch back to admin panel to manage users and system settings</p>
              </div>
              <button 
                onClick={() => window.location.href = '/admin-dashboard'}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
              >
                <div className="flex items-center space-x-2">
                  <span>👑</span>
                  <span>Admin Panel</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}