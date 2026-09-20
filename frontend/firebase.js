import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInAnonymously, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
	apiKey: "AIzaSyDDkhqR-guxHmU8kagnzDQOYEdBvWieuhc",
	authDomain: "happybirthday-6d8ee.firebaseapp.com",
	projectId: "happybirthday-6d8ee",
	storageBucket: "happybirthday-6d8ee.firebasestorage.app",
	messagingSenderId: "31161256619",
	appId: "1:31161256619:web:0f581be19fc1fd45a705ee"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const adminEmail = "ishimwebon@gmail.com";
const googleProvider = new GoogleAuthProvider();

let authReady;
export function ensureAnonymousSession() {
	if (auth.currentUser && auth.currentUser.isAnonymous === false) return Promise.resolve(auth.currentUser);
	authReady ??= signInAnonymously(auth);
	return authReady;
}

export function signInAsAdmin() {
	return signInWithPopup(auth, googleProvider).then((result) => {
		if (result.user.email?.toLowerCase() !== adminEmail) {
			return signOut(auth).then(() => {
				throw new Error("This Google account is not an administrator.");
			});
		}
		return result.user;
	});
}

export function isAdmin(user = auth.currentUser) {
	return user?.email?.toLowerCase() === adminEmail;
}
