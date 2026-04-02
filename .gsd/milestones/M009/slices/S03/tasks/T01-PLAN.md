---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Migration logic in StorageLocal

Add migrate() method to StorageLocal.js. Detects old-schema key '0', converts all uid-yearM month blobs to new plnr:uuid docs, writes prefs:uid, writes dev UUID, removes old keys. Idempotent.

## Inputs

- `js/service/StorageLocal.js`
- `js/service/storage-schema.js`

## Expected Output

- `migrate() method in StorageLocal.js`

## Verification

cd .tests && npx playwright test
