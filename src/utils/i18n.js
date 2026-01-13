import i18next from 'i18next';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import config from '../../config.js';

/**
 * i18next initialization with standard JSON format
 */

// Get __dirname (ESM does not provide this by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supported languages
const supportedLanguages = ['en', 'es', 'de', 'fr', 'pt', 'ru', 'uk', 'zh-TW'];

// Language mapping for compatibility
const languageMapping = {
  'zh': 'zh-TW', // Map 'zh' to 'zh-TW'
  'zh-CN': 'zh-TW' // Map 'zh-CN' to 'zh-TW' as well
};

// Function to ensure we're using a supported language code
const ensureSupportedLanguage = (lang) => {
  if (!lang) return 'en';
  
  // If the language is directly supported
  if (supportedLanguages.includes(lang)) {
    return lang;
  }
  
  // Check the mapping for alternative codes
  if (languageMapping[lang]) {
    return languageMapping[lang];
  }
  
  // Default to English if the language is not supported
  return 'en';
};

// Get language setting from config with validation
let mainLanguage = ensureSupportedLanguage(config.settings.language);

// Resources object to store translations
const resources = {};

// Load translations
supportedLanguages.forEach(lang => {
  try {
    const filePath = path.join(process.cwd(), 'locales', lang, 'translation.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const translation = JSON.parse(content);
      resources[lang] = {
        translation: translation
      };
    } else {
      logger.warn(`Translation file not found for language: ${lang}`);
    }
  } catch (error) {
    logger.error(`Error loading translation for language: ${lang} - ${error.message}`);
  }
});

// Add language mapping resources
// This allows 'zh' to point to 'zh-TW' resources
Object.keys(languageMapping).forEach(langCode => {
  const targetLang = languageMapping[langCode];
  if (resources[targetLang]) {
    resources[langCode] = { ...resources[targetLang] };
  }
});

// Custom language detector
const customLanguageDetector = {
  name: 'custom',
  lookup: () => mainLanguage,
  cacheUserLanguage: () => {}
};

// Initialize i18next
i18next.init({
  lng: mainLanguage,
  fallbackLng: 'en',
  // Include both supported languages and mappings in the supported languages list
  supportedLngs: [...supportedLanguages, ...Object.keys(languageMapping)],
  resources: resources,
  debug: false,
  interpolation: {
    escapeValue: false // React does not need to escape values
  },
  returnEmptyString: false,
  returnNull: false,
  returnObjects: true,
  saveMissing: false,
  saveMissingTo: 'en',
  missingKeyHandler: () => {},
  // Custom language detection
  detection: {
    order: ['custom'],
    lookupFromPathIndex: 0,
    caches: []
  }
});

// Add language detector 
i18next.services.languageDetector = customLanguageDetector;

/**
 * Get translation using type (namespace) and path
 * @param {string} type - Translation namespace (console-log, embeds, slash-cmds, auto-reply, bot-status)
 * @param {string} path - Translation key path using dot notation
 * @param {Object} replacements - Variables to replace in the translated string
 * @param {string|null} language - Optional language code, or null to use configured language
 * @returns {string} Translated string
 */
export const getText = (type, path, replacements = {}, language = null) => {
  const langToUse = ensureSupportedLanguage(language || mainLanguage);
  return i18next.t(`${type}.${path}`, { lng: langToUse, ...replacements });
};

/**
 * Get full translation object for a namespace
 * @param {string} type - Translation namespace
 * @param {string|null} language - Optional language code, or null to use configured language
 * @returns {Object} Translation object
 */
export const getTranslation = (type, language = null) => {
  const langToUse = ensureSupportedLanguage(language || mainLanguage);
  const resourceBundle = i18next.getResourceBundle(langToUse, 'translation');
  return resourceBundle && resourceBundle[type] ? resourceBundle[type] : {};
};

/**
 * Get all available languages
 * @returns {string[]} List of supported language codes
 */
export const getLanguages = () => {
  return supportedLanguages;
};

/**
 * Get current language settings
 * @returns {Object} Language settings object
 */
export const getLanguageSettings = () => {
  return mainLanguage;
};

/**
 * Change language globally
 * @param {string} language - Language code to set
 * @returns {boolean} Success status
 */
export const changeLanguage = (language) => {
  const langToUse = ensureSupportedLanguage(language);
  mainLanguage = langToUse;
  i18next.changeLanguage(langToUse);
  return true;
};

/**
 * Force reload all translations
 */
export const reloadTranslations = () => {
  // Reload translations from files
  supportedLanguages.forEach(lang => {
    try {
      const filePath = path.join(process.cwd(), 'locales', lang, 'translation.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const translation = JSON.parse(content);
        i18next.addResourceBundle(lang, 'translation', translation, true, true);
      }
    } catch (error) {
      logger.error(`Error reloading translation for language: ${lang} - ${error.message}`);
    }
  });
  
  // Reload mapping resources
  Object.keys(languageMapping).forEach(langCode => {
    const targetLang = languageMapping[langCode];
    const resource = i18next.getResourceBundle(targetLang, 'translation');
    if (resource) {
      i18next.addResourceBundle(langCode, 'translation', resource, true, true);
    }
  });
};

export default {
  getText,
  getTranslation,
  getLanguages,
  getLanguageSettings,
  changeLanguage,
  reloadTranslations
}; 