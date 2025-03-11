import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log levels with their numeric values (lower = more important)
export const LogLevel = {
  FATAL: 0,   // Critical errors that cause application termination
  ERROR: 1,   // Errors that prevent functionality from working
  WARN: 2,    // Warnings about potential issues
  INFO: 3,    // Important operational information
  DEBUG: 4,   // Detailed information for debugging
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

class Logger {
  constructor() {
    // Default configuration
    this.config = {
      level: LogLevel.INFO,  // Default log level
      useColors: true,       // Use colors in console output
      showTimestamp: true,   // Show timestamps in log messages
      logToFile: false,      // Whether to log to a file
      logFilePath: path.join(__dirname, '../../logs/app.log'), // Default log file path
      logFileMaxSize: 10 * 1024 * 1024, // 10MB
      logFileRotation: 5,    // Keep 5 rotated log files
      modules: {}            // Module-specific log levels
    };
    
    // Environment-specific configuration
    this.environments = {
      development: {
        level: LogLevel.TRACE,
        useColors: true
      },
      test: {
        level: LogLevel.DEBUG,
        useColors: true
      },
      production: {
        level: LogLevel.INFO,
        useColors: true,
        logToFile: true
      },
      docker: {
        level: LogLevel.INFO,
        useColors: true,
        logToFile: true
      }
    };
    
    // Initialize with default environment
    this.setEnvironment(process.env.NODE_ENV || 'development');
  }
  
  /**
   * Configure the logger for a specific environment
   * @param {string} env - The environment name ('development', 'production', 'test', 'docker')
   */
  setEnvironment(env) {
    if (this.environments[env]) {
      this.config = { ...this.config, ...this.environments[env] };
    }
    
    // Create log directory if logging to file is enabled
    if (this.config.logToFile) {
      const logDir = path.dirname(this.config.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
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
    return now.toISOString();
  }
  
  /**
   * Format a log message
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
    
    if (timestamp) {
      formattedMessage += `${timestamp} | `;
    }
    
    if (this.config.useColors) {
      formattedMessage += `${LOG_COLORS[level](paddedLabel)} | `;
      formattedMessage += `${message}`;
    } else {
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
   * Write a log message to file if file logging is enabled
   * @param {string} message - The formatted log message
   */
  writeToFile(message) {
    if (!this.config.logToFile) return;
    
    try {
      // Remove ANSI color codes for file logging
      const cleanMessage = message.replace(/\u001b\[\d+m/g, '');
      fs.appendFileSync(this.config.logFilePath, cleanMessage + '\n');
      
      // Check file size and rotate if needed
      const stats = fs.statSync(this.config.logFilePath);
      if (stats.size > this.config.logFileMaxSize) {
        this.rotateLogFiles();
      }
    } catch (error) {
      // If we can't write to the log file, output to console
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }
  
  /**
   * Rotate log files when the main log file gets too large
   */
  rotateLogFiles() {
    const baseLogPath = this.config.logFilePath;
    const maxRotation = this.config.logFileRotation;
    
    // Delete the oldest log file if it exists
    if (fs.existsSync(`${baseLogPath}.${maxRotation}`)) {
      fs.unlinkSync(`${baseLogPath}.${maxRotation}`);
    }
    
    // Shift all existing log files
    for (let i = maxRotation - 1; i >= 0; i--) {
      const oldPath = i === 0 ? baseLogPath : `${baseLogPath}.${i}`;
      const newPath = `${baseLogPath}.${i + 1}`;
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
    }
    
    // Create a new empty log file
    fs.writeFileSync(baseLogPath, '');
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
      const formattedMessage = this.formatMessage(level, message, meta);
      
      // Output to console
      console.log(formattedMessage);
      
      // Write to file if enabled
      this.writeToFile(formattedMessage);
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