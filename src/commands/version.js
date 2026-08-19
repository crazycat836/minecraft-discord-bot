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
      // versionEmbed probes the server, which can exceed Discord's 3s ack window
      await interaction.deferReply();
      await interaction.editReply({ embeds: [await versionEmbed()] });
    } catch (error) {
      logger.error('Error executing version command', error);
      await interaction.editReply({ content: ':warning: An error occurred.' }).catch(() => {});
    }
  },

  options: {
    // Only check if slashCommands is enabled
    deleted: !commands.slashCommands,
  },
}; 