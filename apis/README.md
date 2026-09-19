# API and data access layer

The free-tier application uses the Firebase Web SDK directly:

- anonymous Firebase Auth establishes a user session
- Firestore reads the latest `birthdayWishes`
- Firestore creates validated wishes under `database/firestore.rules`
- updates and deletes are denied

The GitHub Pages frontend does not call a paid Cloud Function. The existing `functions/` adapter is optional for a future Blaze-plan deployment when server-side GitHub archival is required.
