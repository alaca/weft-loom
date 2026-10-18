// How the window looks. Loom is the app's own colours; the others are the same window in other
// colours (styles/tokens.css). Match the system is Daylight while the system is light and Loom
// while it is dark. It is how the app looks on this machine, and no part of a song.
export type ThemeName = 'loom' | 'daylight' | 'ink' | 'studio'
export type ThemeChoice = ThemeName | 'system'

export const THEMES: { id: ThemeChoice; label: string }[] = [
    { id: 'loom', label: 'Loom' },
    { id: 'daylight', label: 'Daylight' },
    { id: 'ink', label: 'Ink' },
    { id: 'studio', label: 'Studio' },
    { id: 'system', label: 'Match the system' },
]

export const readTheme = (text: string | null): ThemeChoice => (THEMES.find((theme) => theme.id === text)?.id ?? 'loom')

export const themeShown = (choice: ThemeChoice, systemIsLight: boolean): ThemeName => (choice === 'system' ? (systemIsLight ? 'daylight' : 'loom') : choice)
