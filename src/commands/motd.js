import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { motdEmbed } from '../embeds.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';

const { commands } = config;

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.motd.name)
    .setDescription(cmdSlashTranslation.motd.description),

  run: async ({ interaction }) => {
    try {
      // Create and get the MOTD embed
      // motdEmbed now handles fetching data dynamically
      const embed = await motdEmbed();

      // Reply with the MOTD embed
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in motd command', error);
    }
  },

  options: {
    // Only check if slashCommands is enabled
    deleted: !commands.slashCommands,
  },
};