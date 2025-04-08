/**
 * Language Service
 * Central service for handling language and translation throughout the application
 */

import i18n from '../utils/i18n.js';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';
import logger from '../utils/logger.js';

class LanguageService {
  constructor() {
    this.languages = i18n.getLanguages();
    this.currentSettings = i18n.getLanguageSettings();
  }

  /**
   * Get text translation
   * @param {string} type - Translation namespace
   * @param {string} path - Translation key path
   * @param {Object} replacements - Variables to replace
   * @param {string|null} language - Optional language override
   * @returns {string} Translated text
   */
  getText(type, path, replacements = {}, language = null) {
    return i18n.getText(type, path, replacements, language);
  }

  /**
   * Get entire translation object for a namespace
   * @param {string} type - Translation namespace
   * @param {string|null} language - Optional language override
   * @returns {Object} Translation object
   */
  getTranslation(type, language = null) {
    return i18n.getTranslation(type, language);
  }

  /**
   * Get list of supported languages
   * @returns {string[]} List of language codes
   */
  getSupportedLanguages() {
    return this.languages;
  }

  /**
   * Get language settings
   * @returns {Object} Current language settings
   */
  getLanguageSettings() {
    return this.currentSettings;
  }

  /**
   * Change language for all namespaces
   * @param {string} language - Language code to set
   * @returns {boolean} Success status
   */
  changeGlobalLanguage(language) {
    if (!this.languages.includes(language)) {
      logger.warn(`Unsupported language: ${language}`);
      return false;
    }

    // Change the language in i18next
    const result = i18n.changeLanguage(language);
    if (result) {
      // Update settings object
      this.currentSettings = {
        main: language,
        embeds: language,
        autoReply: language,
        consoleLog: language,
        slashCmds: language
      };

      // Update config
      this._updateConfigFile(language);

      logger.info(`Changed global language to ${language}`);
      return true;
    }
    
    return false;
  }

  /**
   * Change language for a specific namespace
   * @param {string} namespace - Namespace to change
   * @param {string} language - Language code to set
   * @returns {boolean} Success status
   */
  changeNamespaceLanguage(namespace, language) {
    if (!this.languages.includes(language)) {
      logger.warn(`Unsupported language: ${language}`);
      return false;
    }

    // Change language in i18next (no namespace-specific change in the unified system, 
    // we just track the config settings for when the app restarts)
    const result = i18n.changeLanguage(language);
    if (result) {
      // Update settings object
      this.currentSettings[this._mapNamespaceToSetting(namespace)] = language;
      
      // Update config file
      this._updateConfigFile(language, namespace);
      
      logger.info(`Changed language for ${namespace} to ${language}`);
      return true;
    }
    
    return false;
  }

  /**
   * Reload all translations
   */
  reloadTranslations() {
    i18n.reloadTranslations();
    // Refresh current settings
    this.currentSettings = i18n.getLanguageSettings();
    logger.info(`Translation system reloaded`);
  }

  /**
   * Map namespace to config setting key
   * @private
   * @param {string} namespace - Translation namespace
   * @returns {string} Config setting key
   */
  _mapNamespaceToSetting(namespace) {
    switch (namespace) {
      case 'console-log': return 'consoleLog';
      case 'slash-cmds': return 'slashCmds';
      case 'auto-reply': return 'autoReply';
      case 'embeds': return 'embeds';
      case 'bot-status': return 'main';
      default: return 'main';
    }
  }

  /**
   * Update config file with new language settings
   * @private
   * @param {string} language - Language code
   * @param {string|null} namespace - Optional namespace to update specific setting
   */
  _updateConfigFile(language, namespace = null) {
    try {
      const configPath = path.join(process.cwd(), 'config.js');
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      if (namespace) {
        // Update specific namespace
        const settingKey = this._mapNamespaceToSetting(namespace);
        const regex = new RegExp(`(language:\\s*{[\\s\\S]*?${settingKey}:\\s*['"])([^'"]*?)(['"][\\s\\S]*?})`);
        configContent = configContent.replace(regex, `$1${language}$3`);
      } else {
        // Update all language settings
        const regex = new RegExp(`(language:\\s*{[\\s\\S]*?main:\\s*['"])([^'"]*?)(['"][\\s\\S]*?})`);
        configContent = configContent.replace(regex, `$1${language}$3`);
        
        // Update each specific setting
        ['embeds', 'autoReply', 'consoleLog', 'slashCmds'].forEach(setting => {
          const settingRegex = new RegExp(`(${setting}:\\s*['"])([^'"]*?)(['"])`);
          configContent = configContent.replace(settingRegex, `$1${language}$3`);
        });
      }
      
      // Write the updated config back
      fs.writeFileSync(configPath, configContent, 'utf8');
      logger.debug(`Updated config file with new language settings`);
    } catch (error) {
      logger.error(`Failed to update config file: ${error.message}`);
    }
  }
}

// Create singleton instance
const languageService = new LanguageService();
export default languageService; 