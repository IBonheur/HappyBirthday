import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
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

let authReady;
export function ensureAnonymousSession() {
	authReady ??= signInAnonymously(auth);
	return authReady;
}
