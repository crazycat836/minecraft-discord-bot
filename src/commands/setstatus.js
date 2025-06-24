import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import { statusMessageEdit, consoleLogTranslation, cmdSlashTranslation } from '../index.js';
import config from '../../config.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import isIP from 'validator/lib/isIP.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Generate the absolute path to data.json located in the parent directory of this file
const dataJsonPath = path.join(__dirname, '..', 'data.json');

const { autoChangeStatus, mcserver } = config;

// Build the slash command using SlashCommandBuilder
let data = new SlashCommandBuilder()
  .setName(cmdSlashTranslation.setstatus.name)
  .setDescription(cmdSlashTranslation.setstatus.description)
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription(cmdSlashTranslation.setstatus.serverName)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('ip')
      .setDescription(cmdSlashTranslation.setstatus.serverIp)
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('port')
      .setDescription(cmdSlashTranslation.setstatus.serverPort)
      .setMinValue(1)
      .setMaxValue(65535)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('type')
      .setDescription(cmdSlashTranslation.setstatus.serverType)
      .addChoices({ name: 'Java', value: 'java' }, { name: 'Bedrock', value: 'bedrock' })
      .setRequired(true)
  );

// If playerAvatarEmoji feature is enabled, add a boolean option
if (autoChangeStatus.playerAvatarEmoji) {
  data.addBooleanOption((option) =>
    option
      .setName('player_avatar')
      .setDescription(cmdSlashTranslation.setstatus.playerAvatar)
  );
}

// If adminOnly is enabled, restrict command usage to members with ManageChannels permission
if (autoChangeStatus.adminOnly) {
  data.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);
}

export { data };

/**
 * Validates if the input is a valid hostname or IP address
 * @param {string} input - The hostname or IP to validate
 * @returns {boolean} - True if valid hostname or IP
 */
function isValidHostnameOrIP(input) {
  // Remove http:// or https:// prefixes if present
  const cleanInput = input.replace(/^https?:\/\//i, '');
  
  // Check if it's a valid IP address
  if (isIP(cleanInput)) {
    return true;
  }
  
  // Simple domain name validation (allows subdomains like mc.gary-hsu.com)
  // This regex checks for a valid domain name pattern
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(cleanInput);
}

export async function run({ interaction, client }) {
  try {
    // Defer the reply first to give us time to process
    await interaction.deferReply({ ephemeral: true });
    
    // Check if autoChangeStatus feature is enabled
    if (!autoChangeStatus.enabled) {
      await interaction.editReply({
        content: cmdSlashTranslation.setstatus.enableFeature,
      });
      return;
    }

    // Check if the user has admin permissions or if adminOnly is disabled
    if (autoChangeStatus.adminOnly && !interaction.member.permissions.has('ADMINISTRATOR')) {
      await interaction.editReply({
        content: cmdSlashTranslation.setstatus.adminOnly,
      });
      return;
    }

    // Retrieve the channel object where the command was issued
    const channel = client.channels.cache.get(interaction.channelId);
    if (!channel) {
      throw new Error(`Channel ${interaction.channelId} not found`);
    }
    // Send a message indicating that status checking is in progress
    const msg = await channel.send(cmdSlashTranslation.setstatus.checkingStatusCmdMsg);

    // Asynchronously read data.json and parse its JSON content
    let dataRead;
    try {
      const readData = await fs.readFile(dataJsonPath, 'utf8');
      dataRead = JSON.parse(readData);
    } catch (e) {
      // Initialize to an empty autoChangeStatus array if parsing fails
      dataRead = { autoChangeStatus: [] };
    }

    // Retrieve command options; use default values from mcserver if options are not provided
    const ip = interaction.options.getString('ip') || mcserver.ip;
    const portOption = interaction.options.getInteger('port') || mcserver.port;
    const type = interaction.options.getString('type') || mcserver.type;
    const name = interaction.options.getString('name') || mcserver.name;

    // Validate the IP format using our custom validator that accepts both IPs and domain names
    if (!isValidHostnameOrIP(ip)) {
      throw new Error(`Invalid hostname or IP "${ip}"`);
    }

    // Determine whether to use player avatar emoji based on permissions and settings
    const playerAvatarEmoji = interaction.options.getBoolean('player_avatar') || false;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasManageChannels = member.permissions.has(PermissionFlagsBits.ManageChannels);
    const isPlayerAvatarEmoji =
      playerAvatarEmoji && hasManageChannels && autoChangeStatus.playerAvatarEmoji && type === 'java';

    // Ensure dataRead.autoChangeStatus is an array
    if (!Array.isArray(dataRead.autoChangeStatus)) {
      dataRead.autoChangeStatus = [];
    }

    // Remove any existing status record for the current channel
    dataRead.autoChangeStatus = dataRead.autoChangeStatus.filter(
      (entry) => entry.channelId !== interaction.channelId
    );

    // Add a new auto status update record
    dataRead.autoChangeStatus.push({
      ip,
      port: portOption,
      type,
      name,
      channelId: interaction.channelId,
      messageId: msg.id,
      isPlayerAvatarEmoji,
    });

    // Call statusMessageEdit to update the status message with the new server data
    await statusMessageEdit(ip, portOption, type, name, msg, isPlayerAvatarEmoji, client);

    // Write the updated data back to data.json asynchronously
    await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2), 'utf8');

    // Edit the deferred reply to inform the user of successful status update,
    // including a link to the status message
    await interaction.editReply({
      content: cmdSlashTranslation.setstatus.statusMsgSuccess
        .replace(/\{channel\}/gi, `<#${interaction.channelId}>`)
        .replace(/\{messageLink\}/gi, `https://discord.com/channels/${msg.guildId}/${interaction.channelId}/${msg.id}`),
      flags: MessageFlags.Ephemeral,
    });

    // Log a success message to the console
    logger.info(
      consoleLogTranslation.debug.autoChangeStatus.successLog.replace(
        /\{channelName\}/gi,
        chalk.cyan(`#${msg.channel.name}`)
      )
    );
  } catch (error) {
    // If an error occurs, edit the reply with an error message
    await interaction.editReply({
      content: cmdSlashTranslation.setstatus.errorReply.replace(/\{error\}/gi, error.message),
      flags: MessageFlags.Ephemeral,
    });
    // If the error is due to an invalid IP format, stop further processing
    if (error.message.startsWith('Invalid hostname or IP')) return;
    // Log the error details for debugging purposes
    logger.error('Error in setStatus command', error);
  }
}