import { expect, test, type Page } from '@playwright/test'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const SONG = 'setcpm(120/4)\n\ndrums: stack(\n  s("bd").struct("x ~ ~ ~   x ~ ~ ~   x ~ ~ ~   x ~ ~ ~"),\n)\n  .bank("RolandTR909")\n  .mask("<1!4>")\n'

const code = (page: Page) => page.evaluate(() => (window as any).__weft.engine.getCode() as string)
const browser = (page: Page) => page.getByTestId('sound-browser')

function tone(hertz: number, seconds: number): Buffer {
    const rate = 22050
    const frames = Math.round(rate * seconds)
    const file = Buffer.alloc(44 + frames * 2)
    file.write('RIFF', 0, 'latin1')
    file.writeUInt32LE(36 + frames * 2, 4)
    file.write('WAVEfmt ', 8, 'latin1')
    file.writeUInt32LE(16, 16)
    file.writeUInt16LE(1, 20)
    file.writeUInt16LE(1, 22)
    file.writeUInt32LE(rate, 24)
    file.writeUInt32LE(rate * 2, 28)
    file.writeUInt16LE(2, 32)
    file.writeUInt16LE(16, 34)
    file.write('data', 36, 'latin1')
    file.writeUInt32LE(frames * 2, 40)
    for (let at = 0; at < frames; at++) file.writeInt16LE(Math.round(Math.sin((at / rate) * 2 * Math.PI * hertz) * 20000), 44 + at * 2)
    return file
}

test('a pack is made from sounds of your own, added to the app, used in a song, and its sounds go along with the song', async ({ page }) => {
    await page.addInitScript((value) => {
        if (!sessionStorage.getItem('seeded')) {
            localStorage.setItem('weft.song', value)
            localStorage.setItem('weft.snippets', JSON.stringify([{ name: 'dusty', code: 'dust: s("low_hit*4")' }]))
            sessionStorage.setItem('seeded', '1')
        }
    }, SONG)
    await page.goto('/')
    await page.waitForFunction(() => Boolean((window as any).__weft))
    await expect(page.getByTestId('sounds')).toHaveText('Sounds ready', { timeout: 30000 })

    // Two sounds of your own and a snippet that uses one go into a pack, which is saved as one file.
    await page.getByRole('button', { name: 'Sounds', exact: true }).click()
    await browser(page).getByRole('radio', { name: /^Yours/ }).click()
    await page.getByTestId('own-files').setInputFiles([
        { name: 'Low hit.wav', mimeType: 'audio/wav', buffer: tone(110, 0.4) },
        { name: 'Long loop.wav', mimeType: 'audio/wav', buffer: tone(220, 5) },
    ])
    await expect(browser(page).locator('.sb-i')).toHaveCount(2)
    await browser(page).getByRole('button', { name: 'Make a pack', exact: true }).click()
    const making = page.getByTestId('pack-make')
    await making.getByLabel('Name of the pack').fill('Dust loops')
    await making.getByLabel('Who made it').fill('Ante')
    const [download] = await Promise.all([page.waitForEvent('download'), making.getByRole('button', { name: 'Save the pack', exact: true }).click()])
    expect(download.suggestedFilename()).toBe('Dust loops.weftpack')
    await expect(page.getByTestId('pack-made')).toHaveText('Saved the pack Dust loops: 2 sounds and 1 snippet.')
    const file = await readFile(await download.path())
    const made = JSON.parse(file.toString('utf8'))
    expect([made.weftpack, made.id, made.by, made.sounds.map((sound: { name: string }) => sound.name)]).toEqual([1, 'dustloops', 'Ante', ['dustloops_long_loop', 'dustloops_low_hit']])
    expect(made.snippets).toEqual([{ name: 'dusty', code: 'dust: s("dustloops_low_hit*4")' }])
    await making.getByRole('button', { name: 'Close', exact: true }).click()
    await page.getByRole('button', { name: 'Snippets', exact: true }).click()
    await page.getByTestId('snippets').getByRole('button', { name: 'Remove the snippet dusty', exact: true }).click()
    await page.keyboard.press('Escape')

    // Added, the pack is listed with what it holds, and its sounds are beside your own.
    await browser(page).getByRole('radio', { name: /^Packs/ }).click()
    await browser(page).getByRole('button', { name: /^Added/ }).click()
    await expect(browser(page)).toContainText('No packs yet')
    await page.getByTestId('pack-file').setInputFiles({ name: 'Dust loops.weftpack', mimeType: 'application/json', buffer: file })
    await expect(page.getByTestId('pack-note')).toHaveText('Added Dust loops: 2 sounds and 1 snippet.')
    await page.getByRole('button', { name: 'Snippets', exact: true }).click()
    await expect(page.getByTestId('snippets').getByRole('button', { name: 'Put in dusty', exact: true })).toContainText('Dust loops: dust: s("dustloops_low_hit*4")')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('pack-dustloops')).toContainText('Dust loops')
    await expect(page.getByTestId('pack-dustloops')).toContainText('by Ante')
    await expect(browser(page).locator('.sb-i')).toHaveCount(2)

    // One of them becomes a row of the drum grid, the other a recording along the song.
    await page.getByTestId('strip-drums').locator('.st-n').click()
    await browser(page).getByRole('button', { name: 'Use Low hit for drums', exact: true }).click()
    await expect.poll(() => code(page)).toContain('s("dustloops_low_hit")')
    await browser(page).getByRole('button', { name: 'Put Long loop in the song', exact: true }).click()
    await expect.poll(() => code(page)).toContain('audio: s("dustloops_long_loop").slice(2.5, "<0 1 2 ~>")')

    // The song file carries the sounds of the pack that the song uses, as it carries your own.
    await page.getByTestId('top').getByRole('button', { name: 'Export', exact: true }).click()
    const [saved] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').getByRole('button', { name: 'Song file (.weft)', exact: true }).click()])
    const song = JSON.parse(await readFile(await saved.path(), 'utf8'))
    expect(song.sounds.map((sound: { name: string }) => sound.name)).toEqual(['dustloops_long_loop', 'dustloops_low_hit'])
    await page.getByRole('button', { name: 'Close export', exact: true }).click()

    // So whoever opens that song without the pack still hears it: the sounds come among theirs.
    await browser(page).getByRole('button', { name: 'Remove the pack Dust loops', exact: true }).click()
    await expect(page.getByTestId('pack-note')).toHaveText('Removed Dust loops.')
    await expect(page.getByTestId('pack-dustloops')).toHaveCount(0)
    await page.getByTestId('song-file').setInputFiles({ name: 'Dusty.weft', mimeType: 'application/octet-stream', buffer: Buffer.from(JSON.stringify(song)) })
    await expect(page.getByTestId('song-note')).toContainText('with 2 sounds of its own, now among yours.')
    await browser(page).getByRole('radio', { name: /^Yours/ }).click()
    await expect(browser(page).locator('.sb-i')).toHaveCount(4)

    // Adding the pack afterwards takes those two back as its own.
    await browser(page).getByRole('radio', { name: /^Packs/ }).click()
    await page.getByTestId('pack-file').setInputFiles({ name: 'Dust loops.weftpack', mimeType: 'application/json', buffer: file })
    await expect(page.getByTestId('pack-note')).toHaveText('Added Dust loops: 2 sounds and 1 snippet.')
    await expect(browser(page).locator('.sb-i')).toHaveCount(2)
    await browser(page).getByRole('radio', { name: /^Yours/ }).click()
    await expect(browser(page).locator('.sb-i')).toHaveCount(2)
})

test('a free pack of the site is added from inside the app', async ({ page }) => {
    // The dev site hands out the packs it finds in its folder. One is put there for this test.
    const folder = resolve('server/.data/packs')
    const id = `free${Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'x')}`
    const name = `Test ${id}`
    const list = join(folder, 'packs.json')
    await mkdir(folder, { recursive: true })
    const before = await readFile(list, 'utf8').then((text) => JSON.parse(text).packs as unknown[]).catch(() => [])
    const sound = { name: `${id}_hit`, file: 'hit.wav', type: 'audio/wav', seconds: 0.4, data: tone(110, 0.4).toString('base64') }
    await writeFile(join(folder, `${id}.weftpack`), JSON.stringify({ weftpack: 1, id, name, by: 'Weft Loom', about: 'One hit.', sounds: [sound], presets: [], snippets: [] }))
    await writeFile(join(folder, `${id}.mp3`), tone(110, 0.4))
    await writeFile(list, JSON.stringify({ packs: [...before, { id, name, about: 'One hit.', tempo: 120, sounds: 1, presets: 0, snippets: 0, seconds: 0.4, peaks: [1] }] }))
    try {
        await page.goto('/')
        await page.waitForFunction(() => Boolean((window as any).__weft))
        await expect(page.getByTestId('sounds')).toHaveText('Sounds ready', { timeout: 30000 })
        await page.getByRole('button', { name: 'Sounds', exact: true }).click()

        // With no packs added yet, the Packs tab opens on the free ones.
        await browser(page).getByRole('radio', { name: /^Packs/ }).click()
        const row = page.getByTestId(`free-${id}`)
        await expect(row).toContainText(name)
        await expect(row).toContainText('120 bpm, 1 sound')
        await row.getByRole('button', { name: `Add ${name}`, exact: true }).click()
        await expect(page.getByTestId('pack-note')).toHaveText(`Added ${name}: 1 sound.`)
        await expect(row).toContainText('Added')

        // It is on this machine now, with its sound beside the others.
        await browser(page).getByRole('button', { name: /^Added/ }).click()
        await expect(page.getByTestId(`pack-${id}`)).toContainText(name)
        await expect(browser(page).locator('.sb-i', { hasText: 'Hit' })).toHaveCount(1)
    } finally {
        await writeFile(list, JSON.stringify({ packs: before }))
        await rm(join(folder, `${id}.weftpack`), { force: true })
        await rm(join(folder, `${id}.mp3`), { force: true })
    }
})
