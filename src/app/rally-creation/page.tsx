// Update src/app/rally-creation/page.tsx to include the new management tab

'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CreateRallyForm } from '@/components/rally/CreateRallyForm'
import { GamesManagement } from '@/components/rally/GamesManagement'
import { AddGameForm } from '@/components/rally/AddGameForm'
import { EditGameForm } from '@/components/rally/EditGameForm'
import { RallyManagement } from '@/components/rally/RallyManagement' // Add this import
import { MessageDisplay } from '@/components/shared/MessageDisplay'
import { TabNavigation } from '@/components/shared/TabNavigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { useRallyApi } from '@/hooks/useRallyApi'
import { useState, useEffect } from 'react'

type TabType = 'create-rally' | 'manage-rallies' | 'games' | 'add-game' | 'edit-game' // Update this line

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

export default function RallyCreationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('create-rally')
  
  // State for dropdown data
  const [games, setGames] = useState<RallyGame[]>([])
  const [filteredTypes, setFilteredTypes] = useState<RallyType[]>([])
  const [filteredEvents, setFilteredEvents] = useState<RallyEvent[]>([])

  // State for editing game
  const [editingGame, setEditingGame] = useState<{
    game: RallyGame
    existingTypes: RallyType[]
    existingEvents: RallyEvent[]
  } | null>(null)

  const [messages, setMessages] = useState<{type: 'success' | 'error' | 'warning' | 'info', text: string} | null>(null)

  // Use the rally API hook
  const {
    isLoading,
    error,
    fetchRallyGames,
    fetchGameData,
    createGameSetup,
    createRally,
    addRallyTypes,
    addRallyEvents,
    updateRallyType,
    updateRallyEvent,
    deleteRallyType,
    deleteRallyEvent,
    clearError
  } = useRallyApi()

  // Load data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Clear API errors when they change
  useEffect(() => {
    if (error) {
      showMessage('error', error)
      clearError()
    }
  }, [error, clearError])

  const loadAllData = async () => {
    try {
      console.log('Loading rally games...')
      const gamesData = await fetchRallyGames(true)
      setGames(gamesData)
      console.log('Rally games loaded:', gamesData.length)
    } catch (err) {
      console.error('Failed to load rally games:', err)
    }
  }

  const showMessage = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setMessages({ type, text })
    setTimeout(() => setMessages(null), 5000)
  }

  const handleGameChange = async (gameId: string) => {
    if (!gameId) {
      setFilteredTypes([])
      setFilteredEvents([])
      return
    }

    try {
      console.log('Fetching game data for game:', gameId)
      const { types, events } = await fetchGameData(gameId)
      setFilteredTypes(types)
      setFilteredEvents(events)
      console.log('Game data loaded - Types:', types.length, 'Events:', events.length)
    } catch (err) {
      console.error('Failed to load game data:', err)
      setFilteredTypes([])
      setFilteredEvents([])
    }
  }

  const handleCreateRally = async (rallyData: any) => {
    if (!rallyData.gameId || !rallyData.typeId || !rallyData.eventIds || rallyData.eventIds.length === 0 || !rallyData.rallyDate || !rallyData.registrationEndDate) {
      showMessage('error', 'Please fill in all required fields and select at least one event')
      return
    }
    
    try {
      console.log('Creating rally:', rallyData)
      const newRally = await createRally({
        gameId: rallyData.gameId,
        typeId: rallyData.typeId,
        eventIds: rallyData.eventIds,
        rallyDate: rallyData.rallyDate,
        registrationEndDate: rallyData.registrationEndDate,
        notes: rallyData.notes
      })
      
      console.log('Rally created successfully:', newRally)
      showMessage('success', `Rally created successfully with ${rallyData.eventIds.length} event(s)!`)
    } catch (err) {
      console.error('Failed to create rally:', err)
    }
  }

  const handleSaveGame = async (gameData: {
    gameName: string
    gameDescription?: string
    rallyTypes: string[]
    rallyEvents: string[]
  }) => {
    if (!gameData.gameName.trim()) {
      showMessage('error', 'Game name is required')
      return
    }
    
    if (gameData.rallyTypes.length === 0) {
      showMessage('error', 'At least one rally type is required')
      return
    }
    
    if (gameData.rallyEvents.length === 0) {
      showMessage('error', 'At least one rally event is required')
      return
    }
    
    try {
      console.log('Saving game:', gameData)
      const result = await createGameSetup({
        gameName: gameData.gameName,
        gameDescription: gameData.gameDescription,
        rallyTypes: gameData.rallyTypes,
        rallyEvents: gameData.rallyEvents
      })
      
      console.log('Game created successfully:', result)
      showMessage('success', 'Game created successfully!')
      
      // Refresh games list and switch to games tab
      await loadAllData()
      setActiveTab('games')
    } catch (err) {
      console.error('Failed to save game:', err)
    }
  }

  const handleEditGame = async (game: RallyGame) => {
    try {
      console.log('Loading game data for editing:', game.game_name)
      const { types, events } = await fetchGameData(game.id)
      
      setEditingGame({
        game,
        existingTypes: types,
        existingEvents: events
      })
      
      // Switch to edit game tab
      setActiveTab('edit-game')
      
      console.log('Game data loaded for editing - Types:', types.length, 'Events:', events.length)
    } catch (err) {
      console.error('Failed to load game data for editing:', err)
    }
  }

  const handleUpdateGame = async (gameData: {
    newRallyTypes: string[]
    newRallyEvents: string[]
    updatedTypes: { id: string; name: string }[]
    updatedEvents: { id: string; name: string }[]
    deletedTypeIds: string[]
    deletedEventIds: string[]
  }, shouldExit: boolean) => {
    if (!editingGame) return
    
    try {
      console.log('Updating game:', gameData)
      
      const promises = []
      
      // Add new types if any
      if (gameData.newRallyTypes.length > 0) {
        promises.push(addRallyTypes(editingGame.game.id, gameData.newRallyTypes))
      }
      
      // Add new events if any
      if (gameData.newRallyEvents.length > 0) {
        promises.push(addRallyEvents(editingGame.game.id, gameData.newRallyEvents))
      }
      
      // Update existing types
      for (const type of gameData.updatedTypes) {
        const originalType = editingGame.existingTypes.find(t => t.id === type.id)
        if (originalType && originalType.type_name !== type.name) {
          promises.push(updateRallyType(type.id, type.name))
        }
      }
      
      // Update existing events
      for (const event of gameData.updatedEvents) {
        const originalEvent = editingGame.existingEvents.find(e => e.id === event.id)
        if (originalEvent && originalEvent.event_name !== event.name) {
          promises.push(updateRallyEvent(event.id, event.name))
        }
      }
      
      // Delete types
      for (const typeId of gameData.deletedTypeIds) {
        promises.push(deleteRallyType(typeId))
      }
      
      // Delete events
      for (const eventId of gameData.deletedEventIds) {
        promises.push(deleteRallyEvent(eventId))
      }
      
      await Promise.all(promises)
      
      console.log('Successfully updated game')
      
      if (shouldExit) {
        showMessage('success', 'Game updated successfully!')
        // Exit edit mode and refresh data
        setEditingGame(null)
        setActiveTab('games')
        await loadAllData()
      } else {
        showMessage('success', 'Changes saved! You can continue editing.')
        // Refresh the editing game data without exiting
        const { types, events } = await fetchGameData(editingGame.game.id)
        setEditingGame({
          ...editingGame,
          existingTypes: types,
          existingEvents: events
        })
      }
    } catch (err) {
      console.error('Failed to update game:', err)
    }
  }

  const handleDataRefresh = async (updatedData: { types: RallyType[], events: RallyEvent[] }) => {
    if (!editingGame) return
    
    // Update the editing game with fresh data
    setEditingGame({
      ...editingGame,
      existingTypes: updatedData.types,
      existingEvents: updatedData.events
    })
  }

  const handleCancelEdit = () => {
    setEditingGame(null)
    setActiveTab('games')
  }

  const handleSwitchToAddGame = () => {
    setActiveTab('add-game')
  }

  const handleBackToGames = () => {
    setActiveTab('games')
  }

  // Updated tabs array to include rally management
  const tabs = [
    { id: 'create-rally', label: 'Create Rally', icon: '🏁' },
    { id: 'manage-rallies', label: 'Manage Rallies', icon: '📊' }, // Add this line
    { id: 'games', label: 'Games', icon: '🎮' },
    { id: 'add-game', label: 'Add Game', icon: '➕' },
    ...(editingGame ? [{ id: 'edit-game', label: 'Edit Game', icon: '✏️' }] : [])
  ]

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          
          {/* Page Header */}
          <PageHeader
            title="Rally Management"
            description="Create rallies, manage rally data, and oversee existing events for the E-WRC community"
            backUrl="/admin-dashboard"
            backLabel="Back to Dashboard"
          />

          {/* Messages */}
          <MessageDisplay message={messages} />

          {/* Tab Navigation */}
          <TabNavigation
            tabs={tabs.filter(tab => {
              // Always show create-rally, manage-rallies, and games tabs
              if (tab.id === 'create-rally' || tab.id === 'manage-rallies' || tab.id === 'games') return true
              
              // Show add-game tab only when active or when no editing
              if (tab.id === 'add-game') return activeTab === 'add-game' && !editingGame
              
              // Show edit-game tab only when editing
              if (tab.id === 'edit-game') return activeTab === 'edit-game' && editingGame
              
              return false
            })}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as TabType)}
          />

          {/* Tab Content */}
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
            
            {/* Create Rally Tab */}
            {activeTab === 'create-rally' && (
              <CreateRallyForm
                games={games}
                filteredTypes={filteredTypes}
                filteredEvents={filteredEvents}
                isLoading={isLoading}
                onSubmit={handleCreateRally}
                onGameChange={handleGameChange}
              />
            )}

            {/* Manage Rallies Tab - Add this section */}
            {activeTab === 'manage-rallies' && (
              <RallyManagement
                games={games}
                onRefresh={loadAllData}
              />
            )}

            {/* Games Management Tab */}
            {activeTab === 'games' && (
              <GamesManagement
                games={games}
                isLoading={isLoading}
                onEditGame={handleEditGame}
                onAddNewGame={handleSwitchToAddGame}
                onRefresh={loadAllData}
              />
            )}

            {/* Add Game Tab */}
            {activeTab === 'add-game' && (
              <AddGameForm
                isLoading={isLoading}
                onSubmit={handleSaveGame}
                onCancel={handleBackToGames}
              />
            )}

            {/* Edit Game Tab */}
            {activeTab === 'edit-game' && editingGame && (
              <EditGameForm
                editingGame={editingGame}
                isLoading={isLoading}
                onSubmit={handleUpdateGame}
                onCancel={handleCancelEdit}
                onDataRefresh={handleDataRefresh}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}