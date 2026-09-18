# HappyBirthday

A responsive birthday greeting page for Bonheur with rotating photos, animated scenes, and a shared Firestore wish wall.

## Run locally

Open `index.html` through a local static server such as VS Code Live Server. ES modules and Firebase require HTTP(S), so opening the file directly with `file://` may not load the app correctly.

## Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com/.
2. Create a Firestore database.
3. Deploy the `functions` directory and `firestore.rules` with Firebase CLI.

All Firestore access runs through the backend Cloud Function. No Firebase Admin credential, service-account key, GitHub token, or database authority is shipped to the browser. Each wish gets a deterministic ID, is stored once in Firestore, and is backed up to one JSON file in GitHub. Failed GitHub backups remain pending in Firestore and are retried automatically every 15 minutes. Hosting excludes the backend source from public files, and the API validates origins, input lengths, and write frequency.

The backend requires the Firebase runtime secret `GITHUB_BACKUP_TOKEN`, with permission to write repository contents in `IBonheur/HappyBirthday`. Configure it with Firebase Secret Manager before deploying the function, for example with `firebase functions:secrets:set GITHUB_BACKUP_TOKEN`. The browser never receives this token.

## Connect GitHub to Firebase Hosting

This repository is configured for Firebase project `happybirthday-6d8ee` and Hosting site `happybirthday-6d8ee`.

1. In Firebase Console, open Project settings > Service accounts and create a private key.
2. In GitHub, open the repository Settings > Secrets and variables > Actions.
3. Add a repository secret named `FIREBASE_SERVICE_ACCOUNT_HAPPYBIRTHDAY_6D8EE` containing the complete service-account JSON.
4. Push to `main` or run the `Deploy to Firebase Hosting` workflow manually.

The workflow deploys the root page to:

- https://happybirthday-6d8ee.web.app/
- https://happybirthday-6d8ee.firebaseapp.com/

The existing GitHub Pages address can continue to work separately, but Firebase Hosting becomes the deployment target for pushes to `main`.

## Behavior

- Wishes are stored once in the Firestore `birthdayWishes` collection and loaded for every visitor.
- Every wish uses a deterministic SHA-256 ID, so repeated submits of the same name and message do not create duplicate records.
- Each Firestore wish is mirrored to one deterministic JSON file under `backups/wishes/` in GitHub.
- If the backend is temporarily unavailable, the browser keeps a silent local retry queue under `bonheur-pending-wishes`; visitors are not shown backend or storage errors.
- The photo and background scene rotate while the page is visible.
- Animations pause when the tab is hidden and resume when it becomes visible again.
- The privacy screen masks the page when the browser tab or window loses visibility.

Browser privacy limitation: a normal website cannot block operating-system screenshots, screen recording, or external cameras. Full capture prevention requires a native or managed application environment.
