# HappyBirthday

A static GitHub Pages frontend backed by Firebase Cloud Functions and Firestore. Wishes are archived to GitHub by the backend without exposing credentials to visitors.

## Runtime architecture

- Frontend: `index.html`, `style.css`, `script.js`, `frontend/`, and `image/`, deployed by `.github/workflows/github-pages.yml`.
- API/data access: Firebase Web SDK with anonymous Auth and Firestore rules.
- Database: Firestore collection `birthdayWishes`, protected by `database/firestore.rules`.
- Archive: GitHub archival through the optional paid-tier Cloud Functions adapter.
- Resilience: browser local storage caches wishes and queues failed submissions.

## Secure setup

1. Configure GitHub Pages to use **GitHub Actions**.
2. Create the Firebase project and Firestore database for `happybirthday-6d8ee`.
3. Set the backend-only secret:

	```powershell
	firebase functions:secrets:set GITHUB_BACKUP_TOKEN --project happybirthday-6d8ee
	```

4. Enable **Anonymous** sign-in in Firebase Authentication.
5. Deploy Firestore rules:

	```powershell
	firebase deploy --project happybirthday-6d8ee --only firestore:rules
	```

Every push to `main` deploys the frontend and Firestore rules through separate workflows. The browser contains no Firebase Admin SDK, service-account data, GitHub token, or private API key. Firebase Web configuration values, including the API key, are public client identifiers; Firestore rules and anonymous authentication are the security boundary.

## Why no Formspree or Static Forms service

The free plan cannot deploy Cloud Functions. The browser therefore writes directly to Firestore through the Firebase Web SDK under restrictive rules. Formspree/Static Forms are not added because they introduce another data processor without improving this first-party Firebase path. GitHub archival remains an optional paid-tier upgrade through Cloud Functions.