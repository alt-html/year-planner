// storage-schema.js — localStorage key constants and day field names for M009 schema
// Import HLC for clock operations
import { HLC } from '../vendor/data-api-core.esm.js';

// ---- Top-level scalar keys ----
export const KEY_DEV = 'dev';  // stable device UUID
export const KEY_TOK = 'tok';  // JWT auth token
export const KEY_IDS = 'ids';  // identities map { [uid]: { name, provider, email } }

// ---- Namespaced key builders ----
export const keyPrefs = (userKey) => `prefs:${userKey}`;
export const keyPlnr  = (uuid) => `plnr:${uuid}`;
export const keyRev   = (uuid) => `rev:${uuid}`;
export const keyBase  = (uuid) => `base:${uuid}`;
export const keySync  = (uuid) => `sync:${uuid}`;

// ---- Day object field names (new schema) ----
export const F_TYPE  = 'tp';     // entry type (was '0')
export const F_TL    = 'tl';     // tagline    (was '1')
export const F_COL   = 'col';    // colour     (was '2')
export const F_NOTES = 'notes';  // notes      (was '3')
export const F_EMOJI = 'emoji';  // emoji      (was '4')

// ---- HLC zero clock (for new planners / pruned state) ----
export const HLC_ZERO = HLC.zero();

export { HLC };
