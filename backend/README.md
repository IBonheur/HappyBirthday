# Optional backend layer

Cloud Functions is an optional paid-tier backend. Firebase Spark cannot deploy Cloud Functions, so the default free-tier application uses Firebase Web SDK plus Firestore Security Rules instead.

Backend-only responsibilities:

- validate and normalize requests
- enforce CORS and rate limits
- write through the Firebase Admin SDK
- archive public wishes to GitHub using Secret Manager
- retry failed archives on a schedule

Do not put service-account files, GitHub tokens, Firebase Admin credentials, or private environment files in this folder or the frontend.
