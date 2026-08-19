# Minecraft Discord Bot

[![License](https://img.shields.io/github/license/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](LICENSE)
[![Issues](https://img.shields.io/github/issues/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/issues)
[![Latest Release](https://img.shields.io/github/v/release/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/releases)
[![Node Version](https://img.shields.io/node/v/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](package.json)
[![Docker Pulls](https://img.shields.io/docker/pulls/crazycat836/minecraftrobot?style=for-the-badge&color=5D6D7E)](https://hub.docker.com/r/crazycat836/minecraftrobot)

A bot that connects your Minecraft server to Discord, providing real-time server status, player count, and various useful commands.

[Changelog](CHANGELOG.md) | [Contributing](CONTRIBUTING.md)

## Features

- **Environment Variable Configuration**: All settings are configured via environment variables, keeping sensitive information secure.
- **Multilingual Support**: Supports `English`, `Spanish`, `German`, `French`, `Portuguese`, `Russian`, `Ukrainian`, and `Traditional Chinese` with language settings for each feature.
- **Free Hosting Compatibility**: Works with free server hosting services like Aternos, Falixnodes, etc.
- **Anti-Crash System**: Ensures the bot stays running, preventing crashes and unexpected stops.
- **Dynamic Status Messages**: Automatically updated status messages with integrated player lists.
- **Cross-Platform Compatibility**: Support for both Java and Bedrock Minecraft servers.
- **Real-Time Bot Status Updates**: Bot automatically updates with online player count.
- **Multiple Discord Bot Activities**: Support for `playing`, `listening`, `watching`, and `competing`.
- **Multiple Discord Bot Statuses**: Support for `online`, `idle`, `do not disturb (dnd)`, and `invisible`.
- **Auto-Updating Player Count Channel**: Automatically updates player count or server status in a channel counter. (Requires `STATS_CHANNEL_ID` in config, distinct from `/setstatus`)
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
  - `setname` - **Updates the server name used in embeds (Admin only).**
  - `setsite` - **Updates the server website link used in embeds (Admin only).**
  - `help` - **Provides a list of available commands.**
  - `help [command]` - **Sends detailed information about a command.**

## What's New in v1.2.0

This update focuses on internationalization improvements, developer experience, and code quality.

### Improved in v1.2.0
- **Default Language**: Changed the default language to English for broader accessibility
- **Documentation**: Comprehensive code comments added across the codebase for easier maintenance
- **Translation Consistency**: Verified and fixed missing keys across all supported languages (de, es, fr, pt, ru, uk)
- **Bug Fixes**: Resolved character encoding issues in status messages

## Installation

There are two main ways to install and run the bot:

1. **Using Docker** (recommended for production & local development)
2. **Manual Installation** 

### Local Development with Docker (Recommended)

To run the bot locally using Docker:

1. Copy `docker-compose.example.yml` to `docker-compose.yml` (if you haven't already):
   ```bash
   npm run setup
   ```
2. Edit `docker-compose.yml` and add your Discord Token and other environment variables.
3. Start the bot:
   ```bash
   npm run docker:dev
   ```

### Quick Start with Docker (Production)

The easiest way to get started is with a single Docker command:

```bash
docker run -d \
  --name minecraft-discord-bot \
  -v ./data:/app/data \
  -e DISCORD_BOT_TOKEN=your_token \
  -e DISCORD_GUILD_ID=your_guild_id \
  -e LANGUAGE_MAIN=en \
  crazycat836/minecraftrobot:latest
```

The Minecraft server address is **not** an environment variable. Once the bot is running,
set it from Discord with `/setstatus`:

```
/setstatus name:My Server ip:mc.example.com port:25565 type:Java
```

That configuration is stored in `/app/data/data.json`, which is why the `-v ./data:/app/data`
mount above matters — without it the container loses its configuration every time it is
recreated, for example when you pull a new image.

### Docker Environment Variable Setup Methods

When using Docker, there are two ways to set environment variables:

1. **Using command line arguments:**
   ```bash
   docker run -d \
     -v ./data:/app/data \
     -e DISCORD_BOT_TOKEN=your_token \
     -e DISCORD_GUILD_ID=your_guild_id \
     -e LANGUAGE_MAIN=en \
     crazycat836/minecraftrobot:latest
   ```

2. **Using environment file:**
   Create a `.env` file:
   ```env
   DISCORD_BOT_TOKEN=your_token
   DISCORD_GUILD_ID=your_guild_id
   STATS_CHANNEL_ID=your_channel_id
   LANGUAGE_MAIN=en
   ```
   
   Then run:
   ```bash
   docker run --env-file .env -v ./data:/app/data -d crazycat836/minecraftrobot:latest
   ```

> **Important Note**: This project uses environment variables for all configuration settings to avoid exposing sensitive information in the codebase. The `config.js` file is included in `.gitignore` and `.dockerignore` to prevent accidental exposure of sensitive data. When deploying with Docker, make sure to provide all necessary environment variables as shown above.

For a complete list of available environment variables, see the table below:

| Environment Variable | Description | Default Value |
|----------------------|-------------|---------------|
| DISCORD_BOT_TOKEN | Discord bot token (required) | none |
| DISCORD_GUILD_ID | Discord server ID (required) | none |
| STATS_CHANNEL_ID | Channel ID for player count (Must be set here, cannot be changed via command) | none |
| LANGUAGE_MAIN | Main language for the bot | en |
| UPDATE_INTERVAL | Update interval in seconds | 60 |
| PLAYER_COUNT_ENABLED | Enable player count feature | true |
| AUTO_CHANGE_STATUS_ENABLED | Enable status change feature | true |
| NODE_ENV | Environment (production/development) | production |

More environment variables are available for fine-tuning command aliases and other features. Refer to the Dockerfile for a complete list.

### Special Environment Variables Notes

#### NODE_ENV Environment Variable
The `NODE_ENV` environment variable controls the bot's logging level and certain behaviors:
- `development`: Most verbose logging level (TRACE), suitable for development
- `test`: Detailed logging level (DEBUG), suitable for testing
- `production`: Standard logging level (INFO), recommended for production use
- `docker`: Standard logging level (INFO), suitable for Docker environments

#### Update Interval Behavior
In development and test environments (`NODE_ENV` set to `development` or `test`), the system will automatically set the following update intervals to 30 seconds to speed up development and testing: