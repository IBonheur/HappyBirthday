import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { db, ensureAnonymousSession } from "./firebase.js";
import { HTTP_BACKEND_URL, USE_HTTP_BACKEND } from "./config.js";
import { normalizeWish } from "./schema.js";

const wishesCollection = collection(db, "birthdayWishes");

async function getWishId(wish) {
	const data = new TextEncoder().encode(`${wish.name}\n${wish.message}`);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function listWishes() {
	if (USE_HTTP_BACKEND) {
		const response = await fetch(HTTP_BACKEND_URL, { headers: { Accept: "application/json" } });
		if (!response.ok) throw new Error(`Wish loading failed with status ${response.status}`);
		return ((await response.json()).wishes || []).map(normalizeWish).filter(Boolean);
	}
	await ensureAnonymousSession();
	const snapshot = await getDocs(query(wishesCollection, orderBy("createdAt", "desc"), limit(50)));
	return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })).map(normalizeWish).filter(Boolean);
}

export async function watchWishes(onUpdate, onError) {
	if (USE_HTTP_BACKEND) {
		let active = true;
		let polling = false;
		const poll = async () => {
			if (!active || polling) return;
			polling = true;
			try {
				onUpdate(await listWishes(), false);
			} catch (error) {
				onError?.(error);
			} finally {
				polling = false;
			}
		};
		await poll();
		const timer = window.setInterval(poll, 20000);
		return () => {
			active = false;
			window.clearInterval(timer);
		};
	}

	await ensureAnonymousSession();
	return onSnapshot(
		query(wishesCollection, orderBy("createdAt", "desc"), limit(50)),
		{ includeMetadataChanges: true },
		(snapshot) => {
			onUpdate(
				snapshot.docs.map((document) => ({ id: document.id, ...document.data() })).map(normalizeWish).filter(Boolean),
				snapshot.metadata.fromCache
			);
		},
		onError
	);
}

export async function createWish(wish) {
	wish = normalizeWish(wish);
	if (!wish) throw new Error("Invalid wish.");
	if (USE_HTTP_BACKEND) {
		const response = await fetch(HTTP_BACKEND_URL, {
			method: "POST",
			headers: { Accept: "application/json", "Content-Type": "application/json" },
			body: JSON.stringify(wish)
		});
		if (!response.ok) throw new Error(`Wish save failed with status ${response.status}`);
		return;
	}
	await ensureAnonymousSession();
	const wishId = await getWishId(wish);
	const wishReference = doc(wishesCollection, wishId);
	await runTransaction(db, async (transaction) => {
		const existing = await transaction.get(wishReference);
		if (existing.exists()) return;
		transaction.set(wishReference, {
			name: wish.name,
			message: wish.message,
			createdAt: serverTimestamp()
		});
	});
}
