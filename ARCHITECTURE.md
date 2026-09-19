# HappyBirthday system architecture

## Decision

HappyBirthday uses a serverless Web2 architecture. Firebase is the system of record and GitHub is an asynchronous archival sink. The browser never receives credentials and never accesses Firestore directly.

```mermaid
flowchart LR
  Browser[Browser UI] --> Hosting[Firebase Hosting]
  Browser --> API[/api/wishes]
  API --> Functions[Cloud Functions]
  Functions --> Firestore[(Firestore)]
  Functions --> GitHub[GitHub archive]
  Functions --> Logs[Cloud Logging]
```

## Repository layout

```text
HappyBirthday/
├── index.html                 # Hosted application shell
├── style.css                  # Hosted presentation layer
├── script.js                  # Legacy entrypoint retained for compatibility
├── frontend/                  # Browser services and reusable client modules
│   ├── api.js
│   ├── config.js
│   ├── storage.js
│   └── README.md
├── image/                     # Public birthday media
├── functions/
│   ├── index.js               # Cloud Functions entrypoint
│   ├── package.json
│   └── src/
│       ├── api.js             # HTTP contract and request handling
│       ├── backup.js          # GitHub archival adapter
│       ├── config.js          # Backend constants and trusted origins
│       ├── rate-limit.js      # In-memory abuse guard
│       ├── repository.js      # Firestore persistence
│       ├── validation.js      # Server-side input validation
│       └── validation.test.js  # Contract tests for input and IDs
├── firestore.rules            # Deny-by-default browser database policy
├── firebase.json              # Hosting, rewrites, headers, functions
├── ARCHITECTURE.md            # This document
└── .github/workflows/         # CI/CD deployment
```

## Data flow

1. The browser validates basic required fields and sends JSON to `POST /api/wishes`.
2. Cloud Functions validates length and content again, checks the trusted origin, and applies a per-client write limit.
3. Firestore stores the canonical wish using a deterministic SHA-256 document ID, making retries idempotent.
4. GitHub receives a JSON archive asynchronously. Failed archives remain `pending` and are retried by the scheduled function.
5. `GET /api/wishes` returns only the latest public wishes. Firestore remains inaccessible from the browser.
6. Local storage preserves the last successful read and pending writes during temporary network failure.

## Security boundaries

- Secrets belong only in Firebase Secret Manager (`GITHUB_BACKUP_TOKEN`).
- Firestore rules deny all direct client reads and writes.
- Cloud Functions performs all validation and authorization checks.
- Hosting sends a restrictive Content Security Policy and anti-sniffing headers.
- GitHub backups contain only the public name and message, never request metadata or secrets.
- Browser privacy masking is a visual feature; it cannot prevent operating-system screenshots.

## Operational requirements

```powershell
firebase functions:secrets:set GITHUB_BACKUP_TOKEN --project happybirthday-6d8ee
npm --prefix functions install
firebase deploy --project happybirthday-6d8ee
```

The GitHub token needs repository contents write access for `IBonheur/HappyBirthday`. Deployment requires the Firebase service-account secret used by the GitHub Actions workflow. Monitor Cloud Functions logs for failed backup retries and Firestore write errors.

## Evolution path

Keep this as a serverless modular monolith until independent scaling or ownership is required. If moderation, notifications, analytics, or multiple products are added, extract those capabilities behind separate functions or services while retaining the same API contract and Firestore repository boundary.
