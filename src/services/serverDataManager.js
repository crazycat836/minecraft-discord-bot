import { statusBedrock, statusJava } from 'node-mcstatus';
import logger from '../utils/logger.js';

/**
 * ServerDataManager - Centralized management of Minecraft server status data
 * Implements request merging and subscription mechanism
 */
class ServerDataManager {
  constructor() {
    // Initialize module logger
    this.logger = logger.getModuleLogger('ServerDataManager');
    
    // Current ongoing request
    this.pendingRequest = null;
    
    // Retry settings
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    
    // Subscribers list
    this.subscribers = [];
    
    // Request counter for debugging
    this.requestCount = 0;
    
    // Current request key
    this.currentRequestKey = null;
    
    this.logger.debug('Initialized');
  }
  
  /**
   * Get server data
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} - Server data
   */
  async getServerData(config) {
    // Generate a unique key for this request
    const requestKey = `${config.mcserver.ip}:${config.mcserver.port}:${config.mcserver.type}`;
    
    // If there's already a request in progress for this exact server, wait for it to complete
    if (this.pendingRequest && this.currentRequestKey === requestKey) {
      this.logger.debug(`Reusing existing request #${this.requestCount} for ${requestKey}`);
      return this.pendingRequest;
    }
    
    this.logger.debug(`Starting new request #${this.requestCount + 1} for ${config.mcserver.ip}:${config.mcserver.port}`);
    
    // Save the current request key
    this.currentRequestKey = requestKey;
    
    // Create new request
    this.pendingRequest = this._fetchServerData(config);
    
    try {
      const result = await this.pendingRequest;
      this.logger.debug(`Request #${this.requestCount} completed, server ${result.isOnline ? 'online' : 'offline'}`);
      return result;
    } finally {
      // Clear pendingRequest after request completes
      this.pendingRequest = null;
      this.currentRequestKey = null;
    }
  }
  
  /**
   * Fetch server data from the Minecraft server
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Server data and online status
   */
  async _fetchServerData(config) {
    this.requestCount++;
    this.logger.debug(`Fetching data for ${config.mcserver.ip}:${config.mcserver.port} (Request #${this.requestCount})`);
    
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
        
        this.logger.debug(`Server ${config.mcserver.ip} status: ${isOnline ? 'Online' : 'Offline'}, Players: ${playerList.online}/${playerList.max}`);
        if (isOnline && playerList.list && playerList.list.length > 0) {
          this.logger.debug(`Active players: ${playerList.list.map(p => p.name_clean || p.name || p).join(', ')}`);
        }
        
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
          this.logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${retries}/${this.maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Log other errors with full details
          this.logger.error(`Failed to fetch server data: ${error.message}`, error);
          
          // For non-rate limit errors, return offline status immediately
          const result = { data: null, isOnline: false, playerList: { online: 0, max: 0, list: [] } };
          
          // Notify subscribers
          this._notifySubscribers(result);
          
          return result;
        }
      }
    }
    
    // If we've exhausted all retries
    this.logger.error(`All retries failed for ${config.mcserver.ip}:${config.mcserver.port}, returning offline status`);
    
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
    this.logger.debug(`New subscriber added, total: ${this.subscribers.length}`);
    
    // Return function to unsubscribe
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
      this.logger.debug(`Subscriber removed, total: ${this.subscribers.length}`);
    };
  }
  
  /**
   * Notify all subscribers of data changes
   * @param {Object} data - The data to send to subscribers
   */
  _notifySubscribers(data) {
    if (this.subscribers.length > 0) {
      this.logger.debug(`Notifying ${this.subscribers.length} subscribers of server status change`);
      this.subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error('Error in subscriber callback:', error);
        }
      });
    }
  }
}

// Create singleton instance
const serverDataManager = new ServerDataManager();

export default serverDataManager; 