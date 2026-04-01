import { Mailer } from './mailer'
import { ConfigLoader } from './config-loader'
import { Logger } from './logger'
import type { HookEventType, SessionInfo, AdditionalInfo, SendResult, VerifyResult, LoggerOptions } from './types'

export { ConfigMissingError, ConfigInvalidError } from './types'
export type { MailerConfig, HookEventType, SessionInfo, AdditionalInfo, SendResult, VerifyResult } from './types'

export class ClaudeMailer {
  private configLoader: ConfigLoader
  private logger: Logger
  private mailer: Mailer

  constructor(options: { logger?: LoggerOptions } = {}) {
    this.configLoader = new ConfigLoader()
    this.logger = new Logger(options.logger)
    this.mailer = new Mailer(this.configLoader.getConfig())

    this.logger.info('Claude Code Mailer 初始化完成', {
      config: this.mailer.getConfig() as unknown as Record<string, unknown>
    })
  }

  async sendNotification(eventType: HookEventType, sessionInfo: SessionInfo, additionalInfo: AdditionalInfo = {}): Promise<SendResult> {
    try {
      this.logger.info('开始发送邮件通知', {
        eventType,
        sessionId: sessionInfo.sessionId,
        to: this.mailer.getConfig().to
      })

      const result = await this.mailer.sendNotification(eventType, sessionInfo, additionalInfo)

      this.logger.info('邮件发送成功', {
        eventType,
        sessionId: sessionInfo.sessionId,
        messageId: result.messageId,
        attempt: result.attempt
      })

      return {
        success: true,
        messageId: result.messageId,
        attempt: result.attempt
      }
    } catch (error) {
      this.logger.error('邮件发送失败', {
        eventType,
        sessionId: sessionInfo.sessionId,
        error: (error as Error).message
      })

      return {
        success: false,
        error: (error as Error).message,
        attempt: this.mailer.getConfig().retryAttempts
      }
    }
  }

  async sendCustomEmail(options: { to?: string; from?: string; subject?: string; text?: string; html?: string }): Promise<SendResult> {
    try {
      this.logger.info('开始发送自定义邮件', {
        to: options.to ?? this.mailer.getConfig().to,
        subject: options.subject
      })

      const result = await this.mailer.sendMail({
        subject: options.subject ?? '',
        ...options
      })

      this.logger.info('自定义邮件发送成功', {
        to: options.to ?? this.mailer.getConfig().to,
        subject: options.subject,
        messageId: result.messageId
      })

      return {
        success: true,
        messageId: result.messageId,
        attempt: result.attempt
      }
    } catch (error) {
      this.logger.error('自定义邮件发送失败', {
        to: options.to ?? this.mailer.getConfig().to,
        subject: options.subject,
        error: (error as Error).message
      })

      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  async verifyConnection(): Promise<VerifyResult> {
    try {
      const result = await this.mailer.verifyConnection()
      this.logger.info('SMTP 连接验证', result as unknown as Record<string, unknown>)
      return result
    } catch (error) {
      this.logger.error('SMTP 连接验证失败', { error: (error as Error).message })
      return { success: false, message: (error as Error).message }
    }
  }

  getConfig(): ReturnType<Mailer['getConfig']> {
    return this.mailer.getConfig()
  }

  getLogger(): Logger {
    return this.logger
  }
}
