import config from '../../../config.js';
import serverDataManager from '../../services/serverDataManager.js';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger.js';
import languageService from '../../services/languageService.js';

// Construct the absolute path for the data.json file
const dataPath = path.join(process.cwd(), 'src', 'data.json');

export default async (client) => {
  logger.info('PlayerCount: Initializing player count channel module');

  // Function to update player count channel
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
      
      // Get server data
      const result = await serverDataManager.getServerData(config);
      
      // Determine the status name based on server status
      let statusName;
      if (result && result.isOnline) {
        const { data } = result;
        // Get the translation template
        const translationTemplate = languageService.getText('bot-status', 'playerCount.online', {
          playeronline: data.players.online,
          playermax: data.players.max
        });
        
        // Make sure variables are actually replaced
        statusName = translationTemplate
          .replace(/{playeronline}/g, data.players.online)
          .replace(/{playermax}/g, data.players.max);
        
        logger.debug(`PlayerCount: Server online with ${data.players.online}/${data.players.max} players`);
        
        // Log the status name to debug
        logger.debug(`PlayerCount: Generated status name: "${statusName}"`);
        if (statusName.includes('{playeronline}') || statusName.includes('{playermax}')) {
          logger.warn('PlayerCount: Variables not replaced in the status name!');
          // Manually create the status name if the translation variables aren't replacing
          statusName = `🟢 ${data.players.online}/${data.players.max} 位玩家在線`;
          logger.debug(`PlayerCount: Using fallback status name: "${statusName}"`);
        }
      } else {
        statusName = languageService.getText('bot-status', 'playerCount.offline');
        logger.debug(`PlayerCount: Server offline`);
      }
      
      // Only update if the name has changed
      // Compare actual content, ignoring potential variable placeholders in the current name
      const currentNameWithoutVars = channel.name
        .replace(/{playeronline}/g, '0')
        .replace(/{playermax}/g, '0');
        
      const newNameWithoutVars = statusName
        .replace(/{playeronline}/g, '0')
        .replace(/{playermax}/g, '0');
      
      if (currentNameWithoutVars !== newNameWithoutVars || 
          channel.name.includes('{playeronline}') || 
          channel.name.includes('{playermax}')) {
        logger.info(`PlayerCount: Updating channel name from "${channel.name}" to "${statusName}"`);
        try {
          await channel.setName(statusName);
          logger.debug(`PlayerCount: Successfully updated channel name to "${statusName}"`);
        } catch (editError) {
          logger.error(`PlayerCount: Error updating channel name`, editError);
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
        // Use the channel ID from config or from data.json
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
    
    // Initialize data.json if it doesn't exist
    let dataIDS = {};
    try {
      // Check if data.json exists
      try {
        const fileContent = await fsPromises.readFile(dataPath, 'utf8');
        
        // Check if the file content is valid JSON
        if (!fileContent || fileContent.trim() === '') {
          logger.warn('PlayerCount: Empty data.json file, initializing new object');
          dataIDS = {};
        } else {
          try {
            dataIDS = JSON.parse(fileContent);
            logger.debug('PlayerCount: Successfully loaded data.json');
          } catch (parseError) {
            logger.warn(`PlayerCount: Invalid JSON in data.json: ${parseError.message}`);
            
            // Create a backup of the corrupted file
            const backupPath = `${dataPath}.corrupted-${Date.now()}`;
            try {
              await fsPromises.writeFile(backupPath, fileContent);
              logger.info(`PlayerCount: Created backup of corrupted data.json at ${backupPath}`);
            } catch (backupError) {
              logger.error(`PlayerCount: Failed to create backup of corrupted data.json: ${backupError.message}`);
            }
            
            // Initialize with new object
            dataIDS = {};
          }
        }
      } catch (err) {
        // File doesn't exist or can't be read
        logger.warn(`PlayerCount: Error reading data.json: ${err.message}`);
        dataIDS = {};
      }
      
      // Initialize playerCountStats if it doesn't exist or is not an object
      if (!dataIDS.playerCountStats || typeof dataIDS.playerCountStats !== 'object') {
        logger.info('PlayerCount: Initializing playerCountStats in data.json');
        dataIDS.playerCountStats = { 
          channelId: config.playerCountCH.channelId,
          lastUpdate: Date.now() 
        };
      } else {
        logger.debug('PlayerCount: Found existing playerCountStats in data.json');
      }
      
      // Initialize autoChangeStatus if it doesn't exist
      if (!dataIDS.autoChangeStatus) {
        logger.debug('PlayerCount: Initializing autoChangeStatus array in data.json');
        dataIDS.autoChangeStatus = [];
      }
      
      // Write updated data back to file
      try {
        await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2));
        logger.debug('PlayerCount: Successfully updated data.json');
      } catch (writeError) {
        logger.error(`PlayerCount: Failed to write to data.json: ${writeError.message}`);
      }
      
      // Update player count immediately
      logger.info('PlayerCount: Running initial update');
      await updatePlayerCount();
      
      // Set up interval for regular updates
      const updateIntervalSeconds = config.playerCountCH.updateInterval;
      logger.info(`PlayerCount: Setting up update interval (${updateIntervalSeconds} seconds)`);
      
      setInterval(async () => {
        try {
          logger.debug('PlayerCount: Starting scheduled update');
          await updatePlayerCount();
          
          // Update last update time in data.json
          try {
            // Read the current data.json to avoid overwriting other changes
            const currentFileContent = await fsPromises.readFile(dataPath, 'utf8');
            let currentData = {};
            
            try {
              currentData = JSON.parse(currentFileContent);
              logger.debug('PlayerCount: Successfully read data.json for update');
            } catch (parseError) {
              logger.error(`PlayerCount: Error parsing data.json for update: ${parseError.message}`);
              // Create a backup of the corrupted file
              const backupPath = `${dataPath}.corrupted-${Date.now()}`;
              await fsPromises.writeFile(backupPath, currentFileContent);
              logger.info(`PlayerCount: Created backup of corrupted data.json at ${backupPath}`);
              
              // Use our in-memory data as fallback
              currentData = dataIDS;
            }
            
            // Make sure playerCountStats exists and is an object
            if (!currentData.playerCountStats || typeof currentData.playerCountStats !== 'object') {
              logger.warn('PlayerCount: Missing playerCountStats in data.json, recreating');
              currentData.playerCountStats = { 
                channelId: config.playerCountCH.channelId,
                lastUpdate: Date.now() 
              };
            } else {
              // Update lastUpdate time
              currentData.playerCountStats.lastUpdate = Date.now();
              logger.debug('PlayerCount: Updated lastUpdate timestamp');
            }
            
            // Update our in-memory copy
            dataIDS = currentData;
            
            // Write back to file
            await fsPromises.writeFile(dataPath, JSON.stringify(currentData, null, 2));
            logger.debug('PlayerCount: Successfully wrote updated data.json');
          } catch (fileError) {
            logger.error(`PlayerCount: Error updating data.json: ${fileError.message}`);
            // Try to write our in-memory data as fallback
            try {
              dataIDS.playerCountStats.lastUpdate = Date.now();
              await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2));
              logger.debug('PlayerCount: Successfully wrote fallback data.json');
            } catch (recoveryError) {
              logger.error(`PlayerCount: Failed to recover data.json: ${recoveryError.message}`);
            }
          }
        } catch (error) {
          logger.error(`PlayerCount: Error in player count update interval: ${error.message}`, error);
        }
      }, updateIntervalSeconds * 1000);
      
      logger.info('PlayerCount: Module initialized successfully');
    } catch (error) {
      logger.error(`PlayerCount: Failed to initialize: ${error.message}`, error);
    }
  } catch (error) {
    logger.error(`PlayerCount: Unexpected error: ${error.message}`, error);
  }
};