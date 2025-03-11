import logger from './logger.js';

/**
 * Compatibility layer for migrating from old logging methods to the new unified logger
 * This helps maintain backward compatibility while transitioning to the new logging system
 */

/**
 * Maps old getError function to new logger.error
 * @param {Error|string} error - The error object or message
 * @param {string} [errorMsg] - Optional error message key for translation
 */
export function getError(error, errorMsg) {
  if (typeof error === 'string' && !errorMsg) {
    // If only a string was passed, use it as the message
    logger.error(error);
  } else if (error instanceof Error) {
    // If an Error object was passed
    logger.error(errorMsg || 'An error occurred', error);
  } else {
    // Handle other cases
    logger.error(errorMsg || 'An error occurred', error);
  }
}

/**
 * Maps old getWarning function to new logger.warn
 * @param {string} warningMessage - The warning message
 */
export function getWarning(warningMessage) {
  logger.warn(warningMessage);
}

/**
 * Maps old getDebug function to new logger.debug
 * @param {string} debugMessage - The debug message
 */
export function getDebug(debugMessage) {
  logger.debug(debugMessage);
}

/**
 * Maps old console.log with INFO level to new logger.info
 * @param {string} message - The info message
 */
export function logInfo(message) {
  logger.info(message);
}

/**
 * Maps old console.log with SUCCESS level to new logger.info with success tag
 * @param {string} message - The success message
 */
export function logSuccess(message) {
  logger.info(`[SUCCESS] ${message}`);
}

/**
 * Maps old console.error to new logger.error
 * @param {string} message - The error message
 * @param {Error} [error] - Optional error object
 */
export function logError(message, error) {
  if (error) {
    logger.error(message, error);
  } else {
    logger.error(message);
  }
}

/**
 * Maps old console.log with FATAL level to new logger.fatal
 * @param {string} message - The fatal error message
 * @param {Error} [error] - Optional error object
 */
export function logFatal(message, error) {
  if (error) {
    logger.fatal(message, error);
  } else {
    logger.fatal(message);
  }
}

/**
 * Maps old getDateNow function to logger's timestamp functionality
 * @returns {string} Formatted timestamp
 */
export function getDateNow() {
  return new Date().toISOString();
}

// Export all functions as a compatibility layer
export default {
  getError,
  getWarning,
  getDebug,
  logInfo,
  logSuccess,
  logError,
  logFatal,
  getDateNow
}; 