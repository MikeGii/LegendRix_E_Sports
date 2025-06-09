// src/components/rally/AddGameForm.tsx
'use client'

import { useState } from 'react'

interface AddGameFormProps {
  isLoading: boolean
  onSubmit: (gameData: {
    gameName: string
    gameDescription?: string
    rallyTypes: string[]
    rallyEvents: string[]
  }) => void
  onCancel: () => void
}

export function AddGameForm({ isLoading, onSubmit, onCancel }: AddGameFormProps) {
  const [gameData, setGameData] = useState({
    gameName: '',
    gameDescription: '',
    rallyTypes: [''],
    rallyEvents: ['']
  })

  const [currentStep, setCurrentStep] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const filledTypes = gameData.rallyTypes.filter(type => type.trim() !== '')
    const filledEvents = gameData.rallyEvents.filter(event => event.trim() !== '')
    
    onSubmit({
      gameName: gameData.gameName.trim(),
      gameDescription: gameData.gameDescription.trim() || undefined,
      rallyTypes: filledTypes,
      rallyEvents: filledEvents
    })
  }

  const addRallyType = () => {
    setGameData({
      ...gameData,
      rallyTypes: [...gameData.rallyTypes, '']
    })
  }

  const removeRallyType = (index: number) => {
    if (gameData.rallyTypes.length > 1) {
      const newTypes = gameData.rallyTypes.filter((_, i) => i !== index)
      setGameData({ ...gameData, rallyTypes: newTypes })
    }
  }

  const updateRallyType = (index: number, value: string) => {
    const newTypes = [...gameData.rallyTypes]
    newTypes[index] = value
    setGameData({ ...gameData, rallyTypes: newTypes })
  }

  const addRallyEvent = () => {
    setGameData({
      ...gameData,
      rallyEvents: [...gameData.rallyEvents, '']
    })
  }

  const removeRallyEvent = (index: number) => {
    if (gameData.rallyEvents.length > 1) {
      const newEvents = gameData.rallyEvents.filter((_, i) => i !== index)
      setGameData({ ...gameData, rallyEvents: newEvents })
    }
  }

  const updateRallyEvent = (index: number, value: string) => {
    const newEvents = [...gameData.rallyEvents]
    newEvents[index] = value
    setGameData({ ...gameData, rallyEvents: newEvents })
  }

  const canProceedToStep2 = gameData.gameName.trim() !== ''
  const canProceedToStep3 = canProceedToStep2 && gameData.rallyTypes.some(type => type.trim() !== '')
  const canSubmit = canProceedToStep3 && gameData.rallyEvents.some(event => event.trim() !== '')

  const steps = [
    { number: 1, title: 'Game Details', description: 'Basic game information' },
    { number: 2, title: 'Rally Types', description: 'Championship categories' },
    { number: 3, title: 'Rally Events', description: 'Individual race locations' }
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Add New Game</h2>
          <p className="text-slate-400">Create a new rally game with types and events</p>
        </div>
        
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200"
        >
          ← Back to Games
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center space-x-3 ${
                currentStep === step.number ? 'text-blue-400' : 
                currentStep > step.number ? 'text-green-400' : 'text-slate-500'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === step.number ? 'bg-blue-500/20 border-2 border-blue-500' :
                  currentStep > step.number ? 'bg-green-500/20 border-2 border-green-500' :
                  'bg-slate-700 border-2 border-slate-600'
                }`}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs opacity-75">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-slate-600'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        
        {/* Step 1: Game Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Game Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Game Name *
              </label>
              <input
                type="text"
                value={gameData.gameName}
                onChange={(e) => setGameData({ ...gameData, gameName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., EA Sports WRC, Dirt Rally 2.0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Game Description (Optional)
              </label>
              <textarea
                value={gameData.gameDescription}
                onChange={(e) => setGameData({ ...gameData, gameDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Brief description of the rally game..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200"
              >
                Next: Rally Types →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Rally Types */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Rally Types</h3>
                <p className="text-slate-400">Add different championship categories</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                ← Back
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-4">
                Rally Types * (at least one required)
              </label>
              <div className="space-y-3">
                {gameData.rallyTypes.map((type, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={type}
                      onChange={(e) => updateRallyType(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Rally type ${index + 1} (e.g., Championship, Quick Rally)`}
                    />
                    
                    {/* Plus button - show on last non-empty field */}
                    {index === gameData.rallyTypes.length - 1 && type.trim() && (
                      <button
                        type="button"
                        onClick={addRallyType}
                        className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      >
                        +
                      </button>
                    )}
                    
                    {/* Remove button - show if more than 1 field */}
                    {gameData.rallyTypes.length > 1 && (
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

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200"
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200"
              >
                Next: Rally Events →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Rally Events */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Rally Events</h3>
                <p className="text-slate-400">Add individual race locations</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                ← Back
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-4">
                Rally Events * (at least one required)
              </label>
              <div className="space-y-3">
                {gameData.rallyEvents.map((event, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={event}
                      onChange={(e) => updateRallyEvent(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Rally event ${index + 1} (e.g., Rally Estonia, Rally Finland)`}
                    />
                    
                    {/* Plus button - show on last non-empty field */}
                    {index === gameData.rallyEvents.length - 1 && event.trim() && (
                      <button
                        type="button"
                        onClick={addRallyEvent}
                        className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all duration-200"
                      >
                        +
                      </button>
                    )}
                    
                    {/* Remove button - show if more than 1 field */}
                    {gameData.rallyEvents.length > 1 && (
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

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200"
              >
                ← Previous
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Game...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>💾</span>
                    <span>Create Game</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {currentStep === 3 && (
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50 mt-8">
            <h4 className="text-lg font-semibold text-white mb-4">📋 Game Preview</h4>
            <div className="space-y-3">
              <div>
                <span className="text-slate-400">Game: </span>
                <span className="text-white font-medium">{gameData.gameName}</span>
              </div>
              
              {gameData.gameDescription && (
                <div>
                  <span className="text-slate-400">Description: </span>
                  <span className="text-white">{gameData.gameDescription}</span>
                </div>
              )}
              
              {gameData.rallyTypes.some(type => type.trim()) && (
                <div>
                  <span className="text-slate-400">Rally Types ({gameData.rallyTypes.filter(type => type.trim()).length}): </span>
                  <span className="text-white">
                    {gameData.rallyTypes.filter(type => type.trim()).join(', ')}
                  </span>
                </div>
              )}
              
              {gameData.rallyEvents.some(event => event.trim()) && (
                <div>
                  <span className="text-slate-400">Rally Events ({gameData.rallyEvents.filter(event => event.trim()).length}): </span>
                  <span className="text-white">
                    {gameData.rallyEvents.filter(event => event.trim()).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}