// src/components/UserDashboard.tsx

'use client'

import { useAuth } from './AuthProvider'

export function UserDashboard() {
  const { user } = useAuth()

  if (!user) return null

  const getStatusMessage = () => {
    if (!user.emailVerified) {
      return {
        type: 'warning',
        message: 'Please check your email and click the verification link to complete your registration.',
        icon: '📧',
        color: 'yellow'
      }
    }
    
    if (!user.adminApproved) {
      return {
        type: 'info',
        message: 'Your account is pending admin approval. You will be notified once approved.',
        icon: '⏳',
        color: 'blue'
      }
    }
    
    return {
      type: 'success',
      message: 'Your account is fully activated! Welcome to E-WRC Rally Registration.',
      icon: '✅',
      color: 'green'
    }
  }

  const status = getStatusMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-blue-400 text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back, {user.name}!</h1>
              <p className="text-slate-400 mt-1">E-WRC Rally Championship Dashboard</p>
            </div>
          </div>
        </div>

        {/* Account Status Alert */}
        <div className={`bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 ${
          status.color === 'green' ? 'border-green-500/30 bg-green-500/5' :
          status.color === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/5' :
          'border-blue-500/30 bg-blue-500/5'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              status.color === 'green' ? 'bg-green-500/20' :
              status.color === 'yellow' ? 'bg-yellow-500/20' :
              'bg-blue-500/20'
            }`}>
              <span className="text-xl">{status.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${
                status.color === 'green' ? 'text-green-400' :
                status.color === 'yellow' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                {status.type === 'success' ? 'Account Active' :
                 status.type === 'warning' ? 'Email Verification Required' :
                 'Pending Approval'}
              </h3>
              <p className="text-slate-300">{status.message}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Account Information */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                    <label className="text-slate-400 text-sm">Full Name</label>
                    <p className="text-white font-medium">{user.name}</p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                    <label className="text-slate-400 text-sm">Email Address</label>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                    <label className="text-slate-400 text-sm">Account Role</label>
                    <p className="text-white font-medium capitalize">{user.role}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                    <label className="text-slate-400 text-sm">Email Verification</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      <p className={`font-medium ${user.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                    <label className="text-slate-400 text-sm">Admin Approval</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${user.adminApproved ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                      <p className={`font-medium ${user.adminApproved ? 'text-green-400' : 'text-yellow-400'}`}>
                        {user.adminApproved ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                    <label className="text-slate-400 text-sm">Account Status</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        user.status === 'approved' ? 'bg-green-400' :
                        user.status === 'rejected' ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`}></span>
                      <p className={`font-medium capitalize ${
                        user.status === 'approved' ? 'text-green-400' :
                        user.status === 'rejected' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {user.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {!user.emailVerified && (
                  <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25">
                    <div className="flex items-center justify-center space-x-2">
                      <span>📧</span>
                      <span>Resend Verification</span>
                    </div>
                  </button>
                )}
                
                {user.emailVerified && user.adminApproved && (
                  <>
                    <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25">
                      <div className="flex items-center justify-center space-x-2">
                        <span>🏁</span>
                        <span>Register for Rally</span>
                      </div>
                    </button>
                    <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25">
                      <div className="flex items-center justify-center space-x-2">
                        <span>📊</span>
                        <span>View My Stats</span>
                      </div>
                    </button>
                  </>
                )}
                
                <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200">
                  <div className="flex items-center justify-center space-x-2">
                    <span>⚙️</span>
                    <span>Edit Profile</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Racing Progress */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Racing Progress</h3>
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Championships</span>
                    <span className="text-white font-bold">0</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-0"></div>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Total Races</span>
                    <span className="text-white font-bold">0</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-0"></div>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Best Position</span>
                    <span className="text-white font-bold">--</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full w-0"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Features */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">🚧 Coming Soon</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/30 hover:bg-slate-900/50 transition-all duration-200">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-green-400 text-2xl">🏆</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Championship System</h3>
              <p className="text-slate-400 text-sm">Register and compete in official E-WRC rally championships with ranking system.</p>
            </div>
            
            <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/30 hover:bg-slate-900/50 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-blue-400 text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Performance Analytics</h3>
              <p className="text-slate-400 text-sm">Detailed race statistics, lap times, and performance tracking across all events.</p>
            </div>
            
            <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/30 hover:bg-slate-900/50 transition-all duration-200">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-purple-400 text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Community Hub</h3>
              <p className="text-slate-400 text-sm">Connect with other drivers, join teams, and participate in community events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}