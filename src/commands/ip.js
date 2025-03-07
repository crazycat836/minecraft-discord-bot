import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation } from '../index.js';
import { ipEmbed } from '../embeds.js';

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
      console.error('Error executing ip command:', error);
    }
  },

  options: {
    // If the ip command or slashCommands are not enabled, the command will be removed from Discord
    deleted: !commands.ip.enabled || !commands.slashCommands,
  },
};