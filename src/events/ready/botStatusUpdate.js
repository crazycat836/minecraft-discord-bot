import config from '../../../config.js';
import { consoleLogTranslation, getDebug, getServerDataAndPlayerList, getError } from '../../index.js';
import chalk from 'chalk';
import { ActivityType } from 'discord.js';

// Define statusEmojis outside the function to avoid recreating it on every call
const statusEmojis = {
  online: '🟢',
  idle: '🌙',
  dnd: '⛔',
  invisible: '⚫',
};

export default (client) => {
  // Destructure presence settings for easier usage
  const { presence } = config.bot;
  if (!presence.enabled) return;

  /**
   * Helper function to log the bot's presence debug info.
   * @param {Object} presenceData - The presence data returned from setPresence.
   * @param {Function} colorFn - Chalk color function (e.g., chalk.green or chalk.red).
   */
  const logPresenceDebug = (presenceData, colorFn) => {
    if (presenceData.activities.length > 0) {
      presenceData.activities.forEach((activity) => {
        const statusEmoji = statusEmojis[presenceData.status] || '';
        const debugMessage = consoleLogTranslation.debug.botStatusFormat.replace(
          /\{botStatusText\}/gi,
          colorFn(
            `${statusEmoji} ${presenceData.status.toUpperCase()} ${ActivityType[activity.type]} ${activity.name}`
          )
        );
        getDebug(debugMessage);
      });
    }
  };

  /**
   * Function to update the bot's presence based on the server status.
   */
  const botStatusUpdate = async () => {
    try {
      const { data, isOnline } = await getServerDataAndPlayerList(true);
      
      // Determine the presence details based on whether the server is online or offline
      let presenceData;
      if (isOnline) {
        // Replace placeholders in the online status text with real-time data
        const statusText = presence.text.online
          .replace(/{playeronline}/g, data.players.online)
          .replace(/{playermax}/g, data.players.max);

        presenceData = await client.user.setPresence({
          status: presence.status.online,
          activities: [
            {
              name: statusText,
              type: ActivityType[presence.activity],
            },
          ],
        });
        // Log debug info using green color for online status
        logPresenceDebug(presenceData, chalk.green);
      } else {
        presenceData = await client.user.setPresence({
          status: presence.status.offline,
          activities: [
            {
              name: presence.text.offline,
              type: ActivityType[presence.activity],
            },
          ],
        });
        // Log debug info using red color for offline status
        logPresenceDebug(presenceData, chalk.red);
      }
    } catch (error) {
      getError(error, 'botStatusUpdate');
    }
  };

  // Initial status update and scheduling periodic updates every 60 seconds
  botStatusUpdate();
  setInterval(botStatusUpdate, 60000);
};