# Claude Mailer

A standalone email notification service for Claude Code, built with Node.js and Nodemailer.

## Features

- 🚀 Standalone Node.js project dedicated to email sending
- 📧 Email sending via Nodemailer with SMTP support
- 🔄 Retry mechanism for failed emails
- 📝 Detailed logging and debugging
- 🔧 Flexible configuration options
- 🎯 CLI tool for easy integration
- 📋 YAML template system with variable substitution and conditional rendering
- 🏷️ Email subjects automatically include working directory name
- ⏰ Timestamp formatting (HH:MM format)
- 💬 Markdown quote format support
- 🌍 Multilingual template support (Simplified Chinese, Traditional Chinese, English)

## Installation

```bash
cd /data/dev/claude-mailer
pnpm install
```

## Configuration

### Environment Variables

Copy `.env.template` to `.env`:

```bash
cp .env.template .env
```

Edit `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Email Settings
FROM_EMAIL=your-email@example.com
TO_EMAIL=recipient@example.com
SUBJECT_PREFIX=[Claude Code]

# Template Language (zh-CN, zh-HK, en)
TEMPLATE_LANGUAGE=zh-CN

# Retry Settings
RETRY_ATTEMPTS=3
RETRY_DELAY=1000
TIMEOUT=10000
```

### Multilingual Email Templates

Set language in `.env` file:

```env
TEMPLATE_LANGUAGE=zh-CN  # Supports: zh-CN, zh-HK, en
```

Each language has its own template file:

- `config/templates.zh-CN.yaml` - Simplified Chinese templates
- `config/templates.zh-HK.yaml` - Traditional Chinese templates  
- `config/templates.en.yaml` - English templates

**Template file structure:**

```yaml
# config/templates.en.yaml
subjects:
  Notification: "Your attention needed"
  Stop: "Task completed"
  Error: "Error encountered"

content:
  Notification: |
    Current time is {{timestamp}} 
    
    {{#if message}}
    > {{message}} 
    
    {{/if}}Working directory: {{cwd}} 
    Session ID: {{sessionId}} 
    
    Please open Claude Code terminal for details. 

defaults:
  subject: "Notification"
  message: ""
```

**Supported languages:**
- `zh-CN` - Simplified Chinese (default)
- `zh-HK` - Traditional Chinese (Hong Kong)
- `en` - English

**Template variables:**
- `{{timestamp}}` - Current time (HH:MM format)
- `{{message}}` - Message content (wrapped in Markdown quote format)
- `{{cwd}}` - Working directory
- `{{sessionId}}` - Session ID
- `{{error}}` - Error message
- `{{warning}}` - Warning message

**Conditional rendering:**
- `{{#if variable}}content{{/if}}` - Only show content if variable exists

## Usage

### CLI Commands

#### Verify SMTP connection
```bash
node bin/cli.js verify
```

#### Send test email
```bash
node bin/cli.js test
```

#### Send notification email
```bash
# Read JSON from stdin
echo '{"hook_event_name":"Notification","session_id":"test-session"}' | node bin/cli.js send --stdin

# Use command line arguments
node bin/cli.js send --event Notification --session test-session
```

#### Send custom email
```bash
node bin/cli.js custom --subject "Test Email" --message "This is a test email"
```

#### Show configuration
```bash
node bin/cli.js config
```

#### Install/Uninstall Claude Code hooks
```bash
# Install Claude Code hooks automatically
node bin/install-claude.js

# Uninstall Claude Code hooks
node bin/install-claude.js --uninstall

# Show help
node bin/install-claude.js --help
```

### Programming Interface

```javascript
const ClaudeMailer = require('./src/index');

const mailer = new ClaudeMailer();

// Send notification
await mailer.sendNotification('Notification', { sessionId: 'test-session' });

// Send custom email
await mailer.sendCustomEmail({
  subject: 'Custom Email',
  text: 'Email content'
});

// Verify connection
await mailer.verifyConnection();
```

## Claude Code Integration

### Automatic Installation

Use the automatic installation script to configure Claude Code hooks:

```bash
node bin/install-claude.js
```

This script will:
- 🎯 Automatically detect Claude Mailer installation directory
- 🔧 Add Claude Mailer hooks to `~/.claude/settings.json`
- 🛡️ Preserve existing configuration
- 🚫 Prevent duplicate installations
- 📊 Show installation summary

### Manual Configuration

If you prefer manual configuration, add the following to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Error": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Warning": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ],
    "Info": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /data/dev/claude-mailer/bin/cli.js send --stdin"
          }
        ]
      }
    ]
  }
}
```

### Supported Events

- `Notification` - Claude needs your input or permission
- `Stop` - Claude completed task
- `SubagentStop` - Claude subtask completed
- `Error` - Claude encountered error
- `Warning` - Claude issued warning
- `Info` - Claude information notification

### Claude Code Provided Variables

- `{{sessionId}}` - Current session ID
- `{{cwd}}` - Current working directory
- `{{message}}` - Notification message content
- `{{transcript_path}}` - Session transcript file path

### Email Format Features

- Email subjects automatically include the last folder name from working directory
- Timestamp shows only hours and minutes (e.g., 19:39)
- Message content uses Markdown quote format (> message)
- Space added at end of each line to prevent email clients from joining lines

## Logs

Log file locations:
- Regular logs: `~/.claude-mailer/mailer.log`
- Error logs: `~/.claude-mailer/error.log`

## Project Structure

```
claude-mailer/
├── src/
│   ├── index.js          # Main entry point
│   ├── mailer.js         # Email sending core
│   ├── config-loader.js  # Configuration loader
│   └── logger.js         # Logger
├── bin/
│   ├── cli.js            # CLI tool
│   └── install-claude.js # Claude Code hooks installer
├── config/
│   ├── templates.zh-CN.yaml  # Simplified Chinese templates
│   ├── templates.zh-HK.yaml  # Traditional Chinese templates
│   └── templates.en.yaml      # English templates
├── .env                  # Environment variables
├── .env.template         # Environment template
├── package.json
├── pnpm-lock.yaml
├── .gitignore
├── README.md             # This file
└── README.zh.md          # Chinese documentation
```

## Development and Maintenance

### Adding new email templates

1. Edit the corresponding language template file (e.g., `config/templates.zh-CN.yaml`)
2. Add new subjects in `subjects` section
3. Add corresponding content templates in `content` section
4. Use `{{variable}}` syntax to reference variables
5. Use `{{#if variable}}content{{/if}}` for conditional rendering

### Adding new language support

1. Create new template file in `config/` directory (e.g., `templates.ja.yaml`)
2. Copy existing template structure and translate content
3. Add new language option description in `.env.template`

### Configuration Management

- All configuration managed through environment variables (.env file)
- No JSON configuration files used
- Template system uses YAML format for maintainability

### Email Format Optimizations

- Timestamp: Shows only hours and minutes for better readability
- Working directory: Automatically extracts last folder name to email subject
- Message format: Uses Markdown quote format for emphasis
- Line spacing: Space added at end of each line to prevent email client line joining
- Multilingual support: Supports Simplified Chinese, Traditional Chinese (Hong Kong), and English templates
- Independent language files: Each language has separate template files for easy maintenance and extension

## Development

### Run development mode
```bash
pnpm dev
```

### Run tests
```bash
pnpm test
```

## Troubleshooting

### SMTP Connection Failed
1. Check SMTP server configuration
2. Verify username and password
3. Check network connection
4. View error logs

### Email Sending Failed
1. Verify recipient email address
2. Check email content format
3. View `~/.claude-mailer/error.log` logs

### Permission Issues
1. Ensure script has execute permission: `chmod +x bin/cli.js`
2. Ensure log directory has write permission

## License

MIT License