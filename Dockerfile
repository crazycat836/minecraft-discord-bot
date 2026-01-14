# syntax=docker/dockerfile:1.4

# Build stage
FROM node:23-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm install

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

# Language Settings
ENV LANGUAGE_MAIN="zh-TW" \
    TIMEZONE="Asia/Taipei" \
    INVITE_LINK="true"

# Command Settings
ENV COMMAND_PREFIX="!"

# Node Environment - Set to dockerdebug for Info level logging
ENV NODE_ENV="production"

# Start the bot
CMD ["node", "src/index.js"]

# Add labels
LABEL org.opencontainers.image.source="https://github.com/crazycat836/minecraft-discord-bot" \
      org.opencontainers.image.description="Discord bot for Minecraft server monitoring" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://hub.docker.com/r/crazycat836/minecraftrobot" 