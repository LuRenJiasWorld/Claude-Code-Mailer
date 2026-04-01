import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import os from 'os'
import type { MailerConfig, TemplateLanguage } from './types'
import { ConfigMissingError } from './types'

export class ConfigLoader {
  private config: MailerConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private getUserConfigDir(): string {
    return path.join(os.homedir(), '.claude-code-mailer')
  }

  private getGlobalConfigPath(): string {
    return path.join(this.getUserConfigDir(), '.env')
  }

  private getProjectConfigPath(): string {
    let currentDir = process.cwd()
    while (currentDir !== path.parse(currentDir).root) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return path.join(currentDir, '.env')
      }
      currentDir = path.dirname(currentDir)
    }
    return path.join(process.cwd(), '.env')
  }

  private loadConfigFile(configPath: string): Record<string, string> {
    if (!fs.existsSync(configPath)) {
      return {}
    }

    const result = dotenv.config({ path: configPath })
    if (result.error) {
      console.warn(`Warning: Failed to load config file ${configPath}:`, result.error.message)
      return {}
    }
    return (result.parsed as Record<string, string>) || {}
  }

  private createDefaultConfig(configPath: string): void {
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    const defaultConfig = `# Claude Code Mailer Configuration
# Copy this file to .env and fill in your settings

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

# TLS Settings (set to false for self-signed certificates)
TLS_REJECT_UNAUTHORIZED=true
`
    fs.writeFileSync(configPath, defaultConfig)
  }

  private loadConfig(): MailerConfig {
    let configData: Record<string, string> = {}

    const globalConfigPath = this.getGlobalConfigPath()
    if (fs.existsSync(globalConfigPath)) {
      configData = { ...configData, ...this.loadConfigFile(globalConfigPath) }
    }

    const projectConfigPath = this.getProjectConfigPath()
    if (fs.existsSync(projectConfigPath)) {
      configData = { ...configData, ...this.loadConfigFile(projectConfigPath) }
    }

    if (!fs.existsSync(globalConfigPath) && !fs.existsSync(projectConfigPath)) {
      this.createDefaultConfig(globalConfigPath)
      throw new ConfigMissingError(globalConfigPath)
    }

    const tlsRejectUnauthorized = process.env.TLS_REJECT_UNAUTHORIZED ?? configData.TLS_REJECT_UNAUTHORIZED
    const rejectUnauthorized = tlsRejectUnauthorized !== undefined
      ? tlsRejectUnauthorized !== 'false'
      : true

    return {
      smtp: {
        host: process.env.SMTP_HOST ?? configData.SMTP_HOST ?? '',
        port: parseInt(process.env.SMTP_PORT ?? configData.SMTP_PORT ?? '587', 10),
        secure: (process.env.SMTP_SECURE ?? configData.SMTP_SECURE) === 'true',
        auth: {
          user: process.env.SMTP_USER ?? configData.SMTP_USER ?? '',
          pass: process.env.SMTP_PASS ?? configData.SMTP_PASS ?? ''
        },
        rejectUnauthorized
      },
      from: process.env.FROM_EMAIL ?? configData.FROM_EMAIL ?? '',
      to: process.env.TO_EMAIL ?? configData.TO_EMAIL ?? '',
      subjectPrefix: process.env.SUBJECT_PREFIX ?? configData.SUBJECT_PREFIX ?? '[Claude Code]',
      language: (process.env.TEMPLATE_LANGUAGE ?? configData.TEMPLATE_LANGUAGE ?? 'zh-CN') as TemplateLanguage,
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS ?? configData.RETRY_ATTEMPTS ?? '3', 10),
      retryDelay: parseInt(process.env.RETRY_DELAY ?? configData.RETRY_DELAY ?? '1000', 10),
      timeout: parseInt(process.env.TIMEOUT ?? configData.TIMEOUT ?? '10000', 10)
    }
  }

  getConfig(): MailerConfig {
    return this.config
  }

  getSmtpConfig(): MailerConfig['smtp'] {
    return this.config.smtp
  }

  getEmailConfig(): Pick<MailerConfig, 'from' | 'to' | 'subjectPrefix'> {
    return {
      from: this.config.from,
      to: this.config.to,
      subjectPrefix: this.config.subjectPrefix
    }
  }
}
