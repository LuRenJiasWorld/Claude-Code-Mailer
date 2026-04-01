import type { Command } from 'commander'
import { ClaudeMailer } from '../../index'
import { ConfigMissingError } from '../../types'
import { formatSetupGuide } from '../setup'

export function registerVerifyCommand(program: Command): void {
  program
    .command('verify')
    .description('Verify SMTP connection')
    .action(async () => {
      try {
        const mailer = new ClaudeMailer()
        const result = await mailer.verifyConnection()

        if (result.success) {
          console.log('SMTP 连接成功')
          console.log('配置信息:', JSON.stringify(mailer.getConfig(), null, 2))
          process.exit(0)
        } else {
          console.error('SMTP 连接失败:', result.message)
          process.exit(1)
        }
      } catch (error) {
        if (error instanceof ConfigMissingError) {
          process.stderr.write(formatSetupGuide(error.configPath) + '\n')
          process.exit(1)
        }
        console.error('验证失败:', (error as Error).message)
        process.exit(1)
      }
    })
}
