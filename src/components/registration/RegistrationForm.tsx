'use client'

import { useState, useEffect, useMemo } from 'react'

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

interface RegistrationFormProps {
  rallies: Rally[]
  preSelectedRallyId?: string | null
  onSubmit: (registrationData: {
    rallyId: string
    additionalNotes?: string
  }) => void
  isLoading: boolean
  isAdminAsDriver?: boolean  // Add this prop
}

export function RegistrationForm({ 
  rallies, 
  preSelectedRallyId, 
  onSubmit, 
  isLoading,
  isAdminAsDriver = false  // Add this with default value 
}: RegistrationFormProps) {
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [selectedRallyId, setSelectedRallyId] = useState<string>('')
  const [additionalNotes, setAdditionalNotes] = useState<string>('')
  const [showRallyDetails, setShowRallyDetails] = useState(false)

  // Get unique games from rallies
  const availableGames = useMemo(() => {
    const gameMap = new Map()
    rallies.forEach(rally => {
      if (!gameMap.has(rally.rally_game_id)) {
        gameMap.set(rally.rally_game_id, {
          id: rally.rally_game_id,
          name: rally.game_name
        })
      }
    })
    return Array.from(gameMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [rallies])

  // Filter rallies by selected game
  const filteredRallies = useMemo(() => {
    if (!selectedGameId) return rallies
    return rallies.filter(rally => rally.rally_game_id === selectedGameId)
  }, [rallies, selectedGameId])

  // Get selected rally details
  const selectedRally = useMemo(() => {
    return rallies.find(rally => rally.rally_id === selectedRallyId)
  }, [rallies, selectedRallyId])

  // Handle pre-selection
  useEffect(() => {
    if (preSelectedRallyId && rallies.length > 0) {
      const preSelected = rallies.find(r => r.rally_id === preSelectedRallyId)
      if (preSelected) {
        setSelectedRallyId(preSelectedRallyId)
        setSelectedGameId(preSelected.rally_game_id)
        setShowRallyDetails(true)
      }
    }
  }, [preSelectedRallyId, rallies])

  const handleGameChange = (gameId: string) => {
    setSelectedGameId(gameId)
    setSelectedRallyId('') // Reset rally selection when game changes
    setShowRallyDetails(false)
  }

  const handleRallyChange = (rallyId: string) => {
    setSelectedRallyId(rallyId)
    setShowRallyDetails(!!rallyId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRallyId) {
      alert('Please select a rally to register for')
      return
    }
    
    onSubmit({
      rallyId: selectedRallyId,
      additionalNotes: additionalNotes.trim() || undefined
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isRegistrationOpen = (registrationEndDate: string) => {
    return new Date(registrationEndDate) > new Date()
  }

  const getTimeUntilDeadline = (registrationEndDate: string) => {
    const now = new Date()
    const deadline = new Date(registrationEndDate)
    const diff = deadline.getTime() - now.getTime()
    
    if (diff <= 0) return 'Registration closed'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} left`
    } else {
      return 'Less than 1 hour left'
    }
  }

  const getSurfaceIcon = (surface?: string) => {
    switch (surface?.toLowerCase()) {
      case 'gravel': return '🪨'
      case 'tarmac':
      case 'asphalt': return '🛣️'
      case 'snow': return '❄️'
      case 'ice': return '🧊'
      case 'dirt': return '🌍'
      default: return '🏁'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Rally Registration Form
        {isAdminAsDriver && (
          <span className="text-purple-400 text-lg ml-2">(Admin Driver Mode)</span>
        )}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Game Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Select Game (Optional - filter rallies by game)
          </label>
          <select
            value={selectedGameId}
            onChange={(e) => handleGameChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Games ({rallies.length} rallies)</option>
            {availableGames.map((game) => {
              const gameRalliesCount = rallies.filter(r => r.rally_game_id === game.id).length
              return (
                <option key={game.id} value={game.id}>
                  {game.name} ({gameRalliesCount} rallies)
                </option>
              )
            })}
          </select>
        </div>

        {/* Rally Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Select Rally *
            {selectedGameId && (
              <span className="text-slate-400 ml-2">
                (Showing {filteredRallies.length} rallies for {availableGames.find(g => g.id === selectedGameId)?.name})
              </span>
            )}
          </label>
          <select
            value={selectedRallyId}
            onChange={(e) => handleRallyChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose a rally...</option>
            {filteredRallies.map((rally) => {
              const registrationOpen = isRegistrationOpen(rally.registration_ending_date)
              const timeLeft = getTimeUntilDeadline(rally.registration_ending_date)
              
              return (
                <option 
                  key={rally.rally_id} 
                  value={rally.rally_id}
                  disabled={!registrationOpen}
                >
                  {rally.game_name} - {rally.type_name} | {formatDate(rally.rally_date)} | {timeLeft}
                </option>
              )
            })}
          </select>
          
          {filteredRallies.length === 0 && selectedGameId && (
            <p className="text-slate-400 text-sm mt-2">
              No rallies available for the selected game
            </p>
          )}
        </div>

        {/* Rally Details */}
        {selectedRally && showRallyDetails && (
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <span>🏁</span>
              <span>Rally Details</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 text-sm block">Game</span>
                  <span className="text-white font-medium">{selectedRally.game_name}</span>
                </div>
                
                <div>
                  <span className="text-slate-400 text-sm block">Rally Type</span>
                  <span className="text-white">{selectedRally.type_name}</span>
                </div>
                
                <div>
                  <span className="text-slate-400 text-sm block">Rally Date</span>
                  <span className="text-white">{formatDate(selectedRally.rally_date)}</span>
                </div>
                
                <div>
                  <span className="text-slate-400 text-sm block">Registration Deadline</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-white">{formatDate(selectedRally.registration_ending_date)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isRegistrationOpen(selectedRally.registration_ending_date)
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {getTimeUntilDeadline(selectedRally.registration_ending_date)}
                    </span>
                  </div>
                </div>

                {selectedRally.creator_name && (
                  <div>
                    <span className="text-slate-400 text-sm block">Created by</span>
                    <span className="text-white">{selectedRally.creator_name}</span>
                  </div>
                )}
              </div>

              {/* Right Column - Events */}
              <div>
                <span className="text-slate-400 text-sm block mb-3">
                  Rally Events ({selectedRally.events?.length || 0})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedRally.events && selectedRally.events.length > 0 ? (
                    selectedRally.events
                      .sort((a, b) => a.event_order - b.event_order)
                      .map((event) => (
                        <div 
                          key={event.event_id}
                          className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="flex items-center justify-center w-5 h-5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                              {event.event_order}
                            </span>
                            <span className="text-white font-medium text-sm">{event.event_name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            {event.country && (
                              <span className="flex items-center space-x-1">
                                <span>🌍</span>
                                <span>{event.country}</span>
                              </span>
                            )}
                            {event.surface_type && (
                              <span className="flex items-center space-x-1">
                                <span>{getSurfaceIcon(event.surface_type)}</span>
                                <span>{event.surface_type}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-slate-500 italic text-sm">No events assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rally Notes */}
            {selectedRally.optional_notes && (
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <span className="text-slate-400 text-sm block mb-2">Rally Notes</span>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">
                    {selectedRally.optional_notes}
                  </p>
                </div>
              </div>
            )}

            {/* Registration Status Warning */}
            {!isRegistrationOpen(selectedRally.registration_ending_date) && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 font-medium flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Registration for this rally has closed</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Additional Notes (Optional)
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Any additional information, car setup preferences, or special requests..."
            maxLength={500}
          />
          <div className="text-right text-xs text-slate-400 mt-1">
            {additionalNotes.length}/500 characters
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-700/50">
          <div className="text-sm text-slate-400">
            {selectedRally && isRegistrationOpen(selectedRally.registration_ending_date) ? (
              <span className="text-green-400">✅ Registration is open for this rally</span>
            ) : selectedRally ? (
              <span className="text-red-400">❌ Registration is closed for this rally</span>
            ) : (
              <span>Please select a rally to continue</span>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !selectedRallyId || !selectedRally || !isRegistrationOpen(selectedRally.registration_ending_date)}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>🏁</span>
                <span>Register for Rally</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}