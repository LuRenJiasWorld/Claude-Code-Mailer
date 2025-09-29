# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.5] - 2025-09-29

### Changed
- fe0eee4 feat(templates): enhance email templates with attractive ad copy


## [1.4.4] - 2025-09-29

### Changed
- e61a365 fix(tag-release): remove auto-commit behavior and require manual commit before release


## [1.4.3] - 2025-09-29

### Changed
- f279d92 chore(release): prepare release 1.4.3


## [1.3.3] - 2025-09-29

### Added
- Implemented automated GitHub Actions release workflow
- Added tag-release.sh script for simplified version management
- Created comprehensive release documentation and guides
- Automated GitHub Release creation with changelog extraction

### Changed
- Replaced manual release process with automated CI/CD pipeline
- Streamlined version management and tag creation
- Enhanced release reliability with automated testing and validation

### Fixed
- Improved release process consistency and reduced manual errors
- Added automated version verification and validation steps

## [1.3.2] - 2025-09-29

### Fixed
- Fixed duplicate hooks installation issue by simplifying hook detection logic
- Improved hasClaudeMailerHook() function to use generic 'claude-code-mailer' string matching
- Prevented multiple identical hook arrays from being created during repeated installations
- Enhanced installation reliability across different command path formats

### Changed
- Streamlined hook detection to work with both full and relative command paths
- Improved user experience by eliminating duplicate hook entries in Claude settings

## [1.3.1] - 2025-09-29

### Changed
- Simplified getPackageDir() function to use __dirname directly instead of complex path resolution
- Removed unnecessary glob dependency and complex package location detection logic
- Improved code maintainability and performance by eliminating file system checks

### Fixed
- Enhanced reliability of package directory detection across different installation scenarios
- Streamlined path resolution for both local development and global installations

## [1.3.0] - 2025-09-29

### Fixed
- Cleaned up all remaining invalid hook type references from CLI commands and installation scripts
- Fixed test command to use valid 'Notification' event type instead of invalid 'Info' type
- Removed invalid Error, Warning, and Info hook types from all CLI help text and options
- Ensured installation script only displays and installs valid Claude Code hook types

### Changed
- Streamlined hook type validation across all CLI interfaces
- Improved user experience by removing confusing invalid hook type options
- Enhanced consistency between installation script output and actual supported hooks

## [1.2.4] - 2025-09-29

### Fixed
- Fixed invalid Claude Code hook types in installation script and templates
- Removed Error, Warning, and Info hook types which are not valid Claude Code hooks
- Updated installation script to only use valid hook types: Notification, Stop, SubagentStop
- Updated all language templates (zh-CN, zh-HK, en) to remove invalid hook type entries
- Fixed mailer.js fallback template and error handling to match valid hook types
- Added documentation comment listing all valid Claude Code hook types

## [1.2.3] - 2025-09-29

### Fixed
- Replace hardcoded CLI version with dynamic version reading from package.json
- Add getVersion() function to both CLI files for proper version display
- Ensure version command shows correct current version instead of fixed 1.0.0
- Include fallback version handling for error cases
- Fix version display for both local and global installations

## [1.2.2] - 2025-09-29

### Fixed
- Corrected date inconsistencies in CHANGELOG.md from 2024 to 2025
- Updated LICENSE copyright year to current year (2025)
- Enhanced project documentation with comprehensive date standards

### Added
- Complete date management system in CLAUDE.md
- Date validation checklist and automation scripts
- ISO 8601 format requirements for all project dates
- UTC+8 timezone specification as project standard
- Date consistency verification procedures

## [1.2.1] - 2025-09-29

### Added
- Complete version management system with CHANGELOG.md
- Commit message standards and conventions in CLAUDE.md
- Version release process following Semantic Versioning
- English-only commit message requirements with conventional format

### Changed
- Enhanced project documentation with development guidelines
- Added commit type examples and formatting rules

## [1.2.0] - 2025-09-29

### Changed
- Unified project name from "Claude Mailer" to "Claude Code Mailer" across all files
- Updated package.json description to use "Claude Code Mailer"
- Updated README.md and README.zh.md with new project name
- Updated all code references, comments, and documentation
- Updated LICENSE copyright information
- Updated CLAUDE.md project rules document

## [1.1.1] - 2025-09-29

### Added
- Added GitHub repository URL to package.json for npm registry integration
- Updated package description to include "Claude Code Mailer" branding

### Changed
- Version bump for npm publishing with repository field

## [1.1.0] - 2025-09-29

### Added
- Flexible configuration system with multi-level priority support
- Global configuration file auto-creation at `~/.claude-code-mailer/.env`
- Project-level configuration support with `.env` files
- Local development installation script (`install-local.sh`)
- Enhanced configuration priority: Environment variables → Project .env → Global config → Defaults
- Smart project detection for configuration files
- Automatic config file creation for first-time users

### Changed
- Improved error handling and user feedback
- Enhanced documentation with quick start sections
- Updated configuration examples and setup instructions

## [1.0.0] - 2025-09-29

### Added
- Initial release of Claude Code Mailer as a globally installable npm package
- Email notification system for Claude Code with SMTP support
- Multilingual email templates (Simplified Chinese, Traditional Chinese, English)
- Automatic Claude Code hooks installation and management
- CLI tool with commands: send, test, verify, config, install, uninstall
- YAML-based template system with variable substitution and conditional rendering
- Retry mechanism for failed email sending
- Detailed logging and debugging support
- MIT License

### Features
- 🚀 Standalone Node.js project dedicated to email sending
- 📧 Email sending via Nodemailer with SMTP support
- 🔄 Retry mechanism for failed emails
- 📝 Detailed logging and debugging
- 🔧 Flexible configuration options
- 🎯 CLI tool for easy integration
- 📋 YAML template system with variable substitution
- 🏷️ Email subjects automatically include working directory name
- ⏰ Timestamp formatting (HH:MM format)
- 💬 Markdown quote format support
- 🌍 Multilingual template support
- 🚫 Automatic hooks installation and uninstallation
