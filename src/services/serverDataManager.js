import { statusBedrock, statusJava } from 'node-mcstatus';
import logger from '../utils/logger.js';

/**
 * ServerDataManager - Centralized management of Minecraft server status data
 * Implements request merging and subscription mechanism
 */
class ServerDataManager {
  constructor() {
    // Current ongoing request
    this.pendingRequest = null;
    
    // Retry settings
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    
    // Subscribers list
    this.subscribers = [];
    
    // Request counter for debugging
    this.requestCount = 0;
  }
  
  /**
   * Get server data
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} - Server data
   */
  async getServerData(config) {
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
    
    let retries = 0;
    
    while (retries <= this.maxRetries) {
      try {
        // Determine which API to use based on server type
        const statusFunction = config.mcserver.type === 'bedrock' ? statusBedrock : statusJava;
        
        // Call the appropriate status function
        const data = await statusFunction(config.mcserver.ip, config.mcserver.port);
        
        // Check if server is actually online based on returned data
        const isOnline = data && data.online !== false;
        
        // Prepare player list data
        const playerList = isOnline && data.players ? data.players : { online: 0, max: 0, list: [] };
        
        // Notify subscribers
        this._notifySubscribers({ data, isOnline, playerList });
        
        return {
          data,
          isOnline,
          playerList
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
          // Log other errors with full details
          logger.error(`Failed to fetch server data: ${error.message}`);
          
          // For non-rate limit errors, return offline status immediately
          const result = { data: null, isOnline: false, playerList: { online: 0, max: 0, list: [] } };
          
          // Notify subscribers
          this._notifySubscribers(result);
          
          return result;
        }
      }
    }
    
    // If we've exhausted all retries
    logger.error(`All retries failed for ${config.mcserver.ip}:${config.mcserver.port}, returning offline status`);
    
    const result = { data: null, isOnline: false, playerList: { online: 0, max: 0, list: [] } };
    
    // Notify subscribers
    this._notifySubscribers(result);
    
    return result;
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
   * @param {Object} data - The data to send to subscribers
   */
  _notifySubscribers(data) {
    if (this.subscribers.length > 0) {
      this.subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Error in subscriber callback:', error);
        }
      });
    }
  }
}

// Create singleton instance
const serverDataManager = new ServerDataManager();

export default serverDataManager; 