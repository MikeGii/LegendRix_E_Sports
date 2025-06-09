
// src/components/rally/EditGameForm.tsx
'use client'

import { useState, useEffect } from 'react'

interface RallyGame {
  id: string
  game_name: string
  game_description?: string
  is_active: boolean
  created_at: string
}

interface RallyType {
  id: string
  game_id: string
  type_name: string
  type_description?: string
  is_active: boolean
  created_at: string
}

interface RallyEvent {
  id: string
  game_id: string
  event_name: string
  event_description?: string
  country?: string
  surface_type?: string
  is_active: boolean
  created_at: string
}

interface EditGameFormProps {
  editingGame: {
    game: RallyGame
    existingTypes: RallyType[]
    existingEvents: RallyEvent[]
  }
  isLoading: boolean
  onSubmit: (gameData: {
    newRallyTypes: string[]
    newRallyEvents: string[]
    updatedTypes: { id: string; name: string }[]
    updatedEvents: { id: string; name: string; country?: string; surface_type?: string }[]
    deletedTypeIds: string[]
    deletedEventIds: string[]
  }) => void
  onCancel: () => void
}

export function EditGameForm({ editingGame, isLoading, onSubmit, onCancel }: EditGameFormProps) {
  const [activeSection, setActiveSection] = useState<'types' | 'events'>('types')
  
  // State for existing items
  const [existingTypes, setExistingTypes] = useState(editingGame.existingTypes)
  const [existingEvents, setExistingEvents] = useState(editingGame.existingEvents)
  
  // State for new items
  const [newTypes, setNewTypes] = useState([''])
  const [newEvents, setNewEvents] = useState([''])
  
  // State for tracking changes
  const [deletedTypeIds, setDeletedTypeIds] = useState<string[]>([])
  const [deletedEventIds, setDeletedEventIds] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const filledNewTypes = newTypes.filter(type => type.trim() !== '')
    const filledNewEvents = newEvents.filter(event => event.trim() !== '')
    
    const updatedTypes = existingTypes.map(type => ({
      id: type.id,
      name: type.type_name
    }))
    
    const updatedEvents = existingEvents.map(event => ({
      id: event.id,
      name: event.event_name,
      country: event.country,
      surface_type: event.surface_type
    }))
    
    onSubmit({
      newRallyTypes: filledNewTypes,
      newRallyEvents: filledNewEvents,
      updatedTypes,
      updatedEvents,
      deletedTypeIds,
      deletedEventIds
    })
  }

  // New Types Management
  const addNewType = () => {
    setNewTypes([...newTypes, ''])
  }

  const removeNewType = (index: number) => {
    if (newTypes.length > 1) {
      const updated = newTypes.filter((_, i) => i !== index)
      setNewTypes(updated)
    }
  }

  const updateNewType = (index: number, value: string) => {
    const updated = [...newTypes]
    updated[index] = value
    setNewTypes(updated)
  }

  // New Events Management
  const addNewEvent = () => {
    setNewEvents([...newEvents, ''])
  }

  const removeNewEvent = (index: number) => {
    if (newEvents.length > 1) {
      const updated = newEvents.filter((_, i) => i !== index)
      setNewEvents(updated)
    }
  }

  const updateNewEvent = (index: number, value: string) => {
    const updated = [...newEvents]
    updated[index] = value
    setNewEvents(updated)
  }

  // Existing Types Management
  const updateExistingType = (id: string, newName: string) => {
    setExistingTypes(prev => prev.map(type => 
      type.id === id ? { ...type, type_name: newName } : type
    ))
  }

  const deleteExistingType = (id: string) => {
    setExistingTypes(prev => prev.filter(type => type.id !== id))
    setDeletedTypeIds(prev => [...prev, id])
  }

  // Existing Events Management
  const updateExistingEvent = (id: string, field: string, value: string) => {
    setExistingEvents(prev => prev.map(event => 
      event.id === id ? { ...event, [field]: value } : event
    ))
  }

  const deleteExistingEvent = (id: string) => {
    setExistingEvents(prev => prev.filter(event => event.id !== id))
    setDeletedEventIds(prev => [...prev, id])
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Edit Game: {editingGame.game.game_name}</h2>
          <p className="text-slate-400">Modify rally types and events for this game</p>
        </div>
        
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200"
        >
          ← Back to Games
        </button>
      </div>

      {/* Game Info Card */}
      <div className="mb-8 p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-4">📋 Current Game Data</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <span className="text-slate-400">Game: </span>
            <span className="text-white font-medium">{editingGame.game.game_name}</span>
          </div>
          <div>
            <span className="text-slate-400">Rally Types: </span>
            <span className="text-white">{existingTypes.length}</span>
          </div>
          <div>
            <span className="text-slate-400">Rally Events: </span>
            <span className="text-white">{existingEvents.length}</span>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-slate-700/30 rounded-xl p-1">
          <button
            onClick={() => setActiveSection('types')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeSection === 'types'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🏆</span>
              <span>Rally Types ({existingTypes.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection('events')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeSection === 'events'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>📍</span>
              <span>Rally Events ({existingEvents.length})</span>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Rally Types Section */}
        {activeSection === 'types' && (
          <div className="space-y-6">
            
            {/* Existing Types */}
            {existingTypes.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Existing Rally Types</h4>
                <div className="space-y-3">
                  {existingTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <input
                        type="text"
                        value={type.type_name}
                        onChange={(e) => updateExistingType(type.id, e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => deleteExistingType(type.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-all duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Types */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Add New Rally Types</h4>
              <div className="space-y-3">
                {newTypes.map((type, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={type}
                      onChange={(e) => updateNewType(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`New rally type ${index + 1}`}
                    />
                    
                    {index === newTypes.length - 1 && type.trim() && (
                      <button
                        type="button"
                        onClick={addNewType}
                        className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      >
                        +
                      </button>
                    )}
                    
                    {newTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNewType(index)}
                        className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rally Events Section */}
        {activeSection === 'events' && (
          <div className="space-y-6">
            
            {/* Existing Events */}
            {existingEvents.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Existing Rally Events</h4>
                <div className="space-y-3">
                  {existingEvents.map((event) => (
                    <div key={event.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="text"
                          value={event.event_name}
                          onChange={(e) => updateExistingEvent(event.id, 'event_name', e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Event name"
                        />
                        <button
                          type="button"
                          onClick={() => deleteExistingEvent(event.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-all duration-200"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={event.country || ''}
                          onChange={(e) => updateExistingEvent(event.id, 'country', e.target.value)}
                          className="px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Country (optional)"
                        />
                        <input
                          type="text"
                          value={event.surface_type || ''}
                          onChange={(e) => updateExistingEvent(event.id, 'surface_type', e.target.value)}
                          className="px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Surface type (optional)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Events */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Add New Rally Events</h4>
              <div className="space-y-3">
                {newEvents.map((event, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={event}
                      onChange={(e) => updateNewEvent(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`New rally event ${index + 1}`}
                    />
                    
                    {index === newEvents.length - 1 && event.trim() && (
                      <button
                        type="button"
                        onClick={addNewEvent}
                        className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      >
                        +
                      </button>
                    )}
                    
                    {newEvents.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNewEvent(index)}
                        className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving Changes...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>💾</span>
                <span>Save Changes</span>
              </div>
            )}
          </button>
        </div>

        {/* Changes Summary */}
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
          <h4 className="text-lg font-semibold text-white mb-4">📊 Changes Summary</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-2">Rally Types:</p>
              <ul className="space-y-1">
                <li className="text-green-400">+ {newTypes.filter(t => t.trim()).length} new</li>
                <li className="text-red-400">- {deletedTypeIds.length} deleted</li>
                <li className="text-blue-400">{existingTypes.length} remaining</li>
              </ul>
            </div>
            <div>
              <p className="text-slate-400 mb-2">Rally Events:</p>
              <ul className="space-y-1">
                <li className="text-green-400">+ {newEvents.filter(e => e.trim()).length} new</li>
                <li className="text-red-400">- {deletedEventIds.length} deleted</li>
                <li className="text-blue-400">{existingEvents.length} remaining</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}