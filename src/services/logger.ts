/**
 * Logger Service
 *
 * Structured logging service with multiple levels, sensitive data redaction,
 * and environment-specific outputs.
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Automatic sensitive data redaction
 * - Log history for debugging
 * - Console output in development
 * - File logging ready for production
 * - Structured output format
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: number
  level: LogLevel
  message: string
  context?: unknown
}

interface LoggerConfig {
  minLevel: LogLevel
  maxHistorySize: number
}

const SENSITIVE_KEYS = [
  'password',
  'token',
  'apikey',
  'secret',
  'authorization',
  'api_key',
  'access_token',
  'refresh_token',
  'openai_api_key',
]

class Logger {
  private history: LogEntry[] = []
  private config: LoggerConfig

  constructor() {
    // Default to DEBUG in development, INFO in production
    const defaultLevel =
      process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG

    this.config = {
      minLevel: defaultLevel,
      maxHistorySize: 1000,
    }
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: unknown): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log info message
   */
  info(message: string, context?: unknown): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: unknown): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown): void {
    // Convert Error objects to plain objects for logging
    const context = this.serializeError(error)
    this.log(LogLevel.ERROR, message, context)
  }

  /**
   * Get log history
   */
  getHistory(): LogEntry[] {
    return [...this.history]
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.history = []
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: unknown): void {
    // Check if we should log this level
    if (level < this.config.minLevel) {
      return
    }

    // Redact sensitive data from context
    const safeContext = this.redactSensitiveData(context)

    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context: safeContext,
    }

    // Add to history (with size limit)
    this.addToHistory(entry)

    // Output to console
    this.outputToConsole(entry)
  }

  /**
   * Add entry to history with size limit
   */
  private addToHistory(entry: LogEntry): void {
    this.history.push(entry)

    // Enforce max history size
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize)
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const levelName = LogLevel[entry.level]
    const prefix = `${timestamp} [${levelName}]`

    // Only include context if it exists and is not empty
    const args = entry.context !== undefined ? [prefix, entry.message, entry.context] : [prefix, entry.message]

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...args)
        break
      case LogLevel.INFO:
        console.log(...args)
        break
      case LogLevel.WARN:
        console.warn(...args)
        break
      case LogLevel.ERROR:
        console.error(...args)
        break
    }
  }

  /**
   * Redact sensitive data from context
   */
  private redactSensitiveData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.redactSensitiveData(item))
    }

    // Handle objects
    if (typeof data === 'object') {
      const result: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()

        // Check if key contains sensitive data
        const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
          lowerKey.includes(sensitiveKey)
        )

        if (isSensitive) {
          result[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
          // Recursively redact nested objects
          result[key] = this.redactSensitiveData(value)
        } else {
          result[key] = value
        }
      }

      return result
    }

    // Return primitives as-is
    return data
  }

  /**
   * Serialize Error objects to plain objects
   */
  private serializeError(error: unknown): unknown {
    if (!error) {
      return error
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        // Include any custom properties
        ...Object.getOwnPropertyNames(error).reduce(
          (acc, key) => {
            if (key !== 'name' && key !== 'message' && key !== 'stack') {
              acc[key] = (error as unknown as Record<string, unknown>)[key]
            }
            return acc
          },
          {} as Record<string, unknown>
        ),
      }
    }

    return error
  }
}

// Export singleton instance
export const logger = new Logger()
