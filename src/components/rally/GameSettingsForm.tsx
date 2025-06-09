// src/components/rally/GameSettingsForm.tsx
'use client'

import { useState } from 'react'

interface RallyGame {
  id: string
  game_name: string
}

interface GameSettingsFormProps {
  games: RallyGame[]
  isLoading: boolean
  onSubmit: (gameData: {
    gameName: string
    rallyTypes: string[]
    rallyEvents: string[]
  }) => void
}

export function GameSettingsForm({ games, isLoading, onSubmit }: GameSettingsFormProps) {
  const [gameSettings, setGameSettings] = useState({
    gameName: '',
    rallyTypes: [''],
    rallyEvents: ['']
  })

  const addRallyType = () => {
    setGameSettings({
      ...gameSettings,
      rallyTypes: [...gameSettings.rallyTypes, '']
    })
  }

  const removeRallyType = (index: number) => {
    if (gameSettings.rallyTypes.length > 1) {
      const newTypes = gameSettings.rallyTypes.filter((_, i) => i !== index)
      setGameSettings({ ...gameSettings, rallyTypes: newTypes })
    }
  }

  const updateRallyType = (index: number, value: string) => {
    const newTypes = [...gameSettings.rallyTypes]
    newTypes[index] = value
    setGameSettings({ ...gameSettings, rallyTypes: newTypes })
  }

  const addRallyEvent = () => {
    setGameSettings({
      ...gameSettings,
      rallyEvents: [...gameSettings.rallyEvents, '']
    })
  }

  const removeRallyEvent = (index: number) => {
    if (gameSettings.rallyEvents.length > 1) {
      const newEvents = gameSettings.rallyEvents.filter((_, i) => i !== index)
      setGameSettings({ ...gameSettings, rallyEvents: newEvents })
    }
  }

  const updateRallyEvent = (index: number, value: string) => {
    const newEvents = [...gameSettings.rallyEvents]
    newEvents[index] = value
    setGameSettings({ ...gameSettings, rallyEvents: newEvents })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const filledTypes = gameSettings.rallyTypes.filter(type => type.trim() !== '')
    const filledEvents = gameSettings.rallyEvents.filter(event => event.trim() !== '')
    
    onSubmit({
      gameName: gameSettings.gameName.trim(),
      rallyTypes: filledTypes,
      rallyEvents: filledEvents
    })

    // Reset form
    setGameSettings({
      gameName: '',
      rallyTypes: [''],
      rallyEvents: ['']
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Game Settings</h2>
      <p className="text-slate-400 mb-8">Add games with their rally types and events. All data will be linked together.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        
        {/* Game Name */}
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

        {/* Rally Types */}
        {gameSettings.gameName.trim() && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-4">
              Rally Types * (at least one required)
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
                  
                  {/* Plus button */}
                  {index === gameSettings.rallyTypes.length - 1 && type.trim() && (
                    <button
                      type="button"
                      onClick={addRallyType}
                      className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                    >
                      +
                    </button>
                  )}
                  
                  {/* Remove button */}
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

        {/* Rally Events */}
        {gameSettings.gameName.trim() && gameSettings.rallyTypes.some(type => type.trim()) && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-4">
              Rally Events * (at least one required)
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
                  
                  {/* Plus button */}
                  {index === gameSettings.rallyEvents.length - 1 && event.trim() && (
                    <button
                      type="button"
                      onClick={addRallyEvent}
                      className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                    >
                      +
                    </button>
                  )}
                  
                  {/* Remove button */}
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

        {/* Save Button */}
        {gameSettings.gameName.trim() && 
         gameSettings.rallyTypes.some(type => type.trim()) && 
         gameSettings.rallyEvents.some(event => event.trim()) && (
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-all duration-200 text-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving Game Settings...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <span>💾</span>
                  <span>Save Game Settings</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Preview Section */}
        {gameSettings.gameName.trim() && (
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <h3 className="text-lg font-semibold text-white mb-4">📋 Preview</h3>
            <div className="space-y-3">
              <div>
                <span className="text-slate-400">Game: </span>
                <span className="text-white font-medium">{gameSettings.gameName}</span>
              </div>
              
              {gameSettings.rallyTypes.some(type => type.trim()) && (
                <div>
                  <span className="text-slate-400">Rally Types: </span>
                  <span className="text-white">
                    {gameSettings.rallyTypes.filter(type => type.trim()).join(', ')}
                  </span>
                </div>
              )}
              
              {gameSettings.rallyEvents.some(event => event.trim()) && (
                <div>
                  <span className="text-slate-400">Rally Events: </span>
                  <span className="text-white">
                    {gameSettings.rallyEvents.filter(event => event.trim()).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Existing Games List */}
      {games.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <h3 className="text-xl font-semibold text-white mb-6">Existing Games</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div key={game.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                <h4 className="font-medium text-white mb-2">{game.game_name}</h4>
                <div className="text-sm text-slate-400">
                  <p>Game configured</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}