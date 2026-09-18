# HappyBirthday

A responsive birthday greeting page for Bonheur with rotating photos, animated scenes, and a shared Firestore wish wall.

## Run locally

Open `index.html` through a local static server such as VS Code Live Server. ES modules and Firebase require HTTP(S), so opening the file directly with `file://` may not load the app correctly.

## Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com/.
2. Create a Firestore database.
3. Register a Web app and copy its configuration into `firebase-config.js`.
4. Deploy `firestore.rules` in the Firebase Console under Firestore Database > Rules.

The Firebase web configuration is not a private server secret. Firestore Security Rules are the protection that limits what visitors can write.

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

- Wishes are stored in the Firestore `birthdayWishes` collection and loaded for every visitor.
- If Firebase is not configured or temporarily unavailable, wishes fall back to this browser's `localStorage` under `bonheur-birthday-wishes`.
- The photo and background scene rotate while the page is visible.
- Animations pause when the tab is hidden and resume when it becomes visible again.
- The privacy screen masks the page when the browser tab or window loses visibility.

Browser privacy limitation: a normal website cannot block operating-system screenshots, screen recording, or external cameras. Full capture prevention requires a native or managed application environment.
