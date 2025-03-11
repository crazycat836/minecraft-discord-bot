import chalk from 'chalk';
import config from '../../../config.js';
import { consoleLogTranslation, getServerDataAndPlayerList } from '../../index.js';
import logger from '../../utils/logger.js';

export default async (client) => {
  // Log bot invite link if enabled in settings
  if (config.settings.logging.inviteLink) {
    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
    logger.info(
      consoleLogTranslation.inviteLink
        .replace(/\{botUserTag\}/gi, chalk.cyan(client.user.tag))
        .replace(/\{inviteLink\}/gi, chalk.cyan(inviteLink))
    );
  }

  // Return early if server info logging is disabled
  if (!config.settings.logging.serverInfo) return;

  // Destructure mcserver configuration for clarity
  const { ip: mcIp, port: mcPort, type: mcType, version: mcVersion } = config.mcserver;

  // Get server data and player list with error handling
  let data, isOnline;
  try {
    ({ data, isOnline } = await getServerDataAndPlayerList(true));
  } catch (error) {
    logger.error('Failed to fetch server data', error);
    return;
  }
  
  // Format IP information for Bedrock and Java editions
  const ipBedrock = `${mcIp}\n${chalk.reset('Port')}     | ${chalk.cyan.bold(mcPort)}`;
  const portStr = mcPort === 25565 ? '' : `:${mcPort}`;
  const ipJava = `${mcIp}${portStr}`;
  const formattedIp = mcType === 'bedrock' ? ipBedrock : ipJava;

  if (isOnline) {
    // Prepare online server info text
    const serverInfoOnlineText = consoleLogTranslation.serverInfoStart.online.join('\n');
    // Cache MOTD lines for reuse
    const motdLines = data.motd.clean.split('\n');
    logger.info(
      serverInfoOnlineText
        .replace(/\{ip\}/gi, chalk.cyan.bold(formattedIp))
        .replace(/\{version\}/gi, chalk.cyan.bold(mcVersion))
        .replace(/\{playersOnline\}/gi, chalk.cyan.bold(data.players.online))
        .replace(/\{playersMax\}/gi, chalk.cyan.bold(data.players.max))
        .replace(/\{motd_line1\}/gi, chalk.cyan.bold(motdLines[0]))
        .replace(/\{motd_line2\}/gi, chalk.cyan.bold(motdLines[1]))
    );
  } else {
    // For offline status, use ipOffline to avoid naming conflict
    const ipOffline = mcType === 'bedrock' ? mcIp : ipJava;
    const serverInfoOfflineText = consoleLogTranslation.serverInfoStart.offline.join('\n');
    logger.info(
      serverInfoOfflineText
        .replace(/\{ip\}/gi, chalk.red.bold(ipOffline))
        .replace(/\{port\}/gi, chalk.red(mcPort))
        .replace(
          /\{mcServerType\}/gi,
          chalk.red.bold(mcType.charAt(0).toUpperCase() + mcType.slice(1))
        )
    );
  }
};