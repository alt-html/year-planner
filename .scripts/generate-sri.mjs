// .scripts/generate-sri.mjs
// Usage: node .scripts/generate-sri.mjs
// Fetches pinned CDN URLs and prints integrity hashes for manual insertion into index.html.
// Requires Node 18+ (built-in fetch). No npm dependencies.

import { createHash } from 'node:crypto';

const CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/vue@3.5.30/dist/vue.global.prod.js',
    'https://cdn.jsdelivr.net/npm/vue-i18n@9.14.5/dist/vue-i18n.global.prod.js',
    'https://cdn.jsdelivr.net/npm/superagent@10.3.0/dist/superagent.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
];

for (const url of CDN_URLS) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const hash = createHash('sha384').update(Buffer.from(buffer)).digest('base64');
    console.log(`${url}\n  integrity="sha384-${hash}"\n`);
}
