import { describe, it, expect } from 'bun:test'
import { Mailer } from '../src/mailer'
import type { MailerConfig } from '../src/types'

const mockConfig: MailerConfig = {
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'test@example.com', pass: 'password' },
    rejectUnauthorized: true
  },
  from: 'test@example.com',
  to: 'recipient@example.com',
  subjectPrefix: '[Claude Code]',
  language: 'en',
  retryAttempts: 3,
  retryDelay: 100,
  timeout: 5000
}

describe('Mailer.renderTemplate', () => {
  const mailer = new Mailer(mockConfig)

  it('replaces {{variable}} with values', () => {
    const result = mailer.renderTemplate('Hello {{name}}', { name: 'World' })
    expect(result).toBe('Hello World')
  })

  it('leaves unknown {{variable}} untouched', () => {
    const result = mailer.renderTemplate('Hello {{unknown}}', {})
    expect(result).toBe('Hello {{unknown}}')
  })

  it('renders {{#if variable}} block when truthy', () => {
    const result = mailer.renderTemplate('{{#if msg}}yes{{/if}}', { msg: 'hi' })
    expect(result).toBe('yes')
  })

  it('removes {{#if variable}} block when falsy', () => {
    const result = mailer.renderTemplate('{{#if msg}}yes{{/if}}', { msg: '' })
    expect(result).toBe('')
  })

  it('handles multiple variables', () => {
    const result = mailer.renderTemplate('{{a}} and {{b}}', { a: 'foo', b: 'bar' })
    expect(result).toBe('foo and bar')
  })
})

describe('Mailer.getConfig', () => {
  it('hides smtp password', () => {
    const mailer = new Mailer(mockConfig)
    const config = mailer.getConfig()
    expect(config.smtp.auth.pass).toBe('***hidden***')
    expect(config.smtp.auth.user).toBe('test@example.com')
  })
})
