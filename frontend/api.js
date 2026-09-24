import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { db, ensureAnonymousSession } from "./firebase.js";
import { HTTP_BACKEND_URL, USE_HTTP_BACKEND } from "./config.js";
import { normalizeWish } from "./schema.js";

const wishesCollection = collection(db, "birthdayWishes");

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
	const wishData = {
		name: wish.name,
		message: wish.message,
		createdAt: serverTimestamp()
	};
	if (wish.clientId) {
		await setDoc(doc(wishesCollection, wish.clientId), wishData, { merge: false });
		return;
	}
	await addDoc(wishesCollection, wishData);
}
