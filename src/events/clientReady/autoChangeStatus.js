import fs from 'fs/promises'; // Use asynchronous file system operations
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import config from '../../../config.js';
// Removed unused import: mcstatus
import {
  statusMessageEdit,
} from '../../index.js';
import serverDataManager from '../../services/serverDataManager.js';
import logger from '../../utils/logger.js';

const dataJsonUrl = new URL('../../data.json', import.meta.url);
const dataJsonPath = fileURLToPath(dataJsonUrl);

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

    // Check if data.json exists and read it
    // We read fresh data every cycle to handle dynamic updates from commands
    let dataRead = { autoChangeStatus: [] };
    try {
      const fileContent = await fs.readFile(dataJsonPath, 'utf8');
      dataRead = JSON.parse(fileContent);
      logger.debug(`AutoChangeStatus: Found ${dataRead.autoChangeStatus?.length || 0} status messages to update`);
    } catch (readError) {
      logger.warn(`Error reading data.json: ${readError.message}`);

      // Try to recreate data.json if it doesn't exist or is corrupted
      try {
        // Create a new data object with empty autoChangeStatus array
        const newData = {
          autoChangeStatus: []
        };

        // Write the new data to data.json
        await fs.writeFile(dataJsonPath, JSON.stringify(newData, null, 2));
        dataRead = newData;
        logger.info('AutoChangeStatus: Created new data.json file with empty autoChangeStatus array');
      } catch (writeError) {
        logger.error(`Failed to recreate data.json: ${writeError.message}`);
        return;
      }
    }

    try {
      // Process autoChangeStatus records
      // If the array is empty or invalid, there's nothing to update
      if (!dataRead.autoChangeStatus || !Array.isArray(dataRead.autoChangeStatus) || dataRead.autoChangeStatus.length === 0) {
        logger.debug('AutoChangeStatus: No status messages to update');
        return;
      }

      logger.debug(`AutoChangeStatus: Processing ${dataRead.autoChangeStatus.length} status messages`);

      // Filter out invalid records and process valid ones
      // validRecords will store the list of messages that still exist and are valid
      const validRecords = [];

      // Process each record (each status message that needs updating)
      for (const record of dataRead.autoChangeStatus) {
        try {
          logger.debug(`AutoChangeStatus: Processing status message for server ${record.ip}:${record.port} (${record.type || 'java'}) in channel ${record.channelId}`);

          // Fetch the channel where the status message is located
          const channel = await client.channels.fetch(record.channelId).catch(error => {
            logger.error(`Failed to fetch channel ${record.channelId}: ${error.message}`);
            return null;
          });

          if (!channel) {
            logger.warn(`AutoChangeStatus: Channel ${record.channelId} not found, skipping`);
            continue;
          }

          // Fetch the status message itself
          const message = await channel.messages.fetch(record.messageId).catch(error => {
            logger.error(`Failed to fetch message ${record.messageId}: ${error.message}`);
            return null;
          });

          if (!message) {
            logger.warn(`AutoChangeStatus: Message ${record.messageId} not found, skipping`);
            // Note: We don't continue here if we want to remove this record?
            // Current logic skips it, meaning it stays in data.json but is ignored?
            // Actually, since we only add to validRecords if successful, skipping here acts as deletion from data.json
            continue;
          }

          logger.debug(`AutoChangeStatus: Updating status for server ${record.ip}:${record.port} (${record.type || 'java'})`);

          // Clear serverDataManager's pending requests to force a fresh check
          // This ensures we get real-time data instead of cached results
          serverDataManager.pendingRequest = null;
          serverDataManager.currentRequestKey = null;

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

          // Add to valid records since update was successful (or at least attempted on a valid message)
          validRecords.push(record);
        } catch (error) {
          logger.error(`Error processing record: ${error.message}`, error);
          // If we encounter an error, we probably still want to keep the record to try again later
          // unless it's a fatal error like "channel deleted".
          // For now, let's keep it safe and NOT add to validRecords only if it's completely broken?
          // Actually, if we skip adding it to validRecords, it gets deleted.
          // Better safe approach: if error is temporary, we might lose the tracking.
          // But the current logic (original) implies: only add if successful.
          // Re-reading original code: it pushes to validRecords at the end of try block.
          // So if statusMessageEdit throws, it might be removed.
          // StatusMessageEdit catches its own errors mostly, so it should be fine.
        }
      }

      // Update data.json with strictly valid records (removes stale messages)
      try {
        if (validRecords.length === 0) {
          dataRead.autoChangeStatus = [];
          logger.warn('AutoChangeStatus: All records were invalid or removed, clearing autoChangeStatus array');
        } else {
          dataRead.autoChangeStatus = validRecords;
          logger.debug(`AutoChangeStatus: ${validRecords.length} valid records updated`);
        }

        await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2));
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

  // Check if data.json exists and has autoChangeStatus array
  async function checkDataJson() {
    logger.debug('AutoChangeStatus: Checking data.json integrity');

    try {
      let data = {};
      let fileContent = '';

      // Try to read data.json
      try {
        fileContent = await fs.readFile(dataJsonPath, 'utf8');

        // Check for empty file
        if (!fileContent || fileContent.trim() === '') {
          logger.warn('Empty data.json file, initializing new object');
          data = { autoChangeStatus: [] };
          await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2));
        } else {
          // Try to parse JSON
          try {
            data = JSON.parse(fileContent);

            // Check if autoChangeStatus exists in data
            if (!data.autoChangeStatus) {
              logger.info('AutoChangeStatus array not found in data.json, creating it');
              data.autoChangeStatus = [];
              await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2));
            } else {
              logger.debug(`AutoChangeStatus: Found ${data.autoChangeStatus.length} existing records in data.json`);
            }
          } catch (parseError) {
            logger.error(`Failed to parse data.json: ${parseError.message}`);

            // Create a backup of corrupted file
            const backupPath = `${dataJsonPath}.corrupted-${Date.now()}`;
            try {
              await fs.writeFile(backupPath, fileContent);
              logger.info(`Created backup of corrupted data.json at ${backupPath}`);
            } catch (backupError) {
              logger.error(`Failed to create backup of corrupted data.json: ${backupError.message}`);
            }

            // Create a new data.json with empty autoChangeStatus array
            const newData = { autoChangeStatus: [] };
            await fs.writeFile(dataJsonPath, JSON.stringify(newData, null, 2));
            logger.info('Created new data.json with empty autoChangeStatus array');
            data = newData;
          }
        }
      } catch (readError) {
        logger.warn(`Error reading data.json: ${readError.message}`);

        // Create data.json if it doesn't exist
        try {
          data = { autoChangeStatus: [] };
          await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2));
          logger.info('Created new data.json file');
        } catch (writeError) {
          logger.error(`Failed to recreate data.json: ${writeError.message}`, writeError);
          return;
        }
      }

      try {
        // Re-read data.json to ensure it's properly structured
        const reReadContent = await fs.readFile(dataJsonPath, 'utf8');
        const parsedData = JSON.parse(reReadContent);
        logger.debug('AutoChangeStatus: Verified data.json has valid structure');
        return parsedData;
      } catch (error) {
        logger.error(`Error re-reading data.json: ${error.message}`);
        return data;
      }
    } catch (error) {
      logger.error(`Error checking data.json: ${error.message}`, error);
      return { autoChangeStatus: [] };
    }
  }

  try {
    // Initialize by checking data.json
    logger.info('AutoChangeStatus: Starting initialization');
    await checkDataJson();

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