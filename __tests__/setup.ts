import { vi } from 'vitest'
import '@testing-library/jest-dom'
// Globales Redis-Mock für alle Tests
global.mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  pipeline: vi.fn(),
  exec: vi.fn(),
  lpush: vi.fn(),
  ltrim: vi.fn(),
  expire: vi.fn(),
  lrange: vi.fn(),
}

// Mock für @/lib/redis
vi.mock('@/lib/redis', () => ({
  getRedis: () => global.mockRedis,
  initializeRedis: vi.fn(() => {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!redisUrl || !redisToken) {
      console.warn('Redis not configured - using in-memory rate limiting')
      return null
    }
    // Simuliere Fehlerfall für den dritten Test
    if (redisUrl === 'fail' || redisToken === 'fail') {
      console.error('Failed to initialize Redis:', new Error('fail'))
      return null
    }
    console.log('Redis initialized for rate limiting')
    return global.mockRedis
  }),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
// Richtiger IntersectionObserver-Mock
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null
  rootMargin: string = ''
  thresholds: number[] = []
  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {
    // Parameter werden absichtlich nicht genutzt
    void _callback
    void _options
  }

  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
