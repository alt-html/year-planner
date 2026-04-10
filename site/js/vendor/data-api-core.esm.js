// hlc.js
var MS_PAD = 13;
var SEQ_PAD = 6;
function encode(state) {
  const msPart = Math.floor(state.ms).toString(16).padStart(MS_PAD, "0");
  const seqPart = Math.floor(state.seq).toString(16).padStart(SEQ_PAD, "0");
  return `${msPart}-${seqPart}-${state.node}`;
}
function decode(str) {
  const first = str.indexOf("-");
  const second = str.indexOf("-", first + 1);
  if (first === -1 || second === -1) {
    throw new Error(`HLC.decode: invalid format "${str}"`);
  }
  const ms = parseInt(str.slice(0, first), 16);
  const seq = parseInt(str.slice(first + 1, second), 16);
  const node = str.slice(second + 1);
  return { ms, seq, node };
}
function zero() {
  return `${"0".repeat(MS_PAD)}-${"0".repeat(SEQ_PAD)}-00000000`;
}
function tick(current, wallMs) {
  const c = typeof current === "string" ? decode(current) : current;
  const wall = Math.floor(wallMs);
  if (wall > c.ms) {
    return encode({ ms: wall, seq: 0, node: c.node });
  }
  return encode({ ms: c.ms, seq: c.seq + 1, node: c.node });
}
function recv(local, remote, wallMs) {
  const l = typeof local === "string" ? decode(local) : local;
  const r = typeof remote === "string" ? decode(remote) : remote;
  const wall = Math.floor(wallMs);
  const maxMs = Math.max(l.ms, r.ms, wall);
  if (maxMs === wall && wall > l.ms && wall > r.ms) {
    return encode({ ms: wall, seq: 0, node: l.node });
  }
  if (maxMs === l.ms && l.ms === r.ms) {
    return encode({ ms: maxMs, seq: Math.max(l.seq, r.seq) + 1, node: l.node });
  }
  if (maxMs === l.ms) {
    return encode({ ms: maxMs, seq: l.seq + 1, node: l.node });
  }
  return encode({ ms: maxMs, seq: r.seq + 1, node: l.node });
}
function merge(a, b) {
  return compare(a, b) >= 0 ? a : b;
}
function compare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
function create(nodeId, wallMs) {
  const ms = wallMs !== void 0 ? Math.floor(wallMs) : 0;
  return encode({ ms, seq: 0, node: nodeId });
}
var HLC = { encode, decode, zero, tick, recv, merge, compare, create };
var hlc_default = HLC;

// flatten.js
function flatten(obj, prefix = "", result = {}) {
  if (obj == null || typeof obj !== "object") {
    if (prefix !== "") result[prefix] = obj;
    return result;
  }
  const keys = Object.keys(obj);
  const isLeaf = Array.isArray(obj) || keys.length === 0;
  if (isLeaf) {
    if (prefix !== "") result[prefix] = obj;
    return result;
  }
  for (const key of keys) {
    if (key.startsWith("_")) continue;
    const encodedKey = key.replace(/\./g, "%2E");
    const path = prefix ? `${prefix}.${encodedKey}` : encodedKey;
    const val = obj[key];
    const isPlainObj = val !== null && typeof val === "object" && !Array.isArray(val);
    if (isPlainObj && Object.keys(val).length > 0) {
      flatten(val, path, result);
    } else {
      result[path] = val;
    }
  }
  return result;
}
function unflatten(flat) {
  const result = {};
  for (const dotPath of Object.keys(flat)) {
    const segments = dotPath.split(".");
    const decodedSegments = segments.map((s) => s.replace(/%2E/gi, "."));
    if (decodedSegments.some((s) => s.startsWith("_"))) continue;
    let cursor = result;
    for (let i = 0; i < decodedSegments.length - 1; i++) {
      const seg = decodedSegments[i];
      if (cursor[seg] == null || typeof cursor[seg] !== "object" || Array.isArray(cursor[seg])) {
        cursor[seg] = {};
      }
      cursor = cursor[seg];
    }
    const lastSeg = decodedSegments[decodedSegments.length - 1];
    cursor[lastSeg] = flat[dotPath];
  }
  return result;
}

// diff.js
function diff(base, current, fieldRevs, hlcNow) {
  const flatBase = flatten(base ?? {});
  const flatCurrent = flatten(current ?? {});
  const allFields = /* @__PURE__ */ new Set([
    ...Object.keys(flatBase),
    ...Object.keys(flatCurrent)
  ]);
  const changed = {};
  const unchanged = [];
  for (const field of allFields) {
    if (field.startsWith("_")) continue;
    const oldVal = flatBase[field];
    const newVal = flatCurrent[field];
    if (oldVal !== newVal) {
      changed[field] = { old: oldVal, new: newVal, rev: hlcNow };
    } else {
      unchanged.push(field);
    }
  }
  return { changed, unchanged };
}

// textMerge.js
function splitLines(text) {
  if (text == null || text === "") return { lines: [], trailingNewline: false };
  const trailingNewline = text.endsWith("\n");
  const raw = trailingNewline ? text.slice(0, -1) : text;
  return { lines: raw.split("\n"), trailingNewline };
}
function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  const table = new Array((m + 1) * (n + 1)).fill(0);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      table[i * (n + 1) + j] = a[i - 1] === b[j - 1] ? table[(i - 1) * (n + 1) + (j - 1)] + 1 : Math.max(table[(i - 1) * (n + 1) + j], table[i * (n + 1) + (j - 1)]);
    }
  }
  return table;
}
function computeHunks(base, modified) {
  const m = base.length;
  const n = modified.length;
  const table = lcsTable(base, modified);
  const ops = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && base[i - 1] === modified[j - 1]) {
      ops.push({ type: "keep", baseLine: i - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || table[i * (n + 1) + (j - 1)] >= table[(i - 1) * (n + 1) + j])) {
      ops.push({ type: "insert", modLine: modified[j - 1] });
      j--;
    } else {
      ops.push({ type: "delete", baseLine: i - 1 });
      i--;
    }
  }
  ops.reverse();
  const hunks = [];
  let opIdx = 0;
  while (opIdx < ops.length) {
    const op = ops[opIdx];
    if (op.type === "keep") {
      opIdx++;
      continue;
    }
    let baseStart = null;
    let baseEnd = null;
    const hunkLines = [];
    while (opIdx < ops.length && ops[opIdx].type !== "keep") {
      const cur = ops[opIdx];
      if (cur.type === "delete") {
        if (baseStart === null) baseStart = cur.baseLine;
        baseEnd = cur.baseLine + 1;
      } else {
        hunkLines.push(cur.modLine);
      }
      opIdx++;
    }
    if (baseStart === null) {
      let insertPoint = 0;
      for (let k = opIdx - 1; k >= 0; k--) {
        if (ops[k] && ops[k].type === "keep") {
          insertPoint = ops[k].baseLine + 1;
          break;
        }
      }
      baseStart = insertPoint;
      baseEnd = insertPoint;
    }
    hunks.push({ baseStart, baseEnd, lines: hunkLines });
  }
  return hunks;
}
function haveOverlap(hunksA, hunksB) {
  for (const a of hunksA) {
    for (const b of hunksB) {
      const aStart = a.baseStart;
      const aEnd = a.baseEnd;
      const bStart = b.baseStart;
      const bEnd = b.baseEnd;
      if (aStart === aEnd && bStart === bEnd) {
        if (aStart === bStart) return true;
        continue;
      }
      if (aStart < bEnd && bStart < aEnd) return true;
      if (aStart === aEnd && aStart > bStart && aStart < bEnd) return true;
      if (bStart === bEnd && bStart > aStart && bStart < aEnd) return true;
    }
  }
  return false;
}
function applyHunks(baseLines, hunks) {
  const result = baseLines.slice();
  const sorted = hunks.slice().sort((a, b) => b.baseStart - a.baseStart);
  for (const hunk of sorted) {
    result.splice(hunk.baseStart, hunk.baseEnd - hunk.baseStart, ...hunk.lines);
  }
  return result;
}
function mergeHunks(baseLines, localHunks, remoteHunks) {
  const all = [...localHunks];
  for (const rh of remoteHunks) {
    const duplicate = localHunks.some(
      (lh) => lh.baseStart === rh.baseStart && lh.baseEnd === rh.baseEnd && lh.lines.join("\n") === rh.lines.join("\n")
    );
    if (!duplicate) all.push(rh);
  }
  return applyHunks(baseLines, all);
}
function textMerge(base, local, remote) {
  const { lines: baseLines } = splitLines(base);
  const { lines: localLines } = splitLines(local);
  const { lines: remoteLines, trailingNewline: remoteTrail } = splitLines(remote);
  const { trailingNewline: localTrail } = splitLines(local);
  const { trailingNewline: baseTrail } = splitLines(base);
  if (local === base || local == null && base == null) {
    return { merged: remote ?? "", autoMerged: true };
  }
  if (remote === base || remote == null && base == null) {
    return { merged: local ?? "", autoMerged: true };
  }
  if (local === remote) {
    return { merged: local, autoMerged: true };
  }
  const localHunks = computeHunks(baseLines, localLines);
  const remoteHunks = computeHunks(baseLines, remoteLines);
  if (haveOverlap(localHunks, remoteHunks)) {
    return { merged: null, autoMerged: false };
  }
  const mergedLines = mergeHunks(baseLines, localHunks, remoteHunks);
  const trailingNewline = localTrail || remoteTrail || baseTrail;
  const merged = mergedLines.join("\n") + (trailingNewline ? "\n" : "");
  return { merged, autoMerged: true };
}

// merge.js
function merge2(base, local, remote) {
  const flatBase = flatten(base ?? {});
  const flatLocalDoc = flatten(local.doc ?? {});
  const flatRemoteDoc = flatten(remote.doc ?? {});
  const localRevs = local.fieldRevs ?? {};
  const remoteRevs = remote.fieldRevs ?? {};
  const allFields = /* @__PURE__ */ new Set([
    ...Object.keys(flatLocalDoc),
    ...Object.keys(flatRemoteDoc),
    ...Object.keys(flatBase)
  ]);
  const flatMerged = {};
  const conflicts = [];
  for (const field of allFields) {
    if (field.startsWith("_")) continue;
    const baseVal = flatBase[field];
    const localVal = flatLocalDoc[field];
    const remoteVal = flatRemoteDoc[field];
    const localChanged = localVal !== baseVal;
    const remoteChanged = remoteVal !== baseVal;
    if (!localChanged && !remoteChanged) {
      flatMerged[field] = baseVal;
      continue;
    }
    if (localChanged && !remoteChanged) {
      flatMerged[field] = localVal;
      continue;
    }
    if (!localChanged && remoteChanged) {
      flatMerged[field] = remoteVal;
      continue;
    }
    const localRev = localRevs[field] ?? hlc_default.zero();
    const remoteRev = remoteRevs[field] ?? hlc_default.zero();
    if (typeof localVal === "string" && typeof remoteVal === "string") {
      const baseStr = typeof baseVal === "string" ? baseVal : "";
      const { merged: autoMergedText, autoMerged } = textMerge(baseStr, localVal, remoteVal);
      if (autoMerged) {
        flatMerged[field] = autoMergedText;
        conflicts.push({
          field,
          localRev,
          remoteRev,
          localValue: localVal,
          remoteValue: remoteVal,
          winner: "auto-merged",
          winnerValue: autoMergedText,
          mergeStrategy: "text-auto-merged"
        });
        continue;
      }
    }
    const winner = hlc_default.compare(localRev, remoteRev) >= 0 ? "local" : "remote";
    const winnerValue = winner === "local" ? localVal : remoteVal;
    flatMerged[field] = winnerValue;
    conflicts.push({
      field,
      localRev,
      remoteRev,
      localValue: localVal,
      remoteValue: remoteVal,
      winner,
      winnerValue
    });
  }
  return { merged: unflatten(flatMerged), conflicts };
}
export {
  hlc_default as HLC,
  diff,
  flatten,
  merge2 as merge,
  textMerge,
  unflatten
};
