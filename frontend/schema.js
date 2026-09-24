export const WISH_LIMITS = {
	name: 40,
	message: 140
};

export function normalizeWish(value) {
	const name = typeof value?.name === "string" ? value.name.trim() : "";
	const message = typeof value?.message === "string" ? value.message.trim() : "";
	const clientId = typeof value?.clientId === "string" && /^[A-Za-z0-9]{20}$/.test(value.clientId)
		? value.clientId
		: null;
	return name && message && name.length <= WISH_LIMITS.name && message.length <= WISH_LIMITS.message
		? { name, message, ...(clientId ? { clientId } : {}) }
		: null;
}