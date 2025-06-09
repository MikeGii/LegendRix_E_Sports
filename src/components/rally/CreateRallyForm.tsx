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
    eventId: '',
    rallyDate: '',
    registrationEndDate: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(rallyForm)
  }

  const handleGameChange = (gameId: string) => {
    setRallyForm({ ...rallyForm, gameId, typeId: '', eventId: '' })
    onGameChange(gameId)
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

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Rally Event *</label>
          <select
            value={rallyForm.eventId}
            onChange={(e) => setRallyForm({...rallyForm, eventId: e.target.value})}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!rallyForm.gameId}
          >
            <option value="">Select an event...</option>
            {filteredEvents.map((event) => (
              <option key={event.id} value={event.id}>{event.event_name}</option>
            ))}
          </select>
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