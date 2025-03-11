import chalk from 'chalk';
import config from '../../../config.js';
import { getDebug, getError, consoleLogTranslation } from '../../index.js';
import serverDataManager from '../../services/serverDataManager.js';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { ChannelType } from 'discord.js';

// Construct the absolute path for the data.json file
const dataPath = path.join(process.cwd(), 'src', 'data.json');

export default async (client) => {
  /**
   * Updates the player count channel name based on server status
   * @param {string} channelId - The ID of the channel to update
   */
  async function playerCountUpdate(channelId) {
    try {
      if (!channelId) {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Channel ID is undefined`);
        return;
      }

      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | Updating player count channel ${channelId}`);
      
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Channel ${channelId} not found`);
          return;
        }

        // 使用 serverDataManager 獲取伺服器數據
        const result = await serverDataManager.getServerData(config);
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Server data fetched, isOnline=${result?.isOnline}`);
        
        let statusName;
        if (result && result.isOnline) {
          statusName = config.playerCountCH.onlineText
            .replace(/{playeronline}/g, result.data.players.online)
            .replace(/{playermax}/g, result.data.players.max);
        } else {
          statusName = config.playerCountCH.offlineText;
        }

        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | New channel name: ${statusName}`);
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Current channel name: ${channel.name}`);
        
        if (channel.name !== statusName) {
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Updating channel name to: ${statusName}`);
          try {
            await channel.edit({ name: statusName });
            console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.green('SUCCESS')} | Channel name updated to: ${statusName}`);
            console.log(
              consoleLogTranslation.debug.playerCountChUpdate.replace(
                /\{updatedName\}/gi,
                chalk.cyan(statusName)
              )
            );
          } catch (editError) {
            console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error updating channel name: ${editError.message}`);
            throw editError;
          }
        } else {
          console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Channel name unchanged`);
        }
      } catch (fetchError) {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error fetching channel: ${fetchError.message}`);
        throw fetchError;
      }
    } catch (error) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.red('ERROR')} | Error updating player count channel: ${error.message}`);
      getError(error, 'playerCountChNameUpdate');
    }
  }

  try {
    // If playerCountCH feature is not enabled, exit early
    if (!config.playerCountCH || !config.playerCountCH.enabled) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('DEBUG')} | playerCountCH is not enabled in config`);
      return;
    }

    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Starting playerCountCH with config: ${JSON.stringify({
      enabled: config.playerCountCH.enabled,
      updateInterval: config.playerCountCH.updateInterval,
      guildID: config.playerCountCH.guildID,
      channelId: config.playerCountCH.channelId,
      onlineText: config.playerCountCH.onlineText,
      offlineText: config.playerCountCH.offlineText
    })}`);

    // Get the guild based on the configured guild ID
    const guild = client.guilds.cache.get(config.playerCountCH.guildID);
    if (!guild) {
      const error = {
        message: consoleLogTranslation.playerCountCh.playerCountChGuildIncorrect.replace(
          /\{guildID\}/gi,
          config.playerCountCH.guildID
        ),
      };
      getError(error, '');
      return; // Consider retrying instead of exiting immediately
    }

    // Read the data.json file asynchronously
    let dataIDS;
    try {
      const dataRaw = await fsPromises.readFile(dataPath, 'utf-8');
      dataIDS = JSON.parse(dataRaw);
      
      // 確保 dataIDS 是一個有效的對象
      if (!dataIDS || typeof dataIDS !== 'object') {
        console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | Invalid data.json content, initializing new object`);
        dataIDS = {};
      }
    } catch (err) {
      // Initialize data if file doesn't exist or JSON is invalid
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.yellow('WARN')} | Error reading data.json: ${err.message}`);
      dataIDS = {};
    }
    
    // 確保 playerCountStats 字段存在
    if (!dataIDS.playerCountStats) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | playerCountStats not found in data.json, initializing`);
      dataIDS.playerCountStats = null;
    }
    
    // 確保 autoChangeStatus 數組存在
    if (!dataIDS.autoChangeStatus) {
      console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | autoChangeStatus not found in data.json, initializing empty array`);
      dataIDS.autoChangeStatus = [];
    }
    
    console.log(`${chalk.gray(new Date().toISOString())} | ${chalk.blue('INFO')} | Current data.json content: ${JSON.stringify(dataIDS)}`);

    // If playerCountStats is not set, attempt to set it up
    if (!dataIDS.playerCountStats) {
      if (config.playerCountCH.channelId) {
        // If a channelId is provided in the config, use that channel
        const channel = client.channels.cache.get(config.playerCountCH.channelId);
        if (channel) {
          console.log(
            consoleLogTranslation.playerCountCh.playerCountChannelFound.replace(
              /\{channelName\}/gi,
              chalk.cyan(channel.name)
            )
          );
          dataIDS.playerCountStats = channel.id;
          await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2), 'utf-8');
        } else {
          // Channel not found
          const error = {
            message: consoleLogTranslation.playerCountCh.playerCountChannelFound.replace(
              /\{channelId\}/gi,
              chalk.cyan(config.playerCountCH.channelId)
            ),
          };
          getError(error, '');
          return;
        }
      } else {
        // If no channelId is provided, create a new channel
        const result = await serverDataManager.getServerData(config);
        const statusName = result && result.isOnline
          ? config.playerCountCH.onlineText
              .replace(/{playeronline}/g, result.data.players.online)
              .replace(/{playermax}/g, result.data.players.max)
          : config.playerCountCH.offlineText;
        const channel = await guild.channels.create({
          name: statusName,
          type: ChannelType.GuildAnnouncement,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: ['Connect'],
            },
          ],
        });
        dataIDS.playerCountStats = channel.id;
        await fsPromises.writeFile(dataPath, JSON.stringify(dataIDS, null, 2), 'utf-8');
        console.log(
          consoleLogTranslation.playerCountCh.playerCountChannelCreated.replace(
            /\{updatedStatus\}/gi,
            chalk.cyan(statusName)
          )
        );
      }
    }

    // Set up an interval to update the channel name periodically
    playerCountUpdate(dataIDS.playerCountStats);
    setInterval(() => {
      playerCountUpdate(dataIDS.playerCountStats);
    }, config.playerCountCH.updateInterval * 1000);
  } catch (error) {
    getError(error, 'playerCountCh');
  }
};