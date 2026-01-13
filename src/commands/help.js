import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation } from '../index.js';
import { helpEmbed } from '../embeds.js';
import logger from '../utils/logger.js';

const { commands } = config;

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.help.name)
    .setDescription(cmdSlashTranslation.help.description),

  run: async ({ interaction }) => {
    try {
      const embed = await helpEmbed(interaction.client);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error running help command', error);
    }
  },

  options: {
    // Only check if slashCommands is enabled
    deleted: !commands.slashCommands,
  },
};