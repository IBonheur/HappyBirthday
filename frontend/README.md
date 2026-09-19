# Frontend modules

The GitHub Pages site currently keeps its stable DOM-driven entrypoint in `../script.js`. These modules define the scalable browser boundary for future UI extraction:

- `api.js` owns Firebase Web SDK communication with Firestore.
- `storage.js` owns resilient local JSON persistence.
- `config.js` owns browser storage keys and limits.

The client uses anonymous Firebase Auth before reading or creating wishes. Firebase configuration is safe to publish; Firestore rules are the authorization boundary.
