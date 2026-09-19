# Frontend modules

The hosted page currently keeps its stable DOM-driven entrypoint in `../script.js`. These modules define the scalable browser boundary for future UI extraction:

- `api.js` owns HTTP communication with `/api/wishes`.
- `storage.js` owns resilient local JSON persistence.
- `config.js` owns browser storage keys and limits.

The API remains same-origin so Firebase Hosting rewrites requests to Cloud Functions without exposing infrastructure details to the browser.
