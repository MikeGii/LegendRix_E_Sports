// src/components/AdminDashboard.tsx - FIXED VERSION

'use client'

import { useState, useEffect, useCallback } from 'react'

interface PendingUser {
  id: string
  name: string
  email: string
  createdAt: string
  emailVerified: boolean
  adminApproved: boolean
  status: string
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
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now()) // Add refresh trigger

  // Memoized fetch function to prevent infinite re-renders
  const fetchPendingUsers = useCallback(async () => {
    try {
      console.log('🔄 Fetching pending users...')
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      const response = await fetch('/api/admin/pending-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Pending users fetched:', data.length)
        
        // Update users list
        setPendingUsers(data)
        
        // Calculate stats from the fetched data
        const stats = {
          totalUsers: data.length,
          pendingEmail: data.filter((u: PendingUser) => !u.emailVerified).length,
          pendingApproval: data.filter((u: PendingUser) => u.emailVerified && !u.adminApproved && u.status !== 'rejected').length,
          approved: data.filter((u: PendingUser) => u.status === 'approved').length,
          rejected: data.filter((u: PendingUser) => u.status === 'rejected').length
        }
        
        console.log('📊 Updated stats:', stats)
        setUserStats(stats)
      } else {
        console.error('Failed to fetch pending users:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch pending users:', error)
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array since we don't depend on any external values

  // Fetch data on mount and when lastRefresh changes
  useEffect(() => {
    fetchPendingUsers()
  }, [fetchPendingUsers, lastRefresh])

  // Force refresh function
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refresh triggered')
    setLastRefresh(Date.now())
  }, [])

  const handleUserAction = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      console.log(`🔄 ${action} user:`, userId)
      setActionLoading(userId)
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action, reason })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ User ${action} successful:`, result)
        
        // Force refresh the user list
        forceRefresh()
        
        // Close modal if open
        setShowRejectModal(false)
        setSelectedUser(null)
        setRejectionReason('')
        
        // Show success message (optional)
        console.log(`User ${action}d successfully`)
      } else {
        const error = await response.json()
        console.error(`Failed to ${action} user:`, error.error)
        alert(`Failed to ${action} user: ${error.error}`)
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      alert(`Failed to ${action} user. Please try again.`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = (user: PendingUser) => {
    handleUserAction(user.id, 'approve')
  }

  const handleReject = (user: PendingUser) => {
    setSelectedUser(user)
    setShowRejectModal(true)
  }

  const submitRejection = () => {
    if (selectedUser) {
      handleUserAction(selectedUser.id, 'reject', rejectionReason)
    }
  }

  const getFilteredUsers = () => {
    console.log('🔍 Filtering users with filter:', filter)
    console.log('📋 Total users before filtering:', pendingUsers.length)
    
    let filtered: PendingUser[] = []
    
    switch (filter) {
      case 'pending_verification':
        filtered = pendingUsers.filter(user => !user.emailVerified)
        break
      case 'pending_approval':
        filtered = pendingUsers.filter(user => 
          user.emailVerified && 
          !user.adminApproved && 
          user.status !== 'rejected' && 
          user.status !== 'approved'
        )
        break
      default:
        // Show all users that are not yet fully approved
        filtered = pendingUsers.filter(user => 
          user.status !== 'approved' || !user.emailVerified || !user.adminApproved
        )
    }
    
    console.log('📋 Filtered users:', filtered.length)
    return filtered
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
            </div>
            <button
              onClick={forceRefresh}
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
                  <span>Refresh</span>
                </div>
              )}
            </button>
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
                <p className="text-slate-400">Loading users...</p>
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
                          {user.emailVerified && !user.adminApproved && user.status !== 'rejected' && user.status !== 'approved' ? (
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
                            <span className="text-green-400 font-medium text-sm">✅ Already Approved</span>
                          ) : user.status === 'rejected' ? (
                            <span className="text-red-400 font-medium text-sm">❌ Rejected</span>
                          ) : (
                            <span className="text-slate-500 text-sm">
                              {!user.emailVerified ? '⏳ Waiting for email verification' : '⏳ Processing...'}
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