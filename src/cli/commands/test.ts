import type { Command } from 'commander'
import { ClaudeMailer } from '../../index'
import { ConfigMissingError } from '../../types'
import { formatSetupGuide } from '../setup'

export function registerTestCommand(program: Command): void {
  program
    .command('test')
    .description('Send test email')
    .option('-t, --to <email>', 'Test recipient email')
    .action(async () => {
      try {
        const mailer = new ClaudeMailer()

        const result = await mailer.sendNotification('Notification', { sessionId: 'test-session' }, {
          subject: 'Claude Code Mailer 测试邮件',
          message: '这是一封来自 Claude Code Mailer 的测试邮件。',
          details: '如果您收到这封邮件，说明邮件发送功能正常工作。'
        })

        if (result.success) {
          console.log('测试邮件发送成功')
          console.log('Message ID:', result.messageId)
          console.log('尝试次数:', result.attempt)
          process.exit(0)
        } else {
          console.error('测试邮件发送失败:', result.error)
          process.exit(1)
        }
      } catch (error) {
        if (error instanceof ConfigMissingError) {
          process.stderr.write(formatSetupGuide(error.configPath) + '\n')
          process.exit(1)
        }
        console.error('测试失败:', (error as Error).message)
        process.exit(1)
      }
    })
}
