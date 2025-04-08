import fs from 'fs';
import path from 'path';
import json5 from 'json5';
import logger from './logger.js';
import config from '../../config.js';

/**
 * 統一翻譯管理模組
 * 
 * 負責:
 * 1. 集中式載入所有翻譯檔案，避免重複載入
 * 2. 提供簡便的 API 獲取翻譯
 * 3. 統一處理錯誤和缺少翻譯的情況
 */
class TranslationManager {
  constructor() {
    // 支援的語言
    this.supportedLanguages = ['en', 'es', 'de', 'fr', 'pt', 'ru', 'uk', 'zh-TW'];
    
    // 支援的翻譯類型
    this.translationTypes = [
      'console-log',
      'embeds',
      'slash-cmds',
      'auto-reply',
      'bot-status'
    ];
    
    // 翻譯緩存
    this.translations = {};
    
    // 從配置中獲取語言設定
    this.loadLanguageSettings();
    
    // 初始化翻譯緩存
    this.initTranslations();
  }
  
  /**
   * 從配置中載入語言設定
   */
  loadLanguageSettings() {
    // 主要語言
    this.mainLanguage = config.settings.language.main || 'en';
    
    // 確保主要語言是支援的語言
    if (!this.supportedLanguages.includes(this.mainLanguage)) {
      logger.warn(`不支援的主要語言: ${this.mainLanguage}，使用英文 (en) 作為替代`);
      this.mainLanguage = 'en';
    }
    
    // 根據配置或回退到主語言
    this.embedsLanguage = config.settings.language.embeds || this.mainLanguage;
    this.autoReplyLanguage = config.settings.language.autoReply || this.mainLanguage;
    this.consoleLogLanguage = config.settings.language.consoleLog || this.mainLanguage;
    this.slashCmdsLanguage = config.settings.language.slashCmds || this.mainLanguage;
    
    // 所有需要翻譯的語言（去重複）
    this.usedLanguages = [...new Set([
      this.mainLanguage,
      this.embedsLanguage,
      this.autoReplyLanguage,
      this.consoleLogLanguage,
      this.slashCmdsLanguage
    ])];
    
    logger.debug(`翻譯系統初始化: 主要語言=${this.mainLanguage}`);
  }
  
  /**
   * 初始化翻譯緩存
   */
  initTranslations() {
    this.usedLanguages.forEach(language => {
      this.translations[language] = {};
      
      this.translationTypes.forEach(type => {
        try {
          // 載入翻譯檔案
          const filePath = path.join(process.cwd(), 'translation', language, `${type}.json5`);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          this.translations[language][type] = json5.parse(fileContent);
          logger.debug(`已成功載入翻譯: ${language}/${type}`);
        } catch (error) {
          if (language === 'en') {
            // 英文是基礎語言，如果缺少應提供默認值
            logger.error(`無法載入基礎英文翻譯 ${type}.json5: ${error.message}`);
            this.translations[language][type] = this.getDefaultTranslation(type);
          } else {
            // 非英文語言可以回退到英文
            logger.warn(`無法載入翻譯 ${language}/${type}.json5: ${error.message}, 將使用英文作為替代`);
            // 確保英文翻譯已載入
            if (!this.translations['en'][type]) {
              this.translations['en'][type] = this.getDefaultTranslation(type);
            }
            this.translations[language][type] = this.translations['en'][type];
          }
        }
      });
    });
  }
  
  /**
   * 若無法載入翻譯檔案時的默認翻譯
   * @param {string} type - 翻譯類型
   * @returns {Object} 默認翻譯對象
   */
  getDefaultTranslation(type) {
    // 提供基本的默認值
    switch (type) {
      case 'bot-status':
        return {
          botStatus: {
            online: 'Playing with {playeronline}/{playermax} players',
            offline: 'Server is offline',
          },
          playerCount: {
            online: '🟢 {playeronline}/{playermax} active players',
            offline: '⚫ Server offline',
          },
        };
      case 'console-log':
        return {
          error: {
            playerEmbed: 'An error occurred while creating Player List Embeds Message.',
            statusEmbed: 'An error occurred while creating Status Embeds Message.',
          },
          checkErrorConfig: {
            checkConfigWait: 'Checking for Errors in the config.js file. Please wait.',
            followingErrors: 'Config file has the following errors:',
          },
        };
      // 其他類型的默認值...
      default:
        return {};
    }
  }
  
  /**
   * 獲取指定類型和語言的翻譯
   * @param {string} type - 翻譯類型 (console-log, embeds, slash-cmds, auto-reply, bot-status)
   * @param {string|null} language - 語言代碼，若為 null 則使用配置中對應類型的語言
   * @returns {Object} 翻譯物件
   */
  getTranslation(type, language = null) {
    // 確定要使用的語言
    let langToUse;
    
    if (language) {
      // 如果指定了語言，先檢查是否支援
      if (!this.supportedLanguages.includes(language)) {
        logger.warn(`不支援的語言: ${language}，使用英文作為替代`);
        langToUse = 'en';
      } else {
        langToUse = language;
      }
    } else {
      // 根據翻譯類型選擇對應的語言
      switch (type) {
        case 'embeds':
          langToUse = this.embedsLanguage;
          break;
        case 'auto-reply':
          langToUse = this.autoReplyLanguage;
          break;
        case 'console-log':
          langToUse = this.consoleLogLanguage;
          break;
        case 'slash-cmds':
          langToUse = this.slashCmdsLanguage;
          break;
        case 'bot-status':
          langToUse = this.mainLanguage;
          break;
        default:
          langToUse = this.mainLanguage;
      }
    }
    
    // 嘗試獲取翻譯
    try {
      // 確保該語言的翻譯已加載
      if (!this.translations[langToUse]) {
        logger.warn(`翻譯未載入: ${langToUse}，使用英文作為替代`);
        langToUse = 'en';
      }
      
      // 確保該語言的該類型翻譯已加載
      if (!this.translations[langToUse][type]) {
        logger.warn(`翻譯類型未載入: ${langToUse}/${type}，使用英文作為替代`);
        return this.translations['en'][type] || this.getDefaultTranslation(type);
      }
      
      return this.translations[langToUse][type];
    } catch (error) {
      logger.error(`獲取翻譯時出錯 (${langToUse}/${type}): ${error.message}`);
      return this.getDefaultTranslation(type);
    }
  }
  
  /**
   * 根據路徑獲取特定的翻譯字串
   * @param {string} type - 翻譯類型
   * @param {string} path - 取得翻譯的路徑，使用點記法，例如 'botStatus.online'
   * @param {Object} replacements - 要替換的變數，例如 {playeronline: 5, playermax: 20}
   * @param {string|null} language - 語言代碼，若為 null 則使用配置中對應類型的語言
   * @returns {string} 翻譯字串，若找不到則回傳路徑本身
   */
  getText(type, path, replacements = {}, language = null) {
    try {
      // 獲取翻譯物件
      const translation = this.getTranslation(type, language);
      
      // 解析路徑獲取特定翻譯
      const pathParts = path.split('.');
      let result = translation;
      
      for (const part of pathParts) {
        if (result && result[part] !== undefined) {
          result = result[part];
        } else {
          // 找不到路徑，回退到默認翻譯或路徑本身
          logger.warn(`找不到翻譯路徑: ${type}.${path}`);
          
          // 嘗試從英文翻譯中獲取
          if (language !== 'en' && this.translations['en']) {
            let enResult = this.translations['en'][type];
            let found = true;
            
            for (const enPart of pathParts) {
              if (enResult && enResult[enPart] !== undefined) {
                enResult = enResult[enPart];
              } else {
                found = false;
                break;
              }
            }
            
            if (found && typeof enResult === 'string') {
              result = enResult;
            } else {
              result = path; // 最終回退
            }
          } else {
            result = path; // 最終回退
          }
          break;
        }
      }
      
      // 如果結果不是字串，可能是子物件，則無法替換變數
      if (typeof result !== 'string') {
        return path;
      }
      
      // 替換變數
      return this.replaceVariables(result, replacements);
    } catch (error) {
      logger.error(`獲取翻譯文本時出錯 (${type}.${path}): ${error.message}`);
      return path;
    }
  }
  
  /**
   * 替換翻譯字串中的變數
   * @param {string} text - 包含變數的翻譯字串
   * @param {Object} replacements - 要替換的變數
   * @returns {string} 替換後的字串
   */
  replaceVariables(text, replacements) {
    let result = text;
    
    // 替換所有變數
    for (const [key, value] of Object.entries(replacements)) {
      // 支援兩種形式的變數: {varName} 和 {VARNAME}
      const regex1 = new RegExp(`\\{${key}\\}`, 'g');
      const regex2 = new RegExp(`\\{${key.toUpperCase()}\\}`, 'g');
      
      result = result.replace(regex1, value).replace(regex2, value);
    }
    
    return result;
  }
  
  /**
   * 重新載入所有翻譯
   * 在運行時更改語言設定後使用
   */
  reloadTranslations() {
    // 重新載入語言設定
    this.loadLanguageSettings();
    
    // 清除現有翻譯緩存
    this.translations = {};
    
    // 重新初始化翻譯
    this.initTranslations();
    
    logger.info(`翻譯系統已重新載入`);
  }
}

// 建立單例
const translationManager = new TranslationManager();

export default translationManager; 