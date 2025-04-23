// config.js
// "MC" refers to Minecraft in the comments for convenience.
// Copy this file to config.js and fill in your values.

export default {
  bot: {
    token: process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE', // Use environment variable for token
    presence: {
      enabled: true,
      activity: 'Playing', // Options: Playing, Listening, Watching, Competing.
      status: {
        online: 'online',
        offline: 'dnd',
      },
    },
  },
  mcserver: {
    ip: 'YOUR_MC_SERVER_IP', 
    port: 25565,
    type: 'java', // 'java' or 'bedrock'
    name: 'Your Server Name', 
    version: "Your Server Version", 
    icon: 'https://example.com/server-icon.png', // URL to server icon
    site: '',
  },
  settings: {
    guildID: 'YOUR_DISCORD_SERVER_ID', // Discord server ID (shared setting)
    language: 'zh-TW', // Traditional Chinese, used for all language settings
    embedsColors: {
      basicCmds: 'Aqua',
      online: 'Green',
      offline: 'Red',
    },
    logging: {
      timezone: 'Asia/Taipei', // Taipei timezone
      inviteLink: true,
    },
  },
  autoChangeStatus: {
    enabled: true,
    updateInterval: 60, // in seconds
    adminOnly: true,
    playerAvatarEmoji: true,
    isOnlineCheck: true,
  },
  playerCountCH: {
    enabled: true,
    updateInterval: 60, // in seconds
    channelId: 'YOUR_CHANNEL_ID', // Player count channel ID
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