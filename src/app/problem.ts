import { openInBrowser } from '../desktop/browser'
import { versionNow } from '../desktop/update'
import { SITE } from '../site/api'

// A problem is reported on the site, in a form that says what is sent with it: the version of the
// app, the system it runs on, and the last few things that went wrong in it. Nothing of that leaves
// the machine until the form is sent, and nothing is noted but the message of each.
const MOST = 3
const wrong: string[] = []

function note(message: unknown) {
    const text = String(message ?? '').replace(/\s+/g, ' ').trim().slice(0, 300)
    if (!text || wrong.includes(text)) return
    wrong.push(text)
    if (wrong.length > MOST) wrong.shift()
}

let watching = false
export function noteWhatGoesWrong() {
    if (watching) return
    watching = true
    window.addEventListener('error', (event) => note(event.message))
    window.addEventListener('unhandledrejection', (event) => note(event.reason instanceof Error ? event.reason.message : event.reason))
}

export function systemNow(agent = navigator.userAgent): string {
    const name = /Mac OS X/.test(agent) ? 'macOS' : /Windows/.test(agent) ? 'Windows' : /Linux/.test(agent) ? 'Linux' : 'another system'
    const inside = /\(([^)]*)\)/.exec(agent)?.[1] ?? ''
    return inside ? `${name} (${inside})` : name
}

export function problemAddress(version: string | null, system: string, errors: string[]): string {
    const asked = new URLSearchParams()
    if (version) asked.set('version', version)
    asked.set('system', system)
    if (errors.length) asked.set('errors', errors.join(' | '))
    return `${SITE}/report?${asked}`
}

export async function reportProblem() {
    const version = await versionNow().catch(() => null)
    await openInBrowser(problemAddress(version, systemNow(), wrong))
}
