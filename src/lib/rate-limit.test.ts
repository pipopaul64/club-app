import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getRateLimitInfo, _clearStore } from './rate-limit'

beforeEach(() => {
  _clearStore()
})

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    expect(checkRateLimit('test:ip', 5, 60_000)).toBe(true)
  })

  it('allows requests up to the limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('test:ip', 5, 60_000)).toBe(true)
    }
  })

  it('blocks requests exceeding the limit', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('test:ip', 5, 60_000)
    expect(checkRateLimit('test:ip', 5, 60_000)).toBe(false)
  })

  it('does not affect other keys', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('key-a', 5, 60_000)
    // key-a is exhausted, key-b should still be allowed
    expect(checkRateLimit('key-b', 5, 60_000)).toBe(true)
  })

  it('resets after the window expires', () => {
    // Use a very short window (already expired by the time we check)
    const pastWindow = 1 // 1ms window — will immediately expire
    checkRateLimit('test:ip', 1, pastWindow)
    // Give the window time to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit('test:ip', 1, pastWindow)).toBe(true)
        resolve()
      }, 10)
    })
  })
})

describe('getRateLimitInfo', () => {
  it('returns full remaining before any requests', () => {
    const info = getRateLimitInfo('test:ip', 10, 60_000)
    expect(info.remaining).toBe(10)
  })

  it('decrements remaining correctly', () => {
    checkRateLimit('test:ip', 10, 60_000)
    checkRateLimit('test:ip', 10, 60_000)
    checkRateLimit('test:ip', 10, 60_000)
    const info = getRateLimitInfo('test:ip', 10, 60_000)
    expect(info.remaining).toBe(7)
  })

  it('returns 0 when limit is exceeded', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('test:ip', 10, 60_000)
    checkRateLimit('test:ip', 10, 60_000) // one over
    const info = getRateLimitInfo('test:ip', 10, 60_000)
    expect(info.remaining).toBe(0)
  })
})
