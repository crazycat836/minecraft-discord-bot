# Minecraft Discord Bot

[![License](https://img.shields.io/github/license/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](LICENSE)
[![Issues](https://img.shields.io/github/issues/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/issues)
[![Latest Release](https://img.shields.io/github/v/release/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/releases)
[![Node Version](https://img.shields.io/node/v/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](package.json)
[![Docker Pulls](https://img.shields.io/docker/pulls/crazycat836/minecraftrobot?style=for-the-badge&color=5D6D7E)](https://hub.docker.com/r/crazycat836/minecraftrobot)

English | [繁體中文](README_zh-TW.md)

A bot that connects your Minecraft server to Discord, providing real-time server status, player count, and various useful commands.

[Changelog](CHANGELOG.md) | [Contributing](CONTRIBUTING.md)

## Features

- **Highly Customizable**: Full control over the bot, customize it to your needs.
- **Multilingual Support**: Supports `English`, `Spanish`, `German`, `French`, `Portuguese`, `Russian`, `Ukrainian`, and `Traditional Chinese` with language settings for each feature.
- **Free Hosting Compatibility**: Works with free server hosting services like Aternos, Falixnodes, etc.
- **Anti-Crash System**: Ensures the bot stays running, preventing crashes and unexpected stops.
- **Dynamic Status Messages**: Automatically updated status messages with integrated player lists.
- **Cross-Platform Compatibility**: Support for both Java and Bedrock Minecraft servers.
- **Real-Time Bot Status Updates**: Bot automatically updates with online player count.
- **Multiple Discord Bot Activities**: Support for `playing`, `listening`, `watching`, and `competing`.
- **Multiple Discord Bot Statuses**: Support for `online`, `idle`, `do not disturb (dnd)`, and `invisible`.
- **Auto-Updating Player Count Channel Stats**: Automatically updates player count or server status in a channel counter.
- **Auto Replies**: Enable auto-reply functionality for quick responses about IP, status, version, and website.
- **Colorful Console Logs**: Color-coded console logs for improved appearance and clarity.
- **Player Avatar List**: Use emojis to display player avatars in the player list.
- **Multiple Slash and Prefix Commands**:
  - `ip` - **Sends the address of the Minecraft server.**
  - `motd` - **Sends the Message of the Day (MOTD) of the Minecraft server.**
  - `players` - **Sends a list of currently online players.**
  - `status` - **Sends the current status of the Minecraft server.**
  - `version` - **Sends the version of the Minecraft server.**
  - `site` - **Sends the website/vote link of the Minecraft server.**
  - `help` - **Provides a list of available commands.**
  - `help [command]` - **Sends detailed information about a command.**

## Installation

There are two main ways to install and run the bot:

1. **Using Docker** (recommended for production)
2. **Manual Installation** (recommended for development)

### Quick Start with Docker

The easiest way to get started is with a single Docker command:

```bash
docker run -d \
  --name minecraft-discord-bot \
  -e DISCORD_BOT_TOKEN=your_token \
  -e DISCORD_GUILD_ID=your_guild_id \
  -e MC_SERVER_NAME=your_server_name \
  -e MC_SERVER_VERSION=your_server_version \
  -e MC_SERVER_IP=your_server_ip \
  -e LANGUAGE_MAIN=en \
  crazycat836/minecraft-discord-bot
```

### Deployment with Docker Compose

For a more robust setup, we recommend using Docker Compose:

1. **Download the Docker Compose configuration file**

```bash
wget https://raw.githubusercontent.com/crazycat836/minecraft-discord-bot/main/docker-compose.example.yml -O docker-compose.yml
```

2. **Edit the configuration file**

```bash
nano docker-compose.yml
```

Replace the placeholders with your actual values:
- `your_discord_bot_token_here`: Your Discord bot token
- `your_discord_guild_id_here`: Your Discord server ID
- `your_stats_channel_id_here`: The channel ID where you want to display stats
- `your_minecraft_server_name_here`: Your Minecraft server name
- `your_minecraft_server_version_here`: Your Minecraft server version
- `your_minecraft_server_ip_here`: Your Minecraft server IP

3. **Start the container**

```bash
docker-compose up -d
```

4. **Check container status and logs**

```bash
docker-compose ps
docker-compose logs -f
```

### Docker Environment Variable Setup Methods

When using Docker, there are several ways to set environment variables:

1. **Using command line arguments:**
   ```bash
   docker run -d \
     -e DISCORD_BOT_TOKEN=your_token \
     -e DISCORD_GUILD_ID=your_guild_id \
     -e MC_SERVER_NAME="Your Server Name" \
     -e MC_SERVER_VERSION=1.20.4 \
     -e MC_SERVER_IP=mc.example.com \
     -e LANGUAGE_MAIN=en \
     crazycat836/minecraft-discord-bot
   ```

2. **Using .env file with docker-compose:**
   Create a `.env` file in the same directory as your `docker-compose.yml`:
   ```env
   DISCORD_BOT_TOKEN=your_token
   DISCORD_GUILD_ID=your_guild_id
   STATS_CHANNEL_ID=your_channel_id
   MC_SERVER_NAME=Your Server Name
   MC_SERVER_VERSION=1.20.4
   MC_SERVER_IP=mc.example.com
   LANGUAGE_MAIN=en
   ```
   
   Then in your `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     minecraft-discord-bot:
       image: crazycat836/minecraft-discord-bot
       environment:
         - DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
         - DISCORD_GUILD_ID=${DISCORD_GUILD_ID}
         - STATS_CHANNEL_ID=${STATS_CHANNEL_ID}
         - MC_SERVER_NAME=${MC_SERVER_NAME}
         - MC_SERVER_VERSION=${MC_SERVER_VERSION}
         - MC_SERVER_IP=${MC_SERVER_IP}
         - LANGUAGE_MAIN=${LANGUAGE_MAIN}
   ```
   
   Run: `docker-compose up -d`

3. **Using Docker environment file:**
   ```bash
   docker run --env-file .env -d crazycat836/minecraft-discord-bot
   ```

For a complete list of available environment variables, see the `.env.example` file in the repository.

### Special Environment Variables Notes

#### NODE_ENV Environment Variable
The `NODE_ENV` environment variable controls the bot's logging level and certain behaviors:
- `development`: Most verbose logging level (TRACE), suitable for development
- `test`: Detailed logging level (DEBUG), suitable for testing
- `production`: Standard logging level (INFO), recommended for production use
- `docker`: Standard logging level (INFO), suitable for Docker environments

#### Update Interval Behavior
In development and test environments (`NODE_ENV` set to `development` or `test`), the system will automatically set the following update intervals to 30 seconds to speed up development and testing:
- `UPDATE_INTERVAL`: Status update interval
- `PLAYER_COUNT_UPDATE_INTERVAL`: Player count channel update interval

In production environments, these values must be at least 60 seconds to avoid Discord API rate limits.

### Docker Troubleshooting

#### Container Won't Start

Check the logs for error messages:

```bash
docker-compose logs
```

#### Discord Bot Won't Connect

Make sure your `DISCORD_BOT_TOKEN` is correct and the bot has been invited to your server.

#### Can't Get Minecraft Server Status

Ensure your `MC_SERVER_IP` and `MC_SERVER_PORT` are set correctly and the server is accessible from the container's network.

#### Updating the Bot

To update to the latest version, run:

```bash
docker-compose pull
docker-compose up -d
```

#### Backing Up Data

The container stores data in the `./data` directory. To back up data, simply copy this directory:

```bash
cp -r ./data /path/to/backup
```

### Manual Installation

1. **System Requirements:**
   - Install [Node.js](https://nodejs.org/en/download/current) (v23.0.0 or higher)
   - _(Recommended: [Visual Studio Code](https://code.visualstudio.com/Download))_

2. **Install Dependencies:**
   - Open the bot folder in Visual Studio Code
   - Open terminal with **Ctrl + `**
   - Run `npm install` in the terminal

3. **Configure the Bot:**
   - Copy `.env.example` to `.env` (or run `npm run setup`)
   - Edit the `.env` file with your settings:
     ```env
     # Required Settings
     DISCORD_BOT_TOKEN=      # Your Discord bot token
     DISCORD_GUILD_ID=       # Your Discord server ID
     MC_SERVER_NAME=         # Your Minecraft server name
     MC_SERVER_VERSION=      # Your Minecraft server version
     MC_SERVER_IP=           # Your Minecraft server IP
     
     # Optional Settings
     MC_SERVER_PORT=25565    # Default: 25565
     MC_SERVER_TYPE=java     # Options: 'java' or 'bedrock'
     STATS_CHANNEL_ID=       # Channel ID for player count stats
     LANGUAGE_MAIN=en        # Main language (en, es, de, fr, pt, ru, uk, zh-TW)
     ```

4. **Customize Bot Settings (Optional):**
   - Open `config.js`
   - Customize bot features:
     - Auto status updates
     - Command prefix
     - Auto reply triggers
     - And more...

5. **Start the Bot:**
   ```bash
   npm start  # Starts the bot in production mode
   # or
   npm run dev  # Starts the bot in development mode with auto-reload
   ```

## Logging System

The bot includes a unified logging system that provides consistent interfaces for recording messages at different levels of importance.

### Log Levels

The system defines six log levels, from most critical to most detailed:

1. **FATAL** - Critical errors causing application termination
2. **ERROR** - Errors preventing functionality from working
3. **WARN** - Warnings about potential issues
4. **INFO** - Important operational information
5. **DEBUG** - Detailed information for debugging
6. **TRACE** - Very detailed tracing information

### Configuration

The logging system can be configured through environment variables or the config file:

```env
# In .env file
NODE_ENV=production  # Controls default log level (development, test, production, docker)
```

```javascript
// In config.js
settings: {
  logging: {
    level: 'INFO',           // Global log level
    timezone: '',            // Optional timezone for log timestamps
  }
}
```

### Environment-Specific Defaults

- **development**: Shows all logs (TRACE and above)
- **test**: Shows debug logs (DEBUG and above)
- **production**: Shows important logs only (INFO and above)
- **docker**: Shows important logs only (INFO and above)

## Multilingual Support

The bot supports the following languages:
- English (en)
- Spanish (es)
- German (de)
- French (fr)
- Portuguese (pt)
- Russian (ru)
- Ukrainian (uk)
- Traditional Chinese (zh-TW)

You must set the `LANGUAGE_MAIN` environment variable to specify the primary language. The bot will automatically use the appropriate translations for all features, including:

- Bot status messages
- Player count channel names
- Command responses
- Console logs
- Auto replies

If you want different features to use different languages, you can set the following environment variables:
- `LANGUAGE_EMBEDS` - Language for embeds
- `LANGUAGE_AUTO_REPLY` - Language for auto replies
- `LANGUAGE_CONSOLE_LOG` - Language for console logs
- `LANGUAGE_SLASH_CMDS` - Language for slash commands

If these variables are left empty, the value from `LANGUAGE_MAIN` will be used.

> **Note**: Bot status text and player count channel text are automatically determined based on the selected language and cannot be directly customized.

## Development

### Setting Up Development Environment

```bash
# Clone the project
git clone https://github.com/crazycat836/minecraft-discord-bot.git

# Navigate to project directory
cd minecraft-discord-bot

# Install dependencies
npm install

# Create .env file
npm run setup

# Start development server
npm run dev
```

### Available Scripts

- `npm start` - Start the bot in production mode
- `npm run dev` - Start the bot in development mode (auto-reload)
- `npm run setup` - Create .env file from example template
- `npm run docker:build` - Build Docker image for your platform
- `npm run docker:build:amd64` - Build Docker image for AMD64 platform
- `npm run docker:build:multi` - Build multi-platform Docker image (AMD64, ARM64)
- `npm run docker:push` - Push Docker image to Docker Hub
- `npm run docker:run` - Start container using docker-compose
- `npm run docker:stop` - Stop and remove container

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/crazycat836/minecraft-discord-bot/tags).

## Contributing

Contributions are welcome! If you'd like to submit a Pull Request, please feel free to do so. For major changes, please open an issue first to discuss what you would like to change.

Please note that this project is released with an MIT license - see the [LICENSE](LICENSE) file for details. By submitting a contribution, you agree that your contribution will be licensed under the same terms.

## Support

If you encounter any issues or have questions, please:
1. Open an [issue](https://github.com/crazycat836/minecraft-discord-bot/issues)

## Built With

**Technologies used in this project**:

- **[Node.js](https://nodejs.org/en/download)** - JavaScript runtime
- **[Discord.js](https://discord.js.org/)** - Discord API framework
- **[node-mcstatus](https://www.npmjs.com/package/node-mcstatus)** - Minecraft server status checker
- **[CommandKit](https://commandkit.js.org/)** - Command framework
