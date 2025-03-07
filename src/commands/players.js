import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation, getError } from '../index.js';
import { playerList } from '../embeds.js';

const { commands } = config;

export default {
  // Define the slash command data using SlashCommandBuilder
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.players.name)
    .setDescription(cmdSlashTranslation.players.description),

  // Run function executed when the command is invoked
  run: async ({ interaction }) => {
    try {
      // Defer the reply to allow time for processing
      await interaction.deferReply();

      // Fetch the embed that displays the player list
      const embed = await playerList();

      // Edit the deferred reply with the retrieved embed
      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      // If an error occurs, inform the user via followUp and log the error
      await interaction.followUp({ content: cmdSlashTranslation.players.errorReply });
      getError(error, 'playerCmd');
    }
  },

  options: {
    // Remove the command from Discord if either players command or slash commands are disabled
    deleted: !commands.players.enabled || !commands.slashCommands,
  },
};