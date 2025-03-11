import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { versionEmbed } from '../embeds.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';

const { commands } = config;

export default {
  // Define the slash command data using SlashCommandBuilder
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.version.name)
    .setDescription(cmdSlashTranslation.version.description),

  // Run function to execute the command
  run: async ({ interaction }) => {
    try {
      await interaction.reply({ embeds: [versionEmbed] });
    } catch (error) {
      logger.error('Error executing version command', error);
    }
  },

  options: {
    // Remove this command if version command or slashCommands are disabled
    deleted: !commands.version.enabled || !commands.slashCommands,
  },
};