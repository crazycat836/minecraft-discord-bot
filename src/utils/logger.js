import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import os from 'os';

// Define log levels
export const LogLevel = {
  FATAL: 0,   // Critical errors that cause application termination
  ERROR: 1,   // Errors that prevent functionality from working
  WARN: 2,    // Warnings about potential issues
  INFO: 3,    // Important operational information
  DEBUG: 4,    // Detailed information for debugging
  TRACE: 5    // Very detailed tracing information
};

// Color configuration for different log levels
const LOG_COLORS = {
  [LogLevel.FATAL]: chalk.bgRed.white.bold,
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.WARN]: chalk.hex('#FFA500'), // Orange
  [LogLevel.INFO]: chalk.blue,
  [LogLevel.DEBUG]: chalk.yellow,
  [LogLevel.TRACE]: chalk.gray
};

// Text labels for log levels
const LOG_LABELS = {
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.TRACE]: 'TRACE'
};

// Log file configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');
const APP_LOG_FILE = path.join(LOG_DIR, 'app.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5; // Number of rotated log files to keep

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      level: LogLevel.INFO,
      useColors: true,
      showTimestamp: true,
      modulePrefix: null,
      enableFileLogging: false,
      logDirectory: LOG_DIR,
      errorLogFile: ERROR_LOG_FILE,
      appLogFile: APP_LOG_FILE,
      modules: {},
      ...options
    };

    // Module context tracking
    this.moduleContext = new Map();

    // Initialize file logging if enabled
    if (this.config.enableFileLogging) {
      this.initializeFileLogging();
    }
  }

  /**
   * Configure the logger with the given configuration
   * @param {Object} config - Configuration object
   */
  configure(config) {
    if (config) {
      this.config = { ...this.config, ...config };

      // Re-initialize file logging if configuration changed
      if (this.config.enableFileLogging) {
        this.initializeFileLogging();
      }
    }
  }

  /**
   * Set up file logging directory and files
   */
  async initializeFileLogging() {
    try {
      // Ensure log directory exists
      if (!fs.existsSync(this.config.logDirectory)) {
        await fsPromises.mkdir(this.config.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to initialize log directory: ${error.message}`);
      this.config.enableFileLogging = false;
    }
  }

  /**
   * Set the current log level
   * @param {number} level - The log level to set
   */
  setLevel(level) {
    if (level >= LogLevel.FATAL && level <= LogLevel.TRACE) {
      this.config.level = level;
    }
  }

  /**
   * Get the current timestamp formatted for logs
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    // Return formatted timestamp: YYYY-MM-DD HH:mm:ss
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Format a log message for console output
   * @param {number} level - The log level
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = null) {
    const label = LOG_LABELS[level];
    const timestamp = this.config.showTimestamp ? this.getTimestamp() : '';

    // Ensure label has a fixed width (5 characters) for consistent alignment
    const paddedLabel = label.padEnd(5, ' ');

    let formattedMessage = '';

    if (this.config.useColors) {
      if (timestamp) {
        formattedMessage += `[${chalk.gray(timestamp)}] `;
      }
      formattedMessage += `${LOG_COLORS[level](paddedLabel)} | `;
      formattedMessage += `${message}`;
    } else {
      if (timestamp) {
        formattedMessage += `[${timestamp}] `;
      }
      formattedMessage += `${paddedLabel} | ${message}`;
    }

    // Add metadata if provided
    if (meta) {
      if (meta instanceof Error) {
        // Format Error objects specially
        formattedMessage += `: ${meta.message}`;
        if (meta.stack && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
          formattedMessage += `\n${meta.stack}`;
        }
      } else if (typeof meta === 'object') {
        try {
          formattedMessage += ` ${JSON.stringify(meta)}`;
        } catch (e) {
          formattedMessage += ` [Object]`;
        }
      } else {
        formattedMessage += ` ${meta}`;
      }
    }

    return formattedMessage;
  }

  /**
   * Format message for file output (no color codes)
   * @param {number} level - The log level
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata
   * @returns {string} Formatted message for file
   */
  formatMessageForFile(level, message, meta = null) {
    const label = LOG_LABELS[level];
    const timestamp = this.getTimestamp();

    // Basic format: timestamp | LEVEL | message
    let formattedMessage = `${timestamp} | ${label.padEnd(5, ' ')} | ${message}`;

    // Add metadata if provided
    if (meta) {
      if (meta instanceof Error) {
        formattedMessage += `: ${meta.message}`;
        if (meta.stack && (level <= LogLevel.ERROR)) {
          formattedMessage += `\n${meta.stack}`;
        }
      } else if (typeof meta === 'object') {
        try {
          formattedMessage += ` ${JSON.stringify(meta)}`;
        } catch (e) {
          formattedMessage += ` [Object]`;
        }
      } else {
        formattedMessage += ` ${meta}`;
      }
    }

    return formattedMessage;
  }

  /**
   * Log rotation - checks if log file exceeds maximum size and rotates if needed
   * @param {string} logFile - Path to the log file
   */
  async rotateLogIfNeeded(logFile) {
    try {
      // Check if file exists
      if (!fs.existsSync(logFile)) {
        return;
      }

      // Check file size
      const stats = await fsPromises.stat(logFile);
      if (stats.size < MAX_LOG_SIZE) {
        return;
      }

      // Rotate log files
      for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
        const oldFile = `${logFile}.${i}`;
        const newFile = `${logFile}.${i + 1}`;

        if (fs.existsSync(oldFile)) {
          await fsPromises.rename(oldFile, newFile).catch(() => { });
        }
      }

      // Rename current log file
      await fsPromises.rename(logFile, `${logFile}.1`).catch(() => { });
    } catch (error) {
      console.error(`Log rotation error: ${error.message}`);
    }
  }

  /**
   * Append message to log file
   * @param {string} logFile - Path to the log file
   * @param {string} message - Message to append
   */
  async appendToLogFile(logFile, message) {
    if (!this.config.enableFileLogging) {
      return;
    }

    try {
      // Rotate log if needed
      await this.rotateLogIfNeeded(logFile);

      // Append to log file
      await fsPromises.appendFile(logFile, message + os.EOL);
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Set module-specific log level
   * @param {string} moduleName - The name of the module
   * @param {number} level - The log level to set for the module
   */
  setModuleLevel(moduleName, level) {
    if (level >= LogLevel.FATAL && level <= LogLevel.TRACE) {
      if (!this.config.modules) {
        this.config.modules = {};
      }
      this.config.modules[moduleName] = level;
    }
  }

  /**
   * Get the effective log level for a module
   * @param {string} moduleName - The name of the module
   * @returns {number} The effective log level
   */
  getEffectiveLevel(moduleName) {
    if (this.config.modules && this.config.modules[moduleName] !== undefined) {
      return this.config.modules[moduleName];
    }
    return this.config.level;
  }

  /**
   * Create a logger instance for a specific module
   * @param {string} moduleName - The name of the module
   * @returns {Object} Module-specific logger
   */
  getModuleLogger(moduleName) {
    // Check if we already have a logger for this module
    if (this.moduleContext.has(moduleName)) {
      return this.moduleContext.get(moduleName);
    }

    // Create a new module logger
    const moduleLogger = {
      fatal: (message, meta = null) => this.log(LogLevel.FATAL, message, meta, moduleName),
      error: (message, meta = null) => this.log(LogLevel.ERROR, message, meta, moduleName),
      warn: (message, meta = null) => this.log(LogLevel.WARN, message, meta, moduleName),
      info: (message, meta = null) => this.log(LogLevel.INFO, message, meta, moduleName),
      debug: (message, meta = null) => this.log(LogLevel.DEBUG, message, meta, moduleName),
      trace: (message, meta = null) => this.log(LogLevel.TRACE, message, meta, moduleName)
    };

    // Store in cache
    this.moduleContext.set(moduleName, moduleLogger);
    return moduleLogger;
  }

  /**
   * Log a message if the current log level allows it
   * @param {number} level - The log level
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @param {string} [moduleName] - The name of the module (optional)
   */
  log(level, message, meta = null, moduleName = null) {
    // Determine the effective log level
    const effectiveLevel = moduleName ? this.getEffectiveLevel(moduleName) : this.config.level;

    // Only log if the level is less than or equal to the effective level
    if (level <= effectiveLevel) {
      // Format module prefix if provided
      let formattedMessage = '';

      if (moduleName && !message.startsWith(moduleName)) {
        formattedMessage = `${moduleName}: ${message}`;
      } else {
        formattedMessage = message;
      }

      // Format message for console
      const consoleMessage = this.formatMessage(level, formattedMessage, meta);

      // Output to console
      console.log(consoleMessage);

      // Write to log file if enabled
      if (this.config.enableFileLogging) {
        // Plain text format for log files (no colors)
        const fileMessage = this.formatMessageForFile(level, formattedMessage, meta);

        // Save to app log
        this.appendToLogFile(this.config.appLogFile, fileMessage);

        // Also save errors and fatal messages to error log
        if (level <= LogLevel.ERROR) {
          this.appendToLogFile(this.config.errorLogFile, fileMessage);
        }
      }
    }
  }

  /**
   * Enable or disable file logging
   * @param {boolean} enabled - Whether file logging should be enabled
   */
  setFileLogging(enabled) {
    this.config.enableFileLogging = enabled;
    if (enabled) {
      this.initializeFileLogging();
    }
  }

  /**
   * Log a fatal error (level 0)
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @param {string} [moduleName] - The name of the module (optional)
   */
  fatal(message, meta = null, moduleName = null) {
    this.log(LogLevel.FATAL, message, meta, moduleName);
  }

  /**
   * Log an error (level 1)
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @param {string} [moduleName] - The name of the module (optional)
   */
  error(message, meta = null, moduleName = null) {
    this.log(LogLevel.ERROR, message, meta, moduleName);
  }

  /**
   * Log a warning (level 2)
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @param {string} [moduleName] - The name of the module (optional)
   */
  warn(message, meta = null, moduleName = null) {
    this.log(LogLevel.WARN, message, meta, moduleName);
  }

  /**
   * Log an info message (level 3)
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @param {string} [moduleName] - The name of the module (optional)
   */
  info(message, meta = null, moduleName = null) {
    this.log(LogLevel.INFO, message, meta, moduleName);
  }

  /**
   * Log a debug message (level 4)
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @param {string} [moduleName] - The name of the module (optional)
   */
  debug(message, meta = null, moduleName = null) {
    this.log(LogLevel.DEBUG, message, meta, moduleName);
  }

  /**
   * Log a trace message (level 5)
   * @param {string} message - The log message
   * @param {Object} [meta] - Additional metadata to log
   * @param {string} [moduleName] - The name of the module (optional)
   */
  trace(message, meta = null, moduleName = null) {
    this.log(LogLevel.TRACE, message, meta, moduleName);
  }
}

// Create and export a singleton instance
const logger = new Logger();
export default logger; 