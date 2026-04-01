import type { Command } from 'commander'
import { ClaudeMailer } from '../../index'
import { ConfigMissingError } from '../../types'
import { formatSetupGuide } from '../setup'

export function registerCustomCommand(program: Command): void {
  program
    .command('custom')
    .description('Send custom email')
    .option('-t, --to <email>', 'Recipient email')
    .option('-f, --from <email>', 'Sender email')
    .option('-s, --subject <text>', 'Email subject')
    .option('-m, --message <text>', 'Email message')
    .option('-h, --html <content>', 'HTML content')
    .option('--stdin', 'Read JSON data from stdin')
    .action(async (options: {
      to?: string
      from?: string
      subject?: string
      message?: string
      html?: string
      stdin?: boolean
    }) => {
      try {
        const mailer = new ClaudeMailer()

        let mailOptions: { to?: string; from?: string; subject?: string; text?: string; html?: string } = {}

        if (options.stdin) {
          let inputData = ''
          for await (const chunk of process.stdin) {
            inputData += chunk.toString()
          }
          mailOptions = JSON.parse(inputData) as typeof mailOptions
        } else {
          if (options.to) mailOptions.to = options.to
          if (options.from) mailOptions.from = options.from
          if (options.subject) mailOptions.subject = options.subject
          if (options.message) mailOptions.text = options.message
          if (options.html) mailOptions.html = options.html
        }

        const result = await mailer.sendCustomEmail(mailOptions)

        if (result.success) {
          console.log('邮件发送成功')
          console.log('Message ID:', result.messageId)
          process.exit(0)
        } else {
          console.error('邮件发送失败:', result.error)
          process.exit(1)
        }
      } catch (error) {
        if (error instanceof ConfigMissingError) {
          process.stderr.write(formatSetupGuide(error.configPath) + '\n')
          process.exit(1)
        }
        console.error('发送失败:', (error as Error).message)
        process.exit(1)
      }
    })
}
