/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const {cleanWish} = require("./src/validation");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

const githubToken = defineSecret("GITHUB_TOKEN");
const githubRepository = process.env.GITHUB_REPOSITORY;
const githubPath = process.env.GITHUB_WISHES_PATH || "data/wishes.csv";

function csvCell(value) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function wishCsvLine(wish, id, createdAt) {
  return [createdAt, id, wish.name, wish.message].map(csvCell).join(",");
}

async function githubRequest(path, options, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub request failed with status ${response.status}`);
  return response.json();
}

async function appendWishToGithub(wish, wishId, createdAt, token) {
  if (!githubRepository || !token) {
    logger.warn("GitHub export is not configured; Firestore remains the source of truth.");
    return;
  }

  const fileEndpoint = `/repos/${githubRepository}/contents/${githubPath}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let current;
    try {
      current = await githubRequest(fileEndpoint, {method: "GET"}, token);
    } catch (error) {
      if (!String(error.message).includes("status 404")) throw error;
      current = {content: Buffer.from("createdAt,wishId,name,message\n").toString("base64"), sha: undefined};
    }

    const content = Buffer.from(current.content.replaceAll("\n", ""), "base64").toString("utf8");
    const line = wishCsvLine(wish, wishId, createdAt);
    if (content.includes(`,${csvCell(wishId)},`)) return;
    const nextContent = content.endsWith("\n") ? `${content}${line}\n` : `${content}\n${line}\n`;
    try {
      await githubRequest(fileEndpoint, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message: `Store birthday wish ${wishId}`,
          content: Buffer.from(nextContent).toString("base64"),
          ...(current.sha ? {sha: current.sha} : {}),
        }),
      }, token);
      return;
    } catch (error) {
      if (!String(error.message).includes("status 409") || attempt === 2) throw error;
    }
  }
}

exports.exportWishToGithub = onDocumentCreated({
  document: "birthdayWishes/{wishId}",
  database: "happybirthday",
  secrets: [githubToken],
}, async (event) => {
  const rawWish = event.data && event.data.data();
  const wish = cleanWish(rawWish);
  if (!wish) {
    logger.warn("Skipping invalid birthday wish export.", {wishId: event.params.wishId});
    return;
  }

  const timestamp = rawWish.createdAt && rawWish.createdAt.toDate && rawWish.createdAt.toDate();
  const createdAt = timestamp ? timestamp.toISOString() : new Date().toISOString();
  await appendWishToGithub(wish, event.params.wishId, createdAt, githubToken.value());
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
