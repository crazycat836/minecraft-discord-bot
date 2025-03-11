# Minecraft Discord Bot

[![License](https://img.shields.io/github/license/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](LICENSE)
[![Issues](https://img.shields.io/github/issues/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/issues)
[![Latest Release](https://img.shields.io/github/v/release/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/releases)
[![Node Version](https://img.shields.io/node/v/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](package.json)
[![Docker Pulls](https://img.shields.io/docker/pulls/crazycat836/minecraftrobot?style=for-the-badge&color=5D6D7E)](https://hub.docker.com/r/crazycat836/minecraftrobot)

English | [繁體中文](README_zh-TW.md)

A Discord bot that bridges your Minecraft server with Discord, providing real-time server status, player count, and various useful commands.

[Changelog](CHANGELOG.md) | [Contributing](CONTRIBUTING.md) | [Documentation]()

## Features

- **Highly Customizable**: Take full control of the bot and tailor its configuration to meet your unique requirements.
- **Multilingual Support**: `English`, `Spanish`, `German`, `French`, `Portuguese`, `Russian`, `Ukrainian` and `Traditional Chinese` translations with customizable language settings for each features.
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

### Quick Start with Docker

```bash
docker run -d \
  --name minecraft-discord-bot \
  -e DISCORD_BOT_TOKEN=your_token \
  -e DISCORD_GUILD_ID=your_guild_id \
  -e MC_SERVER_NAME=your_server_name \
  -e MC_SERVER_VERSION=your_server_version \
  -e MC_SERVER_IP=your_server_ip \
  crazycat836/minecraft-discord-bot
```

### Docker Environment Variables

There are several ways to set environment variables when using Docker:

1. **Using command line arguments:**
   ```bash
   docker run -d \
     -e DISCORD_BOT_TOKEN=your_token \
     -e DISCORD_GUILD_ID=your_guild_id \
     -e MC_SERVER_NAME="Your Server Name" \
     -e MC_SERVER_VERSION=1.20.4 \
     -e MC_SERVER_IP=mc.example.com \
     crazycat836/minecraft-discord-bot
   ```

2. **Using a .env file with docker-compose:**
   Create a `.env` file in the same directory as your `docker-compose.yml`:
   ```env
   DISCORD_BOT_TOKEN=your_token
   DISCORD_GUILD_ID=your_guild_id
   MC_SERVER_NAME=Your Server Name
   MC_SERVER_VERSION=1.20.4
   MC_SERVER_IP=mc.example.com
   ```
   
   Then in your `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     bot:
       image: crazycat836/minecraft-discord-bot
       environment:
         - DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
         - DISCORD_GUILD_ID=${DISCORD_GUILD_ID}
         - MC_SERVER_NAME=${MC_SERVER_NAME}
         - MC_SERVER_VERSION=${MC_SERVER_VERSION}
         - MC_SERVER_IP=${MC_SERVER_IP}
   ```
   
   Run with: `docker-compose up -d`

3. **Using Docker environment file:**
   ```bash
   docker run --env-file .env -d crazycat836/minecraft-discord-bot
   ```

For a complete list of available environment variables, see the `.env.example` file in the repository.

### Manual Installation

1. **Requirements:**
   - Install [Node.js](https://nodejs.org/en/download/current) (v23.0.0 or higher)
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

## Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/crazycat836/minecraft-discord-bot.git

# Enter the project directory
cd minecraft-discord-bot

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm start` - Start the bot
- `npm run dev` - Start the bot in development mode with auto-reload
- `npm run docker:build` - Build Docker image for your platform
- `npm run docker:build:amd64` - Build Docker image for AMD64 platform
- `npm run docker:build:multi` - Build Docker image for multiple platforms (AMD64, ARM64)
- `npm run docker:push` - Push Docker image to Docker Hub
- `npm run docker:run` - Start container with docker-compose
- `npm run docker:stop` - Stop and remove container

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/crazycat836/minecraft-discord-bot/tags).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Please note that this project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. By contributing, you agree that your contributions will be licensed under the same terms.

## Support

If you encounter any problems or have questions, please:
1. Check the [documentation]()
2. Open an [issue](https://github.com/crazycat836/minecraft-discord-bot/issues)

## Built with

**Technologies used in the project**:

- **[Node.js](https://nodejs.org/en/download)** - JavaScript runtime
- **[Discord.js](https://discord.js.org/)** - Discord API framework
- **[node-mcstatus](https://www.npmjs.com/package/node-mcstatus)** - Minecraft server status checker
- **[CommandKit](https://commandkit.js.org/)** - Command framework
