import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation, getError } from '../index.js';
import { motdEmbed } from '../embeds.js';

const { commands } = config;

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.motd.name)
    .setDescription(cmdSlashTranslation.motd.description),

  run: async ({ interaction }) => {
    // Defer the reply so that we have more time to process
    await interaction.deferReply();
    try {
      // Call motdEmbed() to obtain the embed, then edit the deferred reply with it
      const embed = await motdEmbed();
      if (!embed) {
        throw new Error('motdEmbed did not return a valid embed');
      }
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      // If an error occurs, edit the reply with an error message and log the error
      await interaction.editReply({
        content: cmdSlashTranslation.motd.errorReply,
      });
      console.error('Error in motd command:', error);
      getError(error, 'motdCmd');
    }
  },

  options: {
    // If the motd command or slashCommands feature is not enabled, remove the command from Discord
    deleted: !commands.motd.enabled || !commands.slashCommands,
  },
};