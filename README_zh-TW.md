# Minecraft Discord Bot

[![License](https://img.shields.io/github/license/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](LICENSE)
[![Issues](https://img.shields.io/github/issues/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/issues)
[![Latest Release](https://img.shields.io/github/v/release/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/releases)
[![Node Version](https://img.shields.io/node/v/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](package.json)
[![Docker Pulls](https://img.shields.io/docker/pulls/crazycat836/minecraftrobot?style=for-the-badge&color=5D6D7E)](https://hub.docker.com/r/crazycat836/minecraftrobot)

[English](README.md) | 繁體中文

一個連接 Minecraft 伺服器和 Discord 的機器人，提供即時伺服器狀態、玩家數量和各種實用指令。

[更新日誌](CHANGELOG.md) | [貢獻指南](CONTRIBUTING.md)

## 功能特色

- **高度自訂化**：完全掌控機器人，根據您的需求自訂配置。
- **多語言支援**：支援 `英文`、`西班牙文`、`德文`、`法文`、`葡萄牙文`、`俄文`、`烏克蘭文` 和 `繁體中文`，每個功能都可以自訂語言設定。
- **免費託管相容性**：支援 Aternos、Falixnodes 等免費伺服器託管服務。
- **防當機系統**：確保機器人穩定運行，防止崩潰和意外停止。
- **動態狀態訊息**：自動更新的狀態訊息，包含整合的玩家列表。
- **跨平台相容性**：支援 Java 和 Bedrock 版本的 Minecraft 伺服器。
- **即時機器人狀態更新**：機器人自動更新在線玩家數量。
- **多種 Discord 機器人活動**：支援 `playing`、`listening`、`watching` 和 `competing`。
- **多種 Discord 機器人狀態**：支援 `online`、`idle`、`do not disturb (dnd)` 和 `invisible`。
- **自動更新玩家數量頻道統計**：自動在頻道計數器中更新玩家數量或伺服器狀態。
- **自動回應**：啟用自動回應功能，快速提供 IP、狀態、版本和網站等相關訊息。
- **彩色控制台日誌**：環境感知日誌級別的彩色控制台日誌。
- **玩家頭像列表**：在玩家列表中使用表情符號顯示玩家頭像。
- **多種斜線和前綴指令**：
  - `ip` - **發送 Minecraft 伺服器的地址。**
  - `motd` - **發送 Minecraft 伺服器的每日訊息 (MOTD)。**
  - `players` - **發送目前在線玩家列表。**
  - `status` - **發送 Minecraft 伺服器的當前狀態。**
  - `version` - **發送 Minecraft 伺服器的版本。**
  - `site` - **發送 Minecraft 伺服器的網站/投票連結。**
  - `help` - **提供可用指令列表。**
  - `help [command]` - **發送指令的詳細資訊。**

## v1.1.3 版本新功能

這個更新修復了 IP 地址解析問題並改進了網址處理。

### v1.1.3 修復的問題
- **IP 地址解析**：修復了 IP 指令無法正確解析一般網址的問題
- **改進網址顯示**：增強了伺服器地址在 Discord 訊息中的格式
- **網址前綴支援**：新增對帶有 http:// 或 https:// 前綴的網址支援
- **域名支援**：修復了 setstatus 命令中的驗證問題，現在可以接受域名格式的伺服器地址

### 先前版本 (v1.1.2) 改進的功能
- **簡化語言設定**：將多個語言設定整合為單一環境變數，使設置更加簡便
- **修正命令文件**：更正了版本命令的文件命名
- **代碼清理**：移除冗餘的範例文件並改進組織結構
- **配置改進**：增強配置文件結構，提高可維護性
- **文檔更新**：更新文檔以反映簡化後的語言設定

### 先前版本的功能
- **增強翻譯系統**：使用 i18next 建構可靠且一致的跨功能翻譯
- **優化日誌系統**：環境感知的日誌級別（開發環境：TRACE、測試環境：DEBUG、生產/Docker 環境：INFO）
- **玩家數量顯示**：頻道名稱中的玩家數量變數精確顯示
- **跨平台環境變數**：支援不同作業系統
- **簡化 Docker 配置**：簡化 Docker 設置以提高易用性
- **預設指令啟用**：所有指令預設啟用，改善使用者體驗

## 安裝

安裝和運行機器人有兩種主要方式：

1. **使用 Docker** (推薦用於生產環境)
2. **手動安裝** (推薦用於開發環境)

### 使用 Docker 快速啟動

最簡單的開始方式是使用單一 Docker 命令：

```bash
docker run -d \
  --name minecraft-discord-bot \
  -e DISCORD_BOT_TOKEN=your_token \
  -e DISCORD_GUILD_ID=your_guild_id \
  -e MC_SERVER_NAME=your_server_name \
  -e MC_SERVER_VERSION=your_server_version \
  -e MC_SERVER_IP=your_server_ip \
  -e LANGUAGE_MAIN=zh-TW \
  crazycat836/minecraftrobot:latest
```

### Docker 環境變數設置方式

使用 Docker 時，有兩種設置環境變數的方法：

1. **使用命令行參數：**
   ```bash
   docker run -d \
     -e DISCORD_BOT_TOKEN=your_token \
     -e DISCORD_GUILD_ID=your_guild_id \
     -e MC_SERVER_NAME="Your Server Name" \
     -e MC_SERVER_VERSION=1.20.4 \
     -e MC_SERVER_IP=mc.example.com \
     -e LANGUAGE_MAIN=zh-TW \
     crazycat836/minecraftrobot:latest
   ```

2. **使用環境變數文件：**
   創建一個 `.env` 文件：
   ```env
   DISCORD_BOT_TOKEN=your_token
   DISCORD_GUILD_ID=your_guild_id
   STATS_CHANNEL_ID=your_channel_id
   MC_SERVER_NAME=Your Server Name
   MC_SERVER_VERSION=1.20.4
   MC_SERVER_IP=mc.example.com
   LANGUAGE_MAIN=zh-TW
   ```
   
   然後運行：
   ```bash
   docker run --env-file .env -d crazycat836/minecraftrobot:latest
   ```

> **重要說明**：本專案使用環境變數進行所有配置設定，以避免在程式碼中暴露敏感資訊。`config.js` 檔案包含在 `.gitignore` 和 `.dockerignore` 中，以防止意外暴露敏感資料。使用 Docker 部署時，請確保提供所有必要的環境變數，如上所示。

以下是可用環境變數的完整列表：

| 環境變數 | 說明 | 預設值 |
|----------------------|-------------|---------------|
| DISCORD_BOT_TOKEN | Discord 機器人 Token (必填) | 無 |
| DISCORD_GUILD_ID | Discord 伺服器 ID (必填) | 無 |
| STATS_CHANNEL_ID | 玩家數量統計頻道 ID | 無 |
| MC_SERVER_IP | Minecraft 伺服器 IP (必填) | 無 |
| MC_SERVER_PORT | Minecraft 伺服器連接埠 | 25565 |
| MC_SERVER_TYPE | 伺服器類型 (java/bedrock) | java |
| MC_SERVER_NAME | 伺服器名稱 (必填) | 無 |
| MC_SERVER_VERSION | 伺服器版本 (必填) | 無 |
| MC_SERVER_SITE | 伺服器網站 URL | "" |
| LANGUAGE_MAIN | 機器人主要語言 | zh-TW |
| UPDATE_INTERVAL | 更新間隔 (秒) | 60 |
| PLAYER_COUNT_ENABLED | 啟用玩家數量功能 | true |
| AUTO_CHANGE_STATUS_ENABLED | 啟用狀態更新功能 | true |
| NODE_ENV | 環境 (production/development) | production |

更多用於微調命令和功能的環境變數可用。有關完整列表，請參閱 Dockerfile。

### 環境變數特殊說明

#### NODE_ENV 環境變數
`NODE_ENV` 環境變數控制機器人的日誌級別和某些行為：
- `development`：最詳細的日誌級別 (TRACE)，適合開發使用
- `test`：詳細的日誌級別 (DEBUG)，適合測試使用
- `production`：標準日誌級別 (INFO)，建議在生產環境使用
- `docker`：標準日誌級別 (INFO)，適合 Docker 環境

#### 更新間隔行為
在開發和測試環境中 (`NODE_ENV` 設為 `development` 或 `test`)，系統會自動將以下更新間隔設為 30 秒，以加快開發和測試流程：
- `UPDATE_INTERVAL`：狀態更新間隔
- `PLAYER_COUNT_UPDATE_INTERVAL`：玩家數量頻道更新間隔

在生產環境中，這些值必須至少為 60 秒，以避免 Discord API 限制。

### Docker 故障排除

#### 容器無法啟動

檢查日誌中的錯誤訊息：

```bash
docker logs minecraft-discord-bot
```

#### Discord 機器人無法連接

確保您的 `DISCORD_BOT_TOKEN` 正確，且機器人已被邀請到您的伺服器。

#### 無法獲取 Minecraft 伺服器狀態

確保您的 `MC_SERVER_IP` 和 `MC_SERVER_PORT` 設置正確，且容器所在網絡可以訪問伺服器。

#### 更新過程中的暫時離線狀態

在處理伺服器狀態訊息時，機器人可能會暫時將伺服器顯示為離線狀態。這是更新週期中的正常行為，狀態將在下一次更新間隔中自動恢復正常。

#### 更新機器人

要更新到最新版本，運行：

```bash
docker pull crazycat836/minecraftrobot:latest
docker stop minecraft-discord-bot
docker rm minecraft-discord-bot
# 然後使用上述命令重新啟動容器
```

#### 備份數據

如果您需要保存數據，可以使用 Docker 數據卷：

```bash
docker run -d \
  --name minecraft-discord-bot \
  -v ./data:/app/data \
  -e DISCORD_BOT_TOKEN=your_token \
  # 其他環境變數
  crazycat836/minecraftrobot:latest
```

### 手動安裝

1. **系統需求：**
   - 安裝 [Node.js](https://nodejs.org/en/download/current) (v23.0.0 或更高版本)
   - _(建議使用：[Visual Studio Code](https://code.visualstudio.com/Download))_

2. **安裝依賴：**
   - 在 Visual Studio Code 中開啟機器人資料夾
   - 使用 **Ctrl + `** 開啟終端機
   - 在終端機中執行 `npm install`

3. **配置機器人：**
   - 複製 `.env.example` 到 `.env` (或執行 `npm run setup`)
   - 編輯 `.env` 文件，填入您的設定：
     ```env
     # 必要設定
     DISCORD_BOT_TOKEN=      # 您的 Discord 機器人 Token
     DISCORD_GUILD_ID=       # 您的 Discord 伺服器 ID
     MC_SERVER_NAME=         # 您的 Minecraft 伺服器名稱
     MC_SERVER_VERSION=      # 您的 Minecraft 伺服器版本
     MC_SERVER_IP=           # 您的 Minecraft 伺服器 IP
     
     # 選擇性設定
     MC_SERVER_PORT=25565    # 預設：25565
     MC_SERVER_TYPE=java     # 選項：'java' 或 'bedrock'
     STATS_CHANNEL_ID=       # 玩家數量統計的頻道 ID
     LANGUAGE_MAIN=zh-TW     # 主要語言 (en, es, de, fr, pt, ru, uk, zh-TW)
     ```

4. **啟動機器人：**
   - 開發環境：`npm run dev`
   - 生產環境：`npm start`

5. **開發指令：**
   - `npm run setup` - 從範例檔案建立 .env 檔案
   - `npm run dev` - 以開發模式執行機器人，支援自動重啟
   - `npm start` - 以生產模式執行機器人
   - `npm run docker:build` - 建立並推送多平台 Docker 映像檔

6. **自訂機器人設定（選擇性）：**
   - 開啟 `config.js`
   - 自訂機器人功能，例如：
     - 自動狀態更新
     - 機器人活動配置
     - 伺服器狀態訊息設置
     - 指令前綴和回應

## 日誌系統

本機器人包含一個統一的日誌系統，提供一致的介面來記錄不同重要程度的訊息。

### 日誌等級

系統定義了六種日誌等級，從最重要到最詳細：

1. **FATAL** - 嚴重錯誤，導致應用程式終止
2. **ERROR** - 錯誤，阻止功能正常運作
3. **WARN** - 關於潛在問題的警告
4. **INFO** - 重要的操作資訊
5. **DEBUG** - 用於除錯的詳細資訊
6. **TRACE** - 非常詳細的追蹤資訊

### 配置

日誌系統可以通過環境變數或配置檔案進行配置：

```env
# 在 .env 檔案中
NODE_ENV=production  # 控制預設日誌等級 (development, test, production, docker)
```

```javascript
// 在 config.js 中
settings: {
  logging: {
    level: 'INFO',           // 全域日誌等級
    timezone: '',            // 選擇性的日誌時間戳時區
  }
}
```

### 環境特定預設值

- **development**：顯示所有日誌 (TRACE 及以上)
- **test**：顯示除錯日誌 (DEBUG 及以上)
- **production**：只顯示重要日誌 (INFO 及以上)
- **docker**：只顯示重要日誌 (INFO 及以上)

## 多語言支援

本機器人支援以下語言：
- 英文 (en)
- 西班牙文 (es)
- 德文 (de)
- 法文 (fr)
- 葡萄牙文 (pt)
- 俄文 (ru)
- 烏克蘭文 (uk)
- 繁體中文 (zh-TW)

您必須設置 `LANGUAGE_MAIN` 環境變數來指定主要語言。機器人將自動使用相應的翻譯用於所有功能，包括：

- 機器人狀態訊息
- 玩家數量頻道名稱
- 指令回應
- 控制台日誌
- 自動回覆

如果您希望不同功能使用不同語言，可以設置以下環境變數：
- `LANGUAGE_EMBEDS` - 嵌入訊息的語言
- `LANGUAGE_AUTO_REPLY` - 自動回覆的語言
- `LANGUAGE_CONSOLE_LOG` - 控制台日誌的語言
- `LANGUAGE_SLASH_CMDS` - 斜線指令的語言

如果這些變數留空，將使用 `LANGUAGE_MAIN` 的值。

> **注意**：機器人狀態文字和玩家數量頻道文字會根據所選語言自動決定，無法直接自訂。

## 開發

### 設置開發環境

```bash
# 複製專案
git clone https://github.com/crazycat836/minecraft-discord-bot.git

# 進入專案目錄
cd minecraft-discord-bot

# 安裝依賴
npm install

# 建立 .env 檔案
npm run setup

# 啟動開發伺服器
npm run dev
```

### 可用的腳本

- `npm start` - 以生產模式啟動機器人
- `npm run dev` - 以開發模式啟動機器人（自動重新載入）
- `npm run setup` - 從範例模板建立 .env 檔案
- `npm run docker:build` - 建構多平台的 Docker 映像檔並推送到 Docker Hub

## 版本控制

我們使用 [SemVer](http://semver.org/) 進行版本控制。查看可用版本，請參閱[此專案的標籤](https://github.com/crazycat836/minecraft-discord-bot/tags)。

## 貢獻

歡迎貢獻！如果您想提交 Pull Request，請隨時提出。對於重大更改，請先開啟 Issue 討論您想要更改的內容。

請注意，此專案使用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件。提交貢獻即表示您同意您的貢獻將在相同條款下授權。

## 支援

如果您遇到任何問題或有疑問，請：
1. 開啟[問題](https://github.com/crazycat836/minecraft-discord-bot/issues)

## 使用技術

**專案使用的技術**：

- **[Node.js](https://nodejs.org/en/download)** - JavaScript 執行環境
- **[Discord.js](https://discord.js.org/)** - Discord API 框架
- **[node-mcstatus](https://www.npmjs.com/package/node-mcstatus)** - Minecraft 伺服器狀態檢查器
- **[CommandKit](https://commandkit.js.org/)** - 指令框架
- **[i18next](https://www.i18next.com/)** - 國際化框架 