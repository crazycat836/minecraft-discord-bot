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
  // This updates the name of a voice/text channel to specific formats (e.g., "🟢 Online: 5/20")
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

      // Check if bot has manage channel permissions
      // This is crucial because renaming channels requires specific permission
      if (channel.guild && channel.permissionsFor) {
        const botPermissions = channel.permissionsFor(client.user);
        const canManageChannel = botPermissions.has('MANAGE_CHANNELS');

        if (!canManageChannel) {
          logger.error(`PlayerCount: ERROR - Bot does not have permission to manage channel "${channel.name}"`);
          return;
        }
      }

      // Read data.json to get the latest server configuration
      // We check data.json to see if a specific server is configured for this bot
      let serverConfig = { ...config };
      try {
        const dataContent = await fsPromises.readFile(dataPath, 'utf8');
        const dataJson = JSON.parse(dataContent);

        // Use the first server in autoChangeStatus if it exists as the data source
        if (dataJson.autoChangeStatus && dataJson.autoChangeStatus.length > 0) {
          const serverRecord = dataJson.autoChangeStatus[0];
          logger.debug(`PlayerCount: Using server from data.json: ${serverRecord.ip}:${serverRecord.port}`);

          // Create a custom config with the server details from data.json
          serverConfig = {
            ...config,
            mcserver: {
              ...config.mcserver,
              ip: serverRecord.ip,
              port: serverRecord.port,
              type: serverRecord.type || 'java',
              name: serverRecord.name || serverRecord.ip
            }
          };
        }
      } catch (error) {
        logger.warn(`PlayerCount: Could not read data.json, using default config: ${error.message}`);
      }

      // Clear serverDataManager's cache to force a fresh check
      serverDataManager.pendingRequest = null;
      serverDataManager.currentRequestKey = null;

      // Check if server is actually configured (has IP)
      if (!serverConfig.mcserver.ip || serverConfig.mcserver.ip === '') {
        // Not configured
        statusName = languageService.getText('bot-status', 'playerCount.notConfigured');
        logger.debug(`PlayerCount: Server not configured (no IP)`);
      } else {
        // Get server data using the configuration
        logger.debug(`PlayerCount: Checking status for ${serverConfig.mcserver.ip}:${serverConfig.mcserver.port}`);
        const result = await serverDataManager.getServerData(serverConfig);

        // Determine the status name based on server status
        // This generates the string to use for the channel name (e.g. "🟢 5/20 Players")
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
            statusName = `🟢 ${data.players.online}/${data.players.max} Players Online`;
          }
        } else if (result && result.error) {
          statusName = languageService.getText('bot-status', 'playerCount.error');
          logger.debug(`PlayerCount: Server error: ${result.error}`);
        } else {
          statusName = languageService.getText('bot-status', 'playerCount.offline');
          logger.debug(`PlayerCount: Server offline`);
        }
      }

      // Only update if the name has changed to avoid hitting rate limits
      // Discord channel rename rate limit is 2 per 10 minutes per channel
      // We normalize the strings to ignore numeric values when checking if "template" changed
      // But actually, we just check if the final string is different.

      const currentNameWithoutVars = channel.name
        .replace(/{playeronline}/g, '0')
        .replace(/{playermax}/g, '0');

      const newNameWithoutVars = statusName
        .replace(/{playeronline}/g, '0')
        .replace(/{playermax}/g, '0');

      // Check if actual content changed OR if there are unreplaced variables (which shouldn't happen)
      if (currentNameWithoutVars !== newNameWithoutVars ||
        channel.name !== statusName) {

        logger.info(`PlayerCount: Updating channel name from "${channel.name}" to "${statusName}"`);
        try {
          await channel.setName(statusName)
            .then(() => {
              logger.info(`PlayerCount: Successfully updated channel name to "${statusName}"`);
            })
            .catch((error) => {
              logger.error(`PlayerCount: Discord API error updating channel name: ${error.message}`, error);
              if (error.code === 30000) {
                logger.warn('PlayerCount: Rate limit hit for channel rename - Discord limits channel name changes to 2 per 10 minutes');
              }
            });
        } catch (editError) {
          logger.error(`PlayerCount: Error updating channel name: ${editError.message}`, editError);
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
        // Read the latest data.json
        try {
          const fileContent = await fsPromises.readFile(dataPath, 'utf8');
          const latestData = JSON.parse(fileContent);

          // Update dataIDS with the latest data
          dataIDS = latestData;
          logger.debug('PlayerCount: Updated memory cache with latest data.json content');
        } catch (readError) {
          logger.warn(`PlayerCount: Could not read latest data.json: ${readError.message}`);
        }

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
      logger.debug(`PlayerCount: Setting up update interval (${updateIntervalSeconds} seconds)`);

      setInterval(async () => {
        try {
          logger.debug('PlayerCount: Starting scheduled update');

          // Clear serverDataManager's cache before each update
          serverDataManager.pendingRequest = null;
          serverDataManager.currentRequestKey = null;

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