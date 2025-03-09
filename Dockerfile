# Build stage
FROM node:23-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Production stage
FROM node:23-alpine

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app ./

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Switch to non-root user
USER nodejs

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the bot
CMD ["npm", "start"]

# Document exposed port
EXPOSE 3000

# Add labels
LABEL org.opencontainers.image.source="https://github.com/crazycat836/minecraft-discord-bot" \
      org.opencontainers.image.description="Discord bot for Minecraft server monitoring" \
      org.opencontainers.image.licenses="MIT"