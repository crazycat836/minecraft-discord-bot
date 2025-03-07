# Minecraft Discord Bot

[![License](https://img.shields.io/github/license/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](LICENSE)
[![Issues](https://img.shields.io/github/issues/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/issues)

A Discord bot that bridges your Minecraft server with Discord, providing real-time server status, player count, and various useful commands.

## Features

- **Highly Customizable**: Take full control of the bot and tailor its configuration to meet your unique requirements.
- **Multilingual Support**: `English`, `Spanish`, `German`, `French`, `Portuguese`, `Russian` and `Ukrainian` translations with customizable language settings for each features.
- **Free Hosting Compatibility**: Support for free server hosting providers like Aternos, Falixnodes etc.
- **Anti-Crash System:** This feature safeguards the bot, ensuring its stability and uninterrupted operation by preventing crashes and unexpected halts.
- **Dynamic Status Message**: Auto-updating status messages with integrated player list .
- **Cross-Platform Compatibility**: Supports Java and Bedrock Minecraft servers.
- **Real-Time Bot status Updates**: The bot automatically updates its status with the number of online players.
- **Multiple Discord bot activities**: `playing`, `listening`, `watching`, and `competing`.
- **Multiple Discord bot statuses**: `online`, `idle`, `do not disturb (dnd)`, and `invisible`.
- **Auto-updating Player Count Channel Stats**: Automatically updates the player count or server status in a channel counter.
- **Auto Responses**: Save time and provide quick information by enabling automatic responses to messages related to IP, status, version, and site.
- **ColorFul Console Logging**: Color-coded console logs for improved appearance and clarity.
- **Player Avatar List**: Display the players' avatars alongside their names using emojis in player list.
- **Varies Slash and Prefix Commands**:
  - `ip` - **Sends the server address of the Minecraft server.**
  - `motd` - **Sends the Minecraft Server's Message of the Day (MOTD).**
  - `players` - **Sends the list of players who are currently online on the Minecraft server.**
  - `status` - **Sends the current status of the Minecraft server.**
  - `version` - **Sends the version of the Minecraft server.**
  - `site` - **Sends the website/vote link of the Minecraft server.**
  - `help` - **Provides a list of available commands.**
  - `help [command]` - **Sends the details about a command.**

## Installation

1. **Requirements:**
   - Install [Node.js](https://nodejs.org/en/download/current)
   - _(Recommended: [Visual Studio Code](https://code.visualstudio.com/Download))_

2. **Install Dependencies:**
   - Open bot folder in Visual Studio Code
   - Launch terminal with **Ctrl + `**
   - Run `npm install` in terminal

3. **Configure the Bot:**
   - Copy `.env.example` to `.env`
   - Edit `.env` file with your settings:
     ```env
     # Required Settings
     DISCORD_BOT_TOKEN=      # Your Discord Bot Token
     DISCORD_GUILD_ID=       # Your Discord Server ID
     MC_SERVER_NAME=         # Your Minecraft Server Name
     MC_SERVER_VERSION=      # Your Minecraft Server Version
     MC_SERVER_IP=          # Your Minecraft Server IP

     # Optional Settings
     MC_SERVER_PORT=25565   # Default: 25565
     MC_SERVER_TYPE=java    # Options: 'java' or 'bedrock'
     ```

4. **Customize Bot Settings (Optional):**
   - Open `config.js`
   - Customize bot features:
     - Language preferences
     - Auto-status updates
     - Command prefixes
     - Auto-reply triggers
     - And more...

5. **Start the Bot:**
   ```bash
   npm start
   # or
   node .
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Please note that this project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. By contributing, you agree that your contributions will be licensed under the same terms.

## Support

If you encounter any problems or have questions, please:
1. Check the [documentation]()
2. Open an [issue](https://github.com/crazycat836/minecraft-discord-bot/issues)

## Built with

**Technologies used in the project**:

- **[Node.js](https://nodejs.org/en/download)**
- **[Discord.js](https://discord.js.org/)**
- **[node-mcstatus](https://www.npmjs.com/package/node-mcstatus)**
- **[CommandKit](https://commandkit.js.org/)**
