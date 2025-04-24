import config from '../../../config.js';
import { cmdSlashTranslation } from '../../index.js';
import { ipEmbed, siteEmbed, playerList, versionEmbed, statusEmbed, motdEmbed, helpEmbed } from '../../embeds.js';
import logger from '../../utils/logger.js';

const { commands, mcserver } = config;

export default async (message, client) => {
  // Ignore messages from bots or if prefix commands are disabled or message doesn't start with the prefix
  if (
    message.author.bot ||
    !commands.prefixCommands.enabled ||
    !commands.prefixCommands.prefix ||
    !message.content.startsWith(commands.prefixCommands.prefix)
  ) {
    return;
  }
  
  const prefix = commands.prefixCommands.prefix;
  // Remove the prefix and trim spaces, then split into command and arguments
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  
  /**
   * Helper function to check if the received command matches the given command name or its aliases.
   * @param {string} commandName - The main command name to check.
   * @returns {boolean} - True if the command matches.
   */
  const commandMatches = (commandName) => {
    const cmdConfig = commands[commandName];
    // Check if the command equals the main command name or any alias
    return command === commandName || (Array.isArray(cmdConfig.alias) && cmdConfig.alias.includes(command));
  };
  
  // Process the 'help' command
  if (commandMatches('help')) {
    await message.channel.sendTyping();
    // If a subcommand argument is provided, check if it's a valid command
    if (args[0]) {
      // Create an array of valid command names, excluding non-prefix related ones
      const validCommands = Object.keys(commands).filter(cmdName => 
        !['slashCommands', 'prefixCommands', 'language'].includes(cmdName)
      );
      if (validCommands.includes(args[0].toLowerCase())) {
        return message.channel.send({ embeds: [await helpEmbed(client, args[0].toLowerCase())] });
      }
    }
    return message.channel.send({ embeds: [await helpEmbed(client)] });
  }
  
  // Process the 'motd' command
  if (commandMatches('motd')) {
    await message.channel.sendTyping();
    return message.channel.send({ embeds: [await motdEmbed()] });
  }
  
  // Process the 'ip' command
  if (commandMatches('ip')) {
    return message.channel.send({ embeds: [ipEmbed] });
  }
  
  // Process the 'site' command (only if mcserver.site exists)
  if (commandMatches('site') && mcserver.site) {
    return message.channel.send({ embeds: [siteEmbed] });
  }
  
  // Process the 'version' command
  if (commandMatches('version')) {
    return message.channel.send({ embeds: [versionEmbed] });
  }
  
  // Process the 'players' command
  if (commandMatches('players')) {
    await message.channel.sendTyping();
    return message.channel.send({ embeds: [await playerList()] });
  }
  
  // Process the 'status' command
  if (commandMatches('status')) {
    await message.channel.sendTyping();
    try {
      return message.channel.send({ embeds: [await statusEmbed()] });
    } catch (error) {
      message.channel.send(cmdSlashTranslation.status.errorReply);
      logger.error('Command: Error in status prefix command', error);
    }
  }
};