import { LogLevel } from './logger.js';
import logger from './logger.js';
import os from 'os';

/**
 * Logger configuration that can be imported and modified by the application
 */
export const loggerConfig = {
  // Default log level based on environment
  defaultLevels: {
    development: LogLevel.DEBUG,
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
  enableFileLogging: true, // 啟用文件記錄
  
  // Configure which modules should be logged at which levels
  // This allows for more granular control over logging
  modules: {
    // Core modules - 不同模組使用不同的日誌級別
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
  
  // Set log level based on environment
  const level = loggerConfig.defaultLevels[env] || LogLevel.INFO;
  
  // Set timezone if specified
  if (appConfig?.settings?.logging?.timezone) {
    loggerConfig.timezone = appConfig.settings.logging.timezone;
  }
  
  // Setup file logging based on environment and config
  // 在開發環境中可以關閉文件記錄以提高性能
  if (env === 'development') {
    loggerConfig.enableFileLogging = false;
    
    // 開發環境使用更詳細的日誌
    loggerConfig.modules = {
      ...loggerConfig.modules,
      'ServerDataManager': LogLevel.DEBUG,
      'AutoChangeStatus': LogLevel.DEBUG,
      'PlayerCount': LogLevel.DEBUG
    };
  } else {
    // 在生產環境中啟用文件記錄
    loggerConfig.enableFileLogging = true;
  }
  
  // 允許從配置文件中覆蓋文件記錄設置
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