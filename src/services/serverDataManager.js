import { statusBedrock, statusJava } from 'node-mcstatus';
import chalk from 'chalk';
import logger from '../utils/logger.js';

/**
 * ServerDataManager - Centralized management of Minecraft server status data
 * Implements request merging, data caching, and subscription mechanism
 */
class ServerDataManager {
  constructor() {
    // Cached data
    this.cache = {
      data: null,
      isOnline: false,
      playerList: [],
      lastUpdated: 0
    };
    
    // Current ongoing request
    this.pendingRequest = null;
    
    // Cache expiration time (milliseconds)
    this.cacheExpiry = 30000; // 30 seconds
    
    // Retry settings
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    
    // Subscribers list
    this.subscribers = [];
    
    // Request counter for debugging
    this.requestCount = 0;
  }
  
  /**
   * Get server data, use cache if valid
   * @param {Object} config - Configuration object
   * @param {boolean} forceRefresh - Whether to force refresh the cache
   * @returns {Promise<Object>} - Server data
   */
  async getServerData(config, forceRefresh = false) {
    const now = Date.now();
    
    // If cache is valid and no force refresh, return cache directly
    if (!forceRefresh && this.cache.data && (now - this.cache.lastUpdated) < this.cacheExpiry) {
      return {
        data: this.cache.data,
        isOnline: this.cache.isOnline,
        playerList: this.cache.playerList
      };
    }
    
    // If there's already a request in progress, wait for it to complete
    if (this.pendingRequest) {
      return this.pendingRequest;
    }
    
    // Create new request
    this.pendingRequest = this._fetchServerData(config);
    
    try {
      const result = await this.pendingRequest;
      return result;
    } finally {
      // Clear pendingRequest after request completes
      this.pendingRequest = null;
    }
  }
  
  /**
   * Fetch server data from the Minecraft server
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Server data and online status
   */
  async _fetchServerData(config) {
    this.requestCount++;
    
    // Log the request
    logger.info(`Fetching server data (request #${this.requestCount}) for ${config.mcserver.ip}:${config.mcserver.port}`);
    
    let retries = 0;
    
    while (retries <= this.maxRetries) {
      try {
        // Determine which API to use based on server type
        const statusFunction = config.mcserver.type === 'bedrock' ? statusBedrock : statusJava;
        
        // Call the appropriate status function
        const data = await statusFunction(config.mcserver.ip, config.mcserver.port);
        
        // If we get here, the request was successful
        const isOnline = true;
        
        // Log success
        logger.info(`Server ${config.mcserver.ip}:${config.mcserver.port} is ${isOnline ? 'online' : 'offline'}`);
        
        // Update cache
        this.cache = {
          data,
          isOnline,
          playerList: isOnline ? data.players : { online: 0, max: 0, list: [] },
          lastUpdated: Date.now()
        };
        
        // Notify subscribers
        this._notifySubscribers();
        
        return {
          data,
          isOnline,
          playerList: this.cache.playerList
        };
      } catch (error) {
        // Check if this is a rate limit error
        if (error.message && error.message.includes('rate')) {
          retries++;
          
          // Exponential backoff
          const delay = this.baseDelay * Math.pow(2, retries - 1);
          
          // Log rate limit
          logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${retries}/${this.maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Log other errors
          logger.error(`Failed to fetch server data for ${config.mcserver.ip}:${config.mcserver.port}: ${error.message}`);
          
          // For non-rate limit errors, return offline status immediately
          this.cache = {
            data: null,
            isOnline: false,
            playerList: { online: 0, max: 0, list: [] },
            lastUpdated: Date.now()
          };
          
          // Notify subscribers
          this._notifySubscribers();
          
          return { data: null, isOnline: false, playerList: { online: 0, max: 0, list: [] } };
        }
      }
    }
    
    // If we've exhausted all retries
    logger.error(`All retries failed for ${config.mcserver.ip}:${config.mcserver.port}, returning offline status`);
    
    this.cache = {
      data: null,
      isOnline: false,
      playerList: { online: 0, max: 0, list: [] },
      lastUpdated: Date.now()
    };
    
    // Notify subscribers
    this._notifySubscribers();
    
    return { data: null, isOnline: false, playerList: { online: 0, max: 0, list: [] } };
  }
  
  /**
   * Subscribe to data updates
   * @param {Function} callback - Callback function to call when data is updated
   * @returns {Function} - Function to unsubscribe
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Return function to unsubscribe
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  /**
   * Notify all subscribers of data changes
   */
  _notifySubscribers() {
    if (this.subscribers.length > 0) {
      const { data, isOnline, playerList } = this.cache;
      
      this.subscribers.forEach(callback => {
        try {
          callback({ data, isOnline, playerList });
        } catch (error) {
          logger.error('Error in subscriber callback:', error);
        }
      });
    }
  }
  
  /**
   * Get current date time string
   * @private
   * @returns {string} - Formatted date time string
   */
  _getDateNow() {
    const date = new Date();
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  }
  
  /**
   * Set cache expiration time
   * @param {number} milliseconds - Cache expiration time (milliseconds)
   */
  setCacheExpiry(milliseconds) {
    this.cacheExpiry = milliseconds;
  }
  
  /**
   * Manually clear cache
   */
  clearCache() {
    this.cache = {
      data: null,
      isOnline: false,
      playerList: [],
      lastUpdated: 0
    };
  }
}

// Create singleton instance
const serverDataManager = new ServerDataManager();

export default serverDataManager; 