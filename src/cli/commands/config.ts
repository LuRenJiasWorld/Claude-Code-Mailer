import type { Command } from 'commander'
import { ClaudeMailer } from '../../index'
import { ConfigMissingError } from '../../types'
import { formatSetupGuide } from '../setup'

export function registerConfigCommand(program: Command): void {
  program
    .command('config')
    .description('Show current configuration')
    .action(() => {
      try {
        const mailer = new ClaudeMailer()
        console.log('Claude Code Mailer 配置:')
        console.log(JSON.stringify(mailer.getConfig(), null, 2))
        process.exit(0)
      } catch (error) {
        if (error instanceof ConfigMissingError) {
          process.stderr.write(formatSetupGuide(error.configPath) + '\n')
          process.exit(1)
        }
        console.error('获取配置失败:', (error as Error).message)
        process.exit(1)
      }
    })
}
