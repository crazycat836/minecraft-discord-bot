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
COPY translation ./translation
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
    STATS_CHANNEL_ID=""

# Minecraft Server Settings
ENV MC_SERVER_IP="" \
    MC_SERVER_PORT="25565" \
    MC_SERVER_TYPE="java" \
    MC_SERVER_NAME="" \
    MC_SERVER_VERSION="" \
    MC_SERVER_ICON="https://i.imgur.com/6Msem8Q.png" \
    MC_SERVER_SITE=""

# Language Settings
ENV LANGUAGE_MAIN="zh-TW"

# Feature Toggles
ENV DEBUG_MODE="false" \
    ERROR_LOGGING_ENABLED="true" \
    SERVER_INFO_LOGGING_ENABLED="true" \
    AUTO_CHANGE_STATUS_ENABLED="true" \
    UPDATE_INTERVAL="60" \
    ADMIN_ONLY="false" \
    PLAYER_AVATAR_EMOJI="true"

# Player Count Feature
ENV PLAYER_COUNT_ENABLED="true" \
    PLAYER_COUNT_UPDATE_INTERVAL="60"

# Node Environment
ENV NODE_ENV="production"

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the bot
CMD ["npm", "start"]

# Add labels
LABEL org.opencontainers.image.source="https://github.com/crazycat836/minecraft-discord-bot" \
      org.opencontainers.image.description="Discord bot for Minecraft server monitoring" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://hub.docker.com/r/crazycat836/minecraftrobot"