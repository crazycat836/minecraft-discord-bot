import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { ipEmbed } from '../embeds.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';

// Destructure commands from config
const { commands } = config;

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.ip.name)
    .setDescription(cmdSlashTranslation.ip.description),

  run: async ({ interaction }) => {
    try {
      // Reply with the IP embed
      await interaction.reply({ embeds: [ipEmbed] });
    } catch (error) {
      logger.error('Error executing ip command', error);
    }
  },

  options: {
    // Only check if slashCommands is enabled
    deleted: !commands.slashCommands,
  },
};