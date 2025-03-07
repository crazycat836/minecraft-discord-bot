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
  checkError(config.bot.token.startsWith('your-bot-token-here'), consoleLogTranslation.checkErrorConfig.botToken);
  checkError(
    !['online', 'idle', 'dnd', 'invisible'].includes(config.bot.presence.status.online && config.bot.presence.status.offline),
    consoleLogTranslation.checkErrorConfig.botPresenceStatus
  );
  checkError(
    !['Playing', 'Listening', 'Watching', 'Competing'].includes(config.bot.presence.activity),
    consoleLogTranslation.checkErrorConfig.botStatusActivity
  );
  checkError(!['java', 'bedrock'].includes(config.mcserver.type), consoleLogTranslation.checkErrorConfig.mcType);
  checkError(!config.mcserver.name, consoleLogTranslation.checkErrorConfig.mcName);
  checkError(!config.mcserver.version, consoleLogTranslation.checkErrorConfig.mcVersion);
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
    const data =
      config.mcserver.type === 'java'
        ? await statusJava(config.mcserver.ip, config.mcserver.port)
        : await statusBedrock(config.mcserver.ip, config.mcserver.port);
    const isOnline = config.autoChangeStatus.isOnlineCheck ? data.online && data.players.max > 0 : data.online;
    if (isOnline) {
      if (dataOnly) return { data, isOnline };
      const playerListArray = await getPlayersList(data.players);
      return { data, playerListArray, isOnline };
    } else {
      return { data, playerListArray: [], isOnline };
    }
  } catch (error) {
    if (dataOnly) {
      getError(error, 'fetchServerData');
      return;
    }
    getError(error, 'fetchServerDataAndPlayerList');
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
    const data = type === 'java' ? await statusJava(ip, port) : await statusBedrock(ip, port);
    const isOnline = config.autoChangeStatus.isOnlineCheck ? data.online && data.players.max > 0 : data.online;
    const ipBedrock = `IP: \`${ip}\`\nPort: \`${port}\``;
    const portNumber = port === 25565 ? '' : `:\`${port}\``;
    const ipJava = `**IP: \`${ip}\`${portNumber}**`;
    const ipaddress = type === 'bedrock' ? ipBedrock : ipJava;
    if (isOnline) {
      const playerList =
        isPlayerAvatarEmoji && config.autoChangeStatus.playerAvatarEmoji
          ? await getPlayersListWithEmoji(data.players, client)
          : await getPlayersList(data.players);
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
    getError(error, 'messageEdit');
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
