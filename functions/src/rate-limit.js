const attemptsByClient = new Map();

function getClientKey(request) {
	return request.get("x-forwarded-for")?.split(",")[0]?.trim() || request.ip || "unknown";
}

function isRateLimited(request, { requestWindowMs, maxWritesPerWindow }) {
	const key = getClientKey(request);
	const now = Date.now();
	const attempts = (attemptsByClient.get(key) || []).filter((timestamp) => now - timestamp < requestWindowMs);

	if (attempts.length >= maxWritesPerWindow) {
		attemptsByClient.set(key, attempts);
		return true;
	}

	attempts.push(now);
	attemptsByClient.set(key, attempts);
	return false;
}

module.exports = { isRateLimited };
