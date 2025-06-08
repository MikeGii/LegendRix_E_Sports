'use client'

import { useAuth } from './AuthProvider'
import { useState, useEffect } from 'react'

interface PendingUser {
  id: string
  name: string
  email: string
  createdAt: string
  emailVerified: boolean
}

export function AdminDashboard() {
  const { user, logout } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/pending-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch pending users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action })
      })

      if (response.ok) {
        // Refresh the pending users list
        fetchPendingUsers()
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>

        {/* Admin Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Pending Approvals</h3>
            <p className="text-2xl font-bold text-blue-900">
              {pendingUsers.filter(u => u.emailVerified).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Email Unverified</h3>
            <p className="text-2xl font-bold text-yellow-900">
              {pendingUsers.filter(u => !u.emailVerified).length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Total Users</h3>
            <p className="text-2xl font-bold text-green-900">--</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Registrations</h3>
            <p className="text-2xl font-bold text-purple-900">--</p>
          </div>
        </div>
      </div>

      {/* Pending Users Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">👥 User Management</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No pending users at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Registration Date</th>
                  <th className="text-left p-3 font-semibold">Email Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pendingUser) => (
                  <tr key={pendingUser.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{pendingUser.name}</td>
                    <td className="p-3">{pendingUser.email}</td>
                    <td className="p-3">
                      {new Date(pendingUser.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pendingUser.emailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pendingUser.emailVerified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="p-3">
                      {pendingUser.emailVerified ? (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleUserAction(pendingUser.id, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleUserAction(pendingUser.id, 'reject')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Waiting for email verification</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coming Soon Admin Features */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">🚧 Coming Soon - Admin Features</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">🏆 Championship Management</h3>
            <p className="text-sm text-gray-600">Create and manage rally championships</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">📊 Registration Reports</h3>
            <p className="text-sm text-gray-600">View detailed registration analytics</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">📧 Email Management</h3>
            <p className="text-sm text-gray-600">Send announcements to users</p>
          </div>
        </div>
      </div>
    </div>
  )
}