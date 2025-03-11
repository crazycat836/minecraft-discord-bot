import config from '../../../config.js';
import fs from 'fs';
import json5 from 'json5';

import { getServerDataAndPlayerList } from '../../index.js';
import logger from '../../utils/logger.js';

const { autoReply, mcserver, commands, settings } = config;

// Use language setting: if autoReply language is defined then use it, otherwise use main language
const languageAutoReply = settings.language.autoReply || settings.language.main;
// Synchronously read the translation file (this happens only once at module load)
const fileContents = fs.readFileSync(`./translation/${languageAutoReply}/auto-reply.json5`, 'utf8');
const autoReplyReplyText = json5.parse(fileContents);

export default async (msg) => {
  try {
    // If autoReply is disabled, the message author is a bot, or the message starts with the command prefix, do nothing.
    if (!autoReply.enabled || msg.author.bot || msg.content.startsWith(commands.prefixCommands.prefix)) return;
    
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
        autoReplyReplyText.ip.replyText
          .replace(/{ip}/g, mcserver.ip)
          .replace(/{port}/g, mcserver.port)
      );
    }
    // Reply with site information if trigger is detected, site auto-reply is enabled, and site info exists
    if (isSite.test(content) && autoReply.site.enabled && mcserver.site) {
      await msg.reply(
        autoReplyReplyText.site.replyText.replace(/{site}/g, mcserver.site)
      );
    }
    // Reply with version information if trigger is detected and version auto-reply is enabled
    if (isVersion.test(content) && autoReply.version.enabled) {
      await msg.reply(
        autoReplyReplyText.version.replyText.replace(/{version}/g, mcserver.version)
      );
    }
    // Reply with server status information if trigger is detected and status auto-reply is enabled
    if (isStatus.test(content) && autoReply.status.enabled) {
      // Indicate that the bot is typing
      await msg.channel.sendTyping();
      // Retrieve server data and online status
      const { data, isOnline } = await getServerDataAndPlayerList(true);
      await msg.reply(
        isOnline
          ? autoReplyReplyText.status.onlineReply
              .replace(/{playerOnline}/g, data.players.online)
              .replace(/{playerMax}/g, data.players.max)
          : autoReplyReplyText.status.offlineReply
      );
    }
  } catch (error) {
    // Log error with identifier 'autoReply'
    logger.error('AutoReply: Error processing message', error);
  }
};