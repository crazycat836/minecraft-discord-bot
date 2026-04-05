import config from '../../../config.js';
import { ActivityType } from 'discord.js';
import serverDataManager from '../../services/serverDataManager.js';
import logger from '../../utils/logger.js';
import i18n from '../../utils/i18n.js';
import { getServerConfig } from '../../utils/dataStore.js';

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
      // Get the latest server configuration from data.json
      const serverConfig = await getServerConfig();

      if (!serverConfig) {
        logger.debug('BotStatus: No server configured in data.json (autoChangeStatus is empty). Skipping status update.');
        await client.user.setPresence({
          status: presence.status.idle,
          activities: [{ name: i18n.getText('bot-status', 'botStatus.notConfigured'), type: ActivityType.Custom }]
        });
        return;
      }

      // Get server data using the configuration from data.json
      logger.debug(`BotStatus: Checking status for ${serverConfig.mcserver.ip}:${serverConfig.mcserver.port}`);
      const result = await serverDataManager.getServerData(serverConfig);

      // If server data is invalid or null, set offline status
      if (!result || !result.data) {
        const presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              // Use offline translation
              name: i18n.getText('bot-status', 'botStatus.offline'),
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
        // Get translation with player data (e.g. "Playing with 5/20 players")
        const statusText = i18n.getText('bot-status', 'botStatus.online', {
          playeronline: data.players.online,
          playermax: data.players.max
        });

        // Make sure variables are actually replaced
        const finalStatusText = statusText
          .replace(/{playeronline}/g, data.players.online)
          .replace(/{playermax}/g, data.players.max);

        logger.debug(`BotStatus: Generated status text: "${finalStatusText}"`);

        // Update Discord presence
        presenceData = await client.user.setPresence({
          status: presence.status.online,
          activities: [
            {
              name: finalStatusText,
              type: ActivityType[presence.activity],
            },
          ],
        });
      } else {
        // Server is technically "online" (responds to ping?) but result.isOnline is false?
        // Actually, logic above handles null result. This block handles "valid response but offline".
        presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: i18n.getText('bot-status', 'botStatus.offline'),
              type: ActivityType[presence.activity],
            },
          ],
        });
      }
    } catch (error) {
      logger.error(`BotStatus: Error updating presence`, error);
      // Set a default offline status in case of error (fallback)
      try {
        await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: i18n.getText('bot-status', 'botStatus.offline'),
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
  const updateInterval = config.autoChangeStatus.updateInterval * 1000;
  setInterval(async () => {
    try {
      logger.debug('BotStatus: Starting scheduled update');
      await updateBotStatus();
    } catch (error) {
      logger.error('BotStatus: Unhandled error in scheduled update', error);
    }
  }, updateInterval);
};