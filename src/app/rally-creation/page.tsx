// src/app/rally-creation/page.tsx
'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CreateRallyForm } from '@/components/rally/CreateRallyForm'
import { GameSettingsForm } from '@/components/rally/GameSettingsForm'
import { MessageDisplay } from '@/components/shared/MessageDisplay'
import { TabNavigation } from '@/components/shared/TabNavigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { useRallyApi } from '@/hooks/useRallyApi'
import { useState, useEffect } from 'react'

type TabType = 'create-rally' | 'game-settings'

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

  const [messages, setMessages] = useState<{type: 'success' | 'error' | 'warning' | 'info', text: string} | null>(null)

  // Use the rally API hook
  const {
    isLoading,
    error,
    fetchRallyGames,
    fetchGameData,
    createGameSetup,
    createRally,
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
    if (!rallyData.gameId || !rallyData.typeId || !rallyData.eventId || !rallyData.rallyDate || !rallyData.registrationEndDate) {
      showMessage('error', 'Please fill in all required fields')
      return
    }
    
    try {
      console.log('Creating rally:', rallyData)
      const newRally = await createRally({
        gameId: rallyData.gameId,
        typeId: rallyData.typeId,
        eventId: rallyData.eventId,
        rallyDate: rallyData.rallyDate,
        registrationEndDate: rallyData.registrationEndDate,
        notes: rallyData.notes
      })
      
      console.log('Rally created successfully:', newRally)
      showMessage('success', 'Rally created successfully!')
    } catch (err) {
      console.error('Failed to create rally:', err)
      // Error is already handled by the hook and will show via useEffect
    }
  }

  const handleSaveGameSettings = async (gameData: {
    gameName: string
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
      console.log('Saving game settings:', gameData)
      const result = await createGameSetup({
        gameName: gameData.gameName,
        rallyTypes: gameData.rallyTypes,
        rallyEvents: gameData.rallyEvents
      })
      
      console.log('Game setup created successfully:', result)
      showMessage('success', 'Game settings saved successfully!')
      
      // Refresh games list
      await loadAllData()
    } catch (err) {
      console.error('Failed to save game settings:', err)
      // Error is already handled by the hook and will show via useEffect
    }
  }

  const tabs = [
    { id: 'create-rally', label: 'Create Rally', icon: '🏁' },
    { id: 'game-settings', label: 'Game Settings', icon: '⚙️' }
  ]

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          
          {/* Page Header */}
          <PageHeader
            title="Rally Management"
            description="Create rallies and manage rally data for the E-WRC community"
            backUrl="/admin-dashboard"
            backLabel="Back to Dashboard"
          />

          {/* Messages */}
          <MessageDisplay message={messages} />

          {/* Tab Navigation */}
          <TabNavigation
            tabs={tabs}
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

            {/* Game Settings Tab */}
            {activeTab === 'game-settings' && (
              <GameSettingsForm
                games={games}
                isLoading={isLoading}
                onSubmit={handleSaveGameSettings}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}