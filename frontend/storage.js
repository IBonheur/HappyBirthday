export function readJson(key, fallback) {
	try {
		const value = JSON.parse(localStorage.getItem(key));
		return value ?? fallback;
	} catch {
		return fallback;
	}
}

export function writeJson(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
}
