import { collection, addDoc, getDocs, limit, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { db, ensureAnonymousSession } from "./firebase.js";

const wishesCollection = collection(db, "birthdayWishes");

export async function listWishes() {
	await ensureAnonymousSession();
	const snapshot = await getDocs(query(wishesCollection, orderBy("createdAt", "desc"), limit(50)));
	return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
}

export async function createWish(wish) {
	await ensureAnonymousSession();
	await addDoc(wishesCollection, {
		name: wish.name,
		message: wish.message,
		createdAt: serverTimestamp()
	});
}
