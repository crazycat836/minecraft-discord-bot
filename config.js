// config.js
// Configuration entirely from environment variables

export default {
  bot: {
    token: process.env.DISCORD_BOT_TOKEN,
    presence: {
      enabled: process.env.BOT_PRESENCE_ENABLED === 'false' ? false : true,
      activity: process.env.BOT_ACTIVITY || 'Playing',
      status: {
        online: process.env.BOT_STATUS_ONLINE || 'online',
        offline: process.env.BOT_STATUS_OFFLINE || 'dnd',
      },
    },
  },
  mcserver: {
    ip: '',
    port: 25565,
    type: 'java',
    name: 'Minecraft Server',
    version: 'Unknown',
    site: '',
  },
  settings: {
    guildID: process.env.DISCORD_GUILD_ID,
    language: process.env.LANGUAGE_MAIN || 'en',
    logging: {
      timezone: process.env.TIMEZONE || 'Asia/Taipei',
      inviteLink: process.env.INVITE_LINK === 'false' ? false : true,
    },
  },
  autoReply: {
    enabled: process.env.AUTO_REPLY_ENABLED === 'false' ? false : true,
    ip: {
      enabled: process.env.AUTO_REPLY_IP_ENABLED === 'false' ? false : true,
      triggerWords: process.env.AUTO_REPLY_IP_TRIGGER ? process.env.AUTO_REPLY_IP_TRIGGER.split(',') : ['ip', 'address', 'connect', 'server address'],
    },
    site: {
      enabled: process.env.AUTO_REPLY_SITE_ENABLED === 'false' ? false : true,
      triggerWords: process.env.AUTO_REPLY_SITE_TRIGGER ? process.env.AUTO_REPLY_SITE_TRIGGER.split(',') : ['website', 'site', 'web'],
    },
    status: {
      enabled: process.env.AUTO_REPLY_STATUS_ENABLED === 'false' ? false : true,
      triggerWords: process.env.AUTO_REPLY_STATUS_TRIGGER ? process.env.AUTO_REPLY_STATUS_TRIGGER.split(',') : ['status', 'online', 'offline'],
    },
    version: {
      enabled: process.env.AUTO_REPLY_VERSION_ENABLED === 'false' ? false : true,
      triggerWords: process.env.AUTO_REPLY_VERSION_TRIGGER ? process.env.AUTO_REPLY_VERSION_TRIGGER.split(',') : ['version', 'ver'],
    },
  },
  autoChangeStatus: {
    enabled: process.env.AUTO_CHANGE_STATUS_ENABLED === 'false' ? false : true,
    updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 60,
    adminOnly: process.env.ADMIN_ONLY === 'false' ? false : true,
    playerAvatarEmoji: process.env.PLAYER_AVATAR_EMOJI === 'false' ? false : true,
    isOnlineCheck: process.env.IS_ONLINE_CHECK === 'false' ? false : true,
  },
  playerCountCH: {
    enabled: process.env.PLAYER_COUNT_ENABLED === 'false' ? false : true,
    updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 60,
    // Channel ID for the "Channel Name Counter" feature.
    // NOTE: This MUST be set in the environment variables (e.g., docker-compose.yml).
    // There is no command to set this dynamically.
    channelId: process.env.STATS_CHANNEL_ID,
  },
  commands: {
    slashCommands: true,
    prefixCommands: {
      enabled: true,
      prefix: process.env.COMMAND_PREFIX || '!',
    },
    ip: {
      enabled: true,
      alias: process.env.CMD_IP_ALIAS ? process.env.CMD_IP_ALIAS.split(',') : ['ip-address'],
    },
    site: {
      enabled: true,
      alias: process.env.CMD_SITE_ALIAS ? process.env.CMD_SITE_ALIAS.split(',') : ['vote', 'link'],
    },
    version: {
      enabled: true,
      alias: process.env.CMD_VERSION_ALIAS ? process.env.CMD_VERSION_ALIAS.split(',') : [],
    },
    players: {
      enabled: true,
      alias: process.env.CMD_PLAYERS_ALIAS ? process.env.CMD_PLAYERS_ALIAS.split(',') : ['plist'],
    },
    status: {
      enabled: true,
      alias: process.env.CMD_STATUS_ALIAS ? process.env.CMD_STATUS_ALIAS.split(',') : [],
    },
    motd: {
      enabled: true,
      alias: process.env.CMD_MOTD_ALIAS ? process.env.CMD_MOTD_ALIAS.split(',') : [],
    },
    info: {
      enabled: true,
      alias: process.env.CMD_INFO_ALIAS ? process.env.CMD_INFO_ALIAS.split(',') : [],
    },
    help: {
      enabled: true,
      alias: process.env.CMD_HELP_ALIAS ? process.env.CMD_HELP_ALIAS.split(',') : ['commands'],
    },
    setsite: {
      enabled: true,
      alias: [],
    },
    setname: {
      enabled: true,
      alias: [],
    },
  },
};