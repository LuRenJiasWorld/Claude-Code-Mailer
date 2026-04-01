export type HookEventType = 'Notification' | 'Stop' | 'SubagentStop'
export type TemplateLanguage = 'zh-CN' | 'zh-HK' | 'en'
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface SmtpAuth {
  user: string
  pass: string
}

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  auth: SmtpAuth
  rejectUnauthorized: boolean
}

export interface MailerConfig {
  smtp: SmtpConfig
  from: string
  to: string
  subjectPrefix: string
  language: TemplateLanguage
  retryAttempts: number
  retryDelay: number
  timeout: number
}

export interface SessionInfo {
  sessionId: string
  cwd?: string
}

export interface AdditionalInfo {
  message?: string
  cwd?: string
  details?: string
  transcript_path?: string
  subject?: string
  [key: string]: unknown
}

export interface SendResult {
  success: boolean
  messageId?: string
  attempt?: number
  error?: string
}

export interface VerifyResult {
  success: boolean
  message: string
}

export interface HookPayload {
  hook_event_name?: HookEventType
  session_id?: string
  sessionId?: string
  message?: string
  cwd?: string
  transcript_path?: string
  additional_info?: Record<string, unknown>
  additionalInfo?: Record<string, unknown>
  event?: string
}

export interface TemplateData {
  subjects: Record<string, string>
  content: Record<string, string>
  defaults: {
    subject: string
    message: string
  }
}

export interface MailOptions {
  to?: string
  from?: string
  subject: string
  text?: string
  message?: string
  html?: string | null
}

export interface LoggerOptions {
  logDir?: string
  enableConsole?: boolean
  enableFile?: boolean
}

export interface CustomMailOptions {
  to?: string
  from?: string
  subject?: string
  text?: string
  html?: string
}

export class ConfigMissingError extends Error {
  public readonly configPath: string
  constructor(configPath: string) {
    super(`No configuration found. Please configure: ${configPath}`)
    this.name = 'ConfigMissingError'
    this.configPath = configPath
  }
}

export class ConfigInvalidError extends Error {
  public readonly field: string
  constructor(field: string) {
    super(`Required configuration field missing or invalid: ${field}`)
    this.name = 'ConfigInvalidError'
    this.field = field
  }
}
