// src/components/AdminDashboard.tsx - FORCE FRESH DATA VERSION

'use client'

import { useState, useEffect, useCallback } from 'react'

interface PendingUser {
  id: string
  name: string
  email: string
  createdAt: string
  emailVerified: boolean
  adminApproved: boolean
  status: 'pending_email' | 'pending_approval' | 'approved' | 'rejected' // Match db.ts
}

interface UserStats {
  totalUsers: number
  pendingEmail: number
  pendingApproval: number
  approved: number
  rejected: number
}

export function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    pendingEmail: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending_verification' | 'pending_approval'>('all')

  // Force fresh data with aggressive cache busting
  const fetchPendingUsers = useCallback(async (forceRefresh = false) => {
    try {
      const timestamp = Date.now()
      console.log(`🔄 Fetching users at ${new Date().toISOString()} (force: ${forceRefresh})`)
      
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      // Multiple cache busting strategies
      const cacheBuster = `t=${timestamp}&r=${Math.random()}&force=${forceRefresh ? '1' : '0'}`
      
      const response = await fetch(`/api/admin/pending-users?${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Timestamp': timestamp.toString()
        },
        // Force bypass any caching
        cache: 'no-store'
      })
      
      console.log(`📡 API Response status: ${response.status}`)
      console.log(`📡 API Response headers:`, Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Fresh data received: ${data.length} users`)
        console.log('📋 Raw API data:', data)
        
        // Log each user's detailed state
        data.forEach((user: PendingUser, index: number) => {
          console.log(`👤 User ${index + 1} (${user.email}):`, {
            id: user.id.substring(0, 8) + '...',
            status: user.status,
            emailVerified: user.emailVerified,
            adminApproved: user.adminApproved,
            isFullyApproved: user.status === 'approved' && user.emailVerified && user.adminApproved
          })
        })
        
        // Force React to recognize this as new data
        setPendingUsers([...data])
        
        // Calculate fresh stats
        const stats = {
          totalUsers: data.length,
          pendingEmail: data.filter((u: PendingUser) => u.status === 'pending_email').length,
          pendingApproval: data.filter((u: PendingUser) => 
            u.status === 'pending_approval' && 
            u.emailVerified && 
            !u.adminApproved
          ).length,
          approved: data.filter((u: PendingUser) => u.status === 'approved').length,
          rejected: data.filter((u: PendingUser) => u.status === 'rejected').length
        }
        
        console.log('📊 Fresh stats calculated:', stats)
        setUserStats(stats)
        
      } else {
        console.error('API Error:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Network error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    console.log('🚀 AdminDashboard mounted, fetching initial data')
    fetchPendingUsers(true)
  }, [fetchPendingUsers])

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered')
    await fetchPendingUsers(true)
  }, [fetchPendingUsers])

  const handleUserAction = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      console.log(`🔄 ${action.toUpperCase()} USER ACTION STARTED:`, {
        userId: userId.substring(0, 8) + '...',
        action,
        reason,
        timestamp: new Date().toISOString()
      })
      
      setActionLoading(userId)
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ userId, action, reason })
      })

      console.log(`📡 User action API response: ${response.status}`)

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ User ${action} API success:`, result)
        
        // Close modal first
        setShowRejectModal(false)
        setSelectedUser(null)
        setRejectionReason('')
        
        // Wait a moment for database consistency
        console.log('⏳ Waiting for database consistency...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Force fresh data fetch
        console.log('🔄 Force fetching fresh data after action...')
        await fetchPendingUsers(true)
        
        console.log(`✅ User ${action} completed successfully`)
      } else {
        const error = await response.json()
        console.error(`❌ ${action} failed:`, error)
        alert(`Failed to ${action} user: ${error.error}`)
      }
    } catch (error) {
      console.error(`❌ ${action} error:`, error)
      alert(`Failed to ${action} user. Please try again.`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = (user: PendingUser) => {
    console.log('👍 Approve button clicked for user:', user.email)
    handleUserAction(user.id, 'approve')
  }

  const handleReject = (user: PendingUser) => {
    console.log('👎 Reject button clicked for user:', user.email)
    setSelectedUser(user)
    setShowRejectModal(true)
  }

  const submitRejection = () => {
    if (selectedUser) {
      handleUserAction(selectedUser.id, 'reject', rejectionReason)
    }
  }
  const getFilteredUsers = () => {
    return pendingUsers.filter(user => {
      // For "all" filter - show only users that need admin action
      if (filter === 'all') {
        return (user.status === 'pending_email' || user.status === 'pending_approval') && 
              !user.adminApproved;
      }
      // For pending verification
      if (filter === 'pending_verification') {
        return user.status === 'pending_email' && !user.emailVerified;
      }
      // For pending approval
      if (filter === 'pending_approval') {
        return user.status === 'pending_approval' && 
              user.emailVerified && 
              !user.adminApproved;
      }
      return true;
    });
  }

  const filteredUsers = getFilteredUsers()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-slate-400">Manage user registrations and system oversight</p>
              <p className="text-xs text-slate-500 mt-2">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => window.location.href = '/api/debug-users'}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
              >
                🐛 Debug DB
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Refreshing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>🔄</span>
                    <span>Force Refresh</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <button className="flex items-center space-x-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25">
              <span className="text-xl">👥</span>
              <span>User Management</span>
            </button>
            
            <button className="flex items-center space-x-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25">
              <span className="text-xl">📋</span>
              <span>User List</span>
            </button>
            
            <button 
              onClick={() => window.location.href = '/rally-creation'}
              className="flex items-center space-x-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
            >
              <span className="text-xl">🏁</span>
              <span>Rally Management</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/40 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white mt-1">{userStats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/40 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Email Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{userStats.pendingEmail}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-yellow-400 text-xl">📧</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/40 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Need Approval</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{userStats.pendingApproval}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-400 text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/40 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{userStats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/40 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{userStats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-red-400 text-xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <h3 className="text-red-400 font-medium mb-2">🐛 Debug Information</h3>
          <div className="text-xs text-red-300 space-y-1">
            <p>Total users in state: {pendingUsers.length}</p>
            <p>Filtered users shown: {filteredUsers.length}</p>
            <p>Current filter: {filter}</p>
            <p>Is loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Action loading: {actionLoading || 'None'}</p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-white">User Management</h2>
            
            {/* Filter Pills */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All ({filteredUsers.length})
              </button>
              <button
                onClick={() => setFilter('pending_verification')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'pending_verification' 
                    ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/25' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Email Pending ({userStats.pendingEmail})
              </button>
              <button
                onClick={() => setFilter('pending_approval')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'pending_approval' 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Ready for Approval ({userStats.pendingApproval})
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading fresh data...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-slate-500">👤</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
              <p className="text-slate-400">
                {filter === 'all' 
                  ? 'No users need attention at this time.' 
                  : filter === 'pending_verification'
                  ? 'No users are waiting for email verification.'
                  : 'No users are ready for approval.'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left p-6 font-medium text-slate-300 bg-slate-800/30">User</th>
                      <th className="text-left p-6 font-medium text-slate-300 bg-slate-800/30">Registration</th>
                      <th className="text-left p-6 font-medium text-slate-300 bg-slate-800/30">Status</th>
                      <th className="text-left p-6 font-medium text-slate-300 bg-slate-800/30">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} className={`border-b border-slate-700/30 hover:bg-slate-800/30 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-slate-800/10' : ''
                      }`}>
                        <td className="p-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <span className="text-blue-400 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-sm text-slate-400">{user.email}</p>
                              <p className="text-xs text-slate-500">ID: {user.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="text-sm text-slate-300">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col space-y-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
                              user.emailVerified 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {user.emailVerified ? '✅ Email Verified' : '⏳ Email Pending'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
                              user.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              user.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              user.adminApproved ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}>
                              {user.status === 'approved' ? '✅ Approved' :
                               user.status === 'rejected' ? '❌ Rejected' :
                               user.adminApproved ? '✅ Admin Approved' :
                               '⏳ Admin Review'}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          {user.status === 'pending_approval' && user.emailVerified && !user.adminApproved ? (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleApprove(user)}
                                disabled={actionLoading === user.id}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? '⏳' : '✅'} Approve
                              </button>
                              <button
                                onClick={() => handleReject(user)}
                                disabled={actionLoading === user.id}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? '⏳' : '❌'} Reject
                              </button>
                            </div>
                          ) : user.status === 'approved' ? (
                            <span className="text-green-400 font-medium text-sm">✅ Approved</span>
                          ) : user.status === 'rejected' ? (
                            <span className="text-red-400 font-medium text-sm">❌ Rejected</span>
                          ) : (
                            <span className="text-slate-500 text-sm">
                              {user.status === 'pending_email' ? '⏳ Waiting for email verification' : '⏳ Processing...'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Reject Registration</h3>
              <p className="text-slate-300 mb-6">
                You are about to reject <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email}).
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Reason for rejection (optional):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="e.g., Incomplete information, suspicious activity, etc."
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={submitRejection}
                  disabled={actionLoading === selectedUser.id}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
                >
                  {actionLoading === selectedUser.id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedUser(null)
                    setRejectionReason('')
                  }}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}