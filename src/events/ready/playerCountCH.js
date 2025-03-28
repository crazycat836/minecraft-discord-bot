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

      logger.debug(`PlayerCount: Updating channel ${channelId}`);
      
      // Fetch the channel
      const channel = await client.channels.fetch(channelId).catch(error => {
        logger.error(`PlayerCount: Channel ${channelId} not found`, error);
        return null;
      });
      
      if (!channel) return;
      
      // Get server data
      const result = await serverDataManager.getServerData(config);
      logger.info(`PlayerCount: Server data fetched, isOnline=${result?.isOnline}`);
      
      // Add detailed debugging
      logger.debug('PlayerCount: Full result object: ' + JSON.stringify(result, null, 2));
      if (result && result.data) {
        logger.debug('PlayerCount: Data object structure: ' + JSON.stringify({
          hasStatus: !!result.data.status,
          hasPlayers: !!result.data.players,
          playersKeys: result.data.players ? Object.keys(result.data.players) : null
        }, null, 2));
      }
      
      // Determine the status name based on server status
      let statusName;
      if (result && result.isOnline) {
        const { data } = result;
        // Add defensive programming
        if (!data || !data.players) {
          logger.error('PlayerCount: Missing data or players property in server data');
          statusName = playerCountTranslation.playerCount.offline;
        } else {
          statusName = playerCountTranslation.playerCount.online
            .replace(/{playeronline}/g, data.players.online)
            .replace(/{playermax}/g, data.players.max);
        }
      } else {
        statusName = playerCountTranslation.playerCount.offline;
      }
      
      logger.info(`PlayerCount: New channel name "${statusName}"`);
      logger.info(`PlayerCount: Current channel name "${channel.name}"`);
      
      // Only update if the name has changed
      if (channel.name !== statusName) {
        logger.info(`PlayerCount: Updating channel name to "${statusName}"`);
        try {
          await channel.setName(statusName);
          logger.info(`PlayerCount: Channel name updated to "${statusName}"`);
          logger.debug(`PlayerCount: Channel ID ${channel.id}, Guild ID ${channel.guild.id}`);
        } catch (editError) {
          logger.error(`PlayerCount: Error updating channel name`, editError);
        }
      } else {
        logger.info('PlayerCount: Channel name unchanged');
      }
    } catch (fetchError) {
      logger.error(`PlayerCount: Error fetching channel`, fetchError);
    }
  }
  
  try {
    // Main function to update player count channel
    async function updatePlayerCount() {
      try {
        await playerCountUpdate(config.playerCountCH.channelId);
      } catch (error) {
        logger.error(`PlayerCount: Error updating channel`, error);
      }
    }
    
    // Check if player count channel feature is enabled
    if (!config.playerCountCH || !config.playerCountCH.enabled) {
      logger.debug('PlayerCount: Feature not enabled in config');
      return;
    }
    
    // Log configuration
    logger.info(`Starting playerCountCH with config: ${JSON.stringify({
      enabled: config.playerCountCH.enabled,
      channelId: config.playerCountCH.channelId,
      updateInterval: config.playerCountCH.updateInterval
    })}`);
    
    // Initialize data.json if it doesn't exist
    let dataIDS = {};
    try {
      // Check if data.json exists
      try {
        const fileContent = await fsPromises.readFile(dataPath, 'utf8');
        try {
          dataIDS = JSON.parse(fileContent);
        } catch (parseError) {
          logger.warn('Invalid data.json content, initializing new object');
          dataIDS = {};
        }
      } catch (err) {
        // File doesn't exist or can't be read
        logger.warn(`Error reading data.json: ${err.message}`);
        dataIDS = {};
      }
      
      // Initialize playerCountStats if it doesn't exist
      if (!dataIDS.playerCountStats) {
        logger.info('playerCountStats not found in data.json, initializing');
        dataIDS.playerCountStats = { lastUpdate: Date.now() };
      }
      
      // Initialize autoChangeStatus if it doesn't exist
      if (!dataIDS.autoChangeStatus) {
        logger.info('autoChangeStatus not found in data.json, initializing empty array');
        dataIDS.autoChangeStatus = [];
      }
      
      logger.info(`Current data.json content: ${JSON.stringify(dataIDS)}`);
      
      // Write updated data back to file
      await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2));
      
      // Update player count immediately
      await updatePlayerCount();
      
      // Set up interval for regular updates
      setInterval(async () => {
        try {
          await updatePlayerCount();
          
          // Update last update time in data.json
          dataIDS.playerCountStats.lastUpdate = Date.now();
          await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2));
          
          logger.debug(`Player count updated at ${new Date().toISOString()}`);
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