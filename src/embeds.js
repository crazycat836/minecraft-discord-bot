import { EmbedBuilder, codeBlock } from 'discord.js';
import config from '../config.js';
import { embedTranslation, getServerDataAndPlayerList } from './index.js';
import process from 'node:process';
import os from 'os';
import logger from './utils/logger.js';

const { mcserver, commands, settings } = config;

// Generate IP string based on server type (Bedrock vs. Java)
const ipBedrock = `IP: \`${mcserver.ip}\`\nPort: \`${mcserver.port}\``;
const port = mcserver.port === 25565 ? '' : `:\`${mcserver.port}\``;
const ipJava = `**IP: \`${mcserver.ip}\`${port}**`;
const ip = mcserver.type === 'bedrock' ? ipBedrock : ipJava;

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
const siteEmbed = new EmbedBuilder()
  .setColor(settings.embedsColors.basicCmds)
  .setThumbnail(mcserver.icon)
  .setAuthor({ name: mcserver.name })
  .setTitle(replacePlaceholders(embedTranslation.site.title, { site: mcserver.site }))
  .setDescription(replacePlaceholders(embedTranslation.site.description, { site: mcserver.site }));

// Embed for version commands
const versionEmbed = new EmbedBuilder()
  .setColor(settings.embedsColors.basicCmds)
  .setThumbnail(mcserver.icon)
  .setAuthor({ name: mcserver.name })
  .setTitle(replacePlaceholders(embedTranslation.version.title, { version: mcserver.version }))
  .setDescription(replacePlaceholders(embedTranslation.version.description, { version: mcserver.version }));

// Embed for ip commands
const ipEmbed = new EmbedBuilder()
  .setColor(settings.embedsColors.basicCmds)
  .setThumbnail(mcserver.icon)
  .setAuthor({ name: mcserver.name })
  .setTitle(replacePlaceholders(embedTranslation.ip.title, { ip }))
  .setDescription(replacePlaceholders(embedTranslation.ip.description, { ip }));

// Offline embed for status commands
const offlineStatus = () => {
  try {
    // Create base embed first
    const embed = new EmbedBuilder()
      .setColor(settings.embedsColors.offline)
      .setThumbnail(mcserver.icon)
      .setAuthor({ name: mcserver.name })
      .setTitle(embedTranslation.offlineEmbed.title)
      .setTimestamp()
      .setFooter({ text: embedTranslation.offlineEmbed.footer });
    
    // Only set description if it's not empty
    if (embedTranslation.offlineEmbed.description && embedTranslation.offlineEmbed.description.trim() !== '') {
      const description = embedTranslation.offlineEmbed.description
        .replace(/\{ip\}/gi, ip)
        .replace(/\{port\}/gi, port);
      
      embed.setDescription(description);
    }
    
    return embed;
  } catch (error) {
    logger.error('Error creating offline status embed', error);
    return new EmbedBuilder()
      .setColor(settings.embedsColors.offline)
      .setTitle('Server Offline')
      .setDescription('Error creating embed');
  }
};

// MOTD embed for motd commands
const motdEmbed = async () => {
  const { data, isOnline } = await getServerDataAndPlayerList(true);
  if (!isOnline) {
    return offlineStatus();
  } else {
    const replacements = { motd: data.motd.clean };
    return new EmbedBuilder()
      .setColor(settings.embedsColors.online)
      .setThumbnail(mcserver.icon)
      .setAuthor({ name: mcserver.name })
      .setTitle(replacePlaceholders(embedTranslation.motd.title, replacements))
      .setDescription(replacePlaceholders(embedTranslation.motd.description, replacements))
      .setFooter({ text: 'Checked at' })
      .setTimestamp();
  }
};

// Embed for players commands
const playerList = async () => {
  try {
    const { playerListArray, isOnline } = await getServerDataAndPlayerList();
    if (!isOnline) {
      return offlineStatus();
    } else {
      return new EmbedBuilder()
        .setColor(settings.embedsColors.online)
        .setThumbnail(mcserver.icon)
        .setAuthor({ name: mcserver.name })
        .addFields(playerListArray)
        .setTimestamp()
        .setFooter({ text: embedTranslation.offlineEmbed.footer });
    }
  } catch (error) {
    logger.error('Error creating players embed', error);
    return offlineStatus();
  }
};

// Embed for status commands based on online status
const statusEmbed = async () => {
  const { data, playerListArray, isOnline } = await getServerDataAndPlayerList();
  return isOnline ? await OnlineEmbed(data, playerListArray) : offlineStatus();
};

// Online embed for status commands
const OnlineEmbed = async (data, playerlist) => {
  try {
    // Local helper to edit and replace description fields
    const editDescriptionFields = (description) => {
      const siteText = mcserver.site
        ? replacePlaceholders(embedTranslation.onlineEmbed.siteText, { site: mcserver.site })
        : '';
      return description
        .trim()
        .replace(/\{ip\}/gi, ip)
        .replace(/\{motd\}/gi, data.motd.clean)
        .replace(/\{version\}/gi, mcserver.version)
        .replace(/\{siteText\}/gi, siteText);
    };

    const description_field_one = editDescriptionFields(embedTranslation.onlineEmbed.description_field_one);
    const description_field_two = editDescriptionFields(embedTranslation.onlineEmbed.description_field_two);
    const title = editDescriptionFields(embedTranslation.onlineEmbed.title);

    return new EmbedBuilder()
      .setColor(settings.embedsColors.online)
      .setThumbnail(mcserver.icon)
      .setAuthor({ name: mcserver.name })
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
    return offlineStatus();
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

  // Build a list of enabled command names from config
  const visibleCmdsNames = [];
  for (const key in commands) {
    if (commands[key].enabled) {
      visibleCmdsNames.push(key);
    }
  }
  const cmdsList = [];
  // Add each fetched command that is enabled in config
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
  ipEmbed,
  ip,
  playerList,
  statusEmbed,
  OnlineEmbed,
  motdEmbed,
  helpEmbed,
  botInfoEmbed,
};