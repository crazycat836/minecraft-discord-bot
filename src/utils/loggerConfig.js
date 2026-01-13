import { LogLevel } from './logger.js';
import logger from './logger.js';
import os from 'os';

/**
 * Logger configuration that can be imported and modified by the application
 */
export const loggerConfig = {
  // Default log level based on environment
  defaultLevels: {
    development: LogLevel.INFO,
    test: LogLevel.DEBUG,
    production: LogLevel.INFO,
    docker: LogLevel.INFO,
    dockerdebug: LogLevel.DEBUG
  },

  // Whether to use colors in console output
  useColors: true,

  // Whether to show timestamps in log messages
  showTimestamp: true,

  // File logging settings
  enableFileLogging: true, // Enable file logging

  // Configure which modules should be logged at which levels
  // This allows for more granular control over logging
  modules: {
    // Core modules - specific log levels for different modules
    'ServerDataManager': LogLevel.INFO,

    // Features
    'AutoChangeStatus': LogLevel.INFO,
    'PlayerCount': LogLevel.INFO,

    // Command handlers
    'Command': LogLevel.INFO,

    // Utils
    'Utils': LogLevel.WARN
  }
};

/**
 * Configure the logger based on the application's config object
 * @param {Object} appConfig - The application's config object
 * @returns {Object} Updated logger configuration
 */
export function configureLogger(appConfig) {
  // Set environment with default to production
  const env = process.env.NODE_ENV || 'production';

  // Set log level based on environment or LOG_LEVEL override
  // Allow LOG_LEVEL env var to override default
  const envLogLevel = process.env.LOG_LEVEL && LogLevel[process.env.LOG_LEVEL.toUpperCase()];
  const level = envLogLevel !== undefined ? envLogLevel : (loggerConfig.defaultLevels[env] || LogLevel.INFO);

  // Set timezone if specified
  if (appConfig?.settings?.logging?.timezone) {
    loggerConfig.timezone = appConfig.settings.logging.timezone;
  }

  // Setup file logging based on environment and config
  // Disable file logging in development to improve performance
  if (env === 'development') {
    loggerConfig.enableFileLogging = false;

    // Module overrides removed to keep logs clean by default
  } else {
    // Enable file logging in production
    loggerConfig.enableFileLogging = true;
  }

  // Allow file logging setting to be overridden from config file
  if (appConfig?.settings?.logging?.enableFileLogging !== undefined) {
    loggerConfig.enableFileLogging = appConfig.settings.logging.enableFileLogging;
  }

  // Update the configuration
  loggerConfig.level = level;

  // Apply configuration to the logger instance
  logger.configure(loggerConfig);

  // Log system information on startup
  const sysInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    environment: env,
    logLevel: LogLevel[level],
    fileLogging: loggerConfig.enableFileLogging ? 'Enabled' : 'Disabled'
  };

  logger.info('Logger initialized', sysInfo, 'Startup');

  return loggerConfig;
}

export default configureLogger; 