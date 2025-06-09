// Enhanced Admin Dashboard Component
// src/components/AdminDashboard.tsx

'use client'

import { useState, useEffect } from 'react'

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

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/pending-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data)
        
        // Calculate stats
        const stats = {
          totalUsers: data.length,
          pendingEmail: data.filter((u: PendingUser) => !u.emailVerified).length,
          pendingApproval: data.filter((u: PendingUser) => u.emailVerified && !u.adminApproved).length,
          approved: data.filter((u: PendingUser) => u.status === 'approved').length,
          rejected: data.filter((u: PendingUser) => u.status === 'rejected').length
        }
        setUserStats(stats)
      } else {
        console.error('Failed to fetch pending users')
      }
    } catch (error) {
      console.error('Failed to fetch pending users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
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
        console.log('Action result:', result)
        
        // Show success message
        alert(result.message || `User ${action}d successfully!`)
        
        // Refresh the user list
        await fetchPendingUsers()
        
        // Close modal if open
        setShowRejectModal(false)
        setSelectedUser(null)
        setRejectionReason('')
      } else {
        const error = await response.json()
        alert(`Failed to ${action} user: ${error.error}`)
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      alert(`Network error while trying to ${action} user`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = (user: PendingUser) => {
    if (confirm(`Are you sure you want to approve ${user.name} (${user.email})?`)) {
      handleUserAction(user.id, 'approve')
    }
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
    switch (filter) {
      case 'pending_verification':
        return pendingUsers.filter(user => !user.emailVerified)
      case 'pending_approval':
        return pendingUsers.filter(user => user.emailVerified && !user.adminApproved)
      default:
        return pendingUsers
    }
  }

  const filteredUsers = getFilteredUsers()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage user registrations and approvals</p>
          </div>
          <button
            onClick={fetchPendingUsers}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800">Total Users</h3>
            <p className="text-2xl font-bold text-blue-900">{userStats.totalUsers}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-800">Email Unverified</h3>
            <p className="text-2xl font-bold text-yellow-900">{userStats.pendingEmail}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-sm font-semibold text-orange-800">Pending Approval</h3>
            <p className="text-2xl font-bold text-orange-900">{userStats.pendingApproval}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-sm font-semibold text-green-800">Approved</h3>
            <p className="text-2xl font-bold text-green-900">{userStats.approved}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-sm font-semibold text-red-800">Rejected</h3>
            <p className="text-2xl font-bold text-red-900">{userStats.rejected}</p>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">👥 User Management</h2>
          
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({pendingUsers.length})
            </button>
            <button
              onClick={() => setFilter('pending_verification')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'pending_verification' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Need Email Verification ({userStats.pendingEmail})
            </button>
            <button
              onClick={() => setFilter('pending_approval')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'pending_approval' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Ready for Approval ({userStats.pendingApproval})
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p>
              {filter === 'all' 
                ? 'No users have registered yet.' 
                : filter === 'pending_verification'
                ? 'No users are waiting for email verification.'
                : 'No users are ready for approval.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 font-semibold bg-gray-50">User Info</th>
                  <th className="text-left p-4 font-semibold bg-gray-50">Registration Date</th>
                  <th className="text-left p-4 font-semibold bg-gray-50">Status</th>
                  <th className="text-left p-4 font-semibold bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                          user.emailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.emailVerified ? '✅ Email Verified' : '⏳ Email Pending'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                          user.status === 'approved' ? 'bg-green-100 text-green-800' :
                          user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          user.adminApproved ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {user.status === 'approved' ? '✅ Approved' :
                           user.status === 'rejected' ? '❌ Rejected' :
                           user.adminApproved ? '✅ Admin Approved' :
                           '⏳ Admin Review'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.emailVerified && !user.adminApproved && user.status !== 'rejected' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(user)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === user.id ? '⏳' : '✅'} Approve
                          </button>
                          <button
                            onClick={() => handleReject(user)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === user.id ? '⏳' : '❌'} Reject
                          </button>
                        </div>
                      ) : user.status === 'approved' ? (
                        <span className="text-green-600 font-semibold text-sm">✅ Already Approved</span>
                      ) : user.status === 'rejected' ? (
                        <span className="text-red-600 font-semibold text-sm">❌ Rejected</span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {!user.emailVerified ? '⏳ Waiting for email verification' : '⏳ Processing...'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject User Registration</h3>
            <p className="text-gray-600 mb-4">
              You are about to reject <strong>{selectedUser.name}</strong> ({selectedUser.email}).
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (optional):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="e.g., Incomplete information, suspicious activity, etc."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={submitRejection}
                disabled={actionLoading === selectedUser.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {actionLoading === selectedUser.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedUser(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}