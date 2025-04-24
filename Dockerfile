# syntax=docker/dockerfile:1.4

# Build stage
FROM node:23-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# Copy only necessary files
COPY src ./src
COPY locales ./locales
COPY config.js ./

# Production stage
FROM node:23-alpine AS runner

# Install tini and create non-root user in one layer
RUN apk add --no-cache tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set working directory and switch to non-root user
WORKDIR /app
USER nodejs

# Copy built files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app ./

# Set environment variables
# These will appear in the Docker environment variables interface
# Discord Bot Settings
ENV DISCORD_BOT_TOKEN="" \
    DISCORD_GUILD_ID="" \
    STATS_CHANNEL_ID="" \
    BOT_PRESENCE_ENABLED="true" \
    BOT_ACTIVITY="Playing" \
    BOT_STATUS_ONLINE="online" \
    BOT_STATUS_OFFLINE="dnd"

# Minecraft Server Settings
ENV MC_SERVER_IP="" \
    MC_SERVER_PORT="25565" \
    MC_SERVER_TYPE="java" \
    MC_SERVER_NAME="" \
    MC_SERVER_VERSION="" \
    MC_SERVER_SITE=""

# Language Settings
ENV LANGUAGE_MAIN="zh-TW" \
    TIMEZONE="Asia/Taipei" \
    INVITE_LINK="true"

# Feature Toggles
ENV AUTO_CHANGE_STATUS_ENABLED="true" \
    UPDATE_INTERVAL="60" \
    ADMIN_ONLY="false" \
    PLAYER_AVATAR_EMOJI="true" \
    IS_ONLINE_CHECK="true" \
    PLAYER_COUNT_ENABLED="true"

# Command Aliases
ENV COMMAND_PREFIX="!" \
    CMD_IP_ALIAS="ip-address" \
    CMD_SITE_ALIAS="vote,link" \
    CMD_VERSION_ALIAS="" \
    CMD_PLAYERS_ALIAS="plist" \
    CMD_STATUS_ALIAS="" \
    CMD_MOTD_ALIAS="" \
    CMD_INFO_ALIAS="" \
    CMD_HELP_ALIAS="commands"

# Node Environment - Set to dockerdebug for Info level logging
ENV NODE_ENV="production"

# Start the bot
CMD ["node", "src/index.js"]

# Add labels
LABEL org.opencontainers.image.source="https://github.com/crazycat836/minecraft-discord-bot" \
      org.opencontainers.image.description="Discord bot for Minecraft server monitoring" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://hub.docker.com/r/crazycat836/minecraftrobot" 