import { PermissionFlagsBits } from 'discord.js';
import config from '../../../config.js';
import serverDataManager from '../../services/serverDataManager.js';
import logger from '../../utils/logger.js';
import languageService from '../../services/languageService.js';
import { readData, updateData, getServerConfig } from '../../utils/dataStore.js';

export default async (client) => {
  logger.info('PlayerCount: Initializing player count channel module');

  let renameInFlight = false;

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
      const serverConfig = await getServerConfig();

      let statusName;
      if (!serverConfig) {
        statusName = languageService.getText('bot-status', 'playerCount.notConfigured');
        logger.debug('PlayerCount: No server configured in data.json');
      } else {
        logger.debug(`PlayerCount: Checking status for ${serverConfig.mcserver.ip}:${serverConfig.mcserver.port}`);
        const result = await serverDataManager.getServerData(serverConfig);

        if (result && result.isOnline) {
          const { data } = result;
          const translationTemplate = languageService.getText('bot-status', 'playerCount.online', {
            playeronline: data.players.online,
            playermax: data.players.max
          });

          statusName = translationTemplate;

          logger.debug(`PlayerCount: Server online with ${data.players.online}/${data.players.max} players`);
          logger.debug(`PlayerCount: Generated status name: "${statusName}"`);
        } else if (result && result.error) {
          statusName = languageService.getText('bot-status', 'playerCount.error');
          logger.debug(`PlayerCount: Server error: ${result.error}`);
        } else {
          statusName = languageService.getText('bot-status', 'playerCount.offline');
          logger.debug(`PlayerCount: Server offline`);
        }
      }

      // Discord allows 2 renames per 10 minutes per channel. When the limit is hit,
      // discord.js does not throw — setName() silently waits (up to ~10 minutes).
      // Meanwhile channel.name still holds the old value, so without this guard every
      // cycle queues another rename and the channel falls further and further behind
      // the real status. Allow only one rename at a time; the cycle after it finishes
      // re-checks the server and renames again if the status changed in between.
      if (renameInFlight) {
        logger.debug(`PlayerCount: Rename still waiting on Discord rate limit, skipping this cycle (wanted "${statusName}")`);
      } else if (channel.name !== statusName) {
        logger.info(`PlayerCount: Updating channel name from "${channel.name}" to "${statusName}"`);
        renameInFlight = true;
        try {
          await channel.setName(statusName);
          logger.info(`PlayerCount: Successfully updated channel name to "${statusName}"`);
        } catch (error) {
          logger.error(`PlayerCount: Discord API error updating channel name: ${error.message}`, error);
        } finally {
          renameInFlight = false;
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

    // Initialize data.json structure only when something is actually missing,
    // so a normal boot does not rewrite the file
    const existing = await readData();
    const needsInit =
      !existing.playerCountStats ||
      typeof existing.playerCountStats !== 'object' ||
      !existing.autoChangeStatus;

    if (needsInit) {
      await updateData((data) => {
        if (!data.playerCountStats || typeof data.playerCountStats !== 'object') {
          logger.info('PlayerCount: Initializing playerCountStats in data.json');
          data.playerCountStats = {
            channelId: config.playerCountCH.channelId,
            lastUpdate: Date.now()
          };
        }

        if (!data.autoChangeStatus) {
          logger.debug('PlayerCount: Initializing autoChangeStatus array in data.json');
          data.autoChangeStatus = [];
        }
      });
    } else {
      logger.debug('PlayerCount: Found existing playerCountStats in data.json');
    }

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
