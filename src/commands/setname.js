import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { cmdSlashTranslation } from '../index.js';
import logger from '../utils/logger.js';
import { setServerSetting } from '../utils/dataStore.js';

export default {
    data: new SlashCommandBuilder()
        .setName(cmdSlashTranslation.setname.name)
        .setDescription(cmdSlashTranslation.setname.description)
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription(cmdSlashTranslation.setname.nameOption)
                .setMaxLength(256)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    run: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const name = interaction.options.getString('name');

            // Update name
            await setServerSetting('name', name);

            await interaction.editReply({
                content: cmdSlashTranslation.setname.success.replace('{name}', name),
                flags: MessageFlags.Ephemeral,
            });

            logger.info(`SetName: Server name updated to ${name} by ${interaction.user.tag}`);
        } catch (error) {
            logger.error('Error running setname command', error);
            await interaction.editReply({
                content: `:warning: Error: ${error.message}`,
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
