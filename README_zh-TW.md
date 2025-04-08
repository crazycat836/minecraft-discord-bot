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
- **彩色控制台日誌**：色彩編碼的控制台日誌，提升外觀和清晰度。
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

## v1.1.0 版本新功能

- **增強翻譯系統**：使用 i18next 完全重構翻譯系統，使所有功能的翻譯更加可靠且一致。
- **優化日誌系統**：改進了環境感知的日誌級別，使開發和調試更容易，同時保持生產環境日誌的簡潔。
- **玩家數量顯示修複**：修復了玩家數量變數在頻道名稱中無法正確顯示的問題。
- **跨平台環境變數**：新增 cross-env 支援，提升不同作業系統間的相容性。
- **代碼清理**：移除已棄用的代碼、測試和轉換腳本，精簡代碼庫。

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
  crazycat836/minecraft-discord-bot
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
     crazycat836/minecraft-discord-bot
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
   docker run --env-file .env -d crazycat836/minecraft-discord-bot
   ```

有關可用環境變數的完整列表，請參閱存儲庫中的 `.env.example` 文件。

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
docker pull crazycat836/minecraft-discord-bot
docker stop minecraft-discord-bot
docker rm minecraft-discord-bot
# 然後使用上述命令重新啟動容器
```

#### 備份數據

容器將數據存儲在容器內部。如果您需要保存數據，可以考慮使用 Docker 數據卷來持久化數據：

```bash
docker run -d \
  --name minecraft-discord-bot \
  -v ./data:/app/data \
  -e DISCORD_BOT_TOKEN=your_token \
  # 其他環境變數
  crazycat836/minecraft-discord-bot
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

4. **自訂機器人設定（選擇性）：**
   - 開啟 `config.js`
   - 自訂機器人功能：
     - 自動狀態更新
     - 指令前綴
     - 自動回覆觸發
     - 以及更多...

5. **啟動機器人：**
   ```bash
   npm start  # 以生產模式啟動機器人
   # 或
   npm run dev  # 以開發模式啟動機器人（自動重新載入）
   ```

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