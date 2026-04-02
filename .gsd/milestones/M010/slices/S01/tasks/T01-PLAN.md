---
estimated_steps: 12
estimated_files: 1
skills_used: []
---

# T01: Create site/ and move all web assets

1. mkdir site/
2. git mv index.html site/index.html
3. git mv css site/css
4. git mv js site/js
5. git mv manifest.json site/manifest.json
6. git mv android-chrome-192x192.png site/
7. git mv android-chrome-512x512.png site/
8. git mv apple-touch-icon.png site/
9. git mv favicon-16x16.png site/
10. git mv favicon-32x32.png site/
11. git mv favicon.ico site/
12. Confirm site/ tree looks correct

## Inputs

- `index.html`
- `css/`
- `js/`
- `manifest.json`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `apple-touch-icon.png`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon.ico`

## Expected Output

- `site/index.html`
- `site/css/`
- `site/js/`
- `site/manifest.json`
- `site/favicon.ico`
- `site/favicon-16x16.png`
- `site/favicon-32x32.png`
- `site/android-chrome-192x192.png`
- `site/android-chrome-512x512.png`
- `site/apple-touch-icon.png`

## Verification

find site/ -maxdepth 2 | sort
