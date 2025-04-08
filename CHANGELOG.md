# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2024-04-08

### Fixed
- Republished release with corrected Docker image tags
- Fixed documentation to use the updated Docker image name consistently

## [1.1.0] - 2024-04-08

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

## [1.0.4] - 2024-03-11

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

[1.0.4]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.4
[1.0.3]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.3
[1.0.2]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.2
[1.0.1]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.1
[1.0.0]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.0.0

[1.1.0]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.1.0 
[1.1.1]: https://github.com/crazycat836/minecraft-discord-bot/releases/tag/v1.1.1 