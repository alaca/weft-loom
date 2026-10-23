// Two changes to Strudel's packages so that a long session does not keep more and more sound in
// memory. Run after every install; each does nothing when it was done already, and stops the
// install when its package no longer looks the way it is written for.
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const at = (path) => fileURLToPath(new URL(`../node_modules/${path}`, import.meta.url))
let changed = false
const patch = (path, done, change) => {
    const file = at(path)
    const code = readFileSync(file, 'utf8')
    if (code.includes(done)) return
    const patched = change(code)
    if (!patched) throw new Error(`${path} has changed and could not be patched`)
    writeFileSync(file, patched)
    changed = true
}

// The sound engine keeps every sound file it has decoded, by its address, for as long as the app
// runs, and has no way to let one go. A sound of your own gets a new address each time it
// changes, so every older version of it stayed decoded. This gives it a forgetBuffer(url).
patch('superdough/dist/index.mjs', ' as forgetBuffer,', (code) => {
    const caches = /(\w+) = \{\}, (\w+) = \{\}, (\w+) = \(e\) => \1\[e\];/.exec(code)
    const listed = /\n {2}(\w+) as getCachedBuffer,\n/.exec(code)
    if (!caches || !listed || listed[1] !== caches[3]) return null
    const [whole, decoded, loading] = caches
    return code
        .replace(whole, `${whole.slice(0, -1)}, weftForgetBuffer = (e) => (delete ${decoded}[e], delete ${loading}[e]);`)
        .replace(listed[0], `${listed[0]}  weftForgetBuffer as forgetBuffer,\n`)
})

// An instrument from a soundfont decoded the part of it for a range of keys once for every pitch
// it was played at, and a pitch that slides or is left to chance is another one at every note.
// Pitches are now kept to whole keys, and each part is decoded once.
patch('@strudel/soundfonts/dist/index.mjs', 'weftBuffer', (code) => {
    const key = /(async function getFontPitch\((\w+), (\w+), (\w+)\) \{\n {2}const \w+ = `\$\{\2\}:::\$\{)\3(\}`;)/.exec(code)
    const decode = /(const (\w+) = await )getBuffer\((\w+), (\w+)\);/.exec(code)
    if (!key || !decode) return null
    return code
        .replace(key[0], `${key[1]}Math.round(${key[3]})${key[5]}`)
        .replace(decode[0], `${decode[1]}(${decode[3]}.weftBuffer ??= getBuffer(${decode[3]}, ${decode[4]}));`)
})

// The dev server keeps its own copy of these packages, made before they were patched.
if (changed) rmSync(at('.vite'), { recursive: true, force: true })
