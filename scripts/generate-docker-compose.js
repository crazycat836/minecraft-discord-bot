#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import yaml from 'js-yaml';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: path.join(rootDir, '.env') });

// Paths to files
const examplePath = path.join(rootDir, 'docker-compose.example.yml');
const outputPath = path.join(rootDir, 'docker-compose.yml');

// Check if docker-compose.example.yml exists
if (!fs.existsSync(examplePath)) {
  console.error('Error: docker-compose.example.yml not found!');
  process.exit(1);
}

// Check if .env file exists
if (!fs.existsSync(path.join(rootDir, '.env'))) {
  console.error('Error: .env file not found! Please run "npm run setup" first.');
  process.exit(1);
}

// List of prefixes for application-specific environment variables
const appEnvPrefixes = [
  'DISCORD_',
  'MC_',
  'LANGUAGE_MAIN',  // Only include LANGUAGE_MAIN, not other LANGUAGE_ variables
  'AUTO_CHANGE_STATUS',
  'UPDATE_INTERVAL',
  'ADMIN_ONLY',
  'PLAYER_',
  'IS_ONLINE_CHECK',
  'INVITE_LINK',
  'TIMEZONE',
  'NODE_ENV'
];

// Language variables to exclude (we'll only keep LANGUAGE_MAIN)
const excludedLanguageVars = [
  'LANGUAGE_EMBEDS',
  'LANGUAGE_AUTO_REPLY',
  'LANGUAGE_CONSOLE_LOG',
  'LANGUAGE_SLASH_CMDS'
];

// Function to check if an environment variable is application-specific and not excluded
const isAppEnvVar = (key) => {
  if (excludedLanguageVars.includes(key)) {
    return false;
  }
  return appEnvPrefixes.some(prefix => key.startsWith(prefix)) || 
         ['NODE_ENV', 'TIMEZONE', 'ADMIN_ONLY'].includes(key);
};

try {
  // Read the example file
  const exampleContent = fs.readFileSync(examplePath, 'utf8');
  
  // Parse YAML
  const dockerCompose = yaml.load(exampleContent);
  
  // Get the service name (assuming there's only one service or we want the first one)
  const serviceName = Object.keys(dockerCompose.services)[0];
  
  // Get environment variables from the parsed YAML
  const envVarsInExample = dockerCompose.services[serviceName].environment;
  
  // Extract keys from docker-compose.example.yml
  const dockerComposeKeys = new Set();
  for (const envVar of envVarsInExample) {
    const match = envVar.match(/^([^=]+)(?:=(.*))?$/);
    if (match) {
      dockerComposeKeys.add(match[1].trim());
    }
  }
  
  // Check for app-specific env variables in .env that are not in docker-compose.example.yml
  const missingKeys = [];
  for (const key in process.env) {
    if (isAppEnvVar(key) && !dockerComposeKeys.has(key)) {
      missingKeys.push(key);
    }
  }
  
  // Report missing keys
  if (missingKeys.length > 0) {
    console.warn('\nWARNING: The following environment variables from .env are not in docker-compose.example.yml:');
    missingKeys.forEach(key => console.warn(`- ${key}`));
    console.warn('You may want to add these to your docker-compose.example.yml template.\n');
  }
  
  // Create a new environment array with values from .env
  const newEnvVars = [];
  
  for (const envVar of envVarsInExample) {
    // Parse the environment variable (format: KEY=value or just KEY)
    const match = envVar.match(/^([^=]+)(?:=(.*))?$/);
    if (match) {
      const key = match[1].trim();
      
      // Skip excluded language variables
      if (excludedLanguageVars.includes(key)) {
        console.log(`Skipping excluded language variable: ${key}`);
        continue;
      }
      
      // Check if this key exists in process.env (from .env file)
      if (process.env[key]) {
        newEnvVars.push(`${key}=${process.env[key]}`);
      } else {
        // Keep the original value if not in .env
        newEnvVars.push(envVar);
      }
    } else {
      // If format is unexpected, keep as is
      newEnvVars.push(envVar);
    }
  }
  
  // Update the environment in the docker-compose object
  dockerCompose.services[serviceName].environment = newEnvVars;
  
  // Convert back to YAML
  const newContent = yaml.dump(dockerCompose, { lineWidth: -1 });
  
  // Delete existing docker-compose.yml if it exists
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log('Existing docker-compose.yml deleted.');
  }
  
  // Write the new docker-compose.yml
  fs.writeFileSync(outputPath, newContent, 'utf8');
  console.log('Successfully generated docker-compose.yml with environment variables from .env!');
  console.log('Language settings simplified: Only LANGUAGE_MAIN is included.');
  
} catch (error) {
  console.error('Error generating docker-compose.yml:', error.message);
  process.exit(1);
} 