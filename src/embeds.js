import { EmbedBuilder, codeBlock } from 'discord.js';
import config from '../config.js';
import { embedTranslation, getServerDataAndPlayerList, getServerConfig } from './index.js';
import process from 'node:process';
import os from 'os';
import logger from './utils/logger.js';

const { mcserver, commands } = config;

// Helper to get dynamic config from data.json
// Helper to get dynamic config from data.json via index.js helper
const getDynamicConfig = async () => {
  try {
    const conf = await getServerConfig();
    const { ip, port, type, name, site, version } = conf.mcserver;
    const portStr = port === 25565 ? '' : `:${port}`;

    // Construct fullIp logic matching previous logic
    const fullIp = type === 'bedrock' ? ip : `${ip}${portStr}`;

    return {
      ip,
      port: port.toString(),
      fullIp,
      name,
      site,
      version,
      type
    };
  } catch (error) {
    logger.warn('Error fetching dynamic config:', error);
    return {
      ip: 'Not Configured',
      port: '',
      fullIp: 'Not Configured',
      name: 'Minecraft Server',
      site: '',
      version: 'Unknown',
      type: 'java'
    };
  }
};

// Generate IP string based on server type (Bedrock vs. Java)
const getIpString = (conf) => {
  if (conf.type === 'bedrock') {
    return `IP: \`${conf.ip}\`\nPort: \`${conf.port.replace(':', '')}\``;
  }
  return `**IP: \`${conf.fullIp}\`**`;
};

// Function to get server icon URL
const getServerIconUrl = (ip, port) => {
  const portStr = port ? port.replace(':', '') : '';
  return `https://api.mcstatus.io/v2/icon/${ip}:${portStr}`;
};

/**
 * Helper function to replace placeholders in a template string.
 * @param {string} template - The template string containing placeholders.
 * @param {object} replacements - An object mapping placeholder keys to replacement values.
 * @returns {string} - The formatted string.
 */
function replacePlaceholders(template, replacements) {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, value);
  }
  return result;
}

// Embed for site commands
const siteEmbed = async () => {
  const conf = await getDynamicConfig();
  return new EmbedBuilder()
    .setColor('Aqua')
    .setThumbnail(getServerIconUrl(conf.ip, conf.port))
    .setAuthor({ name: conf.name })
    .setTitle(replacePlaceholders(embedTranslation.site.title, { site: conf.site }))
    .setDescription(replacePlaceholders(embedTranslation.site.description, { site: conf.site }));
};

// Embed for version commands
const versionEmbed = async () => {
  const conf = await getDynamicConfig();
  return new EmbedBuilder()
    .setColor('Aqua')
    .setThumbnail(getServerIconUrl(conf.ip, conf.port))
    .setAuthor({ name: conf.name })
    .setTitle(replacePlaceholders(embedTranslation.version.title, { version: conf.version }))
    .setDescription(replacePlaceholders(embedTranslation.version.description, { version: conf.version }));
};

// Embed for ip commands
const ipEmbed = async () => {
  const conf = await getDynamicConfig();
  const ipStr = getIpString(conf);
  return new EmbedBuilder()
    .setColor('Aqua')
    .setThumbnail(getServerIconUrl(conf.ip, conf.port))
    .setAuthor({ name: conf.name })
    .setTitle(replacePlaceholders(embedTranslation.ip.title, { ip: ipStr }))
    .setDescription(replacePlaceholders(embedTranslation.ip.description, { ip: ipStr }));
};

// Offline embed for status commands
const offlineStatus = async () => {
  const conf = await getDynamicConfig();
  const ipStr = getIpString(conf);
  try {
    // Create base embed first
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setThumbnail(getServerIconUrl(conf.ip, conf.port))
      .setAuthor({ name: conf.name })
      .setTitle(embedTranslation.offlineEmbed.title)
      .setTimestamp()
      .setFooter({ text: embedTranslation.offlineEmbed.footer });

    // Check if description exists in translation
    if (embedTranslation.offlineEmbed.description && embedTranslation.offlineEmbed.description.trim() !== '') {
      const description = embedTranslation.offlineEmbed.description
        .replace(/\{ip\}/gi, ipStr)
        .replace(/\{port\}/gi, conf.port);

      embed.setDescription(description);
    }

    return embed;
  } catch (error) {
    logger.error('Error creating offline status embed', error);
    return new EmbedBuilder()
      .setColor('Red')
      .setTitle('Server Offline')
      .setDescription('Error creating embed');
  }
};

// Error embed for status commands
const errorStatus = async (errorMessage) => {
  const conf = await getDynamicConfig();
  try {
    const description = embedTranslation.errorEmbed.description
      ? replacePlaceholders(embedTranslation.errorEmbed.description, { error: errorMessage || 'Unknown error' })
      : errorMessage;

    return new EmbedBuilder()
      .setColor('Orange')
      .setThumbnail(getServerIconUrl(conf.ip, conf.port))
      .setAuthor({ name: conf.name })
      .setTitle(embedTranslation.errorEmbed.title)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: embedTranslation.errorEmbed.footer });
  } catch (error) {
    logger.error('Error creating error status embed', error);
    return await offlineStatus();
  }
};

// MOTD embed for motd commands
const motdEmbed = async () => {
  const conf = await getDynamicConfig();
  // Pass dynamic config to getServerData to ensure we probe the right server
  const { data, isOnline } = await getServerDataAndPlayerList(conf);
  if (!isOnline) {
    return await offlineStatus();
  } else {
    const replacements = { motd: data.motd.clean };
    return new EmbedBuilder()
      .setColor('Green')
      .setThumbnail(getServerIconUrl(conf.ip, conf.port))
      .setAuthor({ name: conf.name })
      .setTitle(replacePlaceholders(embedTranslation.motd.title, replacements))
      .setDescription(replacePlaceholders(embedTranslation.motd.description, replacements))
      .setFooter({ text: 'Checked at' })
      .setTimestamp();
  }
};

// Embed for players commands
const playerList = async () => {
  const conf = await getDynamicConfig();
  try {
    const { playerListArray, isOnline } = await getServerDataAndPlayerList(conf);
    if (!isOnline) {
      return await offlineStatus();
    } else {
      return new EmbedBuilder()
        .setColor('Green')
        .setThumbnail(getServerIconUrl(conf.ip, conf.port))
        .setAuthor({ name: conf.name })
        .addFields(playerListArray)
        .setTimestamp()
        .setFooter({ text: embedTranslation.offlineEmbed.footer });
    }
  } catch (error) {
    logger.error('Error creating players embed', error);
    return await offlineStatus();
  }
};

// Embed for status commands based on online status
const statusEmbed = async (result) => {
  if (!result) {
    // If result is not provided, get server data
    const serverData = await getServerDataAndPlayerList();
    return serverData.isOnline ? await OnlineEmbed(serverData.data, serverData.playerListArray) : await offlineStatus();
  }

  return result.isOnline ? await OnlineEmbed(result.data, result.playerListArray) : await offlineStatus();
};

// Online embed for status commands
const OnlineEmbed = async (data, playerlist) => {
  const conf = await getDynamicConfig();
  const ipStr = getIpString(conf);
  try {
    // Local helper to edit and replace description fields
    const editDescriptionFields = (description) => {
      const siteText = conf.site
        ? replacePlaceholders(embedTranslation.onlineEmbed.siteText, { site: conf.site })
        : '';
      return description
        .trim()
        .replace(/\{ip\}/gi, ipStr)
        .replace(/\{motd\}/gi, data.motd.clean)
        .replace(/\{version\}/gi, conf.version)
        .replace(/\{siteText\}/gi, siteText);
    };

    const description_field_one = editDescriptionFields(embedTranslation.onlineEmbed.description_field_one);
    const description_field_two = editDescriptionFields(embedTranslation.onlineEmbed.description_field_two);
    const title = editDescriptionFields(embedTranslation.onlineEmbed.title);

    return new EmbedBuilder()
      .setColor('Green')
      .setThumbnail(getServerIconUrl(conf.ip, conf.port))
      .setAuthor({ name: conf.name })
      .setTitle(title)
      .addFields(playerlist)
      .addFields({
        name: description_field_one,
        value: description_field_two,
      })
      .setTimestamp()
      .setFooter({ text: embedTranslation.onlineEmbed.footer });
  } catch (error) {
    logger.error('Error creating online embed', error);
    return await offlineStatus();
  }
};

// Help embed for commands; if commandName is provided, show detailed info for that command.
const helpEmbed = async (client, commandName) => {
  const commandsFetch = await client.application.commands.fetch();
  if (commandName) {
    // Use Array.find to locate the slash command data
    const slashCmdData = commandsFetch.find((slashCmd) => slashCmd.name === commandName);
    if (!slashCmdData) return;
    return new EmbedBuilder()
      .setAuthor({
        name: client.user.username,
        iconURL: client.user.avatarURL(),
      })
      .setColor('Yellow')
      .setTitle(
        replacePlaceholders(embedTranslation.help.commandInfoFormat.title, {
          cmdName: slashCmdData.name.charAt(0).toUpperCase() + slashCmdData.name.slice(1),
        })
      )
      .setDescription(
        replacePlaceholders(embedTranslation.help.commandInfoFormat.description, {
          cmdSlashMention: `</${slashCmdData.name}:${slashCmdData.id}>`,
          cmdDescription: slashCmdData.description,
          prefixCmd: commands.prefixCommands.prefix + slashCmdData.name,
          prefixCmdAlias:
            commands[slashCmdData.name].alias.length
              ? `\`${commands[slashCmdData.name].alias.join('`, `')}\``
              : '',
        })
      );
  }

  // Build a list of all valid command names from config, excluding system keys
  const visibleCmdsNames = Object.keys(commands).filter(
    key => !['slashCommands', 'prefixCommands'].includes(key)
  );
  const cmdsList = [];

  // Add each fetched command that is in our valid commands list
  commandsFetch.forEach((command) => {
    if (visibleCmdsNames.includes(command.name)) {
      cmdsList.push(
        replacePlaceholders(embedTranslation.help.listFormat, {
          slashCmdMention: `</${command.name}:${command.id}>`,
          cmdDescription: command.description,
        })
      );
    }
  });

  return new EmbedBuilder()
    .setTitle(
      replacePlaceholders(embedTranslation.help.title, {
        prefix: commands.prefixCommands.prefix,
        botName: client.user.username,
      })
    )
    .setColor('Yellow')
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.avatarURL(),
    })
    .setDescription(
      `${replacePlaceholders(embedTranslation.help.description, {
        prefix: commands.prefixCommands.prefix,
        botName: client.user.username,
      })}\n${cmdsList.join('\n')}`
    );
};

// Bot information embed
const botInfoEmbed = async (interaction, client) => {
  const reply = await interaction.fetchReply();
  const ping = reply.createdTimestamp - interaction.createdTimestamp;
  const cpuUsage = (os.loadavg()[0] / os.cpus().length).toFixed(2);
  const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const nodeVersion = process.version;
  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeMinutes = Math.floor(uptimeSeconds / 60) % 60;
  const uptimeHours = Math.floor(uptimeMinutes / 60) % 24;
  const uptimeDays = Math.floor(uptimeHours / 24);
  return new EmbedBuilder()
    .setAuthor({
      name: client.user.tag,
      iconURL: client.user.avatarURL(),
    })
    .setTitle(embedTranslation.info.title)
    .setColor('Yellow')
    .setDescription(
      replacePlaceholders(embedTranslation.info.description, {
        cpuUsage,
        memoryUsage,
        nodeVersion,
        uptimeDays,
        uptimeHours,
        uptimeMinutes,
        uptimeSeconds,
        ping,
        websocket: client.ws.ping,
      })
    );
};

export {
  versionEmbed,
  siteEmbed,
  offlineStatus,
  errorStatus,
  ipEmbed,
  playerList,
  statusEmbed,
  OnlineEmbed,
  motdEmbed,
  helpEmbed,
  botInfoEmbed,
};