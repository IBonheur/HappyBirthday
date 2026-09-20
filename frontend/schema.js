export const WISH_LIMITS = {
	name: 40,
	message: 140
};

export function normalizeWish(value) {
	const name = typeof value?.name === "string" ? value.name.trim() : "";
	const message = typeof value?.message === "string" ? value.message.trim() : "";
	return name && message && name.length <= WISH_LIMITS.name && message.length <= WISH_LIMITS.message
		? { name, message }
		: null;
}