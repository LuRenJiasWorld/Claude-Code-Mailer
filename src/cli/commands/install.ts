import fs from 'fs'
import path from 'path'
import os from 'os'
import type { Command } from 'commander'

const NPX_COMMAND = 'npx -y claude-code-mailer send --stdin'

const HOOK_EVENT_TYPES = ['Notification', 'Stop', 'SubagentStop'] as const

interface HookEntry {
  type: string
  command: string
}

interface HookGroup {
  hooks: HookEntry[]
}

interface ClaudeSettings {
  hooks?: Record<string, HookGroup[]>
  [key: string]: unknown
}

function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json')
}

function readClaudeSettings(): ClaudeSettings {
  const settingsPath = getClaudeSettingsPath()

  if (!fs.existsSync(settingsPath)) {
    const claudeDir = path.dirname(settingsPath)
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true })
    }
    const defaultSettings: ClaudeSettings = { hooks: {} }
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2))
    return defaultSettings
  }

  const data = fs.readFileSync(settingsPath, 'utf8')
  return JSON.parse(data) as ClaudeSettings
}

function writeClaudeSettings(settings: ClaudeSettings): void {
  fs.writeFileSync(getClaudeSettingsPath(), JSON.stringify(settings, null, 2))
}

function isMailerHook(command: string): boolean {
  return command.includes('claude-code-mailer send --stdin') ||
         command.includes('claude-code-mailer/bin/cli.js send --stdin')
}

function hasMailerHook(settings: ClaudeSettings, eventType: string): boolean {
  const groups = settings.hooks?.[eventType]
  if (!groups) return false

  for (const group of groups) {
    if (group.hooks?.some(h => h.type === 'command' && isMailerHook(h.command))) {
      return true
    }
  }
  return false
}

export function registerInstallCommand(program: Command): void {
  program
    .command('install')
    .description('Install Claude Code hooks automatically')
    .action(() => {
      console.log('Claude Code Mailer Installation\n')

      const settings = readClaudeSettings()

      if (!settings.hooks) settings.hooks = {}

      let installedCount = 0
      let skippedCount = 0

      for (const eventType of HOOK_EVENT_TYPES) {
        if (hasMailerHook(settings, eventType)) {
          console.log(`${eventType} hook already exists, skipping`)
          skippedCount++
          continue
        }

        if (!settings.hooks[eventType]) {
          settings.hooks[eventType] = []
        }

        settings.hooks[eventType].push({ hooks: [{ type: 'command', command: NPX_COMMAND }] })
        console.log(`${eventType} hook installed`)
        installedCount++
      }

      if (installedCount > 0) {
        writeClaudeSettings(settings)
        console.log(`\nInstallation completed. Installed: ${installedCount}, Skipped: ${skippedCount}`)
        console.log('\nNext steps:')
        console.log('  Configure SMTP: edit ~/.claude-code-mailer/.env')
        console.log('  Verify setup:   npx claude-code-mailer verify')
        console.log('  Uninstall:      npx claude-code-mailer uninstall')
      } else {
        console.log('\nAll Claude Code Mailer hooks are already installed.')
      }
    })

  program
    .command('uninstall')
    .description('Uninstall Claude Code hooks')
    .action(() => {
      console.log('Claude Code Mailer Uninstallation\n')

      const settings = readClaudeSettings()

      if (!settings.hooks) {
        console.log('No hooks found in Claude settings.')
        return
      }

      let removedCount = 0

      for (const eventType of Object.keys(settings.hooks)) {
        const original = settings.hooks[eventType].length

        settings.hooks[eventType] = settings.hooks[eventType].filter(group => {
          return !group.hooks?.some(h => h.type === 'command' && isMailerHook(h.command))
        })

        if (settings.hooks[eventType].length < original) {
          console.log(`Removed ${eventType} hook`)
          removedCount++
        }

        if (settings.hooks[eventType].length === 0) {
          delete settings.hooks[eventType]
        }
      }

      if (removedCount > 0) {
        writeClaudeSettings(settings)
        console.log(`\nUninstallation completed. Removed: ${removedCount} hooks.`)
      } else {
        console.log('\nNo Claude Code Mailer hooks found to remove.')
      }
    })
}
