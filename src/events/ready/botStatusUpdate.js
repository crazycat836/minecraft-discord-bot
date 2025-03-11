import config from '../../../config.js';
import { consoleLogTranslation, getDebug, getError } from '../../index.js';
import chalk from 'chalk';
import { ActivityType } from 'discord.js';
import serverDataManager from '../../services/serverDataManager.js';

// Define statusEmojis outside the function to avoid recreating it on every call
const statusEmojis = {
  online: '🟢',
  idle: '🌙',
  dnd: '⛔',
  invisible: '⚫',
};

export default (client) => {
  // Destructure presence settings for easier usage
  const { presence } = config.bot;
  if (!presence.enabled) return;

  /**
   * Helper function to log the bot's presence debug info.
   * @param {Object} presenceData - The presence data returned from setPresence.
   * @param {Function} colorFn - Chalk color function (e.g., chalk.green or chalk.red).
   */
  const logPresenceDebug = (presenceData, colorFn) => {
    if (presenceData.activities.length > 0) {
      presenceData.activities.forEach((activity) => {
        const statusEmoji = statusEmojis[presenceData.status] || '';
        // Use English format directly instead of translation
        const statusText = `${statusEmoji} ${presenceData.status.toUpperCase()} ${ActivityType[activity.type]} ${activity.name}`;
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | Bot status updated to: ${colorFn(statusText)}`);
      });
    }
  };

  /**
   * Function to update the bot's presence based on the server status.
   */
  const botStatusUpdate = async () => {
    try {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | Updating bot status`);
      
      // 使用 serverDataManager 獲取伺服器數據
      const result = await serverDataManager.getServerData(config);
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Server data fetched, isOnline=${result?.isOnline}`);
      
      // 如果無法獲取數據，設置離線狀態
      if (!result || !result.data) {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Failed to get server data, setting offline status`);
        const presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: presence.text.offline,
              type: ActivityType[presence.activity],
            },
          ],
        });
        logPresenceDebug(presenceData, chalk.red);
        return;
      }
      
      const { data, isOnline } = result;
      
      // Determine the presence details based on whether the server is online or offline
      let presenceData;
      if (isOnline) {
        // Replace placeholders in the online status text with real-time data
        const statusText = presence.text.online
          .replace(/{playeronline}/g, data.players.online)
          .replace(/{playermax}/g, data.players.max);
        
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Setting online status: ${statusText}`);

        presenceData = await client.user.setPresence({
          status: presence.status.online,
          activities: [
            {
              name: statusText,
              type: ActivityType[presence.activity],
            },
          ],
        });
        // Log debug info using green color for online status
        logPresenceDebug(presenceData, chalk.green);
      } else {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Setting offline status: ${presence.text.offline}`);
        presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: presence.text.offline,
              type: ActivityType[presence.activity],
            },
          ],
        });
        // Log debug info using red color for offline status
        logPresenceDebug(presenceData, chalk.red);
      }
    } catch (error) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error updating bot status: ${error.message}`);
      getError(error, 'botStatusUpdate');
      // Set a default offline status in case of error
      try {
        await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: presence.text.offline,
              type: ActivityType[presence.activity],
            },
          ],
        });
      } catch (presenceError) {
        // If even setting the presence fails, just log it and continue
        console.error('Failed to set fallback presence:', presenceError);
      }
    }
  };

  // Initial status update
  botStatusUpdate();
  
  // 設置 serverDataManager 的緩存過期時間與更新間隔相同
  const updateInterval = Math.max(60, parseInt(process.env.UPDATE_INTERVAL) || 60) * 1000;
  serverDataManager.setCacheExpiry(updateInterval);
  
  // 設置定時更新
  setInterval(botStatusUpdate, updateInterval);
  
  // 不再使用訂閱機制，避免重複更新
  // serverDataManager.subscribe((data) => {
  //   // 當數據更新時自動更新機器人狀態
  //   botStatusUpdate();
  // });
};