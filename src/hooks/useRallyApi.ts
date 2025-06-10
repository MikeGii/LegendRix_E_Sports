// src/hooks/useRallyApi.ts
import { useState, useCallback } from 'react'

interface UpdateRallyData {
  rallyDate?: string
  registrationEndDate?: string
  notes?: string
  eventIds?: string[]
}

// Types - Updated Rally interface with events array
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

// Updated Rally interface with events array instead of single event
interface Rally {
  rally_id: string
  rally_game_id: string
  rally_type_id: string
  rally_date: string
  registration_ending_date: string
  optional_notes?: string
  created_by: string
  created_at: string
  updated_at: string
  game_name: string
  type_name: string
  events: Array<{
    event_id: string
    event_name: string
    event_order: number
    country?: string
    surface_type?: string
  }>
  creator_name?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export function useRallyApi() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('auth_token')
  }

  // Helper function to make API calls
  const apiCall = async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const token = getAuthToken()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Fetch all rally games
  const fetchRallyGames = useCallback(async (activeOnly: boolean = true): Promise<RallyGame[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<RallyGame[]> = await apiCall(
        `/api/rally/games?active=${activeOnly}`
      )
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch rally games')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch rally types for a specific game
  const fetchRallyTypes = useCallback(async (gameId: string, activeOnly: boolean = true): Promise<RallyType[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<RallyType[]> = await apiCall(
        `/api/rally/types?gameId=${gameId}&active=${activeOnly}`
      )
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch rally types')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch rally events for a specific game
  const fetchRallyEvents = useCallback(async (gameId: string, activeOnly: boolean = true): Promise<RallyEvent[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<RallyEvent[]> = await apiCall(
        `/api/rally/events?gameId=${gameId}&active=${activeOnly}`
      )
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch rally events')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Utility function to fetch game data (types + events) for a specific game
  const fetchGameData = useCallback(async (gameId: string): Promise<{
    types: RallyType[]
    events: RallyEvent[]
  }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [types, events] = await Promise.all([
        fetchRallyTypes(gameId),
        fetchRallyEvents(gameId)
      ])
      
      return { types, events }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchRallyTypes, fetchRallyEvents])

  // Fetch upcoming rallies for user dashboard - returns rallies with events array
  const fetchUpcomingRallies = useCallback(async (limit: number = 3): Promise<Rally[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<Rally[]> = await apiCall(
        `/api/rally/rallies?limit=${limit}&upcoming=true`
      )
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch upcoming rallies')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a complete game setup (game + types + events)
  const createGameSetup = useCallback(async (gameData: {
    gameName: string
    rallyTypes: string[]
    rallyEvents: string[]
    gameDescription?: string
  }): Promise<{
    game: RallyGame
    types: RallyType[]
    events: RallyEvent[]
  }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<{
        game: RallyGame
        types: RallyType[]
        events: RallyEvent[]
      }> = await apiCall('/api/rally/games', {
        method: 'POST',
        body: JSON.stringify(gameData),
      })
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create game setup')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a new rally - accepts array of event IDs
  const createRally = useCallback(async (rallyData: {
    gameId: string
    typeId: string
    eventIds: string[] // Changed from eventId to eventIds array
    rallyDate: string
    registrationEndDate: string
    notes?: string
  }): Promise<Rally> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<Rally> = await apiCall('/api/rally/rallies', {
        method: 'POST',
        body: JSON.stringify(rallyData),
      })
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create rally')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch rallies with details
  const fetchRallies = useCallback(async (limit: number = 50, offset: number = 0): Promise<Rally[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<Rally[]> = await apiCall(
        `/api/rally/rallies?limit=${limit}&offset=${offset}`
      )
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch rallies')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add rally types to existing game
  const addRallyTypes = useCallback(async (gameId: string, rallyTypes: string[]): Promise<RallyType[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<RallyType[]> = await apiCall('/api/rally/types/add', {
        method: 'POST',
        body: JSON.stringify({ gameId, rallyTypes }),
      })
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to add rally types')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add rally events to existing game
  const addRallyEvents = useCallback(async (gameId: string, rallyEvents: string[]): Promise<RallyEvent[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<RallyEvent[]> = await apiCall('/api/rally/events/add', {
        method: 'POST',
        body: JSON.stringify({ gameId, rallyEvents }),
      })
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to add rally events')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update rally type
  const updateRallyType = useCallback(async (typeId: string, typeName: string): Promise<RallyType> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<RallyType> = await apiCall(`/api/rally/types/${typeId}`, {
        method: 'PUT',
        body: JSON.stringify({ typeName }),
      })
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update rally type')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update rally event
  const updateRallyEvent = useCallback(async (eventId: string, eventName: string): Promise<RallyEvent> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<RallyEvent> = await apiCall(`/api/rally/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({ eventName }),
      })
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update rally event')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete rally type
  const deleteRallyType = useCallback(async (typeId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<void> = await apiCall(`/api/rally/types/${typeId}`, {
        method: 'DELETE',
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete rally type')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete rally event
  const deleteRallyEvent = useCallback(async (eventId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response: ApiResponse<void> = await apiCall(`/api/rally/events/${eventId}`, {
        method: 'DELETE',
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete rally event')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update an existing rally
  const updateRally = useCallback(async (rallyId: string, updateData: UpdateRallyData): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/rally/rallies/${rallyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update rally')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cancel/delete a rally
  const cancelRally = useCallback(async (rallyId: string, reason?: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/rally/rallies/${rallyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel rally')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get rally registrations count
  const getRallyRegistrations = useCallback(async (rallyId: string): Promise<{
    totalRegistrations: number
    registrations: Array<{
      id: string
      userName: string
      userEmail: string
      registeredAt: string
      notes?: string
    }>
  }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/rally/rallies/${rallyId}/registrations`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error || 'Failed to fetch rally registrations')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get all rallies for management (including past ones)
  const fetchAllRallies = useCallback(async (filters?: {
    gameId?: string
    status?: 'upcoming' | 'active' | 'past' | 'cancelled'
    limit?: number
    offset?: number
  }): Promise<any[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams()
      if (filters?.gameId) searchParams.set('gameId', filters.gameId)
      if (filters?.status) searchParams.set('status', filters.status)
      if (filters?.limit) searchParams.set('limit', filters.limit.toString())
      if (filters?.offset) searchParams.set('offset', filters.offset.toString())
      
      const token = getAuthToken()
      const response = await fetch(`/api/rally/rallies/manage?${searchParams.toString()}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.data) {
        return data.data
      } else {
        throw new Error(data.error || 'Failed to fetch rallies')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    isLoading,
    error,
    
    // Methods
    fetchRallyGames,
    fetchRallyTypes,
    fetchRallyEvents,
    fetchGameData,
    fetchUpcomingRallies,
    createGameSetup,
    createRally,
    fetchRallies,
    addRallyTypes,
    addRallyEvents,
    updateRallyType,
    updateRallyEvent,
    deleteRallyType,
    deleteRallyEvent,
    updateRally,
    cancelRally,
    getRallyRegistrations,
    fetchAllRallies,
    
    // Utility
    clearError: () => setError(null),
  }
}