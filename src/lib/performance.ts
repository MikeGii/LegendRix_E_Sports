// src/lib/performance.ts

interface PerformanceTracker {
  start: number
  operation: string
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private trackers: Map<string, PerformanceTracker> = new Map()

  /**
   * Start tracking an operation
   */
  start(operation: string, metadata?: Record<string, any>): string {
    const trackerId = `${operation}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    this.trackers.set(trackerId, {
      start: Date.now(),
      operation,
      metadata
    })

    return trackerId
  }

  /**
   * End tracking and log performance
   */
  end(trackerId: string, additionalData?: Record<string, any>): number {
    const tracker = this.trackers.get(trackerId)
    
    if (!tracker) {
      logger.warn(`Performance tracker not found: ${trackerId}`)
      return 0
    }

    const duration = Date.now() - tracker.start
    
    logger.performance(tracker.operation, duration, {
      ...tracker.metadata,
      ...additionalData
    })

    this.trackers.delete(trackerId)
    return duration
  }

  /**
   * Track an async operation
   */
  async track<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const trackerId = this.start(operation, metadata)
    
    try {
      const result = await fn()
      this.end(trackerId, { success: true })
      return result
    } catch (error) {
      this.end(trackerId, { success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  /**
   * Track a synchronous operation
   */
  trackSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const trackerId = this.start(operation, metadata)
    
    try {
      const result = fn()
      this.end(trackerId, { success: true })
      return result
    } catch (error) {
      this.end(trackerId, { success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }
}

// Export singleton instance
export const performance = new PerformanceMonitor()