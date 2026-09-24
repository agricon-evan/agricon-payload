import { describe, it, expect, beforeEach } from 'vitest'
import { consume, getClientIP, __resetRateLimit } from '@/lib/rate-limit'

describe('rate-limit', () => {
  beforeEach(() => {
    __resetRateLimit()
  })

  it('allows requests up to the limit, then blocks', () => {
    const key = 'test:1.2.3.4'
    for (let i = 0; i < 5; i++) {
      expect(consume(key, 5, 60_000).ok).toBe(true)
    }
    const blocked = consume(key, 5, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tracks separate keys independently', () => {
    for (let i = 0; i < 5; i++) consume('test:a', 5, 60_000)
    expect(consume('test:a', 5, 60_000).ok).toBe(false)
    // A different IP must not be affected by the first one's exhaustion.
    expect(consume('test:b', 5, 60_000).ok).toBe(true)
  })

  it('reports a Retry-After within the window', () => {
    consume('test:c', 1, 30_000)
    const blocked = consume('test:c', 1, 30_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(30)
  })

  it('resets once the window expires', async () => {
    consume('test:d', 1, 20)
    expect(consume('test:d', 1, 20).ok).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(consume('test:d', 1, 20).ok).toBe(true)
  })
})

describe('getClientIP', () => {
  it('takes the first entry of a forwarded chain', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' })
    expect(getClientIP(headers)).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip', () => {
    expect(getClientIP(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9')
  })

  it('returns "unknown" when no IP header is present', () => {
    expect(getClientIP(new Headers())).toBe('unknown')
  })

  it('ignores a blank forwarded value', () => {
    expect(getClientIP(new Headers({ 'x-forwarded-for': '  ', 'x-real-ip': '10.0.0.1' }))).toBe('10.0.0.1')
  })
})
