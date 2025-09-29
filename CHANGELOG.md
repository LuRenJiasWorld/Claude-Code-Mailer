# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2024-09-29

### Added
- Complete version management system with CHANGELOG.md
- Commit message standards and conventions in CLAUDE.md
- Version release process following Semantic Versioning
- English-only commit message requirements with conventional format

### Changed
- Enhanced project documentation with development guidelines
- Added commit type examples and formatting rules

## [1.2.0] - 2024-09-29

### Changed
- Unified project name from "Claude Mailer" to "Claude Code Mailer" across all files
- Updated package.json description to use "Claude Code Mailer"
- Updated README.md and README.zh.md with new project name
- Updated all code references, comments, and documentation
- Updated LICENSE copyright information
- Updated CLAUDE.md project rules document

## [1.1.1] - 2024-09-29

### Added
- Added GitHub repository URL to package.json for npm registry integration
- Updated package description to include "Claude Code Mailer" branding

### Changed
- Version bump for npm publishing with repository field

## [1.1.0] - 2024-09-29

### Added
- Flexible configuration system with multi-level priority support
- Global configuration file auto-creation at `~/.claude-mailer/.env`
- Project-level configuration support with `.env` files
- Local development installation script (`install-local.sh`)
- Enhanced configuration priority: Environment variables → Project .env → Global config → Defaults
- Smart project detection for configuration files
- Automatic config file creation for first-time users

### Changed
- Improved error handling and user feedback
- Enhanced documentation with quick start sections
- Updated configuration examples and setup instructions

## [1.0.0] - 2024-09-29

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