import { expect, test } from '@playwright/test'

const shown = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.dataset.theme)
const ground = (page: import('@playwright/test').Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test('a theme is chosen at the foot of the window, kept for next time, and can follow the system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForFunction(() => Boolean((window as any).__weft))
    const picker = page.getByTestId('status').getByRole('combobox', { name: 'Theme' })
    await expect(picker).toHaveValue('loom')
    expect(await shown(page)).toBe('loom')
    const loom = await ground(page)

    await picker.selectOption('daylight')
    expect(await shown(page)).toBe('daylight')
    expect(await ground(page)).not.toBe(loom)
    await page.reload()
    await page.waitForFunction(() => Boolean((window as any).__weft))
    expect(await shown(page)).toBe('daylight')
    await expect(picker).toHaveValue('daylight')

    await picker.selectOption('system')
    expect(await shown(page)).toBe('loom')
    await page.emulateMedia({ colorScheme: 'light' })
    await expect.poll(() => shown(page)).toBe('daylight')
    await picker.selectOption('ink')
    await page.emulateMedia({ colorScheme: 'dark' })
    expect(await shown(page)).toBe('ink')
})
