import config from '../../../config.js';
import { getServerDataAndPlayerList, getServerConfig } from '../../index.js';
import logger from '../../utils/logger.js';
import languageService from '../../services/languageService.js';

const { autoReply, commands, settings } = config;

// Get translations using languageService
const autoReplyReplyText = languageService.getTranslation('auto-reply');

export default async (msg) => {
  try {
    // If autoReply is disabled, the message author is a bot, or the message starts with the command prefix, do nothing.
    if (!autoReply.enabled || msg.author.bot || msg.content.startsWith(commands.prefixCommands.prefix)) return;

    // Get dynamic config
    const conf = await getServerConfig();
    const { mcserver } = conf;

    const { content } = msg;
    // Destructure autoReply trigger settings for convenience
    const { ip, site, status, version } = autoReply;

    // Create regular expressions to detect trigger words (with Unicode support)
    const isIp = new RegExp(`(?<=^|\\P{L})(${ip.triggerWords.join('|')})(?=\\P{L}|$)`, 'iu');
    const isSite = new RegExp(`(?<=^|\\P{L})(${site.triggerWords.join('|')})(?=\\P{L}|$)`, 'iu');
    const isStatus = new RegExp(`(?<=^|\\P{L})(${status.triggerWords.join('|')})(?=\\P{L}|$)`, 'iu');
    const isVersion = new RegExp(`(?<=^|\\P{L})(${version.triggerWords.join('|')})(?=\\P{L}|$)`, 'iu');

    // Reply with IP information if trigger is detected and IP auto-reply is enabled
    if (isIp.test(content) && autoReply.ip.enabled) {
      await msg.reply(
        languageService.getText('auto-reply', 'ip.replyText', {
          ip: mcserver.ip,
          port: mcserver.port
        })
      );
    }
    // Reply with site information if trigger is detected, site auto-reply is enabled, and site info exists
    if (isSite.test(content) && autoReply.site.enabled && mcserver.site) {
      await msg.reply(
        languageService.getText('auto-reply', 'site.replyText', {
          site: mcserver.site
        })
      );
    }
    // Reply with version information if trigger is detected and version auto-reply is enabled
    if (isVersion.test(content) && autoReply.version.enabled) {
      await msg.reply(
        languageService.getText('auto-reply', 'version.replyText', {
          version: mcserver.version
        })
      );
    }
    // Reply with server status information if trigger is detected and status auto-reply is enabled
    if (isStatus.test(content) && autoReply.status.enabled) {
      // Indicate that the bot is typing
      await msg.channel.sendTyping();
      // Retrieve server data and online status (getServerDataAndPlayerList uses getServerConfig internally)
      const { data, isOnline } = await getServerDataAndPlayerList();

      if (isOnline) {
        await msg.reply(
          languageService.getText('auto-reply', 'status.onlineReply', {
            playerOnline: data.players.online,
            playerMax: data.players.max
          })
        );
      } else {
        await msg.reply(
          languageService.getText('auto-reply', 'status.offlineReply')
        );
      }
    }
  } catch (error) {
    // Log error with identifier 'autoReply'
    logger.error('AutoReply: Error processing message', error);
  }
};