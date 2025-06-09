// src/components/rally/GameSettingsForm.tsx
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

interface GameSettingsFormProps {
  games: RallyGame[]
  isLoading: boolean
  editingGame?: {
    game: RallyGame
    existingTypes: RallyType[]
    existingEvents: RallyEvent[]
  } | null
  onSubmit: (gameData: {
    gameName: string
    rallyTypes: string[]
    rallyEvents: string[]
  }) => void
  onSubmitEdit?: (gameId: string, gameData: {
    newRallyTypes: string[]
    newRallyEvents: string[]
  }) => void
  onCancelEdit?: () => void
  onEditGame?: (game: RallyGame) => Promise<void>
}

export function GameSettingsForm({ 
  games, 
  isLoading, 
  editingGame,
  onSubmit, 
  onSubmitEdit,
  onCancelEdit,
  onEditGame 
}: GameSettingsFormProps) {
  
  // State for form inputs
  const [gameSettings, setGameSettings] = useState({
    gameName: '',
    rallyTypes: [''],
    rallyEvents: ['']
  })

  // Determine if we're in edit mode
  const isEditMode = !!editingGame

  // Initialize form with editing data when editing mode changes
  useEffect(() => {
    if (editingGame) {
      // Edit mode: pre-fill with game name (read-only) and empty fields for new items
      setGameSettings({
        gameName: editingGame.game.game_name,
        rallyTypes: [''], // Start with one empty field for new types
        rallyEvents: [''] // Start with one empty field for new events
      })
    } else {
      // Create mode: reset to empty
      setGameSettings({
        gameName: '',
        rallyTypes: [''],
        rallyEvents: ['']
      })
    }
  }, [editingGame])

  // Handle adding new rally type field
  const addRallyType = () => {
    setGameSettings({
      ...gameSettings,
      rallyTypes: [...gameSettings.rallyTypes, '']
    })
  }

  // Handle removing rally type field
  const removeRallyType = (index: number) => {
    if (gameSettings.rallyTypes.length > 1) {
      const newTypes = gameSettings.rallyTypes.filter((_, i) => i !== index)
      setGameSettings({ ...gameSettings, rallyTypes: newTypes })
    }
  }

  // Handle updating rally type value
  const updateRallyType = (index: number, value: string) => {
    const newTypes = [...gameSettings.rallyTypes]
    newTypes[index] = value
    setGameSettings({ ...gameSettings, rallyTypes: newTypes })
  }

  // Handle adding new rally event field
  const addRallyEvent = () => {
    setGameSettings({
      ...gameSettings,
      rallyEvents: [...gameSettings.rallyEvents, '']
    })
  }

  // Handle removing rally event field
  const removeRallyEvent = (index: number) => {
    if (gameSettings.rallyEvents.length > 1) {
      const newEvents = gameSettings.rallyEvents.filter((_, i) => i !== index)
      setGameSettings({ ...gameSettings, rallyEvents: newEvents })
    }
  }

  // Handle updating rally event value
  const updateRallyEvent = (index: number, value: string) => {
    const newEvents = [...gameSettings.rallyEvents]
    newEvents[index] = value
    setGameSettings({ ...gameSettings, rallyEvents: newEvents })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isEditMode && onSubmitEdit) {
      // Edit mode: only submit new types and events
      const filledTypes = gameSettings.rallyTypes.filter(type => type.trim() !== '')
      const filledEvents = gameSettings.rallyEvents.filter(event => event.trim() !== '')
      
      onSubmitEdit(editingGame!.game.id, {
        newRallyTypes: filledTypes,
        newRallyEvents: filledEvents
      })
    } else {
      // Create mode: submit everything
      const filledTypes = gameSettings.rallyTypes.filter(type => type.trim() !== '')
      const filledEvents = gameSettings.rallyEvents.filter(event => event.trim() !== '')
      
      onSubmit({
        gameName: gameSettings.gameName.trim(),
        rallyTypes: filledTypes,
        rallyEvents: filledEvents
      })
    }

    // Reset form if not in edit mode
    if (!isEditMode) {
      setGameSettings({
        gameName: '',
        rallyTypes: [''],
        rallyEvents: ['']
      })
    }
  }

  return (
    <div>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isEditMode ? `Edit Game: ${editingGame!.game.game_name}` : 'Game Settings'}
          </h2>
          <p className="text-slate-400">
            {isEditMode 
              ? 'Add new rally types and events to this existing game' 
              : 'Add games with their rally types and events. All data will be linked together.'
            }
          </p>
        </div>
        
        {/* Cancel Edit Button */}
        {isEditMode && onCancelEdit && (
          <button
            onClick={onCancelEdit}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Current Game Data Display (Edit Mode Only) */}
      {isEditMode && editingGame && (
        <div className="mb-8 p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">📋 Current Game Data</h3>
          <div className="space-y-3">
            <div>
              <span className="text-slate-400">Game: </span>
              <span className="text-white font-medium">{editingGame.game.game_name}</span>
            </div>
            
            <div>
              <span className="text-slate-400">Existing Rally Types ({editingGame.existingTypes.length}): </span>
              <span className="text-white">
                {editingGame.existingTypes.map(type => type.type_name).join(', ') || 'None'}
              </span>
            </div>
            
            <div>
              <span className="text-slate-400">Existing Rally Events ({editingGame.existingEvents.length}): </span>
              <span className="text-white">
                {editingGame.existingEvents.map(event => event.event_name).join(', ') || 'None'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        
        {/* Game Name Field (Create Mode Only) */}
        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rally Game Name *
            </label>
            <input
              type="text"
              value={gameSettings.gameName}
              onChange={(e) => setGameSettings({ ...gameSettings, gameName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., EA Sports WRC"
              required
            />
          </div>
        )}

        {/* Rally Types Section */}
        {(gameSettings.gameName.trim() || isEditMode) && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-4">
              {isEditMode ? 'Add New Rally Types (optional)' : 'Rally Types * (at least one required)'}
            </label>
            <div className="space-y-3">
              {gameSettings.rallyTypes.map((type, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => updateRallyType(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Rally type ${index + 1} (e.g., Championship)`}
                  />
                  
                  {/* Plus button - show on last non-empty field */}
                  {index === gameSettings.rallyTypes.length - 1 && type.trim() && (
                    <button
                      type="button"
                      onClick={addRallyType}
                      className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                    >
                      +
                    </button>
                  )}
                  
                  {/* Remove button - show if more than 1 field */}
                  {gameSettings.rallyTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRallyType(index)}
                      className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rally Events Section */}
        {(gameSettings.gameName.trim() || isEditMode) && (gameSettings.rallyTypes.some(type => type.trim()) || isEditMode) && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-4">
              {isEditMode ? 'Add New Rally Events' : 'Rally Events * (at least one required)'}
            </label>
            <div className="space-y-3">
              {gameSettings.rallyEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={event}
                    onChange={(e) => updateRallyEvent(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Rally event ${index + 1} (e.g., Rally Estonia)`}
                  />
                  
                  {/* Plus button - show on last non-empty field */}
                  {index === gameSettings.rallyEvents.length - 1 && event.trim() && (
                    <button
                      type="button"
                      onClick={addRallyEvent}
                      className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                    >
                      +
                    </button>
                  )}
                  
                  {/* Remove button - show if more than 1 field */}
                  {gameSettings.rallyEvents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRallyEvent(index)}
                      className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {((gameSettings.gameName.trim() && 
           gameSettings.rallyTypes.some(type => type.trim()) && 
           gameSettings.rallyEvents.some(event => event.trim())) || 
          (isEditMode && (gameSettings.rallyTypes.some(type => type.trim()) || 
                         gameSettings.rallyEvents.some(event => event.trim())))) && (
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-all duration-200 text-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isEditMode ? 'Adding to Game...' : 'Saving Game Settings...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <span>💾</span>
                  <span>{isEditMode ? 'Add to Game' : 'Save Game Settings'}</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Preview Section */}
        {(gameSettings.gameName.trim() || isEditMode) && (
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <h3 className="text-lg font-semibold text-white mb-4">
              📋 {isEditMode ? 'New Items to Add' : 'Preview'}
            </h3>
            <div className="space-y-3">
              {!isEditMode && (
                <div>
                  <span className="text-slate-400">Game: </span>
                  <span className="text-white font-medium">{gameSettings.gameName}</span>
                </div>
              )}
              
              {gameSettings.rallyTypes.some(type => type.trim()) && (
                <div>
                  <span className="text-slate-400">
                    {isEditMode ? 'New Rally Types: ' : 'Rally Types: '}
                  </span>
                  <span className="text-white">
                    {gameSettings.rallyTypes.filter(type => type.trim()).join(', ')}
                  </span>
                </div>
              )}
              
              {gameSettings.rallyEvents.some(event => event.trim()) && (
                <div>
                  <span className="text-slate-400">
                    {isEditMode ? 'New Rally Events: ' : 'Rally Events: '}
                  </span>
                  <span className="text-white">
                    {gameSettings.rallyEvents.filter(event => event.trim()).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Existing Games List (Create Mode Only) */}
      {!isEditMode && games.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <h3 className="text-xl font-semibold text-white mb-6">Existing Games</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div 
                key={game.id} 
                className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:bg-slate-700/40 transition-all duration-200 cursor-pointer group"
                onClick={() => onEditGame && onEditGame(game)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors duration-200">
                      {game.game_name}
                    </h4>
                    <div className="text-sm text-slate-400 mt-2">
                      <p>Click to edit and add more types/events</p>
                    </div>
                  </div>
                  <div className="text-slate-500 group-hover:text-blue-400 transition-colors duration-200">
                    <span className="text-lg">✏️</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}