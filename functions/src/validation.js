function cleanWish(body) {
	const name = typeof body?.name === "string" ? body.name.trim() : "";
	const message = typeof body?.message === "string" ? body.message.trim() : "";

	if (!name || name.length > 40 || !message || message.length > 140) {
		return null;
	}

	return { name, message };
}

function getWishId(wish, crypto) {
	return crypto.createHash("sha256").update(`${wish.name}\n${wish.message}`).digest("hex");
}

module.exports = { cleanWish, getWishId };
