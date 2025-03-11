import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';

const { commands } = config;

export default {
  // Define the slash command data using SlashCommandBuilder
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.players.name)
    .setDescription(cmdSlashTranslation.players.description),

  // Run function executed when the command is invoked
  run: async ({ interaction }) => {
    try {
      // Defer the reply to give us time to process
      await interaction.deferReply();
      
      // Import the necessary functions
      const { getServerDataAndPlayerList } = await import('../index.js');
      
      // Get server data and player list
      const result = await getServerDataAndPlayerList();
      
      // Create the embed based on the result
      const { playersEmbed } = await import('../embeds.js');
      const embed = playersEmbed(result);
      
      // Edit the deferred reply with the embed
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in players command', error);
      
      // Reply with an error message
      await interaction.editReply({
        content: cmdSlashTranslation.players.errorReply,
      });
    }
  },

  options: {
    // If the players command or slashCommands is not enabled, remove the command from Discord
    deleted: !commands.players.enabled || !commands.slashCommands,
  },
};