const { cleanWish } = require("./validation");

function createApi({ db, auth, FieldValue, config }) {
	const attempts = new Map();

	function securityHeaders(response) {
		response.set("Cache-Control", "no-store");
		response.set("X-Content-Type-Options", "nosniff");
		response.set("Referrer-Policy", "no-referrer");
		response.set("Pragma", "no-cache");
		response.set("Vary", "Origin, Authorization");
	}

	function cors(request, response) {
		const origin = request.get("origin");
		if (!origin) return true;
		if (!config.allowedOrigins.has(origin)) return false;
		response.set("Access-Control-Allow-Origin", origin);
		response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		response.set("Access-Control-Allow-Headers", "Accept, Content-Type, Authorization");
		response.set("Vary", "Origin, Authorization");
		return true;
	}

	function limited(request) {
		const key = request.get("x-forwarded-for")?.split(",")[0]?.trim() || request.ip || "unknown";
		const now = Date.now();
		const recent = (attempts.get(key) || []).filter((time) => now - time < 60000);
		if (recent.length >= config.maxWritesPerMinute) return true;
		recent.push(now);
		attempts.set(key, recent);
		return false;
	}

	async function requireAdmin(request) {
		const header = request.get("authorization") || "";
		if (!header.startsWith("Bearer ")) return false;
		try {
			const user = await auth.verifyIdToken(header.slice(7));
			return user.email_verified === true && user.email?.toLowerCase() === config.adminEmail;
		} catch {
			return false;
		}
	}

	return async (request, response) => {
		securityHeaders(response);
		if (!cors(request, response)) return response.status(403).json({ error: "Origin not allowed." });
		if (request.method === "OPTIONS") return response.status(204).send("");
		const collection = db.collection("birthdayWishes");

		try {
			if (request.path === "/admin/wishes") {
				if (!(await requireAdmin(request))) return response.status(403).json({ error: "Administrator access required." });
				if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
				const snapshot = await collection.orderBy("createdAt", "desc").limit(500).get();
				return response.json({ wishes: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) });
			}
			if (request.method === "GET") {
				const snapshot = await collection.orderBy("createdAt", "desc").limit(config.maxWishes).get();
				return response.json({ wishes: snapshot.docs.map((document) => document.data()) });
			}
			if (request.method === "POST") {
				if (limited(request)) return response.status(429).json({ error: "Too many wishes." });
				const wish = cleanWish(request.body);
				if (!wish) return response.status(400).json({ error: "Invalid wish." });
				const reference = wish.clientId ? collection.doc(wish.clientId) : collection.doc();
				await reference.create({
					name: wish.name,
					message: wish.message,
					createdAt: FieldValue.serverTimestamp(),
				});
				return response.status(201).json({ ok: true });
			}
			response.set("Allow", "GET, POST, OPTIONS");
			return response.status(405).json({ error: "Method not allowed." });
		} catch (error) {
			if (error.code === 6) return response.status(200).json({ ok: true, duplicate: true });
			console.error("Wish API failed.", error);
			return response.status(500).json({ error: "Unable to process wish." });
		}
	};
}

module.exports = { createApi };
