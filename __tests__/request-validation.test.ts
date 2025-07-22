import { describe, expect, it } from 'vitest'

import {
  CommonSchemas,
  getSecurityHeaders,
  RequestSchemas,
  sanitizeEmail,
  sanitizeSearchQuery,
  sanitizeString,
  validateContentType,
  validateRequest,
  validateRequestSize,
} from '../lib/validations/request-validation'

// Mocks
class MockHeaders {
  private map: Record<string, string> = {}
  get(key: string) {
    return this.map[key.toLowerCase()] ?? null
  }

  set(key: string, value: string) {
    this.map[key.toLowerCase()] = value
  }
}
class MockRequest {
  url: string
  headers: MockHeaders
  private body: any
  constructor({
    url,
    headers = {},
    body,
  }: {
    url: string
    headers?: Record<string, string>
    body?: any
  }) {
    this.url = url
    this.headers = new MockHeaders()
    Object.entries(headers).forEach(([k, v]) => this.headers.set(k, v))
    this.body = body
  }

  json() {
    return this.body
  }
}

// CommonSchemas tests
describe('commonSchemas', () => {
  it('validates correct EAN13 barcode', () => {
    expect(CommonSchemas.barcode.safeParse('4006381333931').success).toBe(true)
  })
  it('rejects incorrect EAN13 barcode', () => {
    expect(CommonSchemas.barcode.safeParse('4006381333932').success).toBe(
      false,
    )
    expect(CommonSchemas.barcode.safeParse('123456789012').success).toBe(false)
  })
  it('validates non-disposable email', () => {
    expect(CommonSchemas.email.safeParse('user@example.com').success).toBe(
      true,
    )
  })
  it('rejects disposable email', () => {
    expect(CommonSchemas.email.safeParse('foo@mailinator.com').success).toBe(
      false,
    )
  })
  it('rejects unsafe string (XSS)', () => {
    expect(
      CommonSchemas.safeString.safeParse('<script>alert(1)</script>').success,
    ).toBe(false)
  })
  it('validates safe string', () => {
    expect(CommonSchemas.safeString.safeParse('Hello world!').success).toBe(
      true,
    )
  })
  it('validates positive number', () => {
    expect(CommonSchemas.positiveNumber.safeParse(42).success).toBe(true)
    expect(CommonSchemas.positiveNumber.safeParse(-1).success).toBe(false)
  })
  it('validates search query', () => {
    expect(CommonSchemas.searchQuery.safeParse('apple').success).toBe(true)
    expect(
      CommonSchemas.searchQuery.safeParse('SELECT * FROM users').success,
    ).toBe(false)
  })
  it('validates IP address', () => {
    expect(CommonSchemas.ipAddress.safeParse('192.168.1.1').success).toBe(true)
    expect(CommonSchemas.ipAddress.safeParse('::1').success).toBe(false) // Not full IPv6
    expect(CommonSchemas.ipAddress.safeParse('unknown').success).toBe(true)
  })
  it('validates user agent', () => {
    expect(CommonSchemas.userAgent.safeParse('Mozilla/5.0').success).toBe(true)
    expect(CommonSchemas.userAgent.safeParse('sqlmap/1.0').success).toBe(false)
  })
})

// RequestSchemas tests
describe('requestSchemas', () => {
  it('validates createProduct schema', () => {
    const valid = { name: 'Apple', quantity: 1, kcal: 52 }
    expect(RequestSchemas.createProduct.safeParse(valid).success).toBe(true)
    expect(
      RequestSchemas.createProduct.safeParse({
        name: '',
        quantity: 1,
        kcal: 52,
      }).success,
    ).toBe(false)
  })
  it('validates updateProduct schema', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Banana',
    }
    expect(RequestSchemas.updateProduct.safeParse(valid).success).toBe(true)
    expect(
      RequestSchemas.updateProduct.safeParse({ id: 'not-a-uuid' }).success,
    ).toBe(false)
  })
  it('validates barcodeQuery schema', () => {
    expect(
      RequestSchemas.barcodeQuery.safeParse({ barcode: '4006381333931' })
        .success,
    ).toBe(true)
    expect(
      RequestSchemas.barcodeQuery.safeParse({ barcode: '123' }).success,
    ).toBe(false)
  })
  it('validates searchQuery schema', () => {
    expect(RequestSchemas.searchQuery.safeParse({ q: 'apple' }).success).toBe(
      true,
    )
    expect(RequestSchemas.searchQuery.safeParse({ q: 'a' }).success).toBe(
      false,
    )
  })
  it('validates signIn schema', () => {
    expect(
      RequestSchemas.signIn.safeParse({
        email: 'user@example.com',
        password: 'Password123',
      }).success,
    ).toBe(true)
    expect(
      RequestSchemas.signIn.safeParse({
        email: 'user@example.com',
        password: 'short',
      }).success,
    ).toBe(false)
  })
  it('validates signUp schema', () => {
    expect(
      RequestSchemas.signUp.safeParse({
        email: 'user@example.com',
        password: 'Password123',
      }).success,
    ).toBe(true)
    expect(
      RequestSchemas.signUp.safeParse({
        email: 'user@example.com',
        password: 'weakpass',
      }).success,
    ).toBe(false)
  })
  it('validates passwordReset schema', () => {
    expect(
      RequestSchemas.passwordReset.safeParse({
        email: 'user@example.com',
      }).success,
    ).toBe(true)
    expect(
      RequestSchemas.passwordReset.safeParse({
        email: 'foo@mailinator.com',
      }).success,
    ).toBe(false)
  })
})

// Sanitization tests
describe('sanitization', () => {
  it('sanitizes string', () => {
    expect(sanitizeString(' <script>alert(1)</script> ')).not.toContain('<')
    expect(sanitizeString('javascript:alert(1)')).not.toContain('javascript:')
    expect(sanitizeString('onclick=doSomething()')).not.toContain('onclick=')
  })
  it('sanitizes email', () => {
    expect(sanitizeEmail(' USER@EXAMPLE.COM ')).toBe('user@example.com')
  })
  it('sanitizes search query', () => {
    expect(sanitizeSearchQuery('apple!@#')).toBe('apple')
    expect(sanitizeSearchQuery('a'.repeat(101)).length).toBe(100)
  })
})

// Security headers tests
describe('getSecurityHeaders', () => {
  it('returns correct security headers', () => {
    const headers = getSecurityHeaders()
    expect(headers.get('X-XSS-Protection')).toBe('1; mode=block')
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(headers.get('Content-Security-Policy')).toContain(
      'default-src \'self\'',
    )
  })
})

// Request size/content-type validation
describe('validateRequestSize', () => {
  it('accepts request under max size', () => {
    const req = new MockRequest({
      url: 'http://test',
      headers: { 'content-length': '100' },
    })
    expect(
      validateRequestSize(
        req as unknown as import('next/server').NextRequest,
        200,
      ),
    ).toBe(true)
  })
  it('rejects request over max size', () => {
    const req = new MockRequest({
      url: 'http://test',
      headers: { 'content-length': '300' },
    })
    expect(
      validateRequestSize(
        req as unknown as import('next/server').NextRequest,
        200,
      ),
    ).toBe(false)
  })
  it('accepts request with no content-length', () => {
    const req = new MockRequest({ url: 'http://test' })
    expect(
      validateRequestSize(req as unknown as import('next/server').NextRequest),
    ).toBe(true)
  })
})

describe('validateContentType', () => {
  it('accepts allowed content-type', () => {
    const req = new MockRequest({
      url: 'http://test',
      headers: { 'content-type': 'application/json' },
    })
    expect(
      validateContentType(req as unknown as import('next/server').NextRequest, [
        'application/json',
      ]),
    ).toBe(true)
  })
  it('rejects disallowed content-type', () => {
    const req = new MockRequest({
      url: 'http://test',
      headers: { 'content-type': 'text/html' },
    })
    expect(
      validateContentType(req as unknown as import('next/server').NextRequest, [
        'application/json',
      ]),
    ).toBe(false)
  })
  it('accepts missing content-type', () => {
    const req = new MockRequest({ url: 'http://test' })
    expect(
      validateContentType(req as unknown as import('next/server').NextRequest),
    ).toBe(true)
  })
})

// validateRequest middleware tests
describe('validateRequest', () => {
  it('validates body source with valid data', async () => {
    const req = new MockRequest({
      url: 'http://test',
      body: { name: 'Apple', quantity: 1, kcal: 52 },
    })
    const result = await validateRequest(
      req as unknown as import('next/server').NextRequest,
      RequestSchemas.createProduct,
    )
    expect(result.success).toBe(true)
    expect((result as any).data.name).toBe('Apple')
  })

  it('returns error for invalid JSON', async () => {
    const req = new MockRequest({
      url: 'http://test',
      body: undefined,
    })
    req.json = async () => {
      await Promise.resolve() // simulate async
      throw new Error('Invalid JSON')
    }
    const result = await validateRequest(
      req as unknown as import('next/server').NextRequest,
      RequestSchemas.createProduct,
    )
    expect(result.success).toBe(false)
    expect((result as any).error).toContain('Invalid JSON')
  })

  it('validates query source', async () => {
    const req = new MockRequest({
      url: 'http://test?q=apple&limit=5',
    })
    const result = await validateRequest(
      req as unknown as import('next/server').NextRequest,
      RequestSchemas.searchQuery,
      { source: 'query' },
    )
    expect(result.success).toBe(true)
    expect((result as any).data.q).toBe('apple')
    expect((result as any).data.limit).toBe(5)
  })

  it('returns error for params source', async () => {
    const req = new MockRequest({ url: 'http://test' })
    const result = await validateRequest(
      req as unknown as import('next/server').NextRequest,
      RequestSchemas.createProduct,
      { source: 'params' },
    )
    expect(result.success).toBe(false)
    expect((result as any).error).toContain(
      'Params validation not implemented',
    )
  })

  it('returns error for invalid schema', async () => {
    const req = new MockRequest({
      url: 'http://test',
      body: { name: '', quantity: -1, kcal: 0 },
    })
    const result = await validateRequest(
      req as unknown as import('next/server').NextRequest,
      RequestSchemas.createProduct,
    )
    expect(result.success).toBe(false)
    expect((result as any).error).toContain('Product name required')
  })
})
