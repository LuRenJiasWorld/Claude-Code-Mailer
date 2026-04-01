# Claude Code Mailer

Smart email notifications for [Claude Code](https://claude.ai/code). Get notified when Claude needs your attention, finishes a task, or a subtask completes — without staring at the terminal.

## Quick Start

One command. That's it.

```bash
npx claude-code-mailer install
```

The interactive wizard will:

1. Ask you to pick an email provider (Gmail, 163, QQ Mail, or custom SMTP)
2. Collect your SMTP credentials
3. Send a test email — you confirm receipt
4. Save config to `~/.claude-code-mailer/.env`
5. Install hooks into `~/.claude/settings.json` automatically

After that, Claude Code will email you on every `Stop`, `SubagentStop`, and `Notification` event.

## Requirements

- Node.js ≥ 18
- An SMTP account (Gmail, QQ Mail, corporate mail, etc.)

> **Gmail users:** You need an [App Password](https://myaccount.google.com/apppasswords), not your regular password.
> **QQ Mail users:** Enable SMTP in settings and use the authorization code as your password.

## Commands

| Command | Description |
|---------|-------------|
| `npx claude-code-mailer install` | Interactive setup wizard (first-time setup) |
| `npx claude-code-mailer uninstall` | Remove hooks from Claude Code settings |
| `npx claude-code-mailer verify` | Test SMTP connection and show config |
| `npx claude-code-mailer test` | Send a test email with current config |
| `npx claude-code-mailer send --stdin` | Send notification from hook (used internally) |
| `npx claude-code-mailer config` | Print current resolved configuration |
| `npx claude-code-mailer custom` | Send a one-off custom email |

## Configuration

Config lives at `~/.claude-code-mailer/.env`. You can edit it directly at any time:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password

FROM_EMAIL=you@gmail.com
TO_EMAIL=you@gmail.com
SUBJECT_PREFIX=[Claude Code]

# Template language: zh-CN | zh-HK | en
TEMPLATE_LANGUAGE=zh-CN

RETRY_ATTEMPTS=3
RETRY_DELAY=1000
TIMEOUT=10000

# Set to false if your SMTP server uses a self-signed certificate
TLS_REJECT_UNAUTHORIZED=true
```

### Priority order

Environment variables → project `.env` → `~/.claude-code-mailer/.env`

## Manual Hook Configuration

If you prefer to configure hooks manually, add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [{ "hooks": [{ "type": "command", "command": "npx -y claude-code-mailer send --stdin" }] }],
    "Stop":         [{ "hooks": [{ "type": "command", "command": "npx -y claude-code-mailer send --stdin" }] }],
    "SubagentStop": [{ "hooks": [{ "type": "command", "command": "npx -y claude-code-mailer send --stdin" }] }]
  }
}
```

## Email Templates

Templates are YAML files bundled with the package. Three languages are included:

| File | Language |
|------|----------|
| `templates.zh-CN.yaml` | Simplified Chinese (default) |
| `templates.zh-HK.yaml` | Traditional Chinese |
| `templates.en.yaml` | English |

**Template variables:** `{{timestamp}}`, `{{message}}`, `{{cwd}}`, `{{sessionId}}`
**Conditional blocks:** `{{#if message}}…{{/if}}`

## Troubleshooting

**SMTP connection failed**
Run `npx claude-code-mailer verify` to see the exact error. Common causes: wrong port, wrong password, or app password not enabled.

**Email not arriving**
Check spam. Run `npx claude-code-mailer test` to trigger a send manually.

**Config directory not found after npx**
This is a known issue with some old versions. Update to the latest: `npx claude-code-mailer@latest install`.

**Hooks not firing**
Open `/hooks` in Claude Code to reload settings after installation.

## License

MIT
