import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { siteEmbed } from '../embeds.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';

const { commands, mcserver } = config;

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.site.name)
    .setDescription(cmdSlashTranslation.site.description),

  run: async ({ interaction }) => {
    try {
      // Reply with the site embed
      await interaction.reply({ embeds: [siteEmbed] });
    } catch (error) {
      logger.error('Error executing site command', error);
    }
  },

  options: {
    // Only check if slashCommands is enabled and mcserver.site exists
    deleted: !commands.slashCommands || !mcserver.site,
  },
};