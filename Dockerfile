# Use the official Node.js base image
FROM node:23-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory inside the container
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy all project files to the container
COPY . .

# Set the command to run when the container starts (can be modified according to the scripts in package.json)
CMD ["npm", "start"]