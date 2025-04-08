import config from '../../../config.js';
import chalk from 'chalk';
import { ActivityType } from 'discord.js';
import serverDataManager from '../../services/serverDataManager.js';
import logger from '../../utils/logger.js';
import translationManager from '../../utils/translationManager.js';

// Define statusEmojis outside the function to avoid recreating it on every call
const statusEmojis = {
  online: '🟢',
  idle: '🌙',
  dnd: '⛔',
  invisible: '⚫',
};

export default async (client) => {
  // Destructure presence settings for easier usage
  const { presence } = config.bot;
  if (!presence.enabled) return;

  /**
   * Function to update the bot's presence based on the server status.
   */
  const updateBotStatus = async () => {
    try {
      // Get server data
      const result = await serverDataManager.getServerData(config);
      
      if (!result || !result.data) {
        const presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: translationManager.getText('bot-status', 'botStatus.offline'),
              type: ActivityType[presence.activity],
            },
          ],
        });
        return;
      }
      
      const { data, isOnline } = result;
      
      // Determine the presence details based on whether the server is online or offline
      let presenceData;
      if (isOnline) {
        // Get translation with player data
        const statusText = translationManager.getText('bot-status', 'botStatus.online', {
          playeronline: data.players.online,
          playermax: data.players.max
        });

        presenceData = await client.user.setPresence({
          status: presence.status.online,
          activities: [
            {
              name: statusText,
              type: ActivityType[presence.activity],
            },
          ],
        });
      } else {
        presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: translationManager.getText('bot-status', 'botStatus.offline'),
              type: ActivityType[presence.activity],
            },
          ],
        });
      }
    } catch (error) {
      logger.error(`BotStatus: Error updating presence`, error);
      // Set a default offline status in case of error
      try {
        await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: translationManager.getText('bot-status', 'botStatus.offline'),
              type: ActivityType[presence.activity],
            },
          ],
        });
      } catch (presenceError) {
        logger.error('BotStatus: Failed to set fallback presence', presenceError);
      }
    }
  };

  // Initial status update
  await updateBotStatus();
  
  // Set up periodic updates
  const updateInterval = Math.max(60, parseInt(process.env.UPDATE_INTERVAL) || 60) * 1000;
  setInterval(() => updateBotStatus(), updateInterval);
};