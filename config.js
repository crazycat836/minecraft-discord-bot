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
    ip: process.env.MC_SERVER_IP,
    port: parseInt(process.env.MC_SERVER_PORT) || 25565,
    type: process.env.MC_SERVER_TYPE || 'java',
    name: process.env.MC_SERVER_NAME,
    version: process.env.MC_SERVER_VERSION,
    site: process.env.MC_SERVER_SITE || '',
  },
  settings: {
    guildID: process.env.DISCORD_GUILD_ID,
    language: process.env.LANGUAGE_MAIN || 'zh-TW',
    logging: {
      timezone: process.env.TIMEZONE || 'Asia/Taipei',
      inviteLink: process.env.INVITE_LINK === 'false' ? false : true,
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
  },
};