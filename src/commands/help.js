import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../../config.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';

const { commands, settings } = config;

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.help.name)
    .setDescription(cmdSlashTranslation.help.description),

  run: async ({ interaction }) => {
    try {
      // Create the help embed
      const helpEmbed = new EmbedBuilder()
        .setColor('Aqua')
        .setTitle(cmdSlashTranslation.help.embed.title)
        .setDescription(cmdSlashTranslation.help.embed.description)
        .setTimestamp()
        .setFooter({
          text: cmdSlashTranslation.help.embed.footer,
          iconURL: interaction.client.user.displayAvatarURL(),
        });

      // Add fields for each command
      helpEmbed.addFields({
        name: `/${cmdSlashTranslation.ip.name}`,
        value: cmdSlashTranslation.ip.description,
      });

      if (config.mcserver.site) {
        helpEmbed.addFields({
          name: `/${cmdSlashTranslation.site.name}`,
          value: cmdSlashTranslation.site.description,
        });
      }

      // Reply with the help embed
      await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    } catch (error) {
      logger.error('Error running help command', error);
    }
  },

  options: {
    // Only check if slashCommands is enabled
    deleted: !commands.slashCommands,
  },
};