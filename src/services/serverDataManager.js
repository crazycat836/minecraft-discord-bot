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

    // Map to track ongoing requests by key
    // Key: "ip:port:type", Value: Promise
    this.activeRequests = new Map();

    // Retry settings
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.requestTimeout = 10000; // 10 seconds timeout

    // Subscribers list
    this.subscribers = [];

    // Request counter for debugging
    this.requestCount = 0;

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

    // If there's already a request in progress for this exact server, reuse it
    if (this.activeRequests.has(requestKey)) {
      this.logger.debug(`Reusing existing request for ${requestKey}`);
      return this.activeRequests.get(requestKey);
    }

    this.requestCount++;
    const currentRequestId = this.requestCount;
    this.logger.debug(`Starting new request #${currentRequestId} for ${requestKey}`);

    // Create new request promise
    const requestPromise = this._fetchServerData(config, currentRequestId)
      .finally(() => {
        // Remove from active map when done (success or failure)
        // Only remove if it's the SAME promise (though it should be for this key)
        if (this.activeRequests.get(requestKey) === requestPromise) {
          this.activeRequests.delete(requestKey);
        }
      });

    // Save to active requests map
    this.activeRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  /**
   * Fetch server data from the Minecraft server
   * @param {Object} config - Configuration object
   * @param {number} requestId - ID for debugging
   * @returns {Promise<Object>} Server data and online status
   */
  async _fetchServerData(config, requestId) {
    // 處理伺服器 IP，移除可能的協議前綴 (http://, https://)
    const serverIp = config.mcserver.ip.replace(/^https?:\/\//i, '');

    this.logger.debug(`Fetching data for ${serverIp}:${config.mcserver.port} (Request #${requestId})`);

    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        // Determine which API to use based on server type
        const statusFunction = config.mcserver.type === 'bedrock' ? statusBedrock : statusJava;

        // Call the appropriate status function with cleaned IP and timeout
        // Add timeout protection with AbortController pattern (simulated) or just Promise.race
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Connection timed out')), this.requestTimeout);
        });

        const fetchPromise = statusFunction(serverIp, config.mcserver.port);

        // Race between fetch and timeout
        const data = await Promise.race([fetchPromise, timeoutPromise])
          .finally(() => clearTimeout(timeoutHandle)); // Always clear timeout

        // Check if server is actually online based on returned data
        const isOnline = data && data.online !== false;

        // Prepare player list data
        const playerList = isOnline && data.players ? data.players : { online: 0, max: 0, list: [] };

        this.logger.debug(`Request #${requestId} result: ${isOnline ? 'Online' : 'Offline'}, Players: ${playerList.online}/${playerList.max}`);

        if (isOnline && playerList.list && playerList.list.length > 0) {
          // Truncate player list in logs if too long
          const names = playerList.list.map(p => p.name_clean || p.name || p);
          const logNames = names.length > 5 ? `${names.slice(0, 5).join(', ')}... (+${names.length - 5} more)` : names.join(', ');
          this.logger.debug(`Active players: ${logNames}`);
        }

        const result = {
          data,
          isOnline,
          playerList
        };

        // Notify subscribers
        this._notifySubscribers(result);

        return result;
      } catch (error) {
        // Check if this is a rate limit error
        if (error.message && error.message.includes('rate')) {
          retries++;

          // Exponential backoff
          const delay = this.baseDelay * Math.pow(2, retries - 1);

          // Log rate limit
          this.logger.warn(`Rate limited (Request #${requestId}), retrying in ${delay}ms (attempt ${retries}/${this.maxRetries})`);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Log other errors with reasonable detail
          if (error.message === 'Connection timed out') {
            this.logger.warn(`Request #${requestId} timed out after ${this.requestTimeout}ms`);
          } else {
            this.logger.error(`Failed to fetch server data (Request #${requestId}): ${error.message}`);
          }

          // Return offline status with error details
          const result = {
            data: null,
            isOnline: false,
            playerList: { online: 0, max: 0, list: [] },
            error: error.message || 'Unknown error' // Pass error message to caller
          };

          // Notify subscribers
          this._notifySubscribers(result);

          return result;
        }
      }
    }

    // If we've exhausted all retries
    this.logger.error(`Request #${requestId}: All retries failed for ${serverIp}:${config.mcserver.port}, returning offline status`);

    const result = {
      data: null,
      isOnline: false,
      playerList: { online: 0, max: 0, list: [] },
      error: 'Max retries exceeded' // Pass error message
    };

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
    // this.logger.debug(`New subscriber added, total: ${this.subscribers.length}`); // Too verbose

    // Return function to unsubscribe
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
      // this.logger.debug(`Subscriber removed, total: ${this.subscribers.length}`); // Too verbose
    };
  }

  /**
   * Notify all subscribers of data changes
   * @param {Object} data - The data to send to subscribers
   */
  _notifySubscribers(data) {
    if (this.subscribers.length > 0) {
      // this.logger.debug(`Notifying ${this.subscribers.length} subscribers`); // Too verbose
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