import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation, getError } from '../index.js';
import { statusEmbed } from '../embeds.js';

const { commands } = config;

export default {
  // Define the slash command data using SlashCommandBuilder
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.status.name)
    .setDescription(cmdSlashTranslation.status.description),

  // Run function to execute the command
  run: async ({ interaction }) => {
    await interaction.deferReply();
    try {
      // Get the status embed and update the reply
      const embed = await statusEmbed();
      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      // If an error occurs, reply with an error message and log the error
      await interaction.followUp({
        content: cmdSlashTranslation.status.errorReply,
      });
      getError(error, 'statusCmd');
    }
  },

  options: {
    // Remove this command if status command or slashCommands are disabled
    deleted: !commands.status.enabled || !commands.slashCommands,
  },
};