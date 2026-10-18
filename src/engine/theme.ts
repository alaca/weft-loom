import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { settings, themes } from '@strudel/codemirror'
import { setTheme } from '@strudel/draw'

const LINEN = 'var(--linen)'
const LINEN_2 = 'var(--linen-2)'
const LINEN_3 = 'var(--linen-3)'
const mix = (token: string, share: number) => `color-mix(in srgb, var(${token}) ${share}%, transparent)`

// The editor's colours are the theme's, by name, so that they follow it when it changes.
const colors = {
    background: 'var(--cloth)',
    lineBackground: mix('--cloth', 60),
    foreground: LINEN_2,
    caret: LINEN,
    selection: mix('--linen', 18),
    selectionMatch: mix('--linen', 10),
    lineHighlight: mix('--deep', 19),
    gutterBackground: 'var(--cloth)',
    gutterForeground: mix('--linen-3', 60),
}

// Strudel's drawings, a piano roll or a spiral in the code, are painted on a canvas, which takes
// colours as values and not by name. They are given the theme's as they stand now, and again
// whenever the theme changes.
export function drawInTheme(): void {
    const page = getComputedStyle(document.documentElement)
    const value = (token: string) => page.getPropertyValue(token).trim()
    const withAlpha = (token: string, alpha: string) => (/^#[0-9a-f]{6}$/i.test(value(token)) ? `${value(token)}${alpha}` : value(token))
    setTheme({
        ...colors,
        background: value('--cloth'),
        lineBackground: withAlpha('--cloth', '99'),
        foreground: value('--linen-2'),
        caret: value('--linen'),
        selection: withAlpha('--linen', '2e'),
        selectionMatch: withAlpha('--linen', '1a'),
        lineHighlight: withAlpha('--deep', '30'),
        gutterBackground: value('--cloth'),
        gutterForeground: withAlpha('--linen-3', '99'),
    })
}

export function registerTheme(): void {
    if (themes.weft) return
    settings.weft = colors
    themes.weft = [
        EditorView.theme(
            {
                '&': { color: colors.foreground, backgroundColor: 'transparent' },
                '.cm-gutters': { backgroundColor: colors.gutterBackground, color: colors.gutterForeground },
                '.cm-content': { caretColor: colors.caret },
                '.cm-cursor, .cm-dropCursor': { borderLeftColor: colors.caret },
                '&.cm-focused .cm-selectionBackground, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection': {
                    background: `${colors.selection} !important`,
                },
                // What the editor offers while typing, and what it says about each offer.
                '.cm-tooltip': { background: 'var(--cloth-2)', border: '1px solid var(--edge)', borderRadius: '9px', boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)', color: 'var(--linen-2)' },
                '.cm-tooltip.cm-tooltip-autocomplete > ul': { maxHeight: '233px', minWidth: '190px', maxWidth: '280px', padding: '4px', borderRadius: '9px', font: '500 12px/1 var(--mono)', fontStretch: '87%' },
                '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { display: 'flex', alignItems: 'center', gap: '8px', height: '25px', padding: '0 9px', borderRadius: '6px', color: 'var(--linen-2)' },
                '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': { background: 'var(--cloth-3)', color: 'var(--linen)' },
                '.cm-completionIcon': { display: 'none' },
                '.cm-completionLabel': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
                '.cm-completionMatchedText': { textDecoration: 'none', color: 'var(--linen)', fontWeight: '700' },
                '.cm-completionDetail': { marginLeft: 'auto', fontStyle: 'normal', color: 'var(--linen-3)' },
                '.cm-tooltip.cm-completionInfo': { width: '300px', maxWidth: '300px', maxHeight: '300px', padding: '0', overflowY: 'auto', whiteSpace: 'normal', font: '400 12px/1.5 var(--ui)' },
                '.cm-completionInfo.cm-completionInfo-right': { marginLeft: '6px' },
                '.cm-completionInfo.cm-completionInfo-left': { marginRight: '6px' },
            },
            { dark: true },
        ),
        syntaxHighlighting(
            HighlightStyle.define([
                { tag: t.labelName, color: `var(--h, ${LINEN})`, fontWeight: '600' },
                { tag: t.comment, color: LINEN_3, fontStyle: 'italic', fontFamily: "'Piazzolla Variable', Georgia, serif", fontSize: '14.5px' },
                { tag: [t.string, t.special(t.string)], color: LINEN },
                { tag: [t.number, t.bool, t.atom], color: LINEN },
                { tag: [t.propertyName, t.variableName, t.definition(t.variableName)], color: LINEN },
                { tag: [t.keyword, t.operator], color: LINEN_2 },
                { tag: [t.bracket, t.punctuation], color: LINEN_3 },
            ]),
        ),
    ]
}
