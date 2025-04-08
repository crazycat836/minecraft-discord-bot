import config from '../../../config.js';
import serverDataManager from '../../services/serverDataManager.js';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import json5 from 'json5';
import path from 'path';
import logger from '../../utils/logger.js';

// Construct the absolute path for the data.json file
const dataPath = path.join(process.cwd(), 'src', 'data.json');

// Load player count translations
const loadPlayerCountTranslations = () => {
  try {
    const languageMain = config.settings.language.main || 'en';
    const playerCountFileContent = fs.readFileSync(`./translation/${languageMain}/bot-status.json5`, 'utf8');
    return json5.parse(playerCountFileContent);
  } catch (error) {
    logger.error('Failed to load player count translations, using English as fallback');
    try {
      const playerCountFileContent = fs.readFileSync('./translation/en/bot-status.json5', 'utf8');
      return json5.parse(playerCountFileContent);
    } catch (fallbackError) {
      logger.error('Failed to load fallback translations', fallbackError);
      // Return default values if even fallback fails
      return {
        playerCount: {
          online: '🟢 {playeronline}/{playermax} active players',
          offline: '⚫ Server offline'
        }
      };
    }
  }
};

// Load translations
const playerCountTranslation = loadPlayerCountTranslations();

export default async (client) => {
  // Function to update player count channel
  async function playerCountUpdate(channelId) {
    try {
      if (!channelId) {
        logger.error('PlayerCount: Channel ID is undefined');
        return;
      }
      
      // Fetch the channel
      const channel = await client.channels.fetch(channelId).catch(error => {
        logger.error(`PlayerCount: Channel ${channelId} not found`, error);
        return null;
      });
      
      if (!channel) return;
      
      // Get server data
      const result = await serverDataManager.getServerData(config);
      
      // Determine the status name based on server status
      let statusName;
      if (result && result.isOnline) {
        const { data } = result;
        statusName = playerCountTranslation.playerCount.online
          .replace(/{playeronline}/g, data.players.online)
          .replace(/{playermax}/g, data.players.max);
      } else {
        statusName = playerCountTranslation.playerCount.offline;
      }
      
      // Only update if the name has changed
      if (channel.name !== statusName) {
        try {
          await channel.setName(statusName);
        } catch (editError) {
          logger.error(`PlayerCount: Error updating channel name`, editError);
        }
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
        await playerCountUpdate(channelIdToUse);
      } catch (error) {
        logger.error(`PlayerCount: Error updating channel`, error);
      }
    }
    
    // Check if player count channel feature is enabled
    if (!config.playerCountCH || !config.playerCountCH.enabled) {
      return;
    }
    
    // Initialize data.json if it doesn't exist
    let dataIDS = {};
    try {
      // Check if data.json exists
      try {
        const fileContent = await fsPromises.readFile(dataPath, 'utf8');
        
        // Check if the file content is valid JSON
        if (!fileContent || fileContent.trim() === '') {
          logger.warn('Empty data.json file, initializing new object');
          dataIDS = {};
        } else {
          try {
            dataIDS = JSON.parse(fileContent);
          } catch (parseError) {
            logger.warn(`Invalid JSON in data.json: ${parseError.message}`);
            
            // Create a backup of the corrupted file
            const backupPath = `${dataPath}.corrupted-${Date.now()}`;
            try {
              await fsPromises.writeFile(backupPath, fileContent);
            } catch (backupError) {
              logger.error(`Failed to create backup of corrupted data.json: ${backupError.message}`);
            }
            
            // Initialize with new object
            dataIDS = {};
          }
        }
      } catch (err) {
        // File doesn't exist or can't be read
        logger.warn(`Error reading data.json: ${err.message}`);
        dataIDS = {};
      }
      
      // Initialize playerCountStats if it doesn't exist or is not an object
      if (!dataIDS.playerCountStats || typeof dataIDS.playerCountStats !== 'object') {
        dataIDS.playerCountStats = { 
          channelId: config.playerCountCH.channelId,
          lastUpdate: Date.now() 
        };
      }
      
      // Initialize autoChangeStatus if it doesn't exist
      if (!dataIDS.autoChangeStatus) {
        dataIDS.autoChangeStatus = [];
      }
      
      // Write updated data back to file
      try {
        await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2));
      } catch (writeError) {
        logger.error(`Failed to write to data.json: ${writeError.message}`);
      }
      
      // Update player count immediately
      await updatePlayerCount();
      
      // Set up interval for regular updates
      setInterval(async () => {
        try {
          await updatePlayerCount();
          
          // Update last update time in data.json
          try {
            // Read the current data.json to avoid overwriting other changes
            const currentFileContent = await fsPromises.readFile(dataPath, 'utf8');
            let currentData = {};
            
            try {
              currentData = JSON.parse(currentFileContent);
            } catch (parseError) {
              logger.error(`Error parsing data.json for update: ${parseError.message}`);
              // Create a backup of the corrupted file
              const backupPath = `${dataPath}.corrupted-${Date.now()}`;
              await fsPromises.writeFile(backupPath, currentFileContent);
              
              // Use our in-memory data as fallback
              currentData = dataIDS;
            }
            
            // Make sure playerCountStats exists and is an object
            if (!currentData.playerCountStats || typeof currentData.playerCountStats !== 'object') {
              currentData.playerCountStats = { 
                channelId: config.playerCountCH.channelId,
                lastUpdate: Date.now() 
              };
            } else {
              // Update lastUpdate time
              currentData.playerCountStats.lastUpdate = Date.now();
            }
            
            // Update our in-memory copy
            dataIDS = currentData;
            
            // Write back to file
            await fsPromises.writeFile(dataPath, JSON.stringify(currentData, null, 2));
          } catch (fileError) {
            logger.error(`Error updating data.json: ${fileError.message}`);
            // Try to write our in-memory data as fallback
            try {
              dataIDS.playerCountStats.lastUpdate = Date.now();
              await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2));
            } catch (recoveryError) {
              logger.error(`Failed to recover data.json: ${recoveryError.message}`);
            }
          }
        } catch (error) {
          logger.error(`Error in player count update interval: ${error.message}`, error);
        }
      }, config.playerCountCH.updateInterval * 1000);
      
    } catch (error) {
      logger.error(`Failed to initialize playerCountCH: ${error.message}`, error);
    }
  } catch (error) {
    logger.error(`Unexpected error in playerCountCH: ${error.message}`, error);
  }
};