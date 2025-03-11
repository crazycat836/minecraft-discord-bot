# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2024-03-12

### Changed
- Improved autoChangeStatus functionality to handle missing channels or messages
- Enhanced error handling in server data management
- Standardized logging format with consistent timestamps
- Replaced localized log messages with English for better consistency

### Fixed
- Fixed issue where autoChangeStatus would retain invalid records
- Resolved potential file access conflicts in data.json handling
- Improved error recovery when channels or messages are not found

## [1.0.2] - 2024-03-09

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

## [1.0.1] - 2024-03-09

### Changed
- Improved configuration management
- Added `.env.example` template for easier setup
- Updated environment variable handling for better security

### Added
- Detailed setup instructions in README
- Better error handling for configuration errors
- Clear documentation for environment variables

## [1.0.0] - 2024-03-07

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

[1.0.3]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.3
[1.0.2]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.2
[1.0.1]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.1
[1.0.0]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.0 