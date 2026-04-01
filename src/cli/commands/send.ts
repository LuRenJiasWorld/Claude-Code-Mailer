import type { Command } from 'commander'
import { ClaudeMailer } from '../../index'
import { ConfigMissingError } from '../../types'
import { formatSetupGuide } from '../setup'
import type { HookEventType, HookPayload } from '../../types'

export function registerSendCommand(program: Command): void {
  program
    .command('send', { isDefault: true })
    .description('Send email notification')
    .option('-e, --event <type>', 'Event type (Notification|Stop|SubagentStop)', 'Notification')
    .option('-s, --session <id>', 'Session ID', 'unknown')
    .option('-t, --to <email>', 'Recipient email')
    .option('-f, --from <email>', 'Sender email')
    .option('--subject <text>', 'Email subject')
    .option('--message <text>', 'Email message')
    .option('--details <text>', 'Additional details')
    .option('--stdin', 'Read JSON data from stdin')
    .action(async (options: {
      event: string
      session: string
      to?: string
      from?: string
      subject?: string
      message?: string
      details?: string
      stdin?: boolean
    }) => {
      try {
        const mailer = new ClaudeMailer()

        if (options.stdin) {
          let inputData = ''
          for await (const chunk of process.stdin) {
            inputData += chunk.toString()
          }

          if (!inputData.trim()) {
            process.exit(0)
          }

          const data = JSON.parse(inputData) as HookPayload

          const sessionInfo = {
            sessionId: data.session_id ?? data.sessionId ?? options.session
          }

          const additionalInfo = {
            ...(data.additional_info ?? {}),
            ...(data.additionalInfo ?? {}),
            message: data.message,
            cwd: data.cwd,
            transcript_path: data.transcript_path
          }

          const eventType = (data.hook_event_name ?? data.event ?? options.event) as HookEventType
          const result = await mailer.sendNotification(eventType, sessionInfo, additionalInfo)

          console.log(JSON.stringify(result, null, 2))
          process.exit(result.success ? 0 : 1)
        } else {
          const sessionInfo = { sessionId: options.session }
          const additionalInfo: Record<string, string> = {}

          if (options.subject) additionalInfo.subject = options.subject
          if (options.message) additionalInfo.message = options.message
          if (options.details) additionalInfo.details = options.details

          const result = await mailer.sendNotification(options.event as HookEventType, sessionInfo, additionalInfo)

          if (result.success) {
            console.log('邮件发送成功')
            console.log('Message ID:', result.messageId)
            console.log('尝试次数:', result.attempt)
            process.exit(0)
          } else {
            console.error('邮件发送失败:', result.error)
            process.exit(1)
          }
        }
      } catch (error) {
        if (error instanceof ConfigMissingError) {
          process.stderr.write(formatSetupGuide(error.configPath) + '\n')
          process.exit(0)
        }
        console.error('发送失败:', (error as Error).message)
        process.exit(1)
      }
    })
}
