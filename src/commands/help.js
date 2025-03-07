import { SlashCommandBuilder } from 'discord.js';
import config from '../../config.js';
import { helpEmbed } from '../embeds.js';
import { cmdSlashTranslation } from '../index.js';

const { commands } = config;

// Build command choices array using Object.keys and for-of loop
const commandsChoicesArray = [];
for (const commandName of Object.keys(commands)) {
  // Exclude non-help command categories
  if (
    commands[commandName].enabled &&
    !['slashCommands', 'prefixCommands', 'language'].includes(commandName)
  ) {
    // Use full key-value pair syntax for clarity
    commandsChoicesArray.push({ name: commandName, value: commandName });
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName(cmdSlashTranslation.help.name)
    .setDescription(cmdSlashTranslation.help.description)
    .addStringOption((option) =>
      option
        // Ensure option name matches when retrieving its value
        .setName(cmdSlashTranslation.help.options.name)
        .setDescription(cmdSlashTranslation.help.options.description)
        .addChoices(...commandsChoicesArray)
    ),
  run: async ({ interaction, client }) => {
    try {
      await interaction.deferReply();
      // Retrieve the option value using the same name as defined above
      const commandChoice = interaction.options.getString(cmdSlashTranslation.help.options.name);
      const embed = await helpEmbed(client, commandChoice);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error running help command:', error);
    }
  },
  options: {
    // Remove the command from Discord if help or slash commands are disabled
    deleted: !commands.help.enabled || !commands.slashCommands,
  },
};