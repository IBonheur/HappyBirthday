Hello and welcome!

It’s a new year, and I wanted to make it special by hearing from friends and family around the world. So I created this simple website to collect your wishes — and to wish myself a glorious, beautiful birthday every year.

## Wish storage

Submitted wishes are validated against the approved author list and stored as individual documents in the `birthdayWishes` Firestore collection. A Firestore trigger exports each new document to a CSV file in GitHub using the `GITHUB_TOKEN` Firebase secret; the browser never receives that token.

Before deploying the export function, set `GITHUB_REPOSITORY=IBonheur/HappyBirthday` in the Functions environment (or replace it with your repository), optionally set `GITHUB_WISHES_PATH`, and configure both the Firebase and GitHub Actions secrets:

```sh
firebase functions:secrets:set GITHUB_TOKEN
firebase deploy --only functions,firestore
```

The GitHub token should have only the minimum repository contents permission needed to update the export file. The CI workflows also require a repository secret named `FIREBASE_SERVICE_ACCOUNT`. Firestore remains the source of truth if GitHub is unavailable.
