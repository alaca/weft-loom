import { describe, expect, it } from 'vitest'
import { problemAddress, systemNow } from '../../src/app/problem'

describe('the problem the app reports', () => {
    it('names the system it runs on, and opens the site with what goes with the report', () => {
        expect(systemNow('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBe('macOS (Macintosh; Intel Mac OS X 10_15_7)')
        expect(systemNow('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe('Windows (Windows NT 10.0; Win64; x64)')
        const address = new URL(problemAddress('https://weftloom.dev', '0.1.14', 'Linux (X11; Linux x86_64)', ['first', 'second']))
        expect([address.pathname, address.search]).toEqual(['/report', ''])
        expect(Object.fromEntries(new URLSearchParams(address.hash.slice(1)))).toEqual({ version: '0.1.14', system: 'Linux (X11; Linux x86_64)', errors: 'first | second' })
        expect(new URLSearchParams(new URL(problemAddress('https://weftloom.dev', null, 'macOS', [])).hash.slice(1)).has('version')).toBe(false)
    })
})
