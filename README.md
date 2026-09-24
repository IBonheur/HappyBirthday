Hello and welcome!

It’s a new year, and I wanted to make it special by hearing from friends and family around the world. So I created this simple website to collect your wishes — and to wish myself a glorious, beautiful birthday every year.

## Wish storage

Submitted wishes accept a user-entered name and message, validate their size, and are stored as individual documents in the `birthdayWishes` Firestore collection. A Firestore trigger appends every new document to the single ordered `data/wishes.csv` file in GitHub using the `GITHUB_TOKEN` Firebase secret; the browser never receives that token.

The export defaults to `IBonheur/HappyBirthday`; override it with `GITHUB_REPOSITORY` in the Functions environment if needed. You can also override `GITHUB_WISHES_PATH`, then configure both the Firebase and GitHub Actions secrets:

```sh
firebase functions:secrets:set GITHUB_TOKEN
firebase deploy --only functions,firestore
```

The GitHub token should have only the minimum repository contents permission needed to update the export file. The CI workflows also require a repository secret named `FIREBASE_SERVICE_ACCOUNT`. Firestore remains the source of truth if GitHub is unavailable.

To configure the CI credential, open the GitHub repository at `Settings > Secrets and variables > Actions`, choose `New repository secret`, name it `FIREBASE_SERVICE_ACCOUNT`, and paste the complete Google service-account JSON as its value. The VS Code warning about `Context access might be invalid` is a static checker warning for custom secret names; `${{ secrets.FIREBASE_SERVICE_ACCOUNT }}` is the correct GitHub Actions syntax. Never commit this JSON to the repository.
