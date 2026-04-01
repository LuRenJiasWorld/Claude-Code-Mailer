import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type {
  MailerConfig,
  HookEventType,
  SessionInfo,
  AdditionalInfo,
  SendResult,
  VerifyResult,
  MailOptions,
  TemplateData
} from './types'

function resolveConfigDir(): string {
  try {
    const pkgName = 'claude-code-mailer'
    const pkgJsonPath = require.resolve(pkgName + '/package.json')
    return path.join(path.dirname(pkgJsonPath), 'config')
  } catch {
    let dir = process.argv[1] ? path.dirname(process.argv[1]) : process.cwd()
    for (let i = 0; i < 8; i++) {
      const candidate = path.join(dir, 'config', 'templates.en.yaml')
      if (fs.existsSync(candidate)) return path.join(dir, 'config')
      dir = path.dirname(dir)
    }
    throw new Error('Cannot locate config directory. This is a packaging error.')
  }
}

export class Mailer {
  private config: MailerConfig
  private templates: TemplateData
  private transporter: nodemailer.Transporter

  constructor(config: MailerConfig) {
    this.config = config
    this.templates = this.loadTemplates()
    this.transporter = this.initTransporter()
  }

  private initTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: {
        user: this.config.smtp.auth.user,
        pass: this.config.smtp.auth.pass
      },
      tls: {
        rejectUnauthorized: this.config.smtp.rejectUnauthorized
      },
      connectionTimeout: this.config.timeout,
      greetingTimeout: this.config.timeout,
      socketTimeout: this.config.timeout
    })
  }

  async sendMail(options: MailOptions): Promise<SendResult> {
    const mailOptions = {
      from: this.config.from,
      to: options.to ?? this.config.to,
      subject: `${this.config.subjectPrefix} ${options.subject}`,
      text: options.text ?? options.message ?? '',
      html: options.html ?? undefined,
      date: new Date()
    }

    return this.retrySend(mailOptions)
  }

  private async retrySend(mailOptions: nodemailer.SendMailOptions, attempt = 1): Promise<SendResult> {
    try {
      const info = await this.transporter.sendMail(mailOptions)
      return {
        success: true,
        messageId: info.messageId as string,
        attempt
      }
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        console.log(`邮件发送失败，第 ${attempt} 次重试... 错误: ${(error as Error).message}`)
        await this.delay(this.config.retryDelay)
        return this.retrySend(mailOptions, attempt + 1)
      } else {
        throw new Error(`邮件发送失败，已重试 ${this.config.retryAttempts} 次。错误: ${(error as Error).message}`)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async sendNotification(eventType: HookEventType, sessionInfo: SessionInfo, additionalInfo: AdditionalInfo = {}): Promise<SendResult> {
    const subject = this.getSubject(eventType, sessionInfo, additionalInfo)
    const message = this.getMessage(eventType, sessionInfo, additionalInfo)

    return this.sendMail({ subject, text: message })
  }

  private loadTemplates(): TemplateData {
    const language = this.config.language ?? 'zh-CN'
    const configDir = resolveConfigDir()
    const templatePath = path.join(configDir, `templates.${language}.yaml`)

    try {
      const templateData = fs.readFileSync(templatePath, 'utf8')
      return yaml.load(templateData) as TemplateData
    } catch {
      console.warn(`无法加载语言模板文件 ${language}，回退到英文模板`)

      if (language !== 'en') {
        try {
          const fallbackPath = path.join(configDir, 'templates.en.yaml')
          const fallbackData = fs.readFileSync(fallbackPath, 'utf8')
          return yaml.load(fallbackData) as TemplateData
        } catch {
          console.warn('无法加载英文模板文件，使用内置模板')
        }
      }

      return {
        subjects: {
          Notification: 'Your attention needed',
          Stop: 'Task completed',
          SubagentStop: 'Subtask completed'
        },
        content: {
          Notification: 'Current time is {{timestamp}}\n\n{{#if message}}> {{message}}\n\n{{/if}}Working directory: {{cwd}}\nSession ID: {{sessionId}}\n\nPlease open Claude Code terminal for details.',
          Stop: 'Current time is {{timestamp}}\n\n{{#if message}}> {{message}}\n\n{{/if}}Working directory: {{cwd}}\nSession ID: {{sessionId}}\n\nPlease check terminal for details.',
          SubagentStop: 'Current time is {{timestamp}}\n\n{{#if message}}> {{message}}\n\n{{/if}}Working directory: {{cwd}}\nSession ID: {{sessionId}}\n\nPlease check terminal for details.'
        },
        defaults: {
          subject: 'Notification',
          message: ''
        }
      }
    }
  }

  renderTemplate(template: string, data: Record<string, string>): string {
    let result = template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, variable: string, content: string) => {
      return data[variable] ? content : ''
    })

    result = result.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      return data[key] !== undefined ? data[key] : _match
    })

    return result
  }

  private getSubject(eventType: HookEventType, sessionInfo: SessionInfo, additionalInfo: AdditionalInfo = {}): string {
    const baseSubject = this.templates.subjects[eventType] ?? this.templates.defaults.subject

    const cwd = additionalInfo.cwd ?? sessionInfo.cwd ?? ''
    if (cwd) {
      const parts = cwd.split('/')
      const lastPart = parts[parts.length - 1]
      if (lastPart) {
        return `${baseSubject} @${lastPart}`
      }
    }

    return baseSubject
  }

  private getMessage(eventType: HookEventType, sessionInfo: SessionInfo, additionalInfo: AdditionalInfo = {}): string {
    const now = new Date()
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const templateData: Record<string, string> = {
      timestamp,
      message: additionalInfo.message ?? '',
      cwd: additionalInfo.cwd ?? sessionInfo.cwd ?? '未知',
      sessionId: sessionInfo.sessionId ?? 'unknown'
    }

    const template = this.templates.content[eventType]
    if (!template) {
      return this.templates.defaults.message
    }

    let message = this.renderTemplate(template, templateData)

    if (additionalInfo.details) {
      message += `\n\n详细信息:\n${additionalInfo.details}`
    }

    return message
  }

  async verifyConnection(): Promise<VerifyResult> {
    try {
      await this.transporter.verify()
      return { success: true, message: 'SMTP 连接成功' }
    } catch (error) {
      return { success: false, message: `SMTP 连接失败: ${(error as Error).message}` }
    }
  }

  getConfig(): Omit<MailerConfig, 'smtp'> & { smtp: Omit<MailerConfig['smtp'], 'auth'> & { auth: { user: string; pass: string } } } {
    return {
      ...this.config,
      smtp: {
        ...this.config.smtp,
        auth: {
          user: this.config.smtp.auth.user,
          pass: '***hidden***'
        }
      }
    }
  }
}
