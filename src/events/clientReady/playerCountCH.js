import { PermissionFlagsBits } from 'discord.js';
import config from '../../../config.js';
import serverDataManager from '../../services/serverDataManager.js';
import logger from '../../utils/logger.js';
import languageService from '../../services/languageService.js';
import { readData, writeData, updateData, getServerConfig } from '../../utils/dataStore.js';

export default async (client) => {
  logger.info('PlayerCount: Initializing player count channel module');

  // Function to update player count channel
  // This updates the name of a voice/text channel to specific formats (e.g., "🟢 Online: 5/20")
  async function playerCountUpdate(channelId) {
    try {
      if (!channelId) {
        logger.error('PlayerCount: Channel ID is undefined');
        return;
      }

      logger.debug(`PlayerCount: Updating player count for channel ${channelId}`);

      // Fetch the channel
      const channel = await client.channels.fetch(channelId).catch(error => {
        logger.error(`PlayerCount: Channel ${channelId} not found`, error);
        return null;
      });

      if (!channel) {
        logger.warn(`PlayerCount: Could not find channel with ID ${channelId}`);
        return;
      }

      logger.debug(`PlayerCount: Successfully found channel "${channel.name}" (${channel.id})`);

      // Check if bot has manage channel permissions
      if (channel.guild && channel.permissionsFor) {
        const botPermissions = channel.permissionsFor(client.user);
        const canManageChannel = botPermissions.has(PermissionFlagsBits.ManageChannels);

        if (!canManageChannel) {
          logger.error(`PlayerCount: ERROR - Bot does not have permission to manage channel "${channel.name}"`);
          return;
        }
      }

      // Get the latest server configuration from data.json
      const serverConfig = (await getServerConfig()) || { ...config };

      // Check if server is actually configured (has IP)
      let statusName;
      if (!serverConfig.mcserver.ip || serverConfig.mcserver.ip === '') {
        statusName = languageService.getText('bot-status', 'playerCount.notConfigured');
        logger.debug(`PlayerCount: Server not configured (no IP)`);
      } else {
        logger.debug(`PlayerCount: Checking status for ${serverConfig.mcserver.ip}:${serverConfig.mcserver.port}`);
        const result = await serverDataManager.getServerData(serverConfig);

        if (result && result.isOnline) {
          const { data } = result;
          const translationTemplate = languageService.getText('bot-status', 'playerCount.online', {
            playeronline: data.players.online,
            playermax: data.players.max
          });

          // Make sure variables are actually replaced
          statusName = translationTemplate
            .replace(/{playeronline}/g, data.players.online)
            .replace(/{playermax}/g, data.players.max);

          logger.debug(`PlayerCount: Server online with ${data.players.online}/${data.players.max} players`);
          logger.debug(`PlayerCount: Generated status name: "${statusName}"`);

          if (statusName.includes('{playeronline}') || statusName.includes('{playermax}')) {
            logger.warn('PlayerCount: Variables not replaced in the status name, using direct format');
            statusName = `🟢 ${data.players.online}/${data.players.max}`;
          }
        } else if (result && result.error) {
          statusName = languageService.getText('bot-status', 'playerCount.error');
          logger.debug(`PlayerCount: Server error: ${result.error}`);
        } else {
          statusName = languageService.getText('bot-status', 'playerCount.offline');
          logger.debug(`PlayerCount: Server offline`);
        }
      }

      // Only update if the name has changed to avoid hitting rate limits
      // Discord channel rename rate limit is 2 per 10 minutes per channel
      if (channel.name !== statusName) {
        logger.info(`PlayerCount: Updating channel name from "${channel.name}" to "${statusName}"`);
        try {
          await channel.setName(statusName);
          logger.info(`PlayerCount: Successfully updated channel name to "${statusName}"`);
        } catch (error) {
          logger.error(`PlayerCount: Discord API error updating channel name: ${error.message}`, error);
          if (error.code === 30000) {
            logger.warn('PlayerCount: Rate limit hit for channel rename - Discord limits channel name changes to 2 per 10 minutes');
          }
        }
      } else {
        logger.debug(`PlayerCount: Channel name already up to date (${statusName})`);
      }
    } catch (fetchError) {
      logger.error(`PlayerCount: Error fetching channel`, fetchError);
    }
  }

  try {
    // Main function to update player count channel
    async function updatePlayerCount() {
      try {
        const channelIdToUse = config.playerCountCH.channelId;
        logger.debug(`PlayerCount: Starting update cycle for channel ${channelIdToUse}`);
        await playerCountUpdate(channelIdToUse);
      } catch (error) {
        logger.error(`PlayerCount: Error updating channel`, error);
      }
    }

    // Check if player count channel feature is enabled
    if (!config.playerCountCH || !config.playerCountCH.enabled) {
      logger.info('PlayerCount: Feature disabled in config');
      return;
    }

    logger.info('PlayerCount: Feature enabled, starting initialization');

    // Initialize data.json structure if needed
    let dataIDS = await readData();

    if (!dataIDS.playerCountStats || typeof dataIDS.playerCountStats !== 'object') {
      logger.info('PlayerCount: Initializing playerCountStats in data.json');
      dataIDS.playerCountStats = {
        channelId: config.playerCountCH.channelId,
        lastUpdate: Date.now()
      };
    } else {
      logger.debug('PlayerCount: Found existing playerCountStats in data.json');
    }

    if (!dataIDS.autoChangeStatus) {
      logger.debug('PlayerCount: Initializing autoChangeStatus array in data.json');
      dataIDS.autoChangeStatus = [];
    }

    await writeData(dataIDS);

    // Update player count immediately
    logger.info('PlayerCount: Running initial update');
    await updatePlayerCount();

    // Set up interval for regular updates
    const updateIntervalSeconds = config.playerCountCH.updateInterval;
    logger.debug(`PlayerCount: Setting up update interval (${updateIntervalSeconds} seconds)`);

    setInterval(async () => {
      try {
        logger.debug('PlayerCount: Starting scheduled update');
        await updatePlayerCount();

        // Update last update time in data.json
        await updateData(data => {
          if (!data.playerCountStats || typeof data.playerCountStats !== 'object') {
            data.playerCountStats = {
              channelId: config.playerCountCH.channelId,
              lastUpdate: Date.now()
            };
          } else {
            data.playerCountStats.lastUpdate = Date.now();
          }
          logger.debug('PlayerCount: Updated lastUpdate timestamp');
        });
      } catch (error) {
        logger.error(`PlayerCount: Error in player count update interval: ${error.message}`, error);
      }
    }, updateIntervalSeconds * 1000);

    logger.info('PlayerCount: Module initialized successfully');
  } catch (error) {
    logger.error(`PlayerCount: Failed to initialize: ${error.message}`, error);
  }
};
