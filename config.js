// config.js
// Config Documentation: https://nooberpro.gitbook.io/minecraft-discord-bot/installation/config
// "MC" refers to Minecraft in the comments for convenience.

export default {
  bot: {
    token: process.env.DISCORD_BOT_TOKEN || '',
    presence: {
      enabled: true,
      activity: 'Playing', // Options: Playing, Listening, Watching, Competing.
      status: {
        online: 'online',
        offline: 'idle',
      },
    },
  },
  mcserver: {
    ip: process.env.MC_SERVER_IP || '',
    port: parseInt(process.env.MC_SERVER_PORT) || 25565,
    type: process.env.MC_SERVER_TYPE || 'java',
    name: process.env.MC_SERVER_NAME || '',
    version: process.env.MC_SERVER_VERSION || '',
    icon: process.env.MC_SERVER_ICON || 'https://i.imgur.com/6Msem8Q.png',
    site: process.env.MC_SERVER_SITE || '',
  },
  settings: {
    language: {
      main: process.env.LANGUAGE_MAIN || 'en',
      embeds: process.env.LANGUAGE_EMBEDS || '',
      autoReply: process.env.LANGUAGE_AUTO_REPLY || '',
      consoleLog: process.env.LANGUAGE_CONSOLE_LOG || '',
      slashCmds: process.env.LANGUAGE_SLASH_CMDS || '',
    },
    embedsColors: {
      basicCmds: 'Aqua',
      online: 'Green',
      offline: 'Red',
    },
    logging: {
      timezone: '',
      inviteLink: process.env.INVITE_LINK_ENABLED === 'true',
    },
  },
  autoChangeStatus: {
    enabled: process.env.AUTO_CHANGE_STATUS_ENABLED === 'true',
    updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 60, // in seconds
    adminOnly: process.env.ADMIN_ONLY === 'true',
    playerAvatarEmoji: process.env.PLAYER_AVATAR_EMOJI === 'true',
    guildID: process.env.DISCORD_GUILD_ID,
    isOnlineCheck: process.env.IS_ONLINE_CHECK === 'true',
  },
  playerCountCH: {
    enabled: process.env.PLAYER_COUNT_ENABLED === 'true',
    updateInterval: parseInt(process.env.PLAYER_COUNT_UPDATE_INTERVAL) || 60, // in seconds
    guildID: process.env.DISCORD_GUILD_ID,
    channelId: process.env.STATS_CHANNEL_ID,
  },
  autoReply: {
    enabled: false,
    version: {
      enabled: true,
      triggerWords: ['version of the server?', 'version'],
    },
    ip: {
      enabled: true,
      triggerWords: ['ip of the server', 'ip'],
    },
    site: {
      enabled: true,
      triggerWords: ['website link', 'website', 'url', 'site', 'vote url', 'link'],
    },
    status: {
      enabled: true,
      triggerWords: ['is server online?', 'is server offline', 'status of the server'],
    },
  },
  commands: {
    slashCommands: true,
    prefixCommands: {
      enabled: true,
      prefix: '!',
    },
    ip: {
      enabled: true,
      alias: ['ip-address'],
    },
    site: {
      enabled: true,
      alias: ['vote', 'link'],
    },
    version: {
      enabled: true,
      alias: [],
    },
    players: {
      enabled: true,
      alias: ['plist'],
    },
    status: {
      enabled: true,
      alias: [],
    },
    motd: {
      enabled: true,
      alias: [],
    },
    info: {
      enabled: true,
      alias: [],
    },
    help: {
      enabled: true,
      alias: ['commands'],
    },
  },
};