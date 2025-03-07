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

const dataJsonUrl = new URL('../../data.json', import.meta.url);
const dataJsonPath = fileURLToPath(dataJsonUrl);

export default async (client) => {
  // Check if autoChangeStatus is enabled in config
  if (!config.autoChangeStatus.enabled) return;

  // Validate guildID configuration and fetch guild
  try {
    if (!config.autoChangeStatus.guildID) {
      getWarning('Please set up guildID in config file');
      return;
    }

    const guild = client.guilds.cache.get(config.autoChangeStatus.guildID);
    if (guild) {
      console.log(
        consoleLogTranslation.debug.autoChangeStatus.playerAvatarGuildSuccessFull.replace(
          /\{playerAvatarGuildName\}/gi,
          chalk.cyan(guild.name)
        )
      );
    } else {
      console.log(
        consoleLogTranslation.debug.autoChangeStatus.playerAvatarGuildUnSuccessFull.replace(
          /\{playerAvatarGuildID\}/gi,
          chalk.keyword('orange')(config.autoChangeStatus.guildID)
        )
      );
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
      // Read the data.json file asynchronously
      const fileContent = await fs.readFile(dataJsonPath, 'utf8');
      dataRead = JSON.parse(fileContent);
    } catch (error) {
      getError(error, 'readDataJson');
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

      // Iterate over each record and update the corresponding status message
      for (const record of dataRead.autoChangeStatus) {
        try {
          // Attempt to fetch the channel
          const channel = await client.channels.fetch(record.channelId);
          // If channel is not found, skip this record
          if (!channel) {
            getDebug(`Channel with ID ${record.channelId} not found. Removing record from data.`);
            continue;
          }
      
          // Attempt to fetch the message in the channel
          const message = await channel.messages.fetch(record.messageId);
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
        } catch (error) {
          // If error indicates an unknown message or channel, skip this record
          if (error.rawError && 
              (error.rawError.message === 'Unknown Message' || error.rawError.message === 'Unknown Channel')) {
            getDebug(`Record with channelId ${record.channelId} or messageId ${record.messageId} not found. Removing record from data.`);
            continue;
          }
          // Log other errors
          getError(error, 'messageEdit');
        }
      }
    } catch (error) {
      getError(error, 'autoChangeStatusProcess');
    } finally {
      // Update the data with only the successfully processed records
      dataRead.autoChangeStatus = updatedStatusRecords;
      try {
        // Write the updated data back to data.json asynchronously
        await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2), 'utf8');
      } catch (error) {
        getError(error, 'writeDataJson');
      }
    }
  };

  /**
   * Schedule autoChangeStatus using recursive setTimeout to avoid overlapping executions.
   */
  const scheduleAutoChangeStatus = async () => {
    if (isUpdating) return; // Skip if an update is already in progress

    isUpdating = true;
    getDebug("autoChangeStatus isUpdating")
    try {
      getDebug("autoChangeStatus Start")
      await autoChangeStatus();
      getDebug("autoChangeStatus END")
    } finally {
      getDebug("autoChangeStatus isUpdating END")
      isUpdating = false;
      // Schedule the next update after the configured interval (in seconds)
      getDebug("autoChangeStatus next")
      setTimeout(scheduleAutoChangeStatus, config.autoChangeStatus.updateInterval * 1000);
    }
  };

  // Initial check of data.json to decide whether to start auto-updating
  try {
    const fileContent = await fs.readFile(dataJsonPath, 'utf8');
    const data = JSON.parse(fileContent);
    if (data.autoChangeStatus.length === 0) {
      console.log(
        consoleLogTranslation.debug.autoChangeStatus.enableAutoChangeStatus.replace(
          /\{cmd\}/gi,
          chalk.cyan('"/setstatus"')
        )
      );
    } else {
      // Start the auto status update loop
      scheduleAutoChangeStatus();
    }
  } catch (error) {
    getError(error, 'channelIdCheck');
  }
};