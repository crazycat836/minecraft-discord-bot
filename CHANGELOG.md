# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.5] - 2026-08-19

### Fixed
- The server configuration was lost whenever the container was recreated, for example on every image update. `data.json` moved out of `src/` into a dedicated `data/` directory that can be mounted as a volume; an existing `src/data.json` is migrated automatically on startup
- `npm run docker:deploy` could not run at all: the default buildx builder uses the `docker` driver, which rejects multi-platform builds. The script now provisions a `docker-container` builder when one is missing
- The README documented `MC_SERVER_IP`, `MC_SERVER_NAME`, `MC_SERVER_VERSION` and the other `MC_SERVER_*` environment variables, none of which exist in `config.js`. The Minecraft server details are set from Discord with `/setstatus`

### Changed
- `docker:deploy` also tags the image with the package version, so a release can be rolled back to
- The Docker Compose files mount `./data` so the configuration survives `docker compose down`

### Security
- Updated transitive dependencies: `ws`, `qs`, `form-data`, `brace-expansion` and `picomatch`. Production vulnerabilities are down from 15 to 3, all remaining ones inside the build tooling `commandkit` ships as runtime dependencies (`esbuild`, `tsup`), which this bot never executes

### Removed
- `README_zh-TW.md`

## [1.2.4] - 2026-08-19

### Fixed
- `/version` and `/status` always reported the Minecraft version as `Unknown`. The version is now read from the live server status on every request instead of a stored value that was never written
- Locale placeholders were never interpolated: the locale files use `{name}` while i18next defaults to `{{name}}`. The player count channel showed `🟢 0/20` from a hardcoded fallback instead of the localized `🟢 0/20 players online`
- A transient Discord API failure (network blip, missing permission, rate limit) deleted the stored server configuration. Records are now dropped only when Discord confirms the channel or message no longer exists
- Re-running `/setstatus` in a channel posted a new status message and abandoned the previous one, leaving an embed that never updated again. It now edits the existing message in place
- Concurrent writes to `data.json` could silently overwrite each other. All writes are serialized through `updateData()`
- `botStatusUpdate` passed `undefined` as the presence status when no server was configured, because `presence.status` has no `idle` key
- The startup server info log never ran: it checked `settings.logging.serverInfo`, a key that did not exist in `config.js`. Added as `SERVER_INFO_LOG`, enabled by default
- The container could not create `/app/logs`, because `WORKDIR /app` creates the directory as root while the process runs as `nodejs`
- `npm ci` in the Dockerfile could not work from a clean clone, because `.gitignore` excluded `package-lock.json`
- The `config.js` entry in `.gitignore` carried a trailing comment, which is treated as part of the pattern, so the rule never matched anything

### Changed
- `getServerConfig()` returns `null` whenever there is no server worth probing, including a record with no address. Previously two call sites substituted a config with an empty IP, and one of them called the status API with an empty host
- The version string is resolved once in `ServerDataManager` and travels with the probe result, instead of each caller deciding between the Java and Bedrock response fields
- `statusMessageEdit()` takes an options object and receives `site` from its caller instead of re-reading `data.json` on every update cycle
- `/version` defers its reply, since the embed now probes the server
- Upgraded discord.js, dotenv and validator; upgraded i18next and chalk across a major version
- `commandkit` intentionally held at 0.1.10: 1.x requires Node >= 24 and replaces the constructor API with a CLI-driven file-based router, which is a rewrite rather than an upgrade

### Removed
- `config.mcserver.version` and its startup check. The value was hardcoded to `Unknown`, so the check could never fail, and the version is now read live
- Unused dependencies: `json5`, `react-i18next`, `i18next-fs-backend`, `i18next-http-backend`, `i18next-browser-languagedetector`

## [1.2.3] - 2026-04-05

### Fixed
- Bot presence could get stuck showing offline, because an unhandled rejection in the scheduled update was never caught
- `setstatus` left its public message behind when the command failed
- `setsite` reported an unhelpful error for URLs missing a protocol
- `setname` could exceed the Discord name length limit
- `info` command ignored its ephemeral flag due to a typo (`eflags`)
- Uptime in the info embed always reported 0 hours and 0 days
- `statusMessageEdit` passed unresolved promises to `message.edit()` for the offline and error embeds
- `helpEmbed` returned `undefined` instead of an embed when a command was not found
- Presence status validation only checked one of the two configured values
- `getPlayersListWithEmoji` returned nothing when its error path was taken
- `help`, `ip`, `motd`, `site` and `version` gave no reply when they threw
- `0console-log` printed `undefined` for a single-line MOTD
- Auto-reply threw a `SyntaxError` when a trigger word contained a regex metacharacter
- `motdEmbed` threw when the server reported no MOTD

### Changed
- Shared data access extracted into `src/utils/dataStore.js`
- `PermissionFlagsBits` used in place of the deprecated permission strings
- Docker uses `tini` as the entrypoint for signal handling and zombie reaping

## [1.2.2] - 2026-01-14

### Changed
- Removed redundant feature toggle and command alias ENV declarations from the Dockerfile, keeping bot, language and command prefix settings

## [1.2.1] - 2026-01-14

### Added
- "Not Configured" player count status, to distinguish an unconfigured server from a connection error
- `notConfigured` translation key across all locales

### Changed
- Upgraded dotenv, i18next and react-i18next
- Removed `cross-env`, redundant for Docker based workflows
- Aligned all translations with the zh-TW master file

### Fixed
- Russian translation for the offline status
- `ReferenceError` for `statusName` in the player count module
- Removed the obsolete `version` attribute from `docker-compose.example.yml`

## [1.2.0] - 2026-01-13

### Added
- New `setsite` command to dynamically update the server website URL
- New `setname` command to dynamically update the server name
- Added distinction between "Offline" (server down) and "Error" (connection failed) states in status messages
- Added missing translations for `setsite` and `setname` commands across all supported languages

### Changed
- **BREAKING**: Changed default language to English (`en`) for better accessibility (previously `zh-TW`)
- Refactored `ServerDataManager` for better concurrency and thread safety
- Refactored `botStatusUpdate` and `embeds` systems to strictly use dynamic data from `data.json`
- Standardized all code comments to English for improved maintainability
- Improved logging readability and reduced console noise

### Fixed
- Fixed "Invalid Form Body" error in embeds
- Fixed `DeprecationWarning` regarding the `ready` event (renamed to `clientReady`)
- Fixed character encoding issues in status messages for German (`de`) and Portuguese (`pt`)
- Fixed `playerCount.error` status message missing in non-English translation files
- Fixed frozen status updates by refactoring the status update loop logic

## [1.1.3] - 2025-06-24

### Fixed
- Fixed IP command unable to properly resolve standard URLs
- Improved IP address display formatting for better clarity in Discord messages
- Enhanced server address handling with support for http:// and https:// prefixes
- Fixed domain name validation in setstatus command to accept domain name format server addresses

## [1.1.2] - 2025-04-24

### Changed
- Simplified language configuration by consolidating multiple language settings into a single environment variable
- Corrected version command file naming for better consistency
- Removed redundant example files and improved code organization
- Enhanced configuration files structure for better maintainability
- Updated documentation to reflect the streamlined language setup

## [1.1.1] - 2025-04-08

### Fixed
- Republished release with corrected Docker image tags
- Fixed documentation to use the updated Docker image name consistently

## [1.1.0] - 2025-04-08

### Added
- Complete rebuild of the translation system using i18next framework
- Added cross-env support for better compatibility across different operating systems
- Added environment-aware logging levels (development: TRACE, test: DEBUG, production/docker: INFO)

### Changed
- Improved logging system with environment-specific default log levels
- Streamlined Docker configuration by removing Docker Compose functionality
- Updated documentation to reflect the latest changes and improvements
- Removed deprecated code, tests, and conversion scripts to streamline the codebase

### Fixed
- Fixed issues with player count variables not properly displaying in channel names
- Fixed logger configuration to properly handle different environments

## [1.0.4] - 2025-03-12

### Added
- Added dedicated translation files for bot status and player count text
- Added support for automatic language-based text in bot status and player count channels

### Changed
- Improved multilingual system to use language-specific text for bot status
- Removed hardcoded text options in favor of language-based translations
- Updated documentation to reflect new multilingual features
- Enhanced Docker configuration with clearer language settings

### Fixed
- Fixed inconsistencies in language handling between different features
- Improved fallback mechanism for language loading

## [1.0.3] - 2025-03-12

### Changed
- Improved autoChangeStatus functionality to handle missing channels or messages
- Enhanced error handling in server data management
- Standardized logging format with consistent timestamps
- Replaced localized log messages with English for better consistency

### Fixed
- Fixed issue where autoChangeStatus would retain invalid records
- Resolved potential file access conflicts in data.json handling
- Improved error recovery when channels or messages are not found

## [1.0.2] - 2025-03-09

### Added
- Traditional Chinese (zh-TW) translation support
- AMD64 platform Docker build script
- Project documentation in Traditional Chinese

### Changed
- Upgraded to Node.js 23 Alpine in Docker
- Optimized Docker configuration
- Updated npm scripts for better Docker management

### Improved
- Configuration file documentation
- Environment variables example
- Project metadata and documentation

## [1.0.1] - 2025-03-07

### Changed
- Improved configuration management
- Added `.env.example` template for easier setup
- Updated environment variable handling for better security

### Added
- Detailed setup instructions in README
- Better error handling for configuration errors
- Clear documentation for environment variables

## [1.0.0] - 2025-03-07

### Added
- Initial release
- Discord bot core functionality
- Real-time Minecraft server status monitoring
- Multi-language support
- Customizable commands and responses
- Docker support for easy deployment
- Cross-platform compatibility (Java & Bedrock)
- Anti-crash system
- Dynamic status messages
- Player avatar support
- Colorful console logging

[1.0.4]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.4
[1.0.3]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.3
[1.0.2]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.2
[1.0.1]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.1
[1.0.0]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.0

[1.1.0]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.1.0 
[1.1.1]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.1.1 
[1.1.2]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.1.2 
[1.1.3]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.1.3 