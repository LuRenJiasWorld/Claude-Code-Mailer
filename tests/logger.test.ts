import { describe, it, expect } from 'bun:test'
import { Logger } from '../src/logger'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('Logger', () => {
  it('creates log directory if not exists', () => {
    const logDir = path.join(os.tmpdir(), `ccm-test-${Date.now()}`)
    const logger = new Logger({ logDir, enableConsole: false })
    expect(fs.existsSync(logDir)).toBe(true)
    fs.rmSync(logDir, { recursive: true })
  })

  it('writes info log to mailer.log', () => {
    const logDir = path.join(os.tmpdir(), `ccm-test-${Date.now()}`)
    const logger = new Logger({ logDir, enableConsole: false })
    logger.info('test message')
    const content = fs.readFileSync(path.join(logDir, 'mailer.log'), 'utf8')
    expect(content).toContain('[INFO] test message')
    fs.rmSync(logDir, { recursive: true })
  })

  it('writes error log to both mailer.log and error.log', () => {
    const logDir = path.join(os.tmpdir(), `ccm-test-${Date.now()}`)
    const logger = new Logger({ logDir, enableConsole: false })
    logger.error('error message')
    const errorContent = fs.readFileSync(path.join(logDir, 'error.log'), 'utf8')
    expect(errorContent).toContain('[ERROR] error message')
    fs.rmSync(logDir, { recursive: true })
  })
})
