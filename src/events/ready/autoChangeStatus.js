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
  // Check if autoChangeStatus is enabled in config
  if (!config.autoChangeStatus || !config.autoChangeStatus.enabled) {
    return;
  }

  // Validate guildID configuration and fetch guild
  try {
    if (!config.autoChangeStatus.guildID) {
      logger.warn('AutoChangeStatus: GuildID not set in config file');
      return;
    }

    const guild = client.guilds.cache.get(config.autoChangeStatus.guildID);
    if (!guild) {
      logger.error(`AutoChangeStatus: Guild with ID ${chalk.keyword('orange')(config.autoChangeStatus.guildID)} not found`);
      return;
    }
  } catch (error) {
    logger.error('AutoChangeStatus: Error validating guild configuration', error);
    return;
  }

  // Main function to update auto change status
  const autoChangeStatus = async () => {
    // Check if data.json exists and read it
    let dataRead = { autoChangeStatus: [] };
    try {
      const fileContent = await fs.readFile(dataJsonPath, 'utf8');
      dataRead = JSON.parse(fileContent);
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
      } catch (writeError) {
        logger.error(`Failed to recreate data.json: ${writeError.message}`);
        return;
      }
    }
    
    try {
      // Process autoChangeStatus records
      if (!dataRead.autoChangeStatus || !Array.isArray(dataRead.autoChangeStatus) || dataRead.autoChangeStatus.length === 0) {
        return;
      }
      
      // Filter out invalid records and process valid ones
      const validRecords = [];
      
      // Process each record
      for (const record of dataRead.autoChangeStatus) {
        try {
          // Fetch the channel
          const channel = await client.channels.fetch(record.channelId).catch(error => {
            logger.error(`Failed to fetch channel ${record.channelId}: ${error.message}`);
            return null;
          });
          
          if (!channel) {
            continue;
          }
          
          // Fetch the message
          const message = await channel.messages.fetch(record.messageId).catch(error => {
            logger.error(`Failed to fetch message ${record.messageId}: ${error.message}`);
            return null;
          });
          
          if (!message) {
            continue;
          }
          
          // Update the status message
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
        } catch (error) {
          logger.error(`Error processing record: ${error.message}`, error);
        }
      }
      
      // Update data.json with valid records
      try {
        if (validRecords.length === 0) {
          dataRead.autoChangeStatus = [];
        } else {
          dataRead.autoChangeStatus = validRecords;
        }
        
        await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2));
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
      return;
    }
    
    try {
      isRunning = true;
      await autoChangeStatus();
      isRunning = false;
    } catch (error) {
      isRunning = false;
      logger.error(`AutoChangeStatus: Error in scheduler`, error);
    }
  };
  
  // Check if data.json exists and has autoChangeStatus array
  async function checkDataJson() {
    try {
      let data = {};
      let fileContent = '';
      
      // Try to read data.json
      try {
        fileContent = await fs.readFile(dataJsonPath, 'utf8');
        
        // Check for empty file
        if (!fileContent || fileContent.trim() === '') {
          data = { autoChangeStatus: [] };
          await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2));
        } else {
          // Try to parse JSON
          try {
            data = JSON.parse(fileContent);
            
            // Check if autoChangeStatus exists in data
            if (!data.autoChangeStatus) {
              data.autoChangeStatus = [];
              await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2));
            }
          } catch (parseError) {
            logger.error(`Failed to parse data.json: ${parseError.message}`);
            
            // Create a backup of corrupted file
            const backupPath = `${dataJsonPath}.corrupted-${Date.now()}`;
            try {
              await fs.writeFile(backupPath, fileContent);
            } catch (backupError) {
              logger.error(`Failed to create backup of corrupted data.json: ${backupError.message}`);
            }
            
            // Create a new data.json with empty autoChangeStatus array
            const newData = { autoChangeStatus: [] };
            await fs.writeFile(dataJsonPath, JSON.stringify(newData, null, 2));
            data = newData;
          }
        }
      } catch (readError) {
        logger.warn(`Error reading data.json: ${readError.message}`);
        
        // Create data.json if it doesn't exist
        try {
          data = { autoChangeStatus: [] };
          await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2));
        } catch (writeError) {
          logger.error(`Failed to recreate data.json: ${writeError.message}`, writeError);
          return;
        }
      }
      
      try {
        // Re-read data.json to ensure it's properly structured
        const reReadContent = await fs.readFile(dataJsonPath, 'utf8');
        const parsedData = JSON.parse(reReadContent);
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
    await checkDataJson();
    
    // Run immediately and then on schedule
    await scheduleAutoChangeStatus();
    
    // Set up interval for regular updates
    setInterval(scheduleAutoChangeStatus, config.autoChangeStatus.updateInterval * 1000);
  } catch (error) {
    logger.error(`Failed to initialize autoChangeStatus: ${error.message}`, error);
  }
};