// src/components/rally/GamesManagement.tsx
'use client'

import { useState } from 'react'

interface RallyGame {
  id: string
  game_name: string
  game_description?: string
  is_active: boolean
  created_at: string
}

interface GamesManagementProps {
  games: RallyGame[]
  isLoading: boolean
  onEditGame: (game: RallyGame) => void
  onAddNewGame: () => void
  onRefresh: () => void
}

export function GamesManagement({ 
  games, 
  isLoading, 
  onEditGame, 
  onAddNewGame, 
  onRefresh 
}: GamesManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredGames = games.filter(game =>
    game.game_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (game.game_description && game.game_description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Games Management</h2>
          <p className="text-slate-400">Manage rally games, types, and events</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          
          <button
            onClick={onAddNewGame}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add New Game</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {games.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-slate-500">🎮</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">No Games Found</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Get started by creating your first rally game. You can add rally types and events to organize your championships.
          </p>
          <button
            onClick={onAddNewGame}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
          >
            <div className="flex items-center space-x-2">
              <span>➕</span>
              <span>Create Your First Game</span>
            </div>
          </button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-slate-500">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No games match your search</h3>
          <p className="text-slate-400">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <div 
              key={game.id} 
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/70 transition-all duration-200 group"
            >
              {/* Game Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                      {game.game_name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      game.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {game.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {game.game_description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                      {game.game_description}
                    </p>
                  )}
                </div>
              </div>

              {/* Game Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Created:</span>
                  <span className="text-slate-300">{formatDate(game.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => onEditGame(game)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
                
                <button
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all duration-200 text-sm flex items-center justify-center"
                  title="View Details"
                >
                  <span>👁️</span>
                </button>
              </div>

              {/* Quick Info Footer */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Game ID: {game.id.slice(0, 8)}...</span>
                  <span className="flex items-center space-x-1">
                    <span>🎮</span>
                    <span>Rally Game</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      {games.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Showing {filteredGames.length} of {games.length} games
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">
                  {games.filter(g => g.is_active).length} Active
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-400">
                  {games.filter(g => !g.is_active).length} Inactive
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}