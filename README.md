
# HappyBirthday

Responsive birthday page for Bonheur with rotating photos, animated scenes, and a protected shared wish wall.

## Architecture

- The browser sends wishes only to `/api/wishes`.
- Firebase Cloud Functions validate and store wishes in Firestore.
- Each wish uses a deterministic SHA-256 document ID, preventing duplicate records for the same normalized name and message.
- The backend mirrors each wish to `backups/wishes/<id>.json` in the GitHub repository.
- Failed GitHub backups remain pending in Firestore and are retried every 15 minutes.
- Firestore rules deny direct browser access; only the Admin SDK in Cloud Functions can read or write data.
- GitHub and Firebase credentials are backend secrets and never appear in frontend files.

## Deployment

1. Create or select Firebase project `happybirthday-6d8ee`.
2. Set the backend secret with `firebase functions:secrets:set GITHUB_BACKUP_TOKEN`. The token needs repository contents write permission for `IBonheur/HappyBirthday`.
3. Add the Firebase service-account JSON as the GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_HAPPYBIRTHDAY_6D8EE`.
4. Push to `main` or run the `Deploy to Firebase Hosting` workflow.

The deployment includes Hosting, Cloud Functions, and Firestore rules. The public sites are https://happybirthday-6d8ee.web.app/ and https://happybirthday-6d8ee.firebaseapp.com/.

## Local development

Serve the root directory through HTTP, for example with VS Code Live Server. Opening the page with `file://` does not provide the same Hosting rewrite behavior as Firebase.

## Privacy limitation

The page masks itself when the browser reports blur, hidden visibility, page exit, or print preview. A normal website cannot block operating-system screenshots, screen recording, GPU capture, or external cameras. Full capture prevention requires a native or managed application.
