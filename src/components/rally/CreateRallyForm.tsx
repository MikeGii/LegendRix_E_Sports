// src/components/rally/CreateRallyForm.tsx
'use client'

import { useState } from 'react'

interface RallyGame {
  id: string
  game_name: string
}

interface RallyType {
  id: string
  type_name: string
}

interface RallyEvent {
  id: string
  event_name: string
}

interface CreateRallyFormProps {
  games: RallyGame[]
  filteredTypes: RallyType[]
  filteredEvents: RallyEvent[]
  isLoading: boolean
  onSubmit: (formData: any) => void
  onGameChange: (gameId: string) => void
}

export function CreateRallyForm({ 
  games, 
  filteredTypes, 
  filteredEvents, 
  isLoading, 
  onSubmit, 
  onGameChange 
}: CreateRallyFormProps) {
  const [rallyForm, setRallyForm] = useState({
    gameId: '',
    typeId: '',
    eventIds: [''], // Changed to array for multiple events
    rallyDate: '',
    registrationEndDate: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty event IDs
    const selectedEventIds = rallyForm.eventIds.filter(id => id.trim() !== '')
    
    onSubmit({
      ...rallyForm,
      eventIds: selectedEventIds
    })
  }

  const handleGameChange = (gameId: string) => {
    setRallyForm({ ...rallyForm, gameId, typeId: '', eventIds: [''] })
    onGameChange(gameId)
  }

  // Add new event selection
  const addEventSelection = () => {
    setRallyForm({
      ...rallyForm,
      eventIds: [...rallyForm.eventIds, '']
    })
  }

  // Remove event selection
  const removeEventSelection = (index: number) => {
    if (rallyForm.eventIds.length > 1) {
      const newEventIds = rallyForm.eventIds.filter((_, i) => i !== index)
      setRallyForm({...rallyForm, eventIds: newEventIds})
    }
  }

  // Update specific event selection
  const updateEventSelection = (index: number, eventId: string) => {
    const newEventIds = [...rallyForm.eventIds]
    newEventIds[index] = eventId
    setRallyForm({...rallyForm, eventIds: newEventIds})
  }

  // Get available events (exclude already selected ones)
  const getAvailableEventsForIndex = (currentIndex: number) => {
    const selectedEventIds = rallyForm.eventIds
      .filter((id, index) => index !== currentIndex && id.trim() !== '')
    
    return filteredEvents.filter(event => !selectedEventIds.includes(event.id))
  }

  // Check if we can add more events
  const canAddMoreEvents = () => {
    const selectedEventIds = rallyForm.eventIds.filter(id => id.trim() !== '')
    return selectedEventIds.length < filteredEvents.length
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Create New Rally</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rally Game *</label>
            <select
              value={rallyForm.gameId}
              onChange={(e) => handleGameChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a game...</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>{game.game_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rally Type *</label>
            <select
              value={rallyForm.typeId}
              onChange={(e) => setRallyForm({...rallyForm, typeId: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!rallyForm.gameId}
            >
              <option value="">Select a type...</option>
              {filteredTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.type_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rally Events Section */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-4">
            Rally Events * (at least one required)
          </label>
          <div className="space-y-3">
            {rallyForm.eventIds.map((eventId, index) => {
              const availableEvents = getAvailableEventsForIndex(index)
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <select
                      value={eventId}
                      onChange={(e) => updateEventSelection(index, e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!rallyForm.gameId}
                      required={index === 0} // Only first event is required
                    >
                      <option value="">Select event {index + 1}...</option>
                      {availableEvents.map((event) => (
                        <option key={event.id} value={event.id}>{event.event_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Add button - show on last field if current field has value and we can add more */}
                  {index === rallyForm.eventIds.length - 1 && eventId.trim() && canAddMoreEvents() && (
                    <button
                      type="button"
                      onClick={addEventSelection}
                      className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      title="Add another event"
                    >
                      +
                    </button>
                  )}
                  
                  {/* Remove button - show if more than 1 field */}
                  {rallyForm.eventIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEventSelection(index)}
                      className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      title="Remove this event"
                    >
                      −
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Selected Events Preview */}
          {rallyForm.eventIds.some(id => id.trim()) && (
            <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Selected Events:</h4>
              <div className="flex flex-wrap gap-2">
                {rallyForm.eventIds
                  .filter(id => id.trim())
                  .map((eventId, index) => {
                    const event = filteredEvents.find(e => e.id === eventId)
                    return event ? (
                      <span key={eventId} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                        {index + 1}. {event.event_name}
                      </span>
                    ) : null
                  })}
              </div>
            </div>
          )}

          {/* Show info when all events are selected */}
          {!canAddMoreEvents() && rallyForm.eventIds.filter(id => id.trim()).length === filteredEvents.length && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">
                🎉 All available events have been selected! ({filteredEvents.length} events)
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rally Date *</label>
            <input
              type="datetime-local"
              value={rallyForm.rallyDate}
              onChange={(e) => setRallyForm({...rallyForm, rallyDate: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Registration Ends *</label>
            <input
              type="datetime-local"
              value={rallyForm.registrationEndDate}
              onChange={(e) => setRallyForm({...rallyForm, registrationEndDate: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Optional Notes</label>
          <textarea
            value={rallyForm.notes}
            onChange={(e) => setRallyForm({...rallyForm, notes: e.target.value})}
            rows={4}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Add any special notes or instructions for participants..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Creating Rally...' : '🏁 Create Rally'}
        </button>
      </form>
    </div>
  )
}