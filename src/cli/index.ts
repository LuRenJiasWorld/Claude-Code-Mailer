import { Command } from 'commander'
import { readFileSync } from 'fs'
import { join } from 'path'
import { registerSendCommand } from './commands/send'
import { registerInstallCommand } from './commands/install'
import { registerTestCommand } from './commands/test'
import { registerVerifyCommand } from './commands/verify'
import { registerConfigCommand } from './commands/config'
import { registerCustomCommand } from './commands/custom'

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, '../../package.json')
    return (JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string }).version
  } catch {
    return '0.0.0'
  }
}

const program = new Command()

program
  .name('claude-code-mailer')
  .description('Smart email notifications for Claude Code')
  .version(getVersion())

registerSendCommand(program)
registerInstallCommand(program)
registerTestCommand(program)
registerVerifyCommand(program)
registerConfigCommand(program)
registerCustomCommand(program)

if (process.argv.length === 2) {
  program.help()
}

program.parse()
