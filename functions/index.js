const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getDatabase } = require("firebase-admin/database");
const crypto = require("node:crypto");

const app = initializeApp({ databaseURL: "https://happybirthday-6d8ee-default-rtdb.firebaseio.com" });
const db = getFirestore(app, "happybirthday");
const realtimeDb = getDatabase(app);
const auth = getAuth(app);
const maxWishes = 50;
const requestWindowMs = 60 * 1000;
const maxWritesPerWindow = 5;
const githubApi = "https://api.github.com";
const githubOwner = "IBonheur";
const githubRepo = "HappyBirthday";
const githubBackupDirectory = "backups/wishes";
const githubBackupBranch = "birthday-wish-archive";
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
	response.set("Pragma", "no-cache");
}

function configureCors(request, response) {
	const origin = request.get("origin");
	if (!origin) return true;
	if (!allowedOrigins.has(origin)) return false;
	response.set("Access-Control-Allow-Origin", origin);
	response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	response.set("Access-Control-Allow-Headers", "Accept, Content-Type, Authorization");
	response.set("Vary", "Origin, Authorization");
	return true;
}

async function isVerifiedAdmin(request) {
	const authorization = request.get("authorization") || "";
	if (!authorization.startsWith("Bearer ")) return false;
	try {
		const user = await auth.verifyIdToken(authorization.slice(7));
		return user.email_verified === true && user.email?.toLowerCase() === "ishimwebon@gmail.com";
	} catch {
		return false;
	}
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

async function writeRealtimeBackup(wish, wishId, createdAt) {
	const timestamp = typeof createdAt?.toMillis === "function" ? createdAt.toMillis() : Date.now();
	await realtimeDb.ref(`birthdayWishes/${wishId}`).set({
		id: wishId,
		...getBackupWish(wish),
		createdAt: timestamp,
		realtimeBackupStatus: "complete",
		githubBackupStatus: "pending",
		backupUpdatedAt: Date.now()
	});
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

	const repositoryUrl = `${githubApi}/repos/${githubOwner}/${githubRepo}`;
	const branchResponse = await fetch(`${repositoryUrl}/git/ref/heads/${githubBackupBranch}`, { headers });
	if (!branchResponse.ok) {
		if (branchResponse.status !== 404) throw new Error(`GitHub branch lookup failed with status ${branchResponse.status}.`);
		const mainResponse = await fetch(`${repositoryUrl}/git/ref/heads/main`, { headers });
		if (!mainResponse.ok) throw new Error(`GitHub main branch lookup failed with status ${mainResponse.status}.`);
		const mainReference = await mainResponse.json();
		const createBranchResponse = await fetch(`${repositoryUrl}/git/refs`, {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({ ref: `refs/heads/${githubBackupBranch}`, sha: mainReference.object.sha })
		});
		if (!createBranchResponse.ok && createBranchResponse.status !== 422) {
			throw new Error(`GitHub archive branch creation failed with status ${createBranchResponse.status}.`);
		}
	}

	const path = `${githubBackupDirectory}/${wishId}.json`;
	const url = `${repositoryUrl}/contents/${path}`;
	const existingResponse = await fetch(`${url}?ref=${encodeURIComponent(githubBackupBranch)}`, { headers });
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
		branch: githubBackupBranch,
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

	await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(wishReference);
		if (!snapshot.exists) {
			transaction.set(wishReference, {
				...wish,
				createdAt: FieldValue.serverTimestamp(),
				backupStatus: "pending"
			});
		}
	});

	return wishId;
}

exports.archiveNewWish = onDocumentCreated({
	document: "birthdayWishes/{wishId}",
	database: "happybirthday",
	region: "us-central1",
	maxInstances: 2,
	retry: true,
	secrets: [githubBackupToken]
}, async (event) => {
	const document = event.data;
	if (!document) return;
	const wish = cleanWish(document.data());
	if (!wish) {
		console.error("Created wish failed backup validation.", { wishId: event.params.wishId });
		return;
	}

	try {
		await writeRealtimeBackup(wish, event.params.wishId, document.data().createdAt);
		await backupWishToGitHub(wish, event.params.wishId);
		await document.ref.update({
			backupStatus: "complete",
			backupUpdatedAt: FieldValue.serverTimestamp(),
			backupError: FieldValue.delete()
		});
		await realtimeDb.ref(`birthdayWishes/${event.params.wishId}`).update({
			githubBackupStatus: "complete",
			backupUpdatedAt: Date.now()
		});
	} catch (error) {
		await document.ref.update({
			backupStatus: "pending",
			backupUpdatedAt: FieldValue.serverTimestamp()
		});
		console.error("GitHub wish archive failed; the event will retry.", { wishId: event.params.wishId, error: error.message });
		throw error;
	}
});

async function retryPendingBackups() {
	const snapshot = await db.collection("birthdayWishes").where("backupStatus", "==", "pending").limit(25).get();
	for (const document of snapshot.docs) {
		const wish = document.data();
		try {
			await writeRealtimeBackup(wish, document.id, wish.createdAt);
			await backupWishToGitHub(wish, document.id);
			await document.ref.update({ backupStatus: "complete", backupUpdatedAt: FieldValue.serverTimestamp() });
			await realtimeDb.ref(`birthdayWishes/${document.id}`).update({
				githubBackupStatus: "complete",
				backupUpdatedAt: Date.now()
			});
		} catch (error) {
			console.error("GitHub backup retry is pending.", { wishId: document.id });
		}
	}
}

exports.wishesApi = onRequest({ region: "us-central1", maxInstances: 3, secrets: [githubBackupToken] }, async (request, response) => {
	setSecurityHeaders(response);
	if (!configureCors(request, response)) {
		return response.status(403).json({ error: "Origin not allowed." });
	}
	if (request.method === "OPTIONS") return response.status(204).send("");

	if (request.method === "GET") {
		try {
			if (request.path.endsWith("/admin/wishes")) {
				if (!(await isVerifiedAdmin(request))) return response.status(403).json({ error: "Administrator access required." });
				const snapshot = await db.collection("birthdayWishes").orderBy("createdAt", "desc").limit(500).get();
				return response.status(200).json({ wishes: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) });
			}
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