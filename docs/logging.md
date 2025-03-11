# 統一日誌系統 (Unified Logging System)

本專案實現了一個統一的日誌系統，提供一致的介面來記錄不同等級的日誌訊息。

## 日誌等級 (Log Levels)

系統定義了六種日誌等級，從最重要到最詳細：

1. **Fatal (致命錯誤)** - 嚴重錯誤，導致程式無法繼續運作或即將終止
   - 例如：重要服務失效、系統當機等

2. **Error (錯誤)** - 發生問題導致部分功能無法運作，但系統仍在運行
   - 例如：無法讀取特定資源、資料庫存取失敗等

3. **Warn (警告)** - 可能有潛在問題，但程式仍能正常運作
   - 例如：記憶體使用過高、API 回應緩慢等

4. **Info (資訊)** - 程式運作時的重要事件或狀態
   - 例如：服務啟動、設定完成等

5. **Debug (除錯)** - 一般的除錯資訊，主要用於開發與測試階段
   - 例如：記錄變數值或流程狀態

6. **Trace (追蹤)** - 非常細節的除錯資訊，通常用於開發期間追蹤問題

## 使用方法 (Usage)

### 基本用法

```javascript
import logger from './utils/logger.js';

// 記錄不同等級的日誌
logger.fatal('應用程式無法啟動', error);
logger.error('無法連接到資料庫', error);
logger.warn('API 回應時間超過 3 秒');
logger.info('伺服器已啟動在 port 3000');
logger.debug('處理請求參數', { id: 123, name: 'test' });
logger.trace('進入函數 getServerData，參數:', params);
```

### 帶有額外資訊的日誌

```javascript
// 記錄錯誤與錯誤物件
logger.error('操作失敗', error);

// 記錄帶有額外資料的訊息
logger.info('使用者登入', { userId: 123, ip: '192.168.1.1' });
```

## 配置 (Configuration)

日誌系統可以通過環境變數或配置檔案進行配置：

### 環境變數

在 `.env` 檔案中設定：

```
# 日誌等級: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
LOG_LEVEL=INFO

# 是否寫入檔案
LOG_TO_FILE=true

# 日誌檔案路徑
LOG_FILE_PATH=logs/app.log

# 模組特定日誌等級
LOG_LEVEL_SERVER_DATA_MANAGER=DEBUG
LOG_LEVEL_COMMANDS=INFO
LOG_LEVEL_EVENTS=INFO
```

### 配置檔案

在 `config.js` 中的 `settings.logging` 部分：

```javascript
settings: {
  logging: {
    level: 'INFO',           // 日誌等級
    logToFile: true,         // 是否寫入檔案
    logFilePath: 'logs/app.log', // 日誌檔案路徑
    modules: {
      // 模組特定日誌等級
      serverDataManager: 'DEBUG',
      commands: 'INFO',
      events: 'INFO',
    }
  }
}
```

## 環境特定配置 (Environment-specific Configuration)

日誌系統會根據不同的執行環境自動調整配置：

- **development (開發環境)**: 預設顯示所有日誌 (TRACE 及以上)
- **test (測試環境)**: 預設顯示除錯日誌 (DEBUG 及以上)
- **production (生產環境)**: 預設只顯示重要日誌 (INFO 及以上)
- **docker (Docker 環境)**: 預設只顯示重要日誌 (INFO 及以上)

## 顏色編碼 (Color Coding)

在控制台輸出中，不同等級的日誌會使用不同顏色以便於識別：

- **Fatal**: 紅底白字 (醒目)
- **Error**: 紅色
- **Warn**: 橙色
- **Info**: 藍色
- **Debug**: 黃色
- **Trace**: 灰色

## 從舊版日誌系統遷移 (Migration from Old Logging System)

為了保持向後兼容性，我們提供了一個遷移層，可以將舊的日誌函數映射到新的統一日誌系統：

```javascript
// 舊版方式
getError(error, 'errorKey');
getWarning('警告訊息');
getDebug('除錯訊息');
console.log(`${getDateNow()} | ${chalk.blue('INFO')} | 資訊訊息`);

// 新版方式
logger.error('錯誤訊息', error);
logger.warn('警告訊息');
logger.debug('除錯訊息');
logger.info('資訊訊息');
```

## 檔案日誌 (File Logging)

當啟用檔案日誌功能時，系統會：

1. 將日誌訊息寫入指定的檔案
2. 自動移除 ANSI 顏色代碼
3. 當檔案大小超過設定值時自動輪換
4. 保留指定數量的歷史日誌檔案 