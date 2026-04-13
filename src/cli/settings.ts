import fs from 'fs'
import path from 'path'
import os from 'os'

export interface HookEntry {
  type: string
  command: string
}

export interface HookGroup {
  hooks: HookEntry[]
}

export interface ClaudeSettings {
  hooks?: Record<string, HookGroup[]>
  [key: string]: unknown
}

function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json')
}

export function isMailerHook(command: string): boolean {
  return /claude-code-mailer(@[^\s]*)?\s+send\s+--stdin/.test(command) ||
         command.includes('claude-code-mailer/bin/cli.js send --stdin')
}

export function readClaudeSettings(): ClaudeSettings {
  const settingsPath = getClaudeSettingsPath()

  if (!fs.existsSync(settingsPath)) {
    return { hooks: {} }
  }

  const data = fs.readFileSync(settingsPath, 'utf8')
  return JSON.parse(data) as ClaudeSettings
}

function writeClaudeSettings(settings: ClaudeSettings): void {
  fs.writeFileSync(getClaudeSettingsPath(), JSON.stringify(settings, null, 2))
}

export function cleanupDeprecatedHooks(): number {
  const settings = readClaudeSettings()

  if (!settings.hooks?.SubagentStop) {
    return 0
  }

  const before = settings.hooks.SubagentStop.length
  settings.hooks.SubagentStop = settings.hooks.SubagentStop.filter(
    group => !group.hooks?.some(h => h.type === 'command' && isMailerHook(h.command))
  )

  if (settings.hooks.SubagentStop.length === 0) {
    delete settings.hooks.SubagentStop
  }

  const removedCount = before - (settings.hooks.SubagentStop?.length || 0)

  if (removedCount > 0) {
    writeClaudeSettings(settings)
  }

  return removedCount
}
