export function formatSetupGuide(configPath: string): string {
  return `
[claude-code-mailer] Configuration required.

No configuration file found. A template has been created at:
  ${configPath}

Please edit this file with your SMTP settings, then run again.

Quick setup:
  1. Edit ${configPath}
  2. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
  3. Set FROM_EMAIL and TO_EMAIL
  4. Run: npx claude-code-mailer verify

For full documentation: https://github.com/LuRenJiasWorld/Claude-Code-Mailer
`.trim()
}
