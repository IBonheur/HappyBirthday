function createBackupService({ secret, fetchImpl = fetch, config }) {
	function getHeaders() {
		const token = secret.value();
		return token
			? { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" }
			: null;
	}

	async function backupWish(wish, wishId) {
		const headers = getHeaders();
		if (!headers) {
			throw new Error("GitHub backup is not configured.");
		}

		const path = `${config.githubBackupDirectory}/${wishId}.json`;
		const url = `${config.githubApi}/repos/${config.githubOwner}/${config.githubRepo}/contents/${path}`;
		const existingResponse = await fetchImpl(url, { headers });
		let sha;

		if (existingResponse.ok) {
			const existing = await existingResponse.json();
			sha = existing.sha;
			if (existing.content) {
				const current = Buffer.from(existing.content.replace(/\s/g, ""), "base64").toString("utf8");
				const expected = JSON.stringify({ id: wishId, name: wish.name, message: wish.message }, null, 2);
				if (current === expected) return;
			}
		} else if (existingResponse.status !== 404) {
			throw new Error(`GitHub lookup failed with status ${existingResponse.status}.`);
		}

		const content = Buffer.from(JSON.stringify({ id: wishId, name: wish.name, message: wish.message }, null, 2)).toString("base64");
		const payload = { message: `Store birthday wish ${wishId}`, content, ...(sha ? { sha } : {}) };
		const saveResponse = await fetchImpl(url, {
			method: "PUT",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});

		if (!saveResponse.ok) {
			throw new Error(`GitHub backup failed with status ${saveResponse.status}.`);
		}
	}

	return { backupWish };
}

module.exports = { createBackupService };
