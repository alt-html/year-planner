export const plannerState = {
    uid : null,           // legacy numeric id — kept for URL params and display only
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
    identities : null,
    preferences : null,
    updated : null,
    name : '',
    share : '',
    pageLoadTime : null,
    lang : null,
    theme : null,
}
