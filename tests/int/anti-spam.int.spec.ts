import { describe, it, expect } from 'vitest'
import { checkSpam, HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/anti-spam'

/** Builds a submission that passes every check, so each test varies one signal. */
const valid = (overrides: Record<string, unknown> = {}) => ({
  name: 'Jane Farmer',
  email: 'jane@farm.example',
  message: 'Please quote 2 layer cage houses for 20000 birds in Kenya.',
  [HONEYPOT_FIELD]: '',
  [RENDERED_AT_FIELD]: String(Date.now() - 10_000),
  ...overrides,
})

describe('checkSpam', () => {
  it('accepts a plausible human submission', () => {
    expect(checkSpam({ data: valid() }).spam).toBe(false)
  })

  it('rejects a filled honeypot', () => {
    const result = checkSpam({ data: valid({ [HONEYPOT_FIELD]: 'http://spam.example' }) })
    expect(result.spam).toBe(true)
    expect(result.reason).toContain('honeypot')
  })

  it('accepts an explicitly empty honeypot', () => {
    expect(checkSpam({ data: valid({ [HONEYPOT_FIELD]: '   ' }) }).spam).toBe(false)
  })

  it('rejects a non-string honeypot (bot-shaped payload)', () => {
    expect(checkSpam({ data: valid({ [HONEYPOT_FIELD]: ['x'] }) }).spam).toBe(true)
  })

  it('rejects a missing timing token', () => {
    const data = valid()
    delete (data as Record<string, unknown>)[RENDERED_AT_FIELD]
    const result = checkSpam({ data })
    expect(result.spam).toBe(true)
    expect(result.reason).toContain('missing')
  })

  it('rejects an unparseable timing token', () => {
    expect(checkSpam({ data: valid({ [RENDERED_AT_FIELD]: 'not-a-number' }) }).spam).toBe(true)
  })

  it('rejects submissions completed implausibly fast', () => {
    const result = checkSpam({ data: valid({ [RENDERED_AT_FIELD]: String(Date.now()) }) })
    expect(result.spam).toBe(true)
    expect(result.reason).toContain('submitted in')
  })

  it('rejects a stale token (replay)', () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000
    const result = checkSpam({ data: valid({ [RENDERED_AT_FIELD]: String(twoDaysAgo) }) })
    expect(result.spam).toBe(true)
    expect(result.reason).toContain('stale')
  })

  it('rejects known spam keywords in any nested field', () => {
    const data = valid({ productInterest: [{ product: 'cheap backlink package' }] })
    const result = checkSpam({ data })
    expect(result.spam).toBe(true)
    expect(result.reason).toContain('keyword')
  })

  it('rejects link flooding', () => {
    const result = checkSpam({
      data: valid({ message: 'a http://a.example b http://b.example c http://c.example d http://d.example e http://e.example' }),
    })
    expect(result.spam).toBe(true)
    expect(result.reason).toContain('link flood')
  })

  it('tolerates a couple of legitimate links', () => {
    expect(checkSpam({ data: valid({ message: 'Our site is https://farm.example — please review.' }) }).spam).toBe(false)
  })

  it('rejects Cyrillic in a Latin-only identity field', () => {
    const result = checkSpam({ data: valid({ company: 'ООО Ромашка' }) })
    expect(result.spam).toBe(true)
    expect(result.reason).toContain('cyrillic')
  })

  it('still allows Cyrillic in the free-text message', () => {
    // Russian is one of the site's six locales, so the message body must accept
    // Cyrillic — only the identity fields are Latin-restricted.
    expect(checkSpam({ data: valid({ message: 'Здравствуйте, нужны клетки для кур.' }) }).spam).toBe(false)
  })

  it('includes the IP in the reason for operator triage', () => {
    const result = checkSpam({ data: valid({ [HONEYPOT_FIELD]: 'x' }), ip: '203.0.113.5' })
    expect(result.reason).toContain('203.0.113.5')
  })
})
