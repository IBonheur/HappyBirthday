export async function listWishes() {
	const response = await fetch("/api/wishes", { headers: { Accept: "application/json" } });
	if (!response.ok) throw new Error(`Wish loading failed with status ${response.status}`);
	const data = await response.json();
	return Array.isArray(data.wishes) ? data.wishes : [];
}

export async function createWish(wish) {
	const response = await fetch("/api/wishes", {
		method: "POST",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
		body: JSON.stringify(wish)
	});
	if (!response.ok) throw new Error(`Wish save failed with status ${response.status}`);
}
