export const WISH_LIMITS = {
	name: 40,
	message: 140
};

export const WISH_AUTHORS = ["Aline", "Cyusa", "Mugisha", "Gaby", "Naomi", "Mihigo", "Mike", "Simi", "Keza", "Beni", "Emma", "SWH"];

export function normalizeWish(value) {
	const name = typeof value?.name === "string" ? value.name.trim() : "";
	const message = typeof value?.message === "string" ? value.message.trim() : "";
	return name && WISH_AUTHORS.includes(name) && message && name.length <= WISH_LIMITS.name && message.length <= WISH_LIMITS.message
		? { name, message }
		: null;
}