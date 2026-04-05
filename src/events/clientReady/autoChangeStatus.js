import chalk from 'chalk';
import config from '../../../config.js';
import {
  statusMessageEdit,
} from '../../index.js';
import logger from '../../utils/logger.js';
import { readData, writeData } from '../../utils/dataStore.js';

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

      // Filter out invalid records and process valid ones
      const validRecords = [];

      for (const record of dataRead.autoChangeStatus) {
        try {
          logger.debug(`AutoChangeStatus: Processing status message for server ${record.ip}:${record.port} (${record.type || 'java'}) in channel ${record.channelId}`);

          // Fetch the channel where the status message is located
          const channel = await client.channels.fetch(record.channelId).catch(error => {
            logger.error(`Failed to fetch channel ${record.channelId}: ${error.message}`);
            return null;
          });

          if (!channel) {
            logger.warn(`AutoChangeStatus: Channel ${record.channelId} not found — removing stale record for ${record.ip}:${record.port}`);
            continue;
          }

          // Fetch the status message itself
          const message = await channel.messages.fetch(record.messageId).catch(error => {
            logger.error(`Failed to fetch message ${record.messageId}: ${error.message}`);
            return null;
          });

          if (!message) {
            logger.warn(`AutoChangeStatus: Message ${record.messageId} in channel ${record.channelId} not found — removing stale record for ${record.ip}:${record.port}`);
            continue;
          }

          logger.debug(`AutoChangeStatus: Updating status for server ${record.ip}:${record.port} (${record.type || 'java'})`);

          // Update the status message content using the shared utility function
          await statusMessageEdit(
            record.ip,
            record.port,
            record.type || 'java',
            dataRead.serverSettings?.name || record.name || record.ip,
            message,
            record.isPlayerAvatarEmoji,
            client
          );

          logger.debug(`AutoChangeStatus: Status updated for server ${record.ip}:${record.port}`);
          validRecords.push(record);
        } catch (error) {
          logger.error(`Error processing record: ${error.message}`, error);
        }
      }

      // Update data.json with strictly valid records (removes stale messages)
      try {
        const removedCount = dataRead.autoChangeStatus.length - validRecords.length;
        if (validRecords.length === 0) {
          dataRead.autoChangeStatus = [];
          logger.warn('AutoChangeStatus: All records were invalid or removed, clearing autoChangeStatus array');
        } else {
          dataRead.autoChangeStatus = validRecords;
          if (removedCount > 0) {
            logger.warn(`AutoChangeStatus: Removed ${removedCount} stale record(s), ${validRecords.length} remaining`);
          } else {
            logger.debug(`AutoChangeStatus: ${validRecords.length} valid records updated`);
          }
        }

        await writeData(dataRead);
        logger.debug('AutoChangeStatus: data.json updated with valid records');
      } catch (error) {
        logger.error(`Error writing to data.json: ${error.message}`, error);
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
      data.autoChangeStatus = [];
      await writeData(data);
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
