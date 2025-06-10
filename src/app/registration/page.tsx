// Fix src/app/registration/page.tsx
'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { RegistrationForm } from '@/components/registration/RegistrationForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { MessageDisplay } from '@/components/shared/MessageDisplay'
import { useRallyApi } from '@/hooks/useRallyApi'
import { useAuth } from '@/components/AuthProvider'
import { useView } from '@/components/ViewProvider'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Rally interface matching what we get from the API
interface Rally {
  rally_id: string
  rally_game_id: string
  rally_type_id: string
  rally_date: string
  registration_ending_date: string
  optional_notes?: string
  created_by: string
  created_at: string
  updated_at: string
  game_name: string
  type_name: string
  events: Array<{
    event_id: string
    event_name: string
    event_order: number
    country?: string
    surface_type?: string
  }>
  creator_name?: string
}

// Separate component for search params to wrap in Suspense
function RegistrationContent() {
  const { user } = useAuth()
  const { currentView } = useView()
  const [rallies, setRallies] = useState<Rally[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<{type: 'success' | 'error' | 'warning' | 'info', text: string} | null>(null)
  
  const searchParams = useSearchParams()
  const preSelectedRallyId = searchParams.get('rallyId')
  
  // Use the rally API hook
  const { fetchUpcomingRallies, error, clearError } = useRallyApi()

  // Load rallies on component mount
  useEffect(() => {
    loadRallies()
  }, [])

  // Clear API errors when they change
  useEffect(() => {
    if (error) {
      showMessage('error', error)
      clearError()
    }
  }, [error, clearError])

  const loadRallies = async () => {
    try {
      setIsLoading(true)
      console.log('Loading rallies for registration...')
      
      // Fetch all upcoming rallies (no limit for registration)
      const ralliesData = await fetchUpcomingRallies(100)
      setRallies(ralliesData)
      
      console.log('Rallies loaded for registration:', ralliesData.length)
      
      if (preSelectedRallyId) {
        const preSelectedRally = ralliesData.find(r => r.rally_id === preSelectedRallyId)
        if (preSelectedRally) {
          showMessage('info', `Pre-selected rally: ${preSelectedRally.game_name} - ${preSelectedRally.type_name}`)
        }
      }
    } catch (err) {
      console.error('Failed to load rallies:', err)
      showMessage('error', 'Failed to load available rallies')
    } finally {
      setIsLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setMessages({ type, text })
    setTimeout(() => setMessages(null), 5000)
  }

  const handleRegistration = async (registrationData: {
    rallyId: string
    additionalNotes?: string
  }) => {
    // TODO: Implement actual registration logic
    console.log('Rally registration submitted:', registrationData)
    
    const selectedRally = rallies.find(r => r.rally_id === registrationData.rallyId)
    if (selectedRally) {
      showMessage('success', `Registration submitted for ${selectedRally.game_name} - ${selectedRally.type_name}!`)
    }
  }

  // Check if user can access registration
  // For admins in driver mode, treat them as approved users
  const isAdminAsDriver = user?.role === 'admin' && currentView === 'user'
  const canAccessRegistration = user && (
    isAdminAsDriver || // Admin viewing as driver can always register
    (user.emailVerified && user.adminApproved) // Regular users need verification and approval
  )

  console.log('🏁 Registration access check:', {
    userRole: user?.role,
    currentView,
    isAdminAsDriver,
    emailVerified: user?.emailVerified,
    adminApproved: user?.adminApproved,
    canAccessRegistration
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Rally Registration"
        description={
          isAdminAsDriver 
            ? "Register for upcoming rally championships (Administrator Driver Mode)"
            : "Register for upcoming rally championships and compete with drivers worldwide"
        }
        backUrl="/user-dashboard"
        backLabel="Back to Dashboard"
      />

      {/* Messages */}
      <MessageDisplay message={messages} />

      {/* Admin Driver Mode Notice */}
      {isAdminAsDriver && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <span className="text-purple-400">👑</span>
            <span className="text-purple-300 font-medium">Administrator Driver Mode</span>
          </div>
          <p className="text-purple-200 text-sm mt-1">
            You're registering as an administrator in driver mode. All registration features are available.
          </p>
        </div>
      )}

      {/* Check if user can access registration */}
      {!canAccessRegistration ? (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-yellow-400">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Registration Not Available</h3>
            <div className="space-y-2 text-slate-400 max-w-md mx-auto">
              {!user?.emailVerified && (
                <p>• Please verify your email address first</p>
              )}
              {user?.emailVerified && !user?.adminApproved && (
                <p>• Your account is pending admin approval</p>
              )}
            </div>
            <button
              onClick={() => window.location.href = '/user-dashboard'}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading available rallies...</p>
              </div>
            </div>
          ) : rallies.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl text-slate-500">🏁</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No Rallies Available</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                There are currently no upcoming rallies available for registration. 
                Please check back later or contact the administrators.
              </p>
              <button
                onClick={loadRallies}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200"
              >
                Refresh Rallies
              </button>
            </div>
          ) : (
            <RegistrationForm
              rallies={rallies}
              preSelectedRallyId={preSelectedRallyId}
              onSubmit={handleRegistration}
              isLoading={false}
              isAdminAsDriver={isAdminAsDriver}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function RegistrationPage() {
  return (
    <ProtectedRoute 
      requiredRole="user"
      requireEmailVerified={false}
      requireAdminApproved={false}
    >
      <DashboardLayout>
        <Suspense fallback={
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading registration page...</p>
            </div>
          </div>
        }>
          <RegistrationContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  )
}