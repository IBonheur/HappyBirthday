const crypto = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const config = require("./config");
const { createWishesApi } = require("./api");
const { createBackupService } = require("./backup");
const { createWishRepository } = require("./repository");
const { getWishId } = require("./validation");
const { isRateLimited } = require("./rate-limit");

initializeApp();
const githubBackupToken = defineSecret("GITHUB_BACKUP_TOKEN");
const backupService = createBackupService({ secret: githubBackupToken, config });
const repository = createWishRepository({
	db: getFirestore(),
	FieldValue,
	backupService,
	getWishId: (wish) => getWishId(wish, crypto),
	maxWishes: config.maxWishes
});
const rateLimit = (request) => isRateLimited(request, config);

exports.wishesApi = onRequest({ region: "us-central1", secrets: [githubBackupToken] }, createWishesApi({ repository, config, rateLimit }));
exports.retryGitHubBackups = onSchedule({ schedule: "every 15 minutes", secrets: [githubBackupToken] }, repository.retryPendingBackups);
