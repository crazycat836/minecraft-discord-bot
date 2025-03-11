import { statusBedrock, statusJava } from 'node-mcstatus';
import chalk from 'chalk';

/**
 * ServerDataManager - 集中管理 Minecraft 伺服器狀態數據
 * 實現請求合併、數據緩存和訂閱機制
 */
class ServerDataManager {
  constructor() {
    // 緩存的數據
    this.cache = {
      data: null,
      isOnline: false,
      playerList: [],
      lastUpdated: 0
    };
    
    // 當前正在進行的請求
    this.pendingRequest = null;
    
    // 緩存過期時間（毫秒）
    this.cacheExpiry = 30000; // 30 秒
    
    // 重試設置
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 秒
    
    // 訂閱者列表
    this.subscribers = [];
    
    // 請求計數器（用於調試）
    this.requestCount = 0;
  }
  
  /**
   * 獲取伺服器數據，如果緩存有效則使用緩存
   * @param {Object} config - 配置對象
   * @param {boolean} forceRefresh - 是否強制刷新緩存
   * @returns {Promise<Object>} - 伺服器數據
   */
  async getServerData(config, forceRefresh = false) {
    const now = Date.now();
    
    // 如果緩存有效且不強制刷新，直接返回緩存
    if (!forceRefresh && this.cache.data && (now - this.cache.lastUpdated) < this.cacheExpiry) {
      return {
        data: this.cache.data,
        isOnline: this.cache.isOnline,
        playerList: this.cache.playerList
      };
    }
    
    // 如果已經有一個請求在進行中，等待該請求完成
    if (this.pendingRequest) {
      return this.pendingRequest;
    }
    
    // 創建新的請求
    this.pendingRequest = this._fetchServerData(config);
    
    try {
      const result = await this.pendingRequest;
      return result;
    } finally {
      // 請求完成後清除 pendingRequest
      this.pendingRequest = null;
    }
  }
  
  /**
   * 實際獲取伺服器數據的方法（帶重試邏輯）
   * @private
   * @param {Object} config - 配置對象
   * @returns {Promise<Object>} - 伺服器數據
   */
  async _fetchServerData(config) {
    let retries = 0;
    
    while (retries <= this.maxRetries) {
      try {
        this.requestCount++;
        console.log(`${this._getDateNow()} | ${chalk.blue('INFO')} | Fetching server data (request #${this.requestCount}) for ${config.mcserver.ip}:${config.mcserver.port}`);
        
        const data = config.mcserver.type === 'java'
          ? await statusJava(config.mcserver.ip, config.mcserver.port)
          : await statusBedrock(config.mcserver.ip, config.mcserver.port);
        
        // 檢查 config.autoChangeStatus 是否存在
        const isOnlineCheck = config.autoChangeStatus && config.autoChangeStatus.isOnlineCheck;
        const isOnline = isOnlineCheck 
          ? data.online && data.players.max > 0 
          : data.online;
        
        console.log(`${this._getDateNow()} | ${chalk.green('SUCCESS')} | Server ${config.mcserver.ip}:${config.mcserver.port} is ${isOnline ? 'online' : 'offline'}`);
        
        // 更新緩存
        this.cache = {
          data,
          isOnline,
          playerList: isOnline ? data.players : { online: 0, max: 0, list: [] },
          lastUpdated: Date.now()
        };
        
        // 通知訂閱者
        this._notifySubscribers();
        
        return {
          data,
          isOnline,
          playerList: this.cache.playerList
        };
      } catch (error) {
        // 如果是 "Too Many Requests" 錯誤且還有重試次數，則等待後重試
        if (error.message === 'Too Many Requests' && retries < this.maxRetries) {
          retries++;
          const delay = this.baseDelay * Math.pow(2, retries);
          console.log(`${this._getDateNow()} | ${chalk.yellow('WARN')} | Rate limited, retrying in ${delay}ms (attempt ${retries}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // 其他錯誤或重試次數用完，則拋出錯誤
          console.log(`${this._getDateNow()} | ${chalk.red('ERROR')} | Failed to fetch server data for ${config.mcserver.ip}:${config.mcserver.port}: ${error.message}`);
          throw error;
        }
      }
    }
    
    // 如果所有重試都失敗，返回離線狀態
    console.log(`${this._getDateNow()} | ${chalk.red('ERROR')} | All retries failed for ${config.mcserver.ip}:${config.mcserver.port}, returning offline status`);
    return {
      data: { online: false, players: { online: 0, max: 0, list: [] } },
      isOnline: false,
      playerList: { online: 0, max: 0, list: [] }
    };
  }
  
  /**
   * 訂閱數據更新
   * @param {Function} callback - 當數據更新時調用的回調函數
   * @returns {Function} - 取消訂閱的函數
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // 返回取消訂閱的函數
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  /**
   * 通知所有訂閱者數據已更新
   * @private
   */
  _notifySubscribers() {
    for (const subscriber of this.subscribers) {
      try {
        subscriber({
          data: this.cache.data,
          isOnline: this.cache.isOnline,
          playerList: this.cache.playerList
        });
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    }
  }
  
  /**
   * 獲取當前日期時間字符串
   * @private
   * @returns {string} - 格式化的日期時間字符串
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
   * 設置緩存過期時間
   * @param {number} milliseconds - 緩存過期時間（毫秒）
   */
  setCacheExpiry(milliseconds) {
    this.cacheExpiry = milliseconds;
  }
  
  /**
   * 手動清除緩存
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

// 創建單例實例
const serverDataManager = new ServerDataManager();

export default serverDataManager; 