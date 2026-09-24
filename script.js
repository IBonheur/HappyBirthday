import { createWish, listWishes } from "./frontend/api.js";
import { readJson, writeJson } from "./frontend/storage.js";
import { STORAGE_KEYS, MAX_LOCAL_WISHES, MAX_PENDING_WISHES } from "./frontend/config.js";
import { WISH_AUTHORS } from "./frontend/schema.js";

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
const storageKey = STORAGE_KEYS.wishes;
const pendingStorageKey = STORAGE_KEYS.pendingWishes;
const revealDelay = 10000;
const imageChangeDelay = 30000;
const starterWishes = [
	{ name: "Aline", message: "Wishing you a year full of bright moments!" },
	{ name: "Cyusa", message: "May your birthday be as wonderful as you are." },
	{ name: "Mugisha", message: "More joy, laughter, and beautiful memories!" },
	{ name: "Gaby", message: "Cheers to your happiest year yet!" }
];
const birthdayImages = ["image/image1.jpg", "image/image2.jpg"];
const fallbackImage = birthdayImages[0];
const blockedShortcuts = new Set(["s", "u", "p"]);
const backgroundScenes = ["scene-balloons", "scene-cakes", "scene-hearts"];
const background = document.querySelector(".body-bg");

let wishes = loadWishes();
let pendingWishes = loadPendingWishes();
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

function handlePageExit() {
	setPrivacyMode(true);
	window.clearInterval(tickerTimer);
	window.clearInterval(imageTimer);
	window.clearInterval(sceneTimer);
}

function normalizeWish(wish) {
	if (wish && typeof wish.name === "string" && typeof wish.message === "string") {
		const name = wish.name.trim();
		const message = wish.message.trim();
		return WISH_AUTHORS.includes(name) && message ? { name, message, createdAt: wish.createdAt ?? null } : null;
	}

	return null;
}

async function loadCloudWishes() {
	try {
		wishes = (await listWishes()).map(normalizeWish).filter(Boolean);
		saveWishes();
		renderWishes();
		tickerIndex = 0;
		showNextWish();
	} catch {
		formStatus.textContent = "";
	}
}

async function saveCloudWish(wish) {
	await createWish(wish);
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

window.addEventListener("beforeprint", () => setPrivacyMode(true));
window.addEventListener("afterprint", () => {
	if (!document.hidden && document.hasFocus()) {
		setPrivacyMode(false);
	}
});
window.addEventListener("pagehide", handlePageExit);

function loadWishes() {
	try {
		const savedWishes = readJson(storageKey, []);
		return Array.isArray(savedWishes) ? savedWishes.map(normalizeWish).filter(Boolean).slice(0, MAX_LOCAL_WISHES) : [];
	} catch {
		return [];
	}
}

function loadPendingWishes() {
	try {
		const savedWishes = readJson(pendingStorageKey, []);
		return Array.isArray(savedWishes) ? savedWishes.map(normalizeWish).filter(Boolean).slice(0, MAX_PENDING_WISHES) : [];
	} catch {
		return [];
	}
}

function savePendingWishes() {
	try {
		writeJson(pendingStorageKey, pendingWishes);
	} catch {
		return;
	}
}

async function flushPendingWishes() {
	if (!pendingWishes.length) {
		return;
	}

	const remainingWishes = [];
	for (const pendingWish of pendingWishes) {
		try {
			await saveCloudWish(pendingWish);
		} catch {
			remainingWishes.push(pendingWish);
		}
	}
	pendingWishes = remainingWishes;
	savePendingWishes();
}

function saveWishes() {
	try {
		writeJson(storageKey, wishes);
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
	wishAuthor.textContent = currentWish.name;
	wishMessage.textContent = currentWish.message;
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
	formStatus.textContent = "";

	try {
		await saveCloudWish(newWish);
		wishes = [newWish, ...wishes].slice(0, 50);
		formStatus.textContent = "";
	} catch {
		pendingWishes = [newWish, ...pendingWishes].slice(0, 20);
		savePendingWishes();
		formStatus.textContent = "Saved on this device and will retry when the connection returns.";
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

renderWishes();
startTicker();
startImageRotation();
startSceneRotation();
loadCloudWishes();
flushPendingWishes();
window.setTimeout(() => {
	wishPanel.hidden = false;
	wishInput.focus({ preventScroll: true });
}, revealDelay);

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		handlePageExit();
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

setPrivacyMode(document.hidden || !document.hasFocus());
