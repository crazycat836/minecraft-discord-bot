import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { cmdSlashTranslation } from '../index.js';
import config from '../../config.js';
import logger from '../utils/logger.js';
import validator from 'validator';
import { readData, writeData } from '../utils/dataStore.js';

const { autoChangeStatus } = config;

export default {
    data: new SlashCommandBuilder()
        .setName(cmdSlashTranslation.setsite.name)
        .setDescription(cmdSlashTranslation.setsite.description)
        .addStringOption((option) =>
            option
                .setName('url')
                .setDescription(cmdSlashTranslation.setsite.url)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    run: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const url = interaction.options.getString('url');

            // Validate URL
            if (!validator.isURL(url, { require_protocol: true })) {
                await interaction.editReply({
                    content: cmdSlashTranslation.setsite.invalidUrl,
                });
                return;
            }

            // Read data.json
            let dataRead = await readData();

            // Initialize serverSettings if not exists
            if (!dataRead.serverSettings) {
                dataRead.serverSettings = {};
            }

            // Update site
            dataRead.serverSettings.site = url;

            // Write back to data.json
            await writeData(dataRead);

            await interaction.editReply({
                content: cmdSlashTranslation.setsite.success.replace('{site}', url),
                flags: MessageFlags.Ephemeral,
            });

            logger.info(`SetSite: Website updated to ${url} by ${interaction.user.tag}`);
        } catch (error) {
            logger.error('Error running setsite command', error);
            await interaction.editReply({
                content: `:warning: Error: ${error.message}`,
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
