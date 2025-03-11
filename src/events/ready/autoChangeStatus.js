import fs from 'fs/promises'; // Use asynchronous file system operations
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import config from '../../../config.js';
// Removed unused import: mcstatus
import {
  statusMessageEdit,
  consoleLogTranslation,
  getError,
  getWarning,
  getDebug,
} from '../../index.js';
import serverDataManager from '../../services/serverDataManager.js';

const dataJsonUrl = new URL('../../data.json', import.meta.url);
const dataJsonPath = fileURLToPath(dataJsonUrl);

export default async (client) => {
  // Check if autoChangeStatus is enabled in config
  if (!config.autoChangeStatus || !config.autoChangeStatus.enabled) {
    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | autoChangeStatus is not enabled in config`);
    return;
  }

  // Validate guildID configuration and fetch guild
  try {
    if (!config.autoChangeStatus.guildID) {
      getWarning('Please set up guildID in config file');
      return;
    }

    const guild = client.guilds.cache.get(config.autoChangeStatus.guildID);
    if (guild) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.green('SUCCESS')} | Guild '${chalk.cyan(guild.name)}' found for autoChangeStatus`);
    } else {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Guild with ID ${chalk.keyword('orange')(config.autoChangeStatus.guildID)} not found for autoChangeStatus`);
      process.exit(1);
    }
  } catch (error) {
    getError(error, 'playerAvatarGuildIdCheck');
  }

  // A flag to prevent overlapping updates
  let isUpdating = false;

  /**
   * Function to update status messages.
   * Uses asynchronous file operations and individual error handling per record.
   */
  const autoChangeStatus = async () => {
    let dataRead;
    try {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | Starting autoChangeStatus update`);
      
      // Read the data.json file asynchronously
      try {
        const fileContent = await fs.readFile(dataJsonPath, 'utf8');
        dataRead = JSON.parse(fileContent);
        
        // Ensure dataRead.autoChangeStatus exists
        if (!dataRead.autoChangeStatus) {
          dataRead.autoChangeStatus = [];
        }
        
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Read data.json, found ${dataRead.autoChangeStatus?.length || 0} status records`);
      } catch (readError) {
        // If the file doesn't exist or can't be parsed, create a new dataRead object
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | Error reading data.json: ${readError.message}`);
        
        // Try to create data.json file from scratch
        try {
          // Check if other processes are using the file
          await fs.access(dataJsonPath).catch(() => {});
          
          // Read current data.json file (if it exists)
          const currentData = await fs.readFile(dataJsonPath, 'utf8').catch(() => '{}');
          const parsedData = JSON.parse(currentData);
          
          // Ensure autoChangeStatus array exists
          if (!parsedData.autoChangeStatus) {
            parsedData.autoChangeStatus = [];
          }
          
          // Write to file
          await fs.writeFile(dataJsonPath, JSON.stringify(parsedData, null, 2), 'utf8');
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Recreated data.json file`);
          
          // Re-read the file
          const newContent = await fs.readFile(dataJsonPath, 'utf8');
          dataRead = JSON.parse(newContent);
        } catch (writeError) {
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Failed to recreate data.json: ${writeError.message}`);
          // If unable to create file, use in-memory object
          dataRead = { autoChangeStatus: [] };
        }
      }
    } catch (error) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Unexpected error in autoChangeStatus: ${error.message}`);
      getError(error, 'readDataJson');
      return;
    }

    // If no records, return immediately
    if (!dataRead.autoChangeStatus || dataRead.autoChangeStatus.length === 0) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | No autoChangeStatus records found, skipping update`);
      return;
    }

    // Array to store records that were processed successfully
    const updatedStatusRecords = [];

    try {
      const autoStatusArray = dataRead.autoChangeStatus;
      let lastTrueIndex = -1;
      // Find the last index where isPlayerAvatarEmoji is true
      for (let i = autoStatusArray.length - 1; i >= 0; i--) {
        if (autoStatusArray[i].isPlayerAvatarEmoji === true) {
          lastTrueIndex = i;
          break;
        }
      }
      // Filter out duplicate true entries, only keep the last one
      dataRead.autoChangeStatus = autoStatusArray.filter((item, index) => {
        if (item.isPlayerAvatarEmoji === true) {
          return index === lastTrueIndex;
        }
        return true;
      });

      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Processing ${dataRead.autoChangeStatus.length} status records`);
      
      // Iterate over each record and update the corresponding status message
      for (const record of dataRead.autoChangeStatus) {
        try {
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Processing record for channel ${record.channelId}, message ${record.messageId}`);
          
          // Attempt to fetch the channel
          const channel = await client.channels.fetch(record.channelId).catch(error => {
            console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Failed to fetch channel ${record.channelId}: ${error.message}`);
            return null;
          });
          
          // If channel is not found, skip this record and do NOT keep it in the data
          if (!channel) {
            console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | Channel with ID ${record.channelId} not found, removing record from data`);
            getDebug(`Channel with ID ${record.channelId} not found. Removing record from data.`);
            continue;
          }
      
          // Attempt to fetch the message in the channel
          const message = await channel.messages.fetch(record.messageId).catch(error => {
            console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Failed to fetch message ${record.messageId}: ${error.message}`);
            return null;
          });
          
          // If message is not found, skip this record and do NOT keep it in the data
          if (!message) {
            console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | Message with ID ${record.messageId} not found, removing record from data`);
            getDebug(`Message with ID ${record.messageId} not found. Removing record from data.`);
            continue;
          }
          
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Updating status message for ${record.ip}:${record.port}`);
          
          // Update the message with new status info
          await statusMessageEdit(
            record.ip,
            record.port,
            record.type,
            record.name,
            message,
            record.isPlayerAvatarEmoji,
            client
          );
          // Record is valid, add it back to the updated records array
          updatedStatusRecords.push(record);
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.green('SUCCESS')} | Status message updated for ${record.ip}:${record.port}`);
        } catch (error) {
          // If error indicates an unknown message or channel, keep the record for now
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error processing record: ${error.message}`);
          updatedStatusRecords.push(record);
        }
      }
    } catch (error) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error in autoChangeStatus process: ${error.message}`);
      getError(error, 'autoChangeStatusProcess');
    } finally {
      // If no valid records, don't keep original records
      if (updatedStatusRecords.length === 0 && dataRead.autoChangeStatus.length > 0) {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | No valid records found, clearing autoChangeStatus array`);
        // Don't keep original records
      }
      
      // Update the data with only the successfully processed records
      dataRead.autoChangeStatus = updatedStatusRecords;
      try {
        // Write the updated data back to data.json asynchronously
        await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2), 'utf8');
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.green('SUCCESS')} | Updated data.json with ${updatedStatusRecords.length} valid records`);
      } catch (error) {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error writing to data.json: ${error.message}`);
        getError(error, 'writeDataJson');
      }
    }
  };

  /**
   * Schedule autoChangeStatus using recursive setTimeout to avoid overlapping executions.
   */
  const scheduleAutoChangeStatus = async () => {
    if (isUpdating) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | autoChangeStatus is already running, skipping this update`);
      return; // Skip if an update is already in progress
    }

    isUpdating = true;
    getDebug("autoChangeStatus update started")
    try {
      getDebug("autoChangeStatus process starting")
      await autoChangeStatus();
      getDebug("autoChangeStatus process completed")
    } catch (error) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error in scheduleAutoChangeStatus: ${error.message}`);
      getError(error, 'scheduleAutoChangeStatus');
    } finally {
      getDebug("autoChangeStatus update finished")
      isUpdating = false;
      // Schedule the next update after the configured interval (in seconds)
      getDebug("Scheduling next autoChangeStatus update")
      setTimeout(scheduleAutoChangeStatus, config.autoChangeStatus.updateInterval * 1000);
    }
  };

  // Initial check of data.json to decide whether to start auto-updating
  try {
    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | Checking data.json for autoChangeStatus records`);
    
    let data;
    try {
      const fileContent = await fs.readFile(dataJsonPath, 'utf8');
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Read data.json: ${fileContent}`);
      
      data = JSON.parse(fileContent);
      
      // Ensure data.autoChangeStatus exists
      if (!data.autoChangeStatus) {
        data.autoChangeStatus = [];
        await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Added autoChangeStatus array to data.json`);
      }
    } catch (readError) {
      // If the file doesn't exist or can't be parsed, create a new data object
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | Error reading data.json: ${readError.message}`);
      
      // Try to create data.json file from scratch
      try {
        // Check if other processes are using the file
        await fs.access(dataJsonPath).catch(() => {});
        
        // Read current data.json file (if it exists)
        const currentData = await fs.readFile(dataJsonPath, 'utf8').catch(() => '{}');
        const parsedData = JSON.parse(currentData);
        
        // Ensure autoChangeStatus array exists
        if (!parsedData.autoChangeStatus) {
          parsedData.autoChangeStatus = [];
        }
        
        // Write to file
        await fs.writeFile(dataJsonPath, JSON.stringify(parsedData, null, 2), 'utf8');
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Recreated data.json file`);
        
        // Re-read the file
        const newContent = await fs.readFile(dataJsonPath, 'utf8');
        data = JSON.parse(newContent);
      } catch (writeError) {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Failed to recreate data.json: ${writeError.message}`);
        // If unable to create file, use in-memory object
        data = { autoChangeStatus: [] };
      }
    }
    
    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Parsed data.json, autoChangeStatus length: ${data.autoChangeStatus?.length || 0}`);
    
    // Even if no records, start autoChangeStatus functionality
    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.green('SUCCESS')} | Starting autoChangeStatus update loop`);
    scheduleAutoChangeStatus();
    
    // If no records, display prompt message
    if (data.autoChangeStatus.length === 0) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('INFO')} | To set up server status, use ${chalk.cyan('"/setstatus"')} command in the desired channel`);
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | No autoChangeStatus records found, please use /setstatus command to set up status messages`);
    }
  } catch (error) {
    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error checking data.json: ${error.message}`);
    getError(error, 'channelIdCheck');
    
    // Even if error, start autoChangeStatus functionality
    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | Starting autoChangeStatus update loop despite error`);
    scheduleAutoChangeStatus();
  }
};