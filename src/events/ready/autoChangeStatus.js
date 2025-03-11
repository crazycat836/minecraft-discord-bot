import fs from 'fs/promises'; // Use asynchronous file system operations
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import config from '../../../config.js';
// Removed unused import: mcstatus
import {
  statusMessageEdit,
  consoleLogTranslation,
} from '../../index.js';
import serverDataManager from '../../services/serverDataManager.js';
import logger from '../../utils/logger.js';

const dataJsonUrl = new URL('../../data.json', import.meta.url);
const dataJsonPath = fileURLToPath(dataJsonUrl);

export default async (client) => {
  // Check if autoChangeStatus is enabled in config
  if (!config.autoChangeStatus || !config.autoChangeStatus.enabled) {
    logger.debug('AutoChangeStatus: Feature not enabled in config');
    return;
  }

  // Validate guildID configuration and fetch guild
  try {
    if (!config.autoChangeStatus.guildID) {
      logger.warn('AutoChangeStatus: GuildID not set in config file');
      return;
    }

    const guild = client.guilds.cache.get(config.autoChangeStatus.guildID);
    if (guild) {
      logger.info(`AutoChangeStatus: Guild '${chalk.cyan(guild.name)}' found`);
    } else {
      logger.error(`AutoChangeStatus: Guild with ID ${chalk.keyword('orange')(config.autoChangeStatus.guildID)} not found`);
      return;
    }
  } catch (error) {
    logger.error('AutoChangeStatus: Error validating guild configuration', error);
    return;
  }

  // Main function to update auto change status
  const autoChangeStatus = async () => {
    logger.debug('AutoChangeStatus: Starting update process');

    // Check if data.json exists and read it
    let dataRead = { autoChangeStatus: [] };
    try {
      const fileContent = await fs.readFile(dataJsonPath, 'utf8');
      dataRead = JSON.parse(fileContent);
      logger.info(`Read data.json, found ${dataRead.autoChangeStatus?.length || 0} status records`);
    } catch (readError) {
      logger.warn(`Error reading data.json: ${readError.message}`);
      
      // Try to recreate data.json if it doesn't exist
      try {
        // Create a new data object with empty autoChangeStatus array
        const newData = {
          autoChangeStatus: []
        };
        
        // Write the new data to data.json
        await fs.writeFile(dataJsonPath, JSON.stringify(newData, null, 2));
        dataRead = newData;
        logger.info('Recreated data.json file');
      } catch (writeError) {
        logger.error(`Failed to recreate data.json: ${writeError.message}`);
        return;
      }
    }
    
    try {
      // Process autoChangeStatus records
      if (!dataRead.autoChangeStatus || !Array.isArray(dataRead.autoChangeStatus) || dataRead.autoChangeStatus.length === 0) {
        logger.warn('No autoChangeStatus records found, skipping update');
        return;
      }
      
      // Filter out invalid records and process valid ones
      const validRecords = [];
      const updatedStatusRecords = [];
      
      // Process each record
      logger.info(`Processing ${dataRead.autoChangeStatus.length} status records`);
      
      for (const record of dataRead.autoChangeStatus) {
        try {
          logger.info(`Processing record for channel ${record.channelId}, message ${record.messageId}`);
          
          // Fetch the channel
          const channel = await client.channels.fetch(record.channelId).catch(error => {
            logger.error(`Failed to fetch channel ${record.channelId}: ${error.message}`);
            return null;
          });
          
          if (!channel) {
            logger.warn(`Channel with ID ${record.channelId} not found, removing record from data`);
            logger.debug(`Channel with ID ${record.channelId} not found. Removing record from data.`);
            continue;
          }
          
          // Fetch the message
          const message = await channel.messages.fetch(record.messageId).catch(error => {
            logger.error(`Failed to fetch message ${record.messageId}: ${error.message}`);
            return null;
          });
          
          if (!message) {
            logger.warn(`Message with ID ${record.messageId} not found, removing record from data`);
            logger.debug(`Message with ID ${record.messageId} not found. Removing record from data.`);
            continue;
          }
          
          // Update the status message
          logger.info(`Updating status message for ${record.ip}:${record.port}`);
          
          await statusMessageEdit(
            record.ip,
            record.port,
            record.type || 'java',
            record.name || record.ip,
            message,
            config.autoChangeStatus.isPlayerAvatarEmoji,
            client
          );
          
          // Add to valid records
          validRecords.push(record);
          logger.info(`Status message updated for ${record.ip}:${record.port}`);
        } catch (error) {
          logger.error(`Error processing record: ${error.message}`, error);
        }
      }
      
      // Update data.json with valid records
      try {
        if (validRecords.length === 0) {
          logger.warn('No valid records found, clearing autoChangeStatus array');
          dataRead.autoChangeStatus = [];
        } else {
          dataRead.autoChangeStatus = validRecords;
        }
        
        await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2));
        logger.info(`Updated data.json with ${validRecords.length} valid records`);
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
      logger.warn('AutoChangeStatus: Already running, skipping update');
      return;
    }
    
    try {
      isRunning = true;
      logger.debug("AutoChangeStatus: Update started");
      logger.debug("AutoChangeStatus: Process starting");
      await autoChangeStatus();
      logger.debug("AutoChangeStatus: Process completed");
      isRunning = false;
      logger.debug("AutoChangeStatus: Update finished");
      logger.debug("AutoChangeStatus: Scheduling next update");
    } catch (error) {
      isRunning = false;
      logger.error(`AutoChangeStatus: Error in scheduler`, error);
    }
  };
  
  // Check if data.json exists and has autoChangeStatus array
  const checkDataJson = async () => {
    logger.debug('AutoChangeStatus: Checking data.json for records');
    
    try {
      const fileContent = await fs.readFile(dataJsonPath, 'utf8');
      logger.info(`Read data.json: ${fileContent}`);
      
      let data = JSON.parse(fileContent);
      
      // If autoChangeStatus array doesn't exist, create it
      if (!data.autoChangeStatus) {
        data.autoChangeStatus = [];
        await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2));
        logger.info('Added autoChangeStatus array to data.json');
      }
    } catch (readError) {
      logger.warn(`Error reading data.json: ${readError.message}`);
      
      // Try to recreate data.json if it doesn't exist
      try {
        // Create a new data object with empty autoChangeStatus array
        const newData = {
          autoChangeStatus: []
        };
        
        // Write the new data to data.json
        await fs.writeFile(dataJsonPath, JSON.stringify(newData, null, 2));
        logger.info('Recreated data.json file');
      } catch (writeError) {
        logger.error(`Failed to recreate data.json: ${writeError.message}`, writeError);
      }
    }
    
    // Parse data.json again to get the latest data
    const fileContent = await fs.readFile(dataJsonPath, 'utf8');
    const data = JSON.parse(fileContent);
    logger.info(`Parsed data.json, autoChangeStatus length: ${data.autoChangeStatus?.length || 0}`);
    
    // Run autoChangeStatus immediately and then schedule it to run at regular intervals
    await scheduleAutoChangeStatus();
    logger.info('Starting autoChangeStatus update loop');
    
    // Set up interval for regular updates
    setInterval(scheduleAutoChangeStatus, config.autoChangeStatus.updateInterval * 1000);
    
    // If no autoChangeStatus records found, log a message
    if (!data.autoChangeStatus || data.autoChangeStatus.length === 0) {
      logger.info(`To set up server status, use ${chalk.cyan('"/setstatus"')} command in the desired channel`);
      logger.debug('No autoChangeStatus records found, please use /setstatus command to set up status messages');
    }
  };
  
  // Check data.json for existing autoChangeStatus records
  await checkDataJson();
};