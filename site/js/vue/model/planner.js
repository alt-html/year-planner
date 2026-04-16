export const plannerState = {
    uid : null,           // deprecated — set to constant 0 by Application.init(); no longer read from URL or storage
    userKey : null,       // JWT uuid (signed-in) or device UUID (anonymous) — planner ownership key
    activeDocUuid : null, // UUID of the active planner document
    month : 0,
    day : 1,
    entry: '',
    entryType : 0,
    entryColour : 0,
    entryNotes : '',
    entryEmoji : '',
    days : {},            // ISO-date keyed: { 'YYYY-MM-DD': { tp, tl, col, notes, emoji } }
    identities : null,
    preferences : null,
    updated : null,
    name : '',
    pageLoadTime : null,
    lang : null,
    theme : null,
    langMode : null,   // 'system' | 'explicit' — follows navigator language vs user override
    themeMode : null,  // 'system' | 'explicit' — follows OS color scheme vs user override
}
