import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';

const { commands } = config;

export default {
  // Define the slash command data using SlashCommandBuilder
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.status.name)
    .setDescription(cmdSlashTranslation.status.description),

  // Run function to execute the command
  run: async ({ interaction }) => {
    try {
      // Defer the reply to give us time to process
      await interaction.deferReply();
      
      // Import the necessary functions
      const { getServerDataAndPlayerList } = await import('../index.js');
      
      // Get server data and player list - don't use dataOnly parameter
      const result = await getServerDataAndPlayerList();
      
      // Create the embed based on the result
      const { statusEmbed } = await import('../embeds.js');
      const embed = await statusEmbed(result);
      
      // Edit the deferred reply with the embed
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in status command', error);
      
      // Reply with an error message
      await interaction.editReply({
        content: cmdSlashTranslation.status.errorReply,
      });
    }
  },

  options: {
    // Only check if slashCommands is enabled
    deleted: !commands.slashCommands,
  },
};