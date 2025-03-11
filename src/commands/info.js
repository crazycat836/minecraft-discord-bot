import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
// Import required functions and translation from other modules
import { botInfoEmbed } from '../embeds.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';
import config from '../../config.js';

const { commands } = config;

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.info.name)
    .setDescription(cmdSlashTranslation.info.description)
    // Set command to be available only for administrators
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  run: async ({ interaction, client }) => {
    try {
      // Defer reply and mark it as ephemeral (visible only to the user)
      await interaction.deferReply({ eflags: MessageFlags.Ephemeral });

      // Get bot info embed and reply with it
      const embed = await botInfoEmbed(interaction, client);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Command: Error executing info command', error);
      await interaction.editReply({
        content: 'An error occurred while executing this command.',
        ephemeral: true,
      });
    }
  },

  options: {
    // If set to true, the command will be removed from Discord
    deleted: !commands.info.enabled || !commands.slashCommands,
  },
};