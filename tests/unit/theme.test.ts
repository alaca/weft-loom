import { describe, expect, it } from 'vitest'
import { readTheme, themeShown } from '../../src/library/theme'

describe('themes', () => {
    it('keeps a theme that is one and gives Loom for anything else', () => {
        expect([readTheme('ink'), readTheme('system'), readTheme(null), readTheme('purple')]).toEqual(['ink', 'system', 'loom', 'loom'])
    })

    it('matches the system with Daylight when it is light and Loom when it is dark', () => {
        expect([themeShown('system', true), themeShown('system', false), themeShown('studio', true)]).toEqual(['daylight', 'loom', 'studio'])
    })
})
