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
      // Get server data
      const { getServerDataAndPlayerList } = await import('../index.js');
      const result = await getServerDataAndPlayerList(true);
      
      // Create the MOTD embed
      const embed = motdEmbed(result);
      
      // Reply with the MOTD embed
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in motd command', error);
    }
  },

  options: {
    // If the motd command or slashCommands is not enabled, remove the command from Discord
    deleted: !commands.motd.enabled || !commands.slashCommands,
  },
};