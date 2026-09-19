function createWishesApi({ repository, config, rateLimit }) {
	function setSecurityHeaders(response) {
		response.set("Cache-Control", "no-store");
		response.set("X-Content-Type-Options", "nosniff");
		response.set("Referrer-Policy", "no-referrer");
	}

	function configureCors(request, response) {
		const origin = request.get("origin");
		if (!origin) return true;
		if (!config.allowedOrigins.has(origin)) return false;
		response.set("Access-Control-Allow-Origin", origin);
		response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		response.set("Access-Control-Allow-Headers", "Content-Type, Accept");
		response.set("Vary", "Origin");
		return true;
	}

	return async function wishesApi(request, response) {
		setSecurityHeaders(response);
		if (!configureCors(request, response)) return response.status(403).json({ error: "Origin not allowed." });
		if (request.method === "OPTIONS") return response.status(204).send("");

		if (request.method === "GET") {
			try {
				return response.status(200).json({ wishes: await repository.listWishes() });
			} catch (error) {
				console.error("Could not read birthday wishes.", error);
				return response.status(500).json({ error: "Unable to load wishes." });
			}
		}

		if (request.method === "POST") {
			if (rateLimit(request)) return response.status(429).json({ error: "Too many wishes. Please try again later." });
			const wish = require("./validation").cleanWish(request.body);
			if (!wish) return response.status(400).json({ error: "Invalid wish." });
			try {
				await repository.saveWish(wish);
				return response.status(201).json({ ok: true });
			} catch (error) {
				console.error("Could not save birthday wish.", error);
				return response.status(500).json({ error: "Unable to save wish." });
			}
		}

		response.set("Allow", "GET, POST");
		return response.status(405).json({ error: "Method not allowed." });
	};
}

module.exports = { createWishesApi };
