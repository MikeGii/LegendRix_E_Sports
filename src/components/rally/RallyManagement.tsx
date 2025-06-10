// Create src/components/rally/RallyManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRallyApi } from '@/hooks/useRallyApi'

// Extended Rally interface specifically for management
interface ManagementRally {
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
  creator_name?: string
  registration_count: number
  computed_status: 'upcoming' | 'active' | 'past' | 'cancelled'
  status?: string
  cancellation_reason?: string
  events: Array<{
    event_id: string
    event_name: string
    event_order: number
    country?: string
    surface_type?: string
  }>
}

interface RallyGame {
  id: string
  game_name: string
}

interface RallyManagementProps {
  games: RallyGame[]
  onRefresh: () => void
}

export function RallyManagement({ games, onRefresh }: RallyManagementProps) {
  const [rallies, setRallies] = useState<ManagementRally[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'active' | 'past' | 'cancelled'>('all')
  const [editingRally, setEditingRally] = useState<ManagementRally | null>(null)
  const [showCancelModal, setShowCancelModal] = useState<ManagementRally | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { 
    updateRally, 
    cancelRally, 
    error, 
    clearError 
  } = useRallyApi()

  useEffect(() => {
    loadRallies()
  }, [selectedGameId, selectedStatus])

  useEffect(() => {
    if (error) {
      console.error('Rally management error:', error)
      clearError()
    }
  }, [error, clearError])

  const loadRallies = async () => {
    try {
      setIsLoading(true)
      
      // Call the management API directly since we don't have fetchAllRallies yet
      const token = localStorage.getItem('auth_token')
      const searchParams = new URLSearchParams()
      
      if (selectedGameId) searchParams.set('gameId', selectedGameId)
      if (selectedStatus !== 'all') searchParams.set('status', selectedStatus)
      
      const response = await fetch(`/api/rally/rallies/manage?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch rallies')
      }
      
      const data = await response.json()
      if (data.success && data.data) {
        setRallies(data.data)
      }
    } catch (err) {
      console.error('Failed to load rallies:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRally = async (rallyId: string, updateData: any) => {
    try {
      await updateRally(rallyId, updateData)
      setEditingRally(null)
      await loadRallies()
      onRefresh()
    } catch (err) {
      console.error('Failed to update rally:', err)
    }
  }

  const handleCancelRally = async () => {
    if (!showCancelModal) return
    
    try {
      await cancelRally(showCancelModal.rally_id, cancelReason.trim() || undefined)
      setShowCancelModal(null)
      setCancelReason('')
      await loadRallies()
      onRefresh()
    } catch (err) {
      console.error('Failed to cancel rally:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'past':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '⏳'
      case 'active':
        return '🏁'
      case 'past':
        return '🏆'
      case 'cancelled':
        return '❌'
      default:
        return '❓'
    }
  }

  const canEdit = (rally: ManagementRally) => {
    return rally.computed_status === 'upcoming' && rally.status !== 'cancelled'
  }

  const canCancel = (rally: ManagementRally) => {
    return (rally.computed_status === 'upcoming' || rally.computed_status === 'active') && rally.status !== 'cancelled'
  }

  const filteredRallies = rallies.filter(rally =>
    rally.game_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rally.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rally.creator_name && rally.creator_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Rally Management</h2>
          <p className="text-slate-400">View, edit, and manage existing rallies</p>
        </div>
        
        <button
          onClick={loadRallies}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Game</label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Games</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>{game.game_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rallies</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active (Registration Closed)</option>
            <option value="past">Past</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search rallies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {['all', 'upcoming', 'active', 'past', 'cancelled'].map((status) => {
          const count = status === 'all' 
            ? rallies.length 
            : rallies.filter(r => r.computed_status === status || (status === 'cancelled' && r.status === 'cancelled')).length
          
          return (
            <div key={status} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium capitalize">{status}</p>
                  <p className="text-2xl font-bold text-white mt-1">{count}</p>
                </div>
                <span className="text-2xl">{getStatusIcon(status)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rallies List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading rallies...</p>
          </div>
        </div>
      ) : filteredRallies.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-slate-500">🏁</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">No Rallies Found</h3>
          <p className="text-slate-400">
            {searchTerm ? 'No rallies match your search criteria.' : 'No rallies match the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRallies.map((rally) => (
            <div key={rally.rally_id} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{rally.game_name}</h3>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full border border-blue-500/30">
                      {rally.type_name}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(rally.status === 'cancelled' ? 'cancelled' : rally.computed_status)}`}>
                      {getStatusIcon(rally.status === 'cancelled' ? 'cancelled' : rally.computed_status)} 
                      {rally.status === 'cancelled' ? 'Cancelled' : rally.computed_status.charAt(0).toUpperCase() + rally.computed_status.slice(1)}
                    </span>
                    {rally.events.length > 1 && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                        {rally.events.length} Events
                      </span>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-green-400">📅</span>
                        <span className="font-medium">Rally Date:</span>
                        <span>{formatDate(rally.rally_date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-yellow-400">⏰</span>
                        <span className="font-medium">Registration Ends:</span>
                        <span>{formatDate(rally.registration_ending_date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-blue-400">👥</span>
                        <span className="font-medium">Registrations:</span>
                        <span>{rally.registration_count || 0}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-purple-400">👤</span>
                        <span className="font-medium">Created by:</span>
                        <span>{rally.creator_name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-gray-400">📅</span>
                        <span className="font-medium">Created:</span>
                        <span>{formatDate(rally.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-gray-400">🆔</span>
                        <span className="font-medium">ID:</span>
                        <span className="font-mono text-xs">{rally.rally_id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>

                  {/* Events List */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Rally Events ({rally.events.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {rally.events
                        .sort((a, b) => a.event_order - b.event_order)
                        .map((event) => (
                          <span 
                            key={event.event_id}
                            className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-lg border border-slate-600/50"
                          >
                            {event.event_order}. {event.event_name}
                            {event.country && <span className="ml-1 text-slate-400">({event.country})</span>}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {rally.optional_notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Notes</h4>
                      <p className="text-slate-400 text-sm bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                        {rally.optional_notes}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Info */}
                  {rally.status === 'cancelled' && rally.cancellation_reason && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-red-300 mb-2">Cancellation Reason</h4>
                      <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                        {rally.cancellation_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 ml-4">
                  {canEdit(rally) && (
                    <button
                      onClick={() => setEditingRally(rally)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 text-sm"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  
                  {canCancel(rally) && (
                    <button
                      onClick={() => setShowCancelModal(rally)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 text-sm"
                    >
                      ❌ Cancel
                    </button>
                  )}
                  
                  <button
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200 text-sm"
                    title="View Registrations"
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Rally Modal */}
      {editingRally && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Edit Rally: {editingRally.game_name} - {editingRally.type_name}</h3>
            
            <EditRallyForm
              rally={editingRally}
              onSave={(updateData) => handleUpdateRally(editingRally.rally_id, updateData)}
              onCancel={() => setEditingRally(null)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Cancel Rally Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Cancel Rally</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to cancel <strong className="text-white">{showCancelModal.game_name} - {showCancelModal.type_name}</strong>?
              {showCancelModal.registration_count > 0 && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ This rally has {showCancelModal.registration_count} registration(s). Participants will need to be notified.
                </span>
              )}
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Cancellation Reason (recommended):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                placeholder="e.g., Insufficient registrations, technical issues, etc."
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleCancelRally}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(null)
                  setCancelReason('')
                }}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200"
              >
                Keep Rally
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Rally Form Component
interface EditRallyFormProps {
  rally: ManagementRally
  onSave: (updateData: any) => void
  onCancel: () => void
  isLoading: boolean
}

function EditRallyForm({ rally, onSave, onCancel, isLoading }: EditRallyFormProps) {
  const [formData, setFormData] = useState({
    rallyDate: new Date(rally.rally_date).toISOString().slice(0, 16),
    registrationEndDate: new Date(rally.registration_ending_date).toISOString().slice(0, 16),
    notes: rally.optional_notes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate dates
    const rallyDate = new Date(formData.rallyDate)
    const regEndDate = new Date(formData.registrationEndDate)
    
    if (regEndDate >= rallyDate) {
      alert('Registration must end before the rally date')
      return
    }
    
    if (rallyDate <= new Date()) {
      alert('Rally date must be in the future')
      return
    }
    
    onSave({
      rallyDate: formData.rallyDate,
      registrationEndDate: formData.registrationEndDate,
      notes: formData.notes.trim() || null
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Rally Date *</label>
          <input
            type="datetime-local"
            value={formData.rallyDate}
            onChange={(e) => setFormData({ ...formData, rallyDate: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Registration Ends *</label>
          <input
            type="datetime-local"
            value={formData.registrationEndDate}
            onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Optional rally notes..."
        />
      </div>

      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}