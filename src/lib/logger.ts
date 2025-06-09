// src/lib/logger.ts

interface LogLevel {
  ERROR: 0
  WARN: 1
  INFO: 2
  DEBUG: 3
}

interface LogEntry {
  timestamp: string
  level: keyof LogLevel
  message: string
  data?: any
  error?: Error
  requestId?: string
  userId?: string
}

class Logger {
  private logLevel: keyof LogLevel
  private isDevelopment: boolean

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as keyof LogLevel) || 'INFO'
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: LogLevel = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
    return levels[level] <= levels[this.logLevel]
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data, error, requestId, userId } = entry

    if (this.isDevelopment) {
      // Pretty format for development
      let log = `[${timestamp}] ${level}: ${message}`
      
      if (requestId) log += ` (req: ${requestId})`
      if (userId) log += ` (user: ${userId})`
      if (data) log += `\nData: ${JSON.stringify(data, null, 2)}`
      if (error) log += `\nError: ${error.stack || error.message}`
      
      return log
    } else {
      // JSON format for production (better for log aggregation)
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...(data && { data }),
        ...(error && { 
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        }),
        ...(requestId && { requestId }),
        ...(userId && { userId })
      })
    }
  }

  private log(level: keyof LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error
    }

    const formattedLog = this.formatLog(entry)

    switch (level) {
      case 'ERROR':
        console.error(formattedLog)
        break
      case 'WARN':
        console.warn(formattedLog)
        break
      case 'INFO':
        console.info(formattedLog)
        break
      case 'DEBUG':
        console.debug(formattedLog)
        break
    }

    // In production, you might want to send logs to external service
    if (!this.isDevelopment && level === 'ERROR') {
      this.sendToExternalLogger(entry)
    }
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    // Implementation for external logging service (Vercel logs, Sentry, etc.)
    // For now, just ensure it doesn't throw
    try {
      // Example: Send to Vercel Analytics or external service
      // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
    } catch (error) {
      // Don't throw errors from logging
      console.error('Failed to send log to external service:', error)
    }
  }

  error(message: string, error?: Error | any, data?: any): void {
    if (error && !(error instanceof Error)) {
      // If error is not an Error object, treat it as data
      data = error
      error = undefined
    }
    this.log('ERROR', message, data, error)
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data)
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data)
  }

  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data)
  }

  // Specialized logging methods
  database(operation: string, data?: any, error?: Error): void {
    const message = `Database operation: ${operation}`
    if (error) {
      this.error(message, error, data)
    } else {
      this.debug(message, data)
    }
  }

  api(method: string, path: string, statusCode: number, data?: any): void {
    const message = `API ${method} ${path} - ${statusCode}`
    if (statusCode >= 500) {
      this.error(message, undefined, data)
    } else if (statusCode >= 400) {
      this.warn(message, data)
    } else {
      this.info(message, data)
    }
  }

  auth(event: string, userId?: string, data?: any): void {
    const message = `Auth event: ${event}`
    this.info(message, { ...data, userId })
  }

  email(action: string, recipient: string, status: 'sent' | 'failed' | 'bounced', error?: Error): void {
    const message = `Email ${action} to ${recipient}: ${status}`
    if (status === 'failed' || status === 'bounced') {
      this.warn(message, { recipient, status }, error)
    } else {
      this.info(message, { recipient, status })
    }
  }

  // Performance logging
  performance(operation: string, duration: number, data?: any): void {
    const message = `Performance: ${operation} took ${duration}ms`
    if (duration > 5000) { // Log as warning if over 5 seconds
      this.warn(message, data)
    } else if (duration > 1000) { // Log as info if over 1 second
      this.info(message, data)
    } else {
      this.debug(message, data)
    }
  }

  // Request context logging (for tracking requests across operations)
  withContext(requestId: string, userId?: string) {
    return {
      error: (message: string, error?: Error, data?: any) => {
        this.log('ERROR', message, { ...data, requestId, userId }, error)
      },
      warn: (message: string, data?: any) => {
        this.log('WARN', message, { ...data, requestId, userId })
      },
      info: (message: string, data?: any) => {
        this.log('INFO', message, { ...data, requestId, userId })
      },
      debug: (message: string, data?: any) => {
        this.log('DEBUG', message, { ...data, requestId, userId })
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export the class for testing
export { Logger }