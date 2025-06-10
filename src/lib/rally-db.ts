// src/lib/rally-db.ts
import { sql } from '@vercel/postgres'
import { AppError } from './errors'
import { logger } from './logger'

// Rally interfaces
export interface RallyGame {
  id: string
  game_name: string
  game_description?: string
  is_active: boolean
  created_at: Date
}

export interface RallyType {
  id: string
  game_id: string
  type_name: string
  type_description?: string
  is_active: boolean
  created_at: Date
}

export interface RallyEvent {
  id: string
  game_id: string
  event_name: string
  event_description?: string
  country?: string
  surface_type?: string
  is_active: boolean
  created_at: Date
}

export interface Rally {
  rally_id: string
  rally_game_id: string
  rally_type_id: string
  rally_date: Date
  registration_ending_date: Date
  optional_notes?: string
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface RallyWithDetails extends Rally {
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

export interface RallyEventAssignment {
  id: string
  rally_id: string
  rally_event_id: string
  event_order: number
  created_at: Date
}

// Rally Database Operations Class
class RallyDatabaseService {
  
    /**
     * Execute a query with proper error handling and logging
     */
    async executeQuery<T>(
      queryName: string,
      queryFn: () => Promise<{ rows: T[]; rowCount: number }>
    ): Promise<{ rows: T[]; rowCount: number }> {
      try {
        logger.info(`Executing rally query: ${queryName}`)
        const result = await queryFn()
        logger.info(`Rally query ${queryName} completed successfully`, {
          rowCount: result.rowCount
        })
        return result
      } catch (error) {
        logger.error(`Rally query ${queryName} failed:`, error)
        
        // Map common database errors to user-friendly messages
        if (error instanceof Error) {
          if (error.message.includes('unique constraint')) {
            throw new AppError('Resource already exists', 409, 'DUPLICATE_RESOURCE')
          }
          if (error.message.includes('foreign key constraint')) {
            throw new AppError('Referenced resource not found', 404, 'REFERENCE_NOT_FOUND')
          }
          if (error.message.includes('connection')) {
            throw new AppError('Database connection failed', 503, 'DATABASE_UNAVAILABLE')
          }
        }
        
        throw new AppError('Database operation failed', 500, 'DATABASE_ERROR')
      }
    }


  // ==================
  // RALLY GAMES
  // ==================
  
  /**
   * Get all rally games
   */
  async getRallyGames(activeOnly: boolean = true): Promise<RallyGame[]> {
    try {
      const result = activeOnly 
        ? await sql`SELECT * FROM rally_games WHERE is_active = true ORDER BY game_name ASC`
        : await sql`SELECT * FROM rally_games ORDER BY game_name ASC`
      
      return result.rows as RallyGame[]
    } catch (error) {
      logger.error('Failed to get rally games:', error)
      throw new AppError('Failed to retrieve rally games', 500, 'DATABASE_ERROR')
    }
  }

  /**
   * Create a new rally game
   */
  async createRallyGame(gameName: string, gameDescription?: string): Promise<RallyGame> {
    try {
      const result = await sql`
        INSERT INTO rally_games (game_name, game_description)
        VALUES (${gameName}, ${gameDescription || null})
        RETURNING *
      `
      
      if (result.rows.length === 0) {
        throw new AppError('Failed to create rally game', 500, 'CREATION_FAILED')
      }
      
      logger.info('Rally game created successfully', { gameName })
      return result.rows[0] as RallyGame
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new AppError('Rally game with this name already exists', 409, 'DUPLICATE_GAME')
      }
      logger.error('Failed to create rally game:', error)
      throw new AppError('Failed to create rally game', 500, 'DATABASE_ERROR')
    }
  }

  // ==================
  // RALLY TYPES
  // ==================
  
  /**
   * Get rally types for a specific game
   */
  async getRallyTypesByGame(gameId: string, activeOnly: boolean = true): Promise<RallyType[]> {
    try {
      const result = activeOnly
        ? await sql`SELECT * FROM rally_types WHERE game_id = ${gameId} AND is_active = true ORDER BY type_name ASC`
        : await sql`SELECT * FROM rally_types WHERE game_id = ${gameId} ORDER BY type_name ASC`
      
      return result.rows as RallyType[]
    } catch (error) {
      logger.error('Failed to get rally types:', error)
      throw new AppError('Failed to retrieve rally types', 500, 'DATABASE_ERROR')
    }
  }

  /**
   * Create multiple rally types for a game
   */
  async createRallyTypes(gameId: string, typeNames: string[]): Promise<RallyType[]> {
    try {
      const createdTypes: RallyType[] = []
      
      for (const typeName of typeNames) {
        const result = await sql`
          INSERT INTO rally_types (game_id, type_name)
          VALUES (${gameId}, ${typeName})
          RETURNING *
        `
        if (result.rows.length > 0) {
          createdTypes.push(result.rows[0] as RallyType)
        }
      }
      
      logger.info('Rally types created successfully', { gameId, count: createdTypes.length })
      return createdTypes
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new AppError('One or more rally types already exist for this game', 409, 'DUPLICATE_TYPE')
      }
      logger.error('Failed to create rally types:', error)
      throw new AppError('Failed to create rally types', 500, 'DATABASE_ERROR')
    }
  }

  // ==================
  // RALLY EVENTS
  // ==================
  
  /**
   * Get rally events for a specific game
   */
  async getRallyEventsByGame(gameId: string, activeOnly: boolean = true): Promise<RallyEvent[]> {
    try {
      const result = activeOnly
        ? await sql`SELECT * FROM rally_events WHERE game_id = ${gameId} AND is_active = true ORDER BY event_name ASC`
        : await sql`SELECT * FROM rally_events WHERE game_id = ${gameId} ORDER BY event_name ASC`
      
      return result.rows as RallyEvent[]
    } catch (error) {
      logger.error('Failed to get rally events:', error)
      throw new AppError('Failed to retrieve rally events', 500, 'DATABASE_ERROR')
    }
  }

  /**
   * Create multiple rally events for a game
   */
  async createRallyEvents(gameId: string, eventNames: string[]): Promise<RallyEvent[]> {
    try {
      const createdEvents: RallyEvent[] = []
      
      for (const eventName of eventNames) {
        const result = await sql`
          INSERT INTO rally_events (game_id, event_name)
          VALUES (${gameId}, ${eventName})
          RETURNING *
        `
        if (result.rows.length > 0) {
          createdEvents.push(result.rows[0] as RallyEvent)
        }
      }
      
      logger.info('Rally events created successfully', { gameId, count: createdEvents.length })
      return createdEvents
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new AppError('One or more rally events already exist for this game', 409, 'DUPLICATE_EVENT')
      }
      logger.error('Failed to create rally events:', error)
      throw new AppError('Failed to create rally events', 500, 'DATABASE_ERROR')
    }
  }

  // ==================
  // COMPLETE GAME SETUP
  // ==================
  
  /**
   * Create a complete game setup with types and events
   */
  async createCompleteGameSetup(
    gameName: string, 
    rallyTypes: string[], 
    rallyEvents: string[],
    gameDescription?: string
  ): Promise<{
    game: RallyGame
    types: RallyType[]
    events: RallyEvent[]
  }> {
    try {
      logger.info('Creating complete game setup', { gameName, typesCount: rallyTypes.length, eventsCount: rallyEvents.length })
      
      // Create the game first
      const game = await this.createRallyGame(gameName, gameDescription)
      
      // Create types and events in parallel
      const [types, events] = await Promise.all([
        this.createRallyTypes(game.id, rallyTypes),
        this.createRallyEvents(game.id, rallyEvents)
      ])
      
      logger.info('Complete game setup created successfully', { 
        gameId: game.id, 
        typesCreated: types.length, 
        eventsCreated: events.length 
      })
      
      return { game, types, events }
    } catch (error) {
      logger.error('Failed to create complete game setup:', error)
      throw error // Re-throw the specific error from sub-operations
    }
  }

  // ==================
  // RALLIES WITH MULTIPLE EVENTS
  // ==================
  
  /**
   * Create a new rally with multiple events
   */
  async createRally(
    gameId: string,
    typeId: string,
    eventIds: string[], // Array of event IDs
    rallyDate: Date,
    registrationEndingDate: Date,
    createdBy: string,
    optionalNotes?: string
  ): Promise<Rally> {
    try {
      // Validate that we have at least one event
      if (!eventIds || eventIds.length === 0) {
        throw new AppError('At least one rally event is required', 400, 'NO_EVENTS')
      }

      // Validate that the IDs exist and belong to the same game
      const [gameCheck, typeCheck] = await Promise.all([
        sql`SELECT id FROM rally_games WHERE id = ${gameId} AND is_active = true`,
        sql`SELECT id FROM rally_types WHERE id = ${typeId} AND game_id = ${gameId} AND is_active = true`
      ])
      
      if (gameCheck.rows.length === 0) {
        throw new AppError('Selected game not found or inactive', 404, 'GAME_NOT_FOUND')
      }
      if (typeCheck.rows.length === 0) {
        throw new AppError('Selected rally type not found or not associated with this game', 404, 'TYPE_NOT_FOUND')
      }

      // Validate all events exist and belong to the same game
      for (const eventId of eventIds) {
        const eventCheck = await sql`SELECT id FROM rally_events WHERE id = ${eventId} AND game_id = ${gameId} AND is_active = true`
        if (eventCheck.rows.length === 0) {
          throw new AppError(`Rally event ${eventId} not found or not associated with this game`, 404, 'EVENT_NOT_FOUND')
        }
      }
      
      // Create the rally (without direct event reference)
      const rallyResult = await sql`
        INSERT INTO rallies (
          rally_game_id, 
          rally_type_id, 
          rally_date, 
          registration_ending_date, 
          optional_notes, 
          created_by
        )
        VALUES (${gameId}, ${typeId}, ${rallyDate.toISOString()}, ${registrationEndingDate.toISOString()}, ${optionalNotes || null}, ${createdBy})
        RETURNING *
      `
      
      if (rallyResult.rows.length === 0) {
        throw new AppError('Failed to create rally', 500, 'CREATION_FAILED')
      }

      const rally = rallyResult.rows[0] as Rally
      
      // Create event assignments
      for (let i = 0; i < eventIds.length; i++) {
        await sql`
          INSERT INTO rally_event_assignments (rally_id, rally_event_id, event_order)
          VALUES (${rally.rally_id}, ${eventIds[i]}, ${i + 1})
        `
      }
      
      logger.info('Rally created successfully with multiple events', { 
        rallyId: rally.rally_id, 
        gameId, 
        typeId, 
        eventCount: eventIds.length,
        createdBy 
      })
      
      return rally
    } catch (error) {
      logger.error('Failed to create rally:', error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to create rally', 500, 'DATABASE_ERROR')
    }
  }

  /**
   * Get rallies with full details including all events
   */
  async getRalliesWithDetails(limit: number = 50, offset: number = 0, upcomingOnly: boolean = false): Promise<RallyWithDetails[]> {
    try {
      let whereClause = ''
      if (upcomingOnly) {
        whereClause = 'WHERE r.rally_date > NOW()'
      }
      
      // Get rallies with basic info
      const ralliesResult = await sql.query(`
        SELECT 
          r.*,
          g.game_name,
          t.type_name,
          u.name as creator_name
        FROM rallies r
        JOIN rally_games g ON r.rally_game_id = g.id
        JOIN rally_types t ON r.rally_type_id = t.id
        LEFT JOIN users u ON r.created_by = u.id
        ${whereClause}
        ORDER BY r.rally_date ${upcomingOnly ? 'ASC' : 'DESC'} 
        LIMIT ${limit} OFFSET ${offset}
      `)
      
      const rallies = ralliesResult.rows as (Rally & { game_name: string; type_name: string; creator_name?: string })[]
      
      // Get events for each rally
      const ralliesWithDetails: RallyWithDetails[] = []
      
      for (const rally of rallies) {
        const eventsResult = await sql`
          SELECT 
            rea.event_order,
            re.id as event_id,
            re.event_name,
            re.country,
            re.surface_type
          FROM rally_event_assignments rea
          JOIN rally_events re ON rea.rally_event_id = re.id
          WHERE rea.rally_id = ${rally.rally_id}
          ORDER BY rea.event_order ASC
        `
        
        const events = eventsResult.rows.map(row => ({
          event_id: row.event_id,
          event_name: row.event_name,
          event_order: row.event_order,
          country: row.country,
          surface_type: row.surface_type
        }))
        
        ralliesWithDetails.push({
          ...rally,
          events
        })
      }
      
      return ralliesWithDetails
    } catch (error) {
      logger.error('Failed to get rallies with details:', error)
      throw new AppError('Failed to retrieve rallies', 500, 'DATABASE_ERROR')
    }
  }

  /**
   * Get a specific rally by ID with all events
   */
  async getRallyById(rallyId: string): Promise<RallyWithDetails | null> {
    try {
      // Get rally basic info
      const rallyResult = await sql`
        SELECT 
          r.*,
          g.game_name,
          t.type_name,
          u.name as creator_name
        FROM rallies r
        JOIN rally_games g ON r.rally_game_id = g.id
        JOIN rally_types t ON r.rally_type_id = t.id
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.rally_id = ${rallyId}
        LIMIT 1
      `
      
      if (rallyResult.rows.length === 0) {
        return null
      }
      
      const rally = rallyResult.rows[0] as Rally & { game_name: string; type_name: string; creator_name?: string }
      
      // Get events for this rally
      const eventsResult = await sql`
        SELECT 
          rea.event_order,
          re.id as event_id,
          re.event_name,
          re.country,
          re.surface_type
        FROM rally_event_assignments rea
        JOIN rally_events re ON rea.rally_event_id = re.id
        WHERE rea.rally_id = ${rallyId}
        ORDER BY rea.event_order ASC
      `
      
      const events = eventsResult.rows.map(row => ({
        event_id: row.event_id,
        event_name: row.event_name,
        event_order: row.event_order,
        country: row.country,
        surface_type: row.surface_type
      }))
      
      return {
        ...rally,
        events
      }
    } catch (error) {
      logger.error('Failed to get rally by ID:', error)
      throw new AppError('Failed to retrieve rally', 500, 'DATABASE_ERROR')
    }
  }

  // ==================
  // UTILITY METHODS
  // ==================
  
  /**
   * Get rally statistics
   */
  async getRallyStats(): Promise<{
    totalGames: number
    totalRallies: number
    upcomingRallies: number
    activeRegistrations: number
  }> {
    try {
      const [gamesResult, ralliesResult, upcomingResult, activeRegResult] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM rally_games WHERE is_active = true`,
        sql`SELECT COUNT(*) as count FROM rallies`,
        sql`SELECT COUNT(*) as count FROM rallies WHERE rally_date > NOW()`,
        sql`SELECT COUNT(*) as count FROM rallies WHERE registration_ending_date > NOW() AND rally_date > NOW()`
      ])
      
      return {
        totalGames: parseInt(gamesResult.rows[0]?.count || '0'),
        totalRallies: parseInt(ralliesResult.rows[0]?.count || '0'),
        upcomingRallies: parseInt(upcomingResult.rows[0]?.count || '0'),
        activeRegistrations: parseInt(activeRegResult.rows[0]?.count || '0')
      }
    } catch (error) {
      logger.error('Failed to get rally statistics:', error)
      throw new AppError('Failed to retrieve rally statistics', 500, 'DATABASE_ERROR')
    }
  }
}

// Export singleton instance
export const rallyDb = new RallyDatabaseService()

// Export the class for testing
export { RallyDatabaseService }