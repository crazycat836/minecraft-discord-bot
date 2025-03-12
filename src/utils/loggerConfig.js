import { LogLevel } from './logger.js';

/**
 * Logger configuration that can be imported and modified by the application
 */
export const loggerConfig = {
  // Default log level based on environment
  defaultLevels: {
    development: LogLevel.TRACE,
    test: LogLevel.DEBUG,
    production: LogLevel.INFO,
    docker: LogLevel.INFO
  },
  
  // Whether to use colors in console output
  useColors: true,
  
  // Whether to show timestamps in log messages
  showTimestamp: true,
  
  // Configure which modules should be logged at which levels
  // This allows for more granular control over logging
  modules: {}
};

/**
 * Configure the logger based on the application's config object
 * @param {Object} appConfig - The application's config object
 * @returns {Object} Updated logger configuration
 */
export function configureLogger(appConfig) {
  // Determine environment - use NODE_ENV if available, otherwise default to development
  const env = process.env.NODE_ENV || 'development';
  
  // Set log level based on environment
  const level = loggerConfig.defaultLevels[env] || LogLevel.INFO;
  
  // Set timezone if specified
  if (appConfig?.settings?.logging?.timezone) {
    loggerConfig.timezone = appConfig.settings.logging.timezone;
  }
  
  // Update the configuration
  loggerConfig.level = level;
  
  return loggerConfig;
}

export default configureLogger; 