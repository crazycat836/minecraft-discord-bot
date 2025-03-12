import config from '../../../config.js';
import chalk from 'chalk';
import { ActivityType } from 'discord.js';
import serverDataManager from '../../services/serverDataManager.js';
import fs from 'fs';
import json5 from 'json5';
import logger from '../../utils/logger.js';

// Define statusEmojis outside the function to avoid recreating it on every call
const statusEmojis = {
  online: '🟢',
  idle: '🌙',
  dnd: '⛔',
  invisible: '⚫',
};

// Load bot status translations
const loadBotStatusTranslations = () => {
  try {
    const languageMain = config.settings.language.main || 'en';
    const botStatusFileContent = fs.readFileSync(`./translation/${languageMain}/bot-status.json5`, 'utf8');
    return json5.parse(botStatusFileContent);
  } catch (error) {
    logger.error('BotStatus: Failed to load translations, using English fallback');
    try {
      const botStatusFileContent = fs.readFileSync('./translation/en/bot-status.json5', 'utf8');
      return json5.parse(botStatusFileContent);
    } catch (fallbackError) {
      logger.error('BotStatus: Failed to load fallback translations', fallbackError);
      // Return default values if even fallback fails
      return {
        botStatus: {
          online: 'Playing with {playeronline}/{playermax} players',
          offline: 'Server is offline'
        }
      };
    }
  }
};

export default async (client) => {
  // Destructure presence settings for easier usage
  const { presence } = config.bot;
  if (!presence.enabled) return;

  // Load translations
  const botStatusTranslation = loadBotStatusTranslations();

  /**
   * Helper function to log the bot's presence debug info.
   * @param {Object} presenceData - The presence data returned from setPresence.
   * @param {Function} colorFn - Chalk color function (e.g., chalk.green or chalk.red).
   */
  const logPresenceDebug = (presenceData, colorFn) => {
    const statusText = presenceData.activities[0]?.name || 'No activity';
    logger.debug(`BotStatus: Updated to "${statusText}"`);
  };

  /**
   * Function to update the bot's presence based on the server status.
   */
  const updateBotStatus = async () => {
    logger.debug('BotStatus: Updating presence');

    try {
      // Get server data
      const result = await serverDataManager.getServerData(config);
      logger.info(`BotStatus: Server data fetched, isOnline=${result?.isOnline}`);
      
      if (!result || !result.data) {
        logger.error('BotStatus: Failed to get server data, setting offline status');
        const presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: botStatusTranslation.botStatus.offline,
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
        const statusText = botStatusTranslation.botStatus.online
          .replace(/{playeronline}/g, data.players.online)
          .replace(/{playermax}/g, data.players.max);
        
        logger.info(`BotStatus: Setting online status "${statusText}"`);

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
        logger.info(`BotStatus: Setting offline status "${botStatusTranslation.botStatus.offline}"`);
        presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: botStatusTranslation.botStatus.offline,
              type: ActivityType[presence.activity],
            },
          ],
        });
        // Log debug info using red color for offline status
        logPresenceDebug(presenceData, chalk.red);
      }
    } catch (error) {
      logger.error(`BotStatus: Error updating presence`, error);
      // Set a default offline status in case of error
      try {
        await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: botStatusTranslation.botStatus.offline,
              type: ActivityType[presence.activity],
            },
          ],
        });
      } catch (presenceError) {
        // If even setting the presence fails, just log it and continue
        logger.error('BotStatus: Failed to set fallback presence', presenceError);
      }
    }
  };

  // Initial status update
  await updateBotStatus();
  
  // Set serverDataManager cache expiry time to match update interval
  const updateInterval = Math.max(60, parseInt(process.env.UPDATE_INTERVAL) || 60) * 1000;
  serverDataManager.setCacheExpiry(updateInterval * 1000 * 0.9);
  
  // Set up periodic updates
  setInterval(() => updateBotStatus(), updateInterval * 1000);
  
  // No longer using subscription mechanism to avoid duplicate updates
};