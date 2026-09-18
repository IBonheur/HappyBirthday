import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { addDoc, collection, getDocs, getFirestore, limit, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const wishForm = document.querySelector("#wish-form");
const birthdayImage = document.querySelector("#birthday-image");
const wishName = document.querySelector("#wish-name");
const wishInput = document.querySelector("#wish-input");
const wishPanel = document.querySelector("#wish-panel");
const wishList = document.querySelector("#wish-list");
const wishCount = document.querySelector("#wish-count");
const tickerText = document.querySelector("#wish-ticker-text");
const wishAuthor = document.querySelector("#wish-author");
const wishMessage = document.querySelector("#wish-message");
const formStatus = document.querySelector("#form-status");
const toast = document.querySelector("#toast");
const privacyScreen = document.querySelector(".privacy-screen");
const storageKey = "bonheur-birthday-wishes";
const revealDelay = 20000;
const imageChangeDelay = 40000;
const starterWishes = [
	"Wishing you a year full of bright moments!",
	"May your birthday be as wonderful as you are.",
	"More joy, laughter, and beautiful memories!",
	"Cheers to your happiest year yet!"
];
const birthdayImages = ["image/image1.jpg", "image/image2.jpg"];
const fallbackImage = birthdayImages[0];
const blockedShortcuts = new Set(["s", "u", "p"]);
const backgroundScenes = ["scene-balloons", "scene-cakes", "scene-hearts"];
const background = document.querySelector(".body-bg");
const wishesCollection = "birthdayWishes";

let wishes = loadWishes();
let firestore;
let tickerIndex = 0;
let tickerTimer;
let imageIndex = 0;
let imageTimer;
let sceneIndex = 0;
let sceneTimer;

function setPrivacyMode(enabled) {
	document.body.classList.toggle("privacy-mode", enabled);
	privacyScreen.setAttribute("aria-hidden", String(!enabled));
}

function normalizeWish(wish) {
	if (typeof wish === "string" && wish.trim()) {
		return { name: "A friend", message: wish.trim() };
	}

	if (wish && typeof wish.name === "string" && typeof wish.message === "string") {
		const name = wish.name.trim();
		const message = wish.message.trim();
		return name && message ? { name, message, createdAt: wish.createdAt ?? null } : null;
	}

	return null;
}

function isFirebaseConfigured() {
	return Object.values(firebaseConfig).every((value) => typeof value === "string" && value.trim() && !value.startsWith("PASTE_"));
}

function initializeCloudStorage() {
	if (!isFirebaseConfigured()) {
		formStatus.textContent = "Cloud wishes are not configured yet.";
		return null;
	}

	try {
		const app = initializeApp(firebaseConfig);
		return getFirestore(app);
	} catch (error) {
		console.error("Firebase initialization failed.", error);
		formStatus.textContent = "Cloud wishes are temporarily unavailable.";
		return null;
	}
}

async function loadCloudWishes() {
	if (!firestore) {
		return;
	}

	try {
		const wishesQuery = query(collection(firestore, wishesCollection), orderBy("createdAt", "desc"), limit(50));
		const snapshot = await getDocs(wishesQuery);
		wishes = snapshot.docs.map((wish) => normalizeWish(wish.data())).filter(Boolean);
		saveWishes();
		renderWishes();
		tickerIndex = 0;
		showNextWish();
		formStatus.textContent = "Cloud wishes are connected.";
	} catch (error) {
		console.error("Could not load cloud wishes.", error);
		formStatus.textContent = "Cloud wishes could not be loaded. Local wishes are still available.";
	}
}

async function saveCloudWish(wish) {
	if (!firestore) {
		return false;
	}

	await addDoc(collection(firestore, wishesCollection), {
		name: wish.name,
		message: wish.message,
		createdAt: serverTimestamp()
	});
	return true;
}

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => {
	if (!(event.target instanceof HTMLInputElement)) {
		event.preventDefault();
	}
});
document.addEventListener("keydown", (event) => {
	const key = event.key.toLowerCase();
	if ((event.ctrlKey || event.metaKey) && blockedShortcuts.has(key)) {
		event.preventDefault();
	}
});

function loadWishes() {
	try {
		const savedWishes = JSON.parse(localStorage.getItem(storageKey));
		return Array.isArray(savedWishes)
			? savedWishes.map(normalizeWish).filter(Boolean).slice(0, 50)
			: [];
	} catch {
		return [];
	}
}
function saveWishes() {
	try {
		localStorage.setItem(storageKey, JSON.stringify(wishes));
	} catch {
		return;
	}
}
function getTickerWishes() {
	return [...wishes, ...starterWishes];
}
function showNextWish() {
	const availableWishes = getTickerWishes();
	const currentWish = availableWishes[tickerIndex % availableWishes.length];
	tickerText.classList.remove("is-changing");
	void tickerText.offsetWidth;
	if (typeof currentWish === "string") {
		wishAuthor.textContent = "Birthday friends";
		wishMessage.textContent = currentWish;
	} else {
		wishAuthor.textContent = currentWish.name;
		wishMessage.textContent = currentWish.message;
	}
	tickerText.classList.add("is-changing");
	tickerIndex += 1;
}

function startTicker() {
	window.clearInterval(tickerTimer);
	showNextWish();
	tickerTimer = window.setInterval(showNextWish, 4200);
}

function rotateBirthdayImage() {
	imageIndex = (imageIndex + 1) % birthdayImages.length;
	birthdayImage.classList.add("is-changing");
	birthdayImage.addEventListener("animationend", () => birthdayImage.classList.remove("is-changing"), { once: true });
	birthdayImage.src = birthdayImages[imageIndex];
}

birthdayImage.addEventListener("error", () => {
	if (birthdayImage.src.endsWith(fallbackImage)) {
		return;
	}

	imageIndex = 0;
	birthdayImage.src = fallbackImage;
});

function startImageRotation() {
	window.clearInterval(imageTimer);
	imageTimer = window.setInterval(rotateBirthdayImage, imageChangeDelay);
}

function startSceneRotation() {
	window.clearInterval(sceneTimer);
	sceneTimer = window.setInterval(changeBackgroundScene, 12000);
}

function renderWishes() {
	wishList.replaceChildren();
	wishes.forEach((wish) => {
		const wishItem = document.createElement("li");
		wishItem.textContent = `${wish.name}: ${wish.message}`;
		wishList.append(wishItem);
	});
	wishCount.textContent = wishes.length;
}

function showThankYou(name) {
	toast.textContent = `Thank you, ${name}! Your wish is wrapped in love 💖`;
	toast.classList.add("is-visible");
	window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

wishForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	const submitButton = wishForm.querySelector("button[type=submit]");
	const name = wishName.value.trim();
	const wish = wishInput.value.trim();

	if (!name || !wish) {
		formStatus.textContent = "Please add your name and wish.";
		(name ? wishInput : wishName).focus();
		return;
	}

	const newWish = { name, message: wish };
	submitButton.disabled = true;
	formStatus.textContent = "Saving your wish...";

	try {
		const savedToCloud = await saveCloudWish(newWish);
		wishes = [newWish, ...wishes].slice(0, 50);
		if (!savedToCloud) {
			saveWishes();
			formStatus.textContent = "Wish saved on this device. Configure Firebase for shared wishes.";
		} else {
			formStatus.textContent = "Wish added to the birthday wall.";
		}
	} catch (error) {
		console.error("Could not save cloud wish.", error);
		wishes = [newWish, ...wishes].slice(0, 50);
		saveWishes();
		formStatus.textContent = "Cloud save failed. Your wish was saved on this device.";
	}

	renderWishes();
	tickerIndex = 0;
	showNextWish();
	wishForm.reset();
	showThankYou(name);
	submitButton.disabled = false;
});

function changeBackgroundScene() {
	background.classList.remove(...backgroundScenes);
	sceneIndex = (sceneIndex + 1) % backgroundScenes.length;
	background.classList.add(backgroundScenes[sceneIndex]);
}

firestore = initializeCloudStorage();
renderWishes();
startTicker();
startImageRotation();
startSceneRotation();
loadCloudWishes();
window.setTimeout(() => {
	wishPanel.hidden = false;
	wishInput.focus({ preventScroll: true });
}, revealDelay);

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		setPrivacyMode(true);
		window.clearInterval(tickerTimer);
		window.clearInterval(imageTimer);
		window.clearInterval(sceneTimer);
	} else {
		setPrivacyMode(false);
		startTicker();
		startImageRotation();
		startSceneRotation();
	}
});

window.addEventListener("blur", () => setPrivacyMode(true));
window.addEventListener("focus", () => {
	if (!document.hidden) {
		setPrivacyMode(false);
	}
});
