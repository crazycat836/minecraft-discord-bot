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
    this.currentLanguage = i18n.getLanguageSettings();
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
   * Get current language setting
   * @returns {string} Current language code
   */
  getLanguageSetting() {
    return this.currentLanguage;
  }

  /**
   * Change global language setting
   * @param {string} language - Language code to set
   * @returns {boolean} Success status
   */
  changeLanguage(language) {
    if (!this.languages.includes(language)) {
      logger.warn(`Unsupported language: ${language}`);
      return false;
    }

    // Change the language in i18next
    const result = i18n.changeLanguage(language);
    if (result) {
      // Update settings
      this.currentLanguage = language;

      // Update config
      this._updateConfigFile(language);

      logger.info(`Changed language to ${language}`);
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
    this.currentLanguage = i18n.getLanguageSettings();
    logger.info(`Translation system reloaded`);
  }

  /**
   * Update config file with new language setting
   * @private
   * @param {string} language - Language code
   */
  _updateConfigFile(language) {
    try {
      const configPath = path.join(process.cwd(), 'config.js');
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // Update language setting (assuming it's now a string, not an object)
      const regex = new RegExp(`(language:\\s*['"])([^'"]*?)(['"])`);
      configContent = configContent.replace(regex, `$1${language}$3`);
      
      // Write the updated config back
      fs.writeFileSync(configPath, configContent, 'utf8');
      logger.debug(`Updated config file with new language setting: ${language}`);
    } catch (error) {
      logger.error(`Failed to update config file: ${error.message}`);
    }
  }
}

// Create singleton instance
const languageService = new LanguageService();
export default languageService; 