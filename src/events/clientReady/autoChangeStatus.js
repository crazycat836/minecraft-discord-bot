import chalk from 'chalk';
import { RESTJSONErrorCodes } from 'discord.js';
import config from '../../../config.js';
import {
  statusMessageEdit,
} from '../../index.js';
import logger from '../../utils/logger.js';
import { readData, updateData, getSite } from '../../utils/dataStore.js';

// Only a confirmed "it no longer exists" justifies dropping a record — any other
// failure is transient and must not wipe the config.
const GONE_ERROR_CODES = new Set([
  RESTJSONErrorCodes.UnknownChannel,
  RESTJSONErrorCodes.UnknownMessage
]);

export default async (client) => {
  logger.info('AutoChangeStatus: Initializing module');

  // Check if autoChangeStatus is enabled in config
  if (!config.autoChangeStatus || !config.autoChangeStatus.enabled) {
    logger.info('AutoChangeStatus: Module disabled in config');
    return;
  }

  // Validate guildID configuration and fetch guild
  try {
    if (!config.settings || !config.settings.guildID) {
      logger.warn('AutoChangeStatus: GuildID not set in config.settings');
      return;
    }

    const guild = client.guilds.cache.get(config.settings.guildID);
    if (!guild) {
      logger.error(`AutoChangeStatus: Guild with ID ${chalk.yellow(config.settings.guildID)} not found`);
      return;
    }

    logger.info(`AutoChangeStatus: Successfully connected to guild "${guild.name}" (${guild.id})`);
  } catch (error) {
    logger.error('AutoChangeStatus: Error validating guild configuration', error);
    return;
  }

  // Main function to update auto change status
  const autoChangeStatus = async () => {
    logger.debug('AutoChangeStatus: Starting update cycle');

    // Read fresh data every cycle to handle dynamic updates from commands
    let dataRead = await readData();
    logger.debug(`AutoChangeStatus: Found ${dataRead.autoChangeStatus?.length || 0} status messages to update`);

    try {
      // If the array is empty or invalid, there's nothing to update
      if (!dataRead.autoChangeStatus || !Array.isArray(dataRead.autoChangeStatus) || dataRead.autoChangeStatus.length === 0) {
        logger.debug('AutoChangeStatus: No status messages to update');
        return;
      }

      logger.debug(`AutoChangeStatus: Processing ${dataRead.autoChangeStatus.length} status messages`);

      // Track only the records Discord confirms are gone; everything else stays
      const goneMessageIds = new Set();

      for (const record of dataRead.autoChangeStatus) {
        const label = `${record.ip}:${record.port} in channel ${record.channelId}`;
        try {
          logger.debug(`AutoChangeStatus: Processing status message for server ${record.ip}:${record.port} (${record.type || 'java'}) in channel ${record.channelId}`);

          const channel = await client.channels.fetch(record.channelId);
          const message = await channel.messages.fetch(record.messageId);

          logger.debug(`AutoChangeStatus: Updating status for server ${record.ip}:${record.port} (${record.type || 'java'})`);

          // Update the status message content using the shared utility function
          await statusMessageEdit({
            ip: record.ip,
            port: record.port,
            type: record.type || 'java',
            name: dataRead.serverSettings?.name || record.name || record.ip,
            site: getSite(dataRead),
            message,
            isPlayerAvatarEmoji: record.isPlayerAvatarEmoji,
            client
          });

          logger.debug(`AutoChangeStatus: Status updated for server ${record.ip}:${record.port}`);
        } catch (error) {
          if (GONE_ERROR_CODES.has(error.code)) {
            logger.warn(`AutoChangeStatus: ${label} no longer exists — removing record`);
            goneMessageIds.add(record.messageId);
            continue;
          }
          // Transient failure (network, permissions, rate limit): keep the record so a
          // temporary error cannot wipe the server configuration.
          logger.error(`AutoChangeStatus: Failed to update ${label}, keeping record: ${error.message}`);
        }
      }

      // Only write when a record was actually removed, and filter the freshly read data
      // so a /setstatus that landed during the loop above is not overwritten
      if (goneMessageIds.size > 0) {
        logger.warn(`AutoChangeStatus: Removing ${goneMessageIds.size} record(s) whose message no longer exists`);
        try {
          await updateData((data) => {
            data.autoChangeStatus = (data.autoChangeStatus ?? []).filter(
              (record) => !goneMessageIds.has(record.messageId)
            );
          });
        } catch (error) {
          logger.error(`Error writing to data.json: ${error.message}`, error);
        }
      } else {
        logger.debug(`AutoChangeStatus: ${dataRead.autoChangeStatus.length} records updated`);
      }
    } catch (error) {
      logger.error(`Error in autoChangeStatus process: ${error.message}`, error);
    }
  };

  // Variable to track if autoChangeStatus is already running
  let isRunning = false;

  // Schedule autoChangeStatus to run at regular intervals
  const scheduleAutoChangeStatus = async () => {
    if (isRunning) {
      logger.debug('AutoChangeStatus: Update already in progress, skipping');
      return;
    }

    try {
      isRunning = true;
      logger.debug('AutoChangeStatus: Starting scheduled update');
      await autoChangeStatus();
      logger.debug('AutoChangeStatus: Scheduled update completed');
      isRunning = false;
    } catch (error) {
      isRunning = false;
      logger.error(`AutoChangeStatus: Error in scheduler`, error);
    }
  };

  try {
    // Initialize by ensuring data.json has valid structure
    logger.info('AutoChangeStatus: Starting initialization');
    const data = await readData();
    if (!data.autoChangeStatus) {
      await updateData((fresh) => {
        if (!fresh.autoChangeStatus) {
          fresh.autoChangeStatus = [];
        }
      });
    }

    // Run immediately and then on schedule
    logger.info('AutoChangeStatus: Running initial update');
    await scheduleAutoChangeStatus();

    // Set up interval for regular updates
    const updateIntervalSeconds = config.autoChangeStatus.updateInterval;
    logger.info(`AutoChangeStatus: Setting up update interval (${updateIntervalSeconds} seconds)`);
    setInterval(scheduleAutoChangeStatus, updateIntervalSeconds * 1000);

    logger.info('AutoChangeStatus: Module initialized successfully');
  } catch (error) {
    logger.error(`Failed to initialize autoChangeStatus: ${error.message}`, error);
  }
};
