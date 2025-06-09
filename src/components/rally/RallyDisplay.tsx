// src/components/rally/RallyDisplay.tsx
'use client'

import { useState } from 'react'

interface Rally {
  rally_id: string
  rally_game_id: string
  rally_type_id: string
  rally_event_id: string
  rally_date: string
  registration_ending_date: string
  optional_notes?: string
  created_by: string
  created_at: string
  updated_at: string
  game_name: string
  type_name: string
  event_name: string
  creator_name?: string
}

interface RallyDisplayProps {
  rallies: Rally[]
  showLimit?: number
  onRegister?: (rallyId: string) => void
}

export function RallyDisplay({ rallies, showLimit = 3, onRegister }: RallyDisplayProps) {
  const [expandedRallies, setExpandedRallies] = useState<Set<string>>(new Set())

  const toggleExpanded = (rallyId: string) => {
    const newExpanded = new Set(expandedRallies)
    if (newExpanded.has(rallyId)) {
      newExpanded.delete(rallyId)
    } else {
      newExpanded.add(rallyId)
    }
    setExpandedRallies(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  // Sort rallies by rally date (nearest first) and limit results
  const sortedRallies = rallies
    .filter(rally => new Date(rally.rally_date) > new Date()) // Only show upcoming rallies
    .sort((a, b) => new Date(a.rally_date).getTime() - new Date(b.rally_date).getTime())
    .slice(0, showLimit)

  if (sortedRallies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl text-slate-500">🏁</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Upcoming Rallies</h3>
        <p className="text-slate-400">
          There are no rallies scheduled at the moment. Check back later for new events!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedRallies.map((rally) => {
        const isExpanded = expandedRallies.has(rally.rally_id)
        const registrationOpen = isRegistrationOpen(rally.registration_ending_date)
        const timeLeft = getTimeUntilDeadline(rally.registration_ending_date)

        return (
          <div 
            key={rally.rally_id}
            className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:bg-slate-800/40 transition-all duration-200"
          >
            {/* Main Rally Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{rally.game_name}</h3>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full border border-blue-500/30">
                      {rally.type_name}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <span className="text-green-400">📅</span>
                      <span className="font-medium">Rally Date:</span>
                      <span>{formatDate(rally.rally_date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-slate-300">
                      <span className={registrationOpen ? "text-yellow-400" : "text-red-400"}>⏰</span>
                      <span className="font-medium">Registration:</span>
                      <span className={registrationOpen ? "text-yellow-300" : "text-red-300"}>
                        {formatDate(rally.registration_ending_date)}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        registrationOpen 
                          ? 'bg-yellow-500/20 text-yellow-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 ml-4">
                  {registrationOpen && onRegister && (
                    <button
                      onClick={() => onRegister(rally.rally_id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                    >
                      Register
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleExpanded(rally.rally_id)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>{isExpanded ? 'Show Less' : 'View More'}</span>
                    <span className={`transform transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}>
                      ▼
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-slate-700/50 bg-slate-900/30 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Rally Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <span>🏁</span>
                      <span>Rally Details</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 w-20">Event:</span>
                        <span className="text-white font-medium">{rally.event_name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 w-20">Type:</span>
                        <span className="text-white">{rally.type_name}</span>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <span className="text-slate-400 w-20">Created:</span>
                        <div>
                          <p className="text-white">{formatDate(rally.created_at)}</p>
                          {rally.creator_name && (
                            <p className="text-slate-400 text-sm">by {rally.creator_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <span>📋</span>
                      <span>Additional Information</span>
                    </h4>
                    
                    <div className="space-y-3">
                      {rally.optional_notes ? (
                        <div>
                          <span className="text-slate-400 block mb-1">Notes:</span>
                          <p className="text-white bg-slate-800/50 rounded-lg p-3 text-sm">
                            {rally.optional_notes}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-400">Notes:</span>
                          <span className="text-slate-500 italic">No additional notes</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          registrationOpen 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {registrationOpen ? 'Registration Open' : 'Registration Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}