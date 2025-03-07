import chalk from 'chalk';
import config from '../../../config.js';
import { getServerDataAndPlayerList, getDebug, getError, consoleLogTranslation } from '../../index.js';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { ChannelType } from 'discord.js';

// Construct the absolute path for the data.json file
const dataPath = path.join(process.cwd(), 'src', 'data.json');

export default async (client) => {
  // Function to update the channel name with player count status
  const playerCountUpdate = async (channelId) => {
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;
    try {
      // Get the server data (only data, not the full player list)
      const { data, isOnline } = await getServerDataAndPlayerList(true);
      // Determine the status name based on online/offline state
      const statusName = isOnline
        ? config.playerCountCH.onlineText
            .replace(/\{playeronline\}/g, data.players.online)
            .replace(/\{playermax\}/g, data.players.max)
        : config.playerCountCH.offlineText;
      // Update the channel name
      await channel.edit({ name: statusName });
      getDebug(
        consoleLogTranslation.debug.playerCountChUpdate.replace(
          /\{updatedName\}/gi,
          isOnline ? chalk.green(statusName) : chalk.red(statusName)
        )
      );
    } catch (error) {
      // In case of an error, set the channel name to indicate an error
      await channel.edit({ name: '🔴 ERROR' });
      getError(error, 'playerCountChNameUpdate');
    }
  };

  try {
    // If playerCountCH feature is not enabled, exit early
    if (!config.playerCountCH.enabled) return;

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
    } catch (err) {
      // Initialize data if file doesn't exist or JSON is invalid
      dataIDS = { playerCountStats: null };
    }

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
        const { data, isOnline } = await getServerDataAndPlayerList(true);
        const statusName = isOnline
          ? config.playerCountCH.onlineText
              .replace(/\{playeronline\}/g, data.players.online)
              .replace(/\{playermax\}/g, data.players.max)
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