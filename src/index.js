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

// Debug: Log environment variables to verify they are loaded
console.log(chalk.blue('Environment Variables Debug:'));
console.log(chalk.green('DISCORD_BOT_TOKEN exists:'), !!process.env.DISCORD_BOT_TOKEN);
console.log(chalk.green('MC_SERVER_NAME:'), process.env.MC_SERVER_NAME || 'Not set');
console.log(chalk.green('MC_SERVER_VERSION:'), process.env.MC_SERVER_VERSION || 'Not set');

// Debug: Log config object to verify it's correctly populated
console.log(chalk.blue('Config Object Debug:'));
console.log(chalk.green('config.bot.token exists:'), !!config.bot.token);
console.log(chalk.green('config.mcserver.name:'), config.mcserver.name || 'Not set');
console.log(chalk.green('config.mcserver.version:'), config.mcserver.version || 'Not set');

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
  console.log(`${getDateNow()} | ${chalk.redBright('ERROR')} | ${chalk.bold('Uncaught Exception')}:`, error);
});

process.on('unhandledRejection', (reason) => {
  console.log(`${getDateNow()} | ${chalk.redBright('ERROR')} | ${chalk.bold('Unhandled Rejection')}:`, reason);
});

// ---------------------
// Translation File Loading (Synchronous for Startup)
// ---------------------

const languageEmbedOutput = config.settings.language.embeds || config.settings.language.main;
const embedFileContent = fs.readFileSync(`./translation/${languageEmbedOutput}/embeds.json5`, 'utf8');
const embedTranslation = json5.parse(embedFileContent);

const languageConsoleOutput = config.settings.language.consoleLog || config.settings.language.main;
const consoleLogFileContent = fs.readFileSync(`./translation/${languageConsoleOutput}/console-log.json5`, 'utf8');
const consoleLogTranslation = json5.parse(consoleLogFileContent);

const cmdSlashLanguageOutput = config.settings.language.slashCmds || config.settings.language.main;
const cmdSlashContents = fs.readFileSync(`./translation/${cmdSlashLanguageOutput}/slash-cmds.json5`, 'utf8');
const cmdSlashTranslation = json5.parse(cmdSlashContents);

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
  console.log(chalk.blue(consoleLogTranslation.checkErrorConfig.checkConfigWait));

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

  if (!config.settings.logging.debug) {
    checkError(
      config.autoChangeStatus.updateInterval < 60,
      'Auto change status updateInterval must be at least 60 seconds.'
    );
    checkError(
      config.playerCountCH.updateInterval < 60,
      'Player CH count updateInterval must be at least 60 seconds.'
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
    console.error(chalk.red(consoleLogTranslation.checkErrorConfig.followingErrors));
    errors.forEach((errorMsg) => console.log(chalk.hex('#FFA500')(errorMsg)));
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

function getError(error, errorMsg) {
  if (config.settings.logging.error) {
    console.log(
      `${getDateNow()} | ${chalk.red('ERROR')} | ${chalk.white.bold(consoleLogTranslation.error[errorMsg])}: ${chalk.hex('#FFA500')(error.message)}`
    );
  }
}

function getWarning(warningMessage) {
  if (config.settings.logging.warning) {
    console.log(
      `${chalk.gray(getDateNow())} | ${chalk.hex('#FFA500')('WARNING')} | ${chalk.white.bold(warningMessage)}`
    );
  }
}

function getDebug(debugMessage) {
  if (config.settings.logging.debug) {
    console.log(`${chalk.gray(getDateNow())} | ${chalk.yellow('DEBUG')} | ${chalk.white.bold(debugMessage)}`);
  }
}

const getServerDataAndPlayerList = async (dataOnly) => {
  try {
    // 使用 serverDataManager 獲取伺服器數據
    const result = await serverDataManager.getServerData(config);
    
    // 添加日誌輸出
    console.log(`${getDateNow()} | ${chalk.blue('INFO')} | getServerDataAndPlayerList called, dataOnly=${dataOnly}, isOnline=${result?.isOnline}`);
    
    if (dataOnly) {
      return {
        data: result.data,
        isOnline: result.isOnline
      };
    }
    
    if (result.isOnline) {
      const playerListArray = await getPlayersList(result.data.players);
      return {
        data: result.data,
        playerListArray,
        isOnline: result.isOnline
      };
    } else {
      return {
        data: result.data,
        playerListArray: [],
        isOnline: result.isOnline
      };
    }
  } catch (error) {
    getError(error, 'fetchServerDataAndPlayerList');
    // Return a default object with offline status to prevent destructuring errors
    return { 
      data: { online: false, players: { online: 0, max: 0 } }, 
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
    getError(error, 'playerList');
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
    getError(error, 'playerAvatarEmojiError');
  }
};

const statusMessageEdit = async (ip, port, type, name, message, isPlayerAvatarEmoji, client) => {
  try {
    console.log(`${getDateNow()} | ${chalk.blue('INFO')} | Editing status message for ${ip}:${port}`);
    
    // 創建一個臨時配置對象，用於獲取特定伺服器的數據
    const tempConfig = {
      ...config,
      mcserver: {
        ...config.mcserver,
        ip,
        port,
        type
      }
    };
    
    // 使用 serverDataManager 獲取伺服器數據
    const result = await serverDataManager.getServerData(tempConfig);
    console.log(`${getDateNow()} | ${chalk.blue('INFO')} | Server data fetched, isOnline=${result?.isOnline}`);
    
    // 如果無法獲取數據，顯示離線狀態
    if (!result || !result.data) {
      console.log(`${getDateNow()} | ${chalk.red('ERROR')} | Failed to get server data, showing offline status`);
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
      console.log(`${getDateNow()} | ${chalk.green('SUCCESS')} | Server is online, creating online embed`);
      let playerList;
      try {
        playerList =
          isPlayerAvatarEmoji && config.autoChangeStatus.playerAvatarEmoji
            ? await getPlayersListWithEmoji(data.players, client)
            : await getPlayersList(data.players);
      } catch (playerListError) {
        // 如果獲取玩家列表失敗，使用空列表但繼續
        console.log(`${getDateNow()} | ${chalk.yellow('WARN')} | Failed to get player list: ${playerListError.message}`);
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
      console.log(`${getDateNow()} | ${chalk.green('SUCCESS')} | Status message updated with online status`);
    } else {
      console.log(`${getDateNow()} | ${chalk.yellow('WARN')} | Server is offline, showing offline status`);
      const { offlineStatus } = await import('./embeds.js');
      await message.edit({ content: '', embeds: [offlineStatus()] });
    }
  } catch (error) {
    console.log(`${getDateNow()} | ${chalk.red('ERROR')} | Error editing status message: ${error.message}`);
    getError(error, 'messageEdit');
    // 嘗試即使在出錯時也顯示離線狀態
    try {
      const { offlineStatus } = await import('./embeds.js');
      await message.edit({ content: '', embeds: [offlineStatus()] });
    } catch (embedError) {
      // 如果連顯示離線狀態都失敗，只記錄錯誤
      console.error('Failed to show offline status:', embedError);
    }
  }
};

// ---------------------
// Exports
// ---------------------

export {
  getServerDataAndPlayerList,
  getError,
  getWarning,
  getDateNow,
  getDebug,
  statusMessageEdit,
  getPlayersList,
  embedTranslation,
  consoleLogTranslation,
  cmdSlashTranslation,
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
  console.error('Bot login error:', error);
});