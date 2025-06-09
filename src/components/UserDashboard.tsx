'use client'

import { useAuth } from './AuthProvider'

export function UserDashboard() {
  const { user } = useAuth()

  if (!user) return null

  const getStatusMessage = () => {
    if (!user.emailVerified) {
      return {
        type: 'warning',
        message: '📧 Please check your email and click the verification link to complete your registration.'
      }
    }
    
    if (!user.adminApproved) {
      return {
        type: 'info',
        message: '⏳ Your account is pending admin approval. You will be notified once approved.'
      }
    }
    
    return {
      type: 'success',
      message: '✅ Your account is fully activated! Welcome to E-WRC Rally Registration.'
    }
  }

  const status = getStatusMessage()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="text-gray-600">User Dashboard</p>
        </div>

        {/* Account Status */}
        <div className={`p-4 rounded-md mb-6 ${
          status.type === 'success' ? 'bg-green-100 text-green-800' :
          status.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          <p className="font-medium">{status.message}</p>
        </div>

        {/* Account Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Account Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email Verified:</span>
                <span className={`font-medium ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.emailVerified ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Admin Approved:</span>
                <span className={`font-medium ${user.adminApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.adminApproved ? '✅ Yes' : '⏳ Pending'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-3">
              {!user.emailVerified && (
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Resend Verification Email
                </button>
              )}
              
              {user.emailVerified && user.adminApproved && (
                <>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    📝 Register for Championship
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    📊 View My Registrations
                  </button>
                </>
              )}
              
              <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
                ⚙️ Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">🚧 Coming Soon</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">🏆 Championship Registration</h3>
            <p className="text-sm text-gray-600">Register for upcoming rally championships</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">📊 My Statistics</h3>
            <p className="text-sm text-gray-600">View your racing history and performance</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">👥 Community</h3>
            <p className="text-sm text-gray-600">Connect with other rally drivers</p>
          </div>
        </div>
      </div>
    </div>
  )
}