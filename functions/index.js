const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("node:crypto");

initializeApp();
const db = getFirestore();
const maxWishes = 50;
const requestWindowMs = 60 * 1000;
const maxWritesPerWindow = 5;
const githubApi = "https://api.github.com";
const githubOwner = "IBonheur";
const githubRepo = "HappyBirthday";
const githubBackupDirectory = "backups/wishes";
const githubBackupToken = defineSecret("GITHUB_BACKUP_TOKEN");
const writeAttempts = new Map();
const allowedOrigins = new Set([
	"https://happybirthday-6d8ee.web.app",
	"https://happybirthday-6d8ee.firebaseapp.com",
	"https://ibonheur.github.io"
]);

function setSecurityHeaders(response) {
	response.set("Cache-Control", "no-store");
	response.set("X-Content-Type-Options", "nosniff");
	response.set("Referrer-Policy", "no-referrer");
}

function cleanWish(body) {
	const name = typeof body?.name === "string" ? body.name.trim() : "";
	const message = typeof body?.message === "string" ? body.message.trim() : "";
	if (!name || name.length > 40 || !message || message.length > 140) {
		return null;
	}
	return { name, message };
}

function getClientKey(request) {
	return request.get("x-forwarded-for")?.split(",")[0]?.trim() || request.ip || "unknown";
}

function isAllowedOrigin(request) {
	const origin = request.get("origin");
	return !origin || allowedOrigins.has(origin);
}

function isRateLimited(request) {
	const key = getClientKey(request);
	const now = Date.now();
	const attempts = (writeAttempts.get(key) || []).filter((timestamp) => now - timestamp < requestWindowMs);
	if (attempts.length >= maxWritesPerWindow) {
		writeAttempts.set(key, attempts);
		return true;
	}
	attempts.push(now);
	writeAttempts.set(key, attempts);
	return false;
}

function getWishId(wish) {
	return crypto.createHash("sha256").update(`${wish.name}\n${wish.message}`).digest("hex");
}

function getBackupWish(wish) {
	return { name: wish.name, message: wish.message };
}

function getGitHubHeaders() {
	const token = githubBackupToken.value();
	return token
		? { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" }
		: null;
}

async function backupWishToGitHub(wish, wishId) {
	wish = getBackupWish(wish);
	const headers = getGitHubHeaders();
	if (!headers) {
		throw new Error("GitHub backup is not configured.");
	}

	const path = `${githubBackupDirectory}/${wishId}.json`;
	const url = `${githubApi}/repos/${githubOwner}/${githubRepo}/contents/${path}`;
	const existingResponse = await fetch(url, { headers });
	let sha;
	if (existingResponse.ok) {
		const existing = await existingResponse.json();
		sha = existing.sha;
		if (existing.content) {
			const existingContent = Buffer.from(existing.content.replace(/\s/g, ""), "base64").toString("utf8");
			const expectedContent = JSON.stringify({ id: wishId, ...wish }, null, 2);
			if (existingContent === expectedContent) {
				return;
			}
		}
	} else if (existingResponse.status !== 404) {
		throw new Error(`GitHub lookup failed with status ${existingResponse.status}.`);
	}

	const content = Buffer.from(JSON.stringify({ id: wishId, ...wish }, null, 2)).toString("base64");
	const payload = {
		message: `Store birthday wish ${wishId}`,
		content,
		...(sha ? { sha } : {})
	};
	const saveResponse = await fetch(url, {
		method: "PUT",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
	if (!saveResponse.ok) {
		throw new Error(`GitHub backup failed with status ${saveResponse.status}.`);
	}
}

async function saveWish(wish) {
	const wishId = getWishId(wish);
	const wishReference = db.collection("birthdayWishes").doc(wishId);
	let isNewWish = false;

	await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(wishReference);
		if (!snapshot.exists) {
			isNewWish = true;
			transaction.set(wishReference, {
				...wish,
				createdAt: FieldValue.serverTimestamp(),
				backupStatus: "pending"
			});
		}
	});

	if (isNewWish) {
		try {
			await backupWishToGitHub(wish, wishId);
			await wishReference.update({ backupStatus: "complete", backupUpdatedAt: FieldValue.serverTimestamp() });
		} catch (error) {
			console.error("GitHub backup is pending.", { wishId });
		}
	}

	return wishId;
}

async function retryPendingBackups() {
	const snapshot = await db.collection("birthdayWishes").where("backupStatus", "==", "pending").limit(25).get();
	for (const document of snapshot.docs) {
		const wish = document.data();
		try {
			await backupWishToGitHub(wish, document.id);
			await document.ref.update({ backupStatus: "complete", backupUpdatedAt: FieldValue.serverTimestamp() });
		} catch (error) {
			console.error("GitHub backup retry is pending.", { wishId: document.id });
		}
	}
}

exports.wishesApi = onRequest({ region: "us-central1", secrets: [githubBackupToken] }, async (request, response) => {
	setSecurityHeaders(response);
	if (!isAllowedOrigin(request)) {
		return response.status(403).json({ error: "Origin not allowed." });
	}

	if (request.method === "GET") {
		try {
			const snapshot = await db.collection("birthdayWishes").orderBy("createdAt", "desc").limit(maxWishes).get();
			return response.status(200).json({ wishes: snapshot.docs.map((doc) => doc.data()) });
		} catch (error) {
			console.error("Could not read birthday wishes.", error);
			return response.status(500).json({ error: "Unable to load wishes." });
		}
	}

	if (request.method === "POST") {
		if (isRateLimited(request)) {
			return response.status(429).json({ error: "Too many wishes. Please try again later." });
		}

		const wish = cleanWish(request.body);
		if (!wish) {
			return response.status(400).json({ error: "Invalid wish." });
		}

		try {
			await saveWish(wish);
			return response.status(201).json({ ok: true });
		} catch (error) {
			console.error("Could not save birthday wish.", error);
			return response.status(500).json({ error: "Unable to save wish." });
		}
	}

	response.set("Allow", "GET, POST");
	return response.status(405).json({ error: "Method not allowed." });
});

exports.retryGitHubBackups = onSchedule({ schedule: "every 15 minutes", secrets: [githubBackupToken] }, retryPendingBackups);