import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import config from '../../config.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

// data.json lives outside src/ so the directory can be mounted as a volume without
// shadowing the application code. Without a mount it is lost whenever the container
// is recreated, which silently wipes the server configuration on every image update.
const DATA_DIR = path.join(MODULE_DIR, '..', '..', 'data');
const DATA_PATH = path.join(DATA_DIR, 'data.json');

// Where data.json lived before v1.2.5
const LEGACY_DATA_PATH = path.join(MODULE_DIR, '..', 'data.json');

/**
 * Returns the absolute path to data.json.
 */
export function getDataPath() {
  return DATA_PATH;
}

/**
 * Moves data.json from its pre-1.2.5 location (src/data.json) into the mountable
 * data/ directory. Call once at startup; a no-op once the file has moved.
 */
export async function migrateLegacyDataFile() {
  try {
    await fsPromises.access(DATA_PATH);
    return false;
  } catch {
    // Not on the new path yet, see whether there is anything to move
  }

  let legacyContent;
  try {
    legacyContent = await fsPromises.readFile(LEGACY_DATA_PATH, 'utf8');
  } catch {
    return false;
  }

  try {
    await fsPromises.mkdir(DATA_DIR, { recursive: true });
    await fsPromises.writeFile(DATA_PATH, legacyContent, 'utf8');
    // Best effort: keeping the old file around would only confuse the next reader
    await fsPromises.rename(LEGACY_DATA_PATH, `${LEGACY_DATA_PATH}.migrated`).catch(() => {});
    logger.info(`DataStore: Migrated data.json to ${DATA_PATH}`);
    return true;
  } catch (err) {
    logger.error(`DataStore: Failed to migrate data.json: ${err.message}`);
    return false;
  }
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
 * Module-private on purpose: every caller goes through updateData so writes stay serialized.
 */
async function writeData(data) {
  try {
    await fsPromises.mkdir(DATA_DIR, { recursive: true });
    await fsPromises.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logger.error(`DataStore: Failed to write data.json: ${err.message}`);
    throw err;
  }
}

// Serializes read-modify-write cycles. Without this, two callers can each read
// data.json, then write back their own stale copy and silently drop the other's change.
let writeQueue = Promise.resolve();

/**
 * Atomic read-modify-write. The updater function receives the current data
 * and should return the modified data (or mutate in place).
 * Concurrent calls are queued, so each updater sees the previous one's result.
 */
export async function updateData(updater) {
  const run = writeQueue.then(async () => {
    const data = await readData();
    const updated = await updater(data);
    const toWrite = updated !== undefined ? updated : data;
    await writeData(toWrite);
    return toWrite;
  });
  // Keep the queue running even if this update throws, without retaining the written data
  writeQueue = run.then(() => {}, () => {});
  return run;
}

/**
 * Sets a single key on data.json's serverSettings, creating the object if needed.
 */
export async function setServerSetting(key, value) {
  await updateData((data) => {
    if (!data.serverSettings) {
      data.serverSettings = {};
    }
    data.serverSettings[key] = value;
  });
}

/**
 * Resolves the website to show, from data.json with a fall back to config.js.
 */
export function getSite(dataJson) {
  return dataJson.serverSettings?.site || config.mcserver.site || '';
}

/**
 * Builds a server config by merging data.json's autoChangeStatus[0] with config.js defaults.
 * Returns null when there is no server worth probing — either no record at all, or a
 * record with no address. Callers only ever have to handle "null means not configured".
 */
export async function getServerConfig() {
  const dataJson = await readData();
  const record = dataJson.autoChangeStatus?.[0];

  if (record?.ip) {
    const settings = dataJson.serverSettings || {};

    return {
      ...config,
      mcserver: {
        ...config.mcserver,
        ip: record.ip,
        port: record.port,
        type: record.type || 'java',
        name: settings.name || record.name || config.mcserver.name || 'Minecraft Server',
        site: getSite(dataJson),
      }
    };
  }

  return null;
}

export default {
  getDataPath,
  migrateLegacyDataFile,
  readData,
  updateData,
  setServerSetting,
  getSite,
  getServerConfig
};
