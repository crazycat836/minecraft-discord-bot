import 'dotenv/config';

import { Client, IntentsBitField, EmbedBuilder } from 'discord.js';
import { statusBedrock, statusJava } from 'node-mcstatus';
import config from '../config.js';
import chalk from 'chalk';
import fs from 'fs';
import { CommandKit } from 'commandkit';
import process from 'node:process';
import json5 from 'json5';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import serverDataManager from './services/serverDataManager.js';

// Import the logger and translation systems
import logger, { LogLevel } from './utils/logger.js';
import { configureLogger } from './utils/loggerConfig.js';
import loggerMigration from './utils/loggerMigration.js';
import translationManager from './utils/translationManager.js';

// Configure the logger based on the application config
configureLogger(config);

// For backward compatibility, extract the migration functions
const { getWarning: migrationGetWarning, getDebug: migrationGetDebug } = loggerMigration;

// ---------------------
// Global Variables & Setup
// ---------------------

// Get __filename and __dirname (ESM does not provide these by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client instance
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildExpressions,
  ],
});

// Date formatting function
const getDateNow = () => {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: config.settings.logging.timezone || Intl.DateTimeFormat().resolvedOptions().timezone,
    timeZoneName: 'shortGeneric',
  });
};

// ---------------------
// Global Error Handling
// ---------------------

process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught Exception', error);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled Rejection', reason);
});

// ---------------------
// Translation Constants
// ---------------------

// Get translations using the manager
const embedTranslation = translationManager.getTranslation('embeds');
const consoleLogTranslation = translationManager.getTranslation('console-log');
const cmdSlashTranslation = translationManager.getTranslation('slash-cmds');

// ---------------------
// Configuration Checks
// ---------------------

(() => {
  function isTimeZoneSupported() {
    if (!config.settings.logging.timezone) return true;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: config.settings.logging.timezone });
      return true;
    } catch (e) {
      return false;
    }
  }

  const errors = [];
  logger.info(consoleLogTranslation.checkErrorConfig.checkConfigWait);

  function checkError(condition, errorMessage) {
    if (condition) errors.push(errorMessage);
  }

  checkError(!isTimeZoneSupported(), consoleLogTranslation.checkErrorConfig.timeZone);
  
  // Check if token is missing or has default value
  checkError(!config.bot.token || config.bot.token === '' || config.bot.token.startsWith('your-bot-token-here'), consoleLogTranslation.checkErrorConfig.botToken);
  
  checkError(
    !['online', 'idle', 'dnd', 'invisible'].includes(config.bot.presence.status.online && config.bot.presence.status.offline),
    consoleLogTranslation.checkErrorConfig.botPresenceStatus
  );
  checkError(
    !['Playing', 'Listening', 'Watching', 'Competing'].includes(config.bot.presence.activity),
    consoleLogTranslation.checkErrorConfig.botStatusActivity
  );
  checkError(!['java', 'bedrock'].includes(config.mcserver.type), consoleLogTranslation.checkErrorConfig.mcType);
  
  // Check if name is missing or empty
  checkError(!config.mcserver.name || config.mcserver.name === '', consoleLogTranslation.checkErrorConfig.mcName);
  
  // Check if version is missing or empty
  checkError(!config.mcserver.version || config.mcserver.version === '', consoleLogTranslation.checkErrorConfig.mcVersion);
  
  checkError(
    config.playerCountCH.enabled && config.playerCountCH.guildID === 'your-guild-id-here',
    consoleLogTranslation.checkErrorConfig.guildID
  );

  // Get current environment
  const env = process.env.NODE_ENV || 'development';
  
  // In development or test environments, set intervals to 30 seconds
  if (env === 'development' || env === 'test') {
    // Override the intervals in config for development/test environments
    config.autoChangeStatus.updateInterval = 30;
    config.playerCountCH.updateInterval = 30;
    logger.info(`Environment: ${env} - Setting update intervals to 30 seconds for faster testing`);
  } else {
    // In production or other environments, check if intervals are at least 60 seconds
    checkError(
      config.autoChangeStatus.updateInterval < 60,
      'Auto change status updateInterval must be at least 60 seconds in production.'
    );
    checkError(
      config.playerCountCH.updateInterval < 60,
      'Player CH count updateInterval must be at least 60 seconds in production.'
    );
  }

  for (const key in cmdSlashTranslation) {
    if (Object.hasOwn(cmdSlashTranslation, key)) {
      const cmdObject = cmdSlashTranslation[key];
      const cmdName = cmdObject.name;
      if (cmdName === 'help') {
        if (!/^[\p{Ll}\p{Lm}\p{Lo}\p{N}\p{sc=Devanagari}\p{sc=Thai}_-]+$/u.test(cmdObject.options.name)) {
          errors.push(
            consoleLogTranslation.checkErrorConfig.slashCmdName
              .replace(/\{givenCmdName\}/gi, cmdObject.options.name)
              .replace(/\{cmdName\}/gi, key + '.options')
          );
        }
      }
      if (!/^[\p{Ll}\p{Lm}\p{Lo}\p{N}\p{sc=Devanagari}\p{sc=Thai}_-]+$/u.test(cmdName)) {
        errors.push(
          consoleLogTranslation.checkErrorConfig.slashCmdName
            .replace(/\{givenCmdName\}/gi, cmdName)
            .replace(/\{cmdName\}/gi, key)
        );
      }
    }
  }

  if (errors.length > 0) {
    logger.error(consoleLogTranslation.checkErrorConfig.followingErrors);
    errors.forEach((errorMsg) => logger.error(chalk.hex('#FFA500')(errorMsg)));
    process.exit(1);
  }
})();

// ---------------------
// Utility Functions
// ---------------------

const groupPlayerList = (playerListArrayRaw) => {
  const { online, max, list } = playerListArrayRaw;
  const baseEmbed = [{
    name: embedTranslation.players.title,
    value: embedTranslation.players.description
      .replace(/\{playeronline\}/gi, online)
      .replace(/\{playermax\}/gi, max),
  }];

  const groups = Array.from({ length: 3 }, () => []);
  list.forEach((person, index) => {
    groups[index % 3].push(person.name_clean ?? person);
  });

  groups.forEach((group) => {
    if (group.length > 0) {
      const name = `• ${group[0]}`;
      const value = group.length > 1 ? `**• ${group.slice(1).join('\n• ')}**` : '‎ ';
      baseEmbed.push({ name, value, inline: true });
    }
  });

  return baseEmbed;
};

function getWarning(warningMessage) {
  migrationGetWarning(warningMessage);
}

function getDebug(debugMessage) {
  migrationGetDebug(debugMessage);
}

const getServerDataAndPlayerList = async (dataOnly) => {
  try {
    // Use serverDataManager to get server data
    const result = await serverDataManager.getServerData(config);
    
    // Use the new logger
    logger.info(`ServerData: Request processed, dataOnly=${dataOnly}, isOnline=${result?.isOnline}`);
    
    if (dataOnly) {
      return {
        data: result.data,
        isOnline: result.isOnline
      };
    }
    
    if (result.isOnline) {
      try {
        const playerListArray = await getPlayersList(result.data.players);
        return {
          data: result.data,
          playerListArray,
          isOnline: result.isOnline
        };
      } catch (playerListError) {
        logger.error('ServerData: Error getting player list', playerListError);
        // If getting player list fails, use empty list but continue
        return {
          data: result.data,
          playerListArray: [],
          isOnline: result.isOnline
        };
      }
    } else {
      return {
        data: result.data,
        playerListArray: [],
        isOnline: false
      };
    }
  } catch (error) {
    logger.error('ServerData: Failed to get data and player list', error);
    return {
      data: null,
      playerListArray: [],
      isOnline: false
    };
  }
};

const getPlayersList = async (playerListRaw) => {
  try {
    const baseEmbed = [
      {
        name: embedTranslation.players.title,
        value: embedTranslation.players.description
          .replace(/\{playeronline\}/gi, playerListRaw.online)
          .replace(/\{playermax\}/gi, playerListRaw.max),
      },
    ];
    return (!playerListRaw.list?.length || config.mcserver.type === 'bedrock')
      ? baseEmbed
      : groupPlayerList(playerListRaw);
  } catch (error) {
    logger.error('Error processing player list', error);
    // Return a default value when an error occurs
    return [
      {
        name: embedTranslation.players.title,
        value: 'Error retrieving player list',
      },
    ];
  }
};

const getPlayersListWithEmoji = async (playerListRaw, client) => {
  try {
    const emojisList = await client.application.emojis.fetch();
    const playerNames = playerListRaw.list.map((player) => player.name_clean);
    const existingEmojis = new Map();
    for (const emoji of emojisList.values()) {
      existingEmojis.set(emoji.name, emoji);
    }
    const playerList = await Promise.all(
      playerListRaw.list.map(async ({ name_clean, uuid }) => {
        let emoji = existingEmojis.get(name_clean);
        if (!emoji) {
          emoji = await client.application.emojis.create({
            attachment: `https://api.mineatar.io/head/${uuid}?scale=8&overlay=true`,
            name: name_clean,
          });
        }
        return { name_clean: `<:${emoji.name}:${emoji.id}> ${emoji.name}` };
      })
    );
    const result = groupPlayerList({
      online: playerListRaw.online,
      max: playerListRaw.max,
      list: playerList,
    });
    await Promise.all(
      Array.from(emojisList.values())
        .filter((emoji) => !playerNames.includes(emoji.name))
        .map((emoji) => emoji.delete())
    );
    return result;
  } catch (error) {
    if (!config.settings.logging.errorLog) return;
    logger.error('Error processing player avatar emoji', error);
  }
};

const statusMessageEdit = async (ip, port, type, name, message, isPlayerAvatarEmoji, client) => {
  try {
    // Create a temporary config object to get data for a specific server
    const tempConfig = {
      ...config,
      mcserver: {
        ...config.mcserver,
        ip,
        port,
        type
      }
    };
    
    // Use serverDataManager to get server data
    const result = await serverDataManager.getServerData(tempConfig);
    
    // If unable to get data, display offline status
    if (!result || !result.data) {
      logger.error('StatusMsg: Failed to get server data, showing offline status');
      const { offlineStatus } = await import('./embeds.js');
      await message.edit({ content: '', embeds: [offlineStatus()] });
      return;
    }
    
    const { data, isOnline } = result;
    
    const ipBedrock = `IP: \`${ip}\`\nPort: \`${port}\``;
    const portNumber = port === 25565 ? '' : `:\`${port}\``;
    const ipJava = `**IP: \`${ip}\`${portNumber}**`;
    const ipaddress = type === 'bedrock' ? ipBedrock : ipJava;
    
    if (isOnline) {
      let playerList;
      try {
        playerList =
          isPlayerAvatarEmoji && config.autoChangeStatus.playerAvatarEmoji
            ? await getPlayersListWithEmoji(data.players, client)
            : await getPlayersList(data.players);
      } catch (playerListError) {
        logger.error('StatusMsg: Failed to get player list', playerListError);
        playerList = [];
      }
      
      function editDescriptionFields(description) {
        const versionStr = type === 'java' ? data.version.name_clean : data.version.name;
        return description
          .trim()
          .replace(/\{ip\}/gi, ipaddress)
          .replace(/\{motd\}/gi, data.motd.clean)
          .replace(/\{version\}/gi, versionStr)
          .replace(/\{siteText\}/gi, '');
      }
      
      const description_field_one = editDescriptionFields(embedTranslation.onlineEmbed.description_field_one);
      const description_field_two = editDescriptionFields(embedTranslation.onlineEmbed.description_field_two);
      const title = editDescriptionFields(embedTranslation.onlineEmbed.title);
      const onlineEmbed = new EmbedBuilder()
        .setColor(config.settings.embedsColors.online)
        .setAuthor({ name: name })
        .setThumbnail(`https://api.mcstatus.io/v2/icon/${ip}:${port}`)
        .setTitle(title)
        .addFields(playerList)
        .addFields({ name: description_field_one, value: description_field_two })
        .setTimestamp()
        .setFooter({ text: embedTranslation.onlineEmbed.footer });
      await message.edit({ content: '', embeds: [onlineEmbed] });
    } else {
      const { offlineStatus } = await import('./embeds.js');
      await message.edit({ content: '', embeds: [offlineStatus()] });
    }
  } catch (error) {
    logger.error('StatusMsg: Error updating message', error);
    
    try {
      // Try to display offline status even when an error occurs
      const { offlineStatus } = await import('./embeds.js');
      await message.edit({ content: '', embeds: [offlineStatus()] });
    } catch (secondError) {
      // If even displaying offline status fails, just log the error
      logger.error('StatusMsg: Failed to show offline status', secondError);
    }
  }
};

// ---------------------
// Exports
// ---------------------

export {
  getServerDataAndPlayerList,
  getPlayersList,
  getPlayersListWithEmoji,
  statusMessageEdit,
  embedTranslation,
  cmdSlashTranslation,
  consoleLogTranslation,
  getWarning,
  getDebug,
};

// ---------------------
// CommandKit Initialization & Bot Login
// ---------------------

new CommandKit({
  client,
  eventsPath: path.join(__dirname, 'events'),
  commandsPath: path.join(__dirname, 'commands'),
  bulkRegister: true,
});

client.login(config.bot.token).catch((error) => {
  logger.error('Bot login error:', error);
});