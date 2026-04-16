export const plannerState = {
    uid : null,           // legacy numeric id — set by Application.init() from ?uid= param; deprecated, will be removed in T02
    userKey : null,       // JWT uuid (signed-in) or device UUID (anonymous) — planner ownership key
    activeDocUuid : null, // UUID of the active planner document
    month : 0,
    day : 1,
    entry: '',
    entryType : 0,
    entryColour : 0,
    entryNotes : '',
    entryEmoji : '',
    shareUrl: window.location.origin,
    days : {},            // ISO-date keyed: { 'YYYY-MM-DD': { tp, tl, col, notes, emoji } }
    _pendingImport : null,  // set by Storage.setModelFromImportString() before mount; consumed and cleared by refresh()
    identities : null,
    preferences : null,
    updated : null,
    name : '',
    share : '',
    pageLoadTime : null,
    lang : null,
    theme : null,
}
