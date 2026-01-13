import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import fs from 'fs/promises';
import { cmdSlashTranslation } from '../index.js';
import config from '../../config.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import validator from 'validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataJsonPath = path.join(__dirname, '..', 'data.json');

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
            let dataRead;
            try {
                const readData = await fs.readFile(dataJsonPath, 'utf8');
                dataRead = JSON.parse(readData);
            } catch (e) {
                dataRead = {};
            }

            // Initialize serverSettings if not exists
            if (!dataRead.serverSettings) {
                dataRead.serverSettings = {};
            }

            // Update site
            dataRead.serverSettings.site = url;

            // Write back to data.json
            await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2), 'utf8');

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
