import fs from 'fs'
import path from 'path'
import os from 'os'
import type { LogLevel, LoggerOptions } from './types'

export class Logger {
  private logDir: string
  private logFile: string
  private errorFile: string
  private enableConsole: boolean
  private enableFile: boolean

  constructor(options: LoggerOptions = {}) {
    this.logDir = options.logDir ?? path.join(os.homedir(), '.claude-code-mailer')
    this.logFile = path.join(this.logDir, 'mailer.log')
    this.errorFile = path.join(this.logDir, 'error.log')
    this.enableConsole = options.enableConsole !== false
    this.enableFile = options.enableFile !== false

    this.ensureLogDirectory()
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private formatMessage(level: LogLevel, message: string, data: Record<string, unknown> = {}): string {
    const timestamp = new Date().toISOString()
    const dataStr = Object.keys(data).length > 0 ? ` | ${JSON.stringify(data)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`
  }

  private writeToFile(filename: string, message: string): void {
    try {
      fs.appendFileSync(filename, message + '\n')
    } catch (error) {
      console.error('无法写入日志文件:', (error as Error).message)
    }
  }

  log(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
    const formattedMessage = this.formatMessage(level, message, data)

    if (this.enableConsole) {
      console.log(formattedMessage)
    }

    if (this.enableFile) {
      if (level === 'error') {
        this.writeToFile(this.errorFile, formattedMessage)
      } else {
        this.writeToFile(this.logFile, formattedMessage)
      }
    }
  }

  info(message: string, data: Record<string, unknown> = {}): void {
    this.log('info', message, data)
  }

  warn(message: string, data: Record<string, unknown> = {}): void {
    this.log('warn', message, data)
  }

  error(message: string, data: Record<string, unknown> = {}): void {
    this.log('error', message, data)
  }

  debug(message: string, data: Record<string, unknown> = {}): void {
    this.log('debug', message, data)
  }
}
