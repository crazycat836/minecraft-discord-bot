import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import config from '../../config.js';

const DATA_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data.json');

/**
 * Returns the absolute path to data.json.
 */
export function getDataPath() {
  return DATA_PATH;
}

/**
 * Safely reads and parses data.json.
 * Handles: missing file, empty file, corrupted JSON (creates backup).
 * Returns a default object on any failure.
 */
export async function readData() {
  try {
    const content = await fsPromises.readFile(DATA_PATH, 'utf8');

    if (!content || content.trim() === '') {
      logger.warn('DataStore: Empty data.json, returning default');
      return { autoChangeStatus: [] };
    }

    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.warn('DataStore: data.json not found, returning default');
      return { autoChangeStatus: [] };
    }

    if (err instanceof SyntaxError) {
      logger.error(`DataStore: Corrupted data.json: ${err.message}`);
      try {
        const backupPath = `${DATA_PATH}.corrupted-${Date.now()}`;
        await fsPromises.writeFile(backupPath, content);
        logger.info(`DataStore: Backup created at ${backupPath}`);
      } catch (backupErr) {
        logger.error(`DataStore: Failed to create backup: ${backupErr.message}`);
      }
      return { autoChangeStatus: [] };
    }

    logger.error(`DataStore: Error reading data.json: ${err.message}`);
    return { autoChangeStatus: [] };
  }
}

/**
 * Safely writes data to data.json with pretty-printing.
 */
export async function writeData(data) {
  try {
    await fsPromises.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logger.error(`DataStore: Failed to write data.json: ${err.message}`);
    throw err;
  }
}

/**
 * Atomic read-modify-write. The updater function receives the current data
 * and should return the modified data (or mutate in place).
 */
export async function updateData(updater) {
  const data = await readData();
  const updated = await updater(data);
  const toWrite = updated !== undefined ? updated : data;
  await writeData(toWrite);
  return toWrite;
}

/**
 * Builds a server config by merging data.json's autoChangeStatus[0] with config.js defaults.
 * Returns null if no server is configured.
 */
export async function getServerConfig() {
  const dataJson = await readData();

  if (dataJson.autoChangeStatus?.length > 0) {
    const record = dataJson.autoChangeStatus[0];
    const settings = dataJson.serverSettings || {};

    return {
      ...config,
      mcserver: {
        ...config.mcserver,
        ip: record.ip,
        port: record.port,
        type: record.type || 'java',
        name: settings.name || record.name || record.ip || config.mcserver.name || 'Minecraft Server',
        site: settings.site || config.mcserver.site || '',
        version: record.version || config.mcserver.version || 'Unknown',
      }
    };
  }

  return null;
}

export default { getDataPath, readData, writeData, updateData, getServerConfig };
