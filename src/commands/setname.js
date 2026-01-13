import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import fs from 'fs/promises';
import { cmdSlashTranslation } from '../index.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataJsonPath = path.join(__dirname, '..', 'data.json');

export default {
    data: new SlashCommandBuilder()
        .setName(cmdSlashTranslation.setname.name)
        .setDescription(cmdSlashTranslation.setname.description)
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription(cmdSlashTranslation.setname.nameOption)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    run: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const name = interaction.options.getString('name');

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

            // Update name
            dataRead.serverSettings.name = name;

            // Write back to data.json
            await fs.writeFile(dataJsonPath, JSON.stringify(dataRead, null, 2), 'utf8');

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
