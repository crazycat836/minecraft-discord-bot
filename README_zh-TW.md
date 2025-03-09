# Minecraft Discord Bot

[![License](https://img.shields.io/github/license/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](LICENSE)
[![Issues](https://img.shields.io/github/issues/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/issues)
[![Latest Release](https://img.shields.io/github/v/release/crazycat836/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](https://github.com/crazycat836/minecraft-discord-bot/releases)
[![Node Version](https://img.shields.io/node/v/minecraft-discord-bot?style=for-the-badge&color=5D6D7E)](package.json)
[![Docker Pulls](https://img.shields.io/docker/pulls/crazycat836/minecraftrobot?style=for-the-badge&color=5D6D7E)](https://hub.docker.com/r/crazycat836/minecraftrobot)

[English](README.md) | 繁體中文

一個連接 Minecraft 伺服器和 Discord 的機器人，提供即時伺服器狀態、玩家數量和各種實用指令。

[更新日誌](CHANGELOG.md) | [貢獻指南](CONTRIBUTING.md) | [文檔]()

## 功能特色

- **高度自訂化**：完全掌控機器人，根據您的需求自訂配置。
- **多語言支援**：支援 `英文`、`西班牙文`、`德文`、`法文`、`葡萄牙文`、`俄文` 和 `烏克蘭文`，每個功能都可以自訂語言設定。
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

## 安裝

### 使用 Docker 快速啟動

```bash
docker run -d \
  --name minecraft-discord-bot \
  -e DISCORD_BOT_TOKEN=your_token \
  -e DISCORD_GUILD_ID=your_guild_id \
  -e MC_SERVER_NAME=your_server_name \
  -e MC_SERVER_VERSION=your_server_version \
  -e MC_SERVER_IP=your_server_ip \
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
   - 複製 `.env.example` 到 `.env`
   - 編輯 `.env` 文件，填入您的設定：
     ```env
     # 必要設定
     DISCORD_BOT_TOKEN=      # 您的 Discord 機器人 Token
     DISCORD_GUILD_ID=       # 您的 Discord 伺服器 ID
     MC_SERVER_NAME=         # 您的 Minecraft 伺服器名稱
     MC_SERVER_VERSION=      # 您的 Minecraft 伺服器版本
     MC_SERVER_IP=          # 您的 Minecraft 伺服器 IP

     # 選擇性設定
     MC_SERVER_PORT=25565   # 預設：25565
     MC_SERVER_TYPE=java    # 選項：'java' 或 'bedrock'
     ```

4. **自訂機器人設定（選擇性）：**
   - 開啟 `config.js`
   - 自訂機器人功能：
     - 語言偏好
     - 自動狀態更新
     - 指令前綴
     - 自動回覆觸發
     - 以及更多...

5. **啟動機器人：**
   ```bash
   npm start
   # 或
   node .
   ```

## 開發

### 設置開發環境

```bash
# 複製專案
git clone https://github.com/crazycat836/minecraft-discord-bot.git

# 進入專案目錄
cd minecraft-discord-bot

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

### 可用的腳本

- `npm start` - 啟動機器人
- `npm run dev` - 以開發模式啟動機器人（自動重新載入）
- `npm run lint` - 執行 ESLint 檢查程式碼風格
- `npm run format` - 使用 Prettier 格式化程式碼

## 版本控制

我們使用 [SemVer](http://semver.org/) 進行版本控制。查看可用版本，請參閱[此專案的標籤](https://github.com/crazycat836/minecraft-discord-bot/tags)。

## 貢獻

歡迎貢獻！如果您想提交 Pull Request，請隨時提出。對於重大更改，請先開啟 Issue 討論您想要更改的內容。

請注意，此專案使用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件。提交貢獻即表示您同意您的貢獻將在相同條款下授權。

## 支援

如果您遇到任何問題或有疑問，請：
1. 查看[文檔]()
2. 開啟[問題](https://github.com/crazycat836/minecraft-discord-bot/issues)

## 使用技術

**專案使用的技術**：

- **[Node.js](https://nodejs.org/en/download)** - JavaScript 執行環境
- **[Discord.js](https://discord.js.org/)** - Discord API 框架
- **[node-mcstatus](https://www.npmjs.com/package/node-mcstatus)** - Minecraft 伺服器狀態檢查器
- **[CommandKit](https://commandkit.js.org/)** - 指令框架 