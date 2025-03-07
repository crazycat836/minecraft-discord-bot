import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
// Import required functions and translation from other modules
import { botInfoEmbed } from '../embeds.js';
import { cmdSlashTranslation, getError } from '../index.js';

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

      // Retrieve bot information embed
      const infoEmbed = await botInfoEmbed(interaction, client);

      // Edit the deferred reply with the bot info embed
      await interaction.editReply({
        embeds: [infoEmbed],
      });
    } catch (error) {
      // Follow up with an ephemeral error message if something goes wrong
      await interaction.followUp({
        content: cmdSlashTranslation.info.errorReply,
        flags: MessageFlags.Ephemeral,
      });
      getError(error, 'infoCmd');
    }
  },

  options: {
    // If set to true, the command will be removed from Discord
    deleted: false,
  },
};