import { createWish, watchWishes } from "./frontend/api.js";
import { readJson, writeJson } from "./frontend/storage.js";
import { STORAGE_KEYS, MAX_LOCAL_WISHES, MAX_PENDING_WISHES } from "./frontend/config.js";

const wishForm = document.querySelector("#wish-form");
const birthdayImage = document.querySelector("#birthday-image");
const wishName = document.querySelector("#wish-name");
const wishInput = document.querySelector("#wish-input");
const wishPanel = document.querySelector("#wish-panel");
const wishList = document.querySelector("#wish-list");
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

let pendingWishes = loadPendingWishes();
let wishes = loadWishes().filter((wish) => !pendingWishes.some((pendingWish) => pendingWish.name === wish.name && pendingWish.message === wish.message));
let tickerIndex = 0;
let tickerTimer;
let imageIndex = 0;
let imageTimer;
let sceneIndex = 0;
let sceneTimer;
let flushingPending = false;
let stopWishUpdates;
let wishUpdatesGeneration = 0;

function setPrivacyMode(enabled) {
	document.body.classList.toggle("privacy-mode", enabled);
	privacyScreen.setAttribute("aria-hidden", String(!enabled));
}

function handlePageExit() {
	wishUpdatesGeneration += 1;
	setPrivacyMode(true);
	window.clearInterval(tickerTimer);
	window.clearInterval(imageTimer);
	window.clearInterval(sceneTimer);
	stopWishUpdates?.();
	stopWishUpdates = null;
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

async function startWishUpdates() {
	const generation = ++wishUpdatesGeneration;
	stopWishUpdates?.();
	stopWishUpdates = null;
	try {
		const stop = await watchWishes((latestWishes, fromCache) => {
			wishes = latestWishes.map(normalizeWish).filter(Boolean);
			saveWishes();
			renderWishes();
			tickerIndex = 0;
			showNextWish();
			if (fromCache && pendingWishes.length) {
				formStatus.textContent = "Cloud connection unavailable. Pending wishes are still awaiting confirmation.";
			}
		}, () => {
			formStatus.textContent = pendingWishes.length
				? "Cloud connection unavailable. Pending wishes are still awaiting confirmation."
				: "Unable to refresh wishes right now.";
		});
		if (generation !== wishUpdatesGeneration || document.hidden) {
			stop();
			return;
		}
		stopWishUpdates = stop;
	} catch {
		formStatus.textContent = pendingWishes.length
			? "Cloud connection unavailable. Pending wishes are still awaiting confirmation."
			: "Unable to connect to the wishes service right now.";
	}
}

async function saveCloudWish(wish) {
	let timeoutId;
	try {
		await Promise.race([
			createWish(wish),
			new Promise((_, reject) => {
				timeoutId = window.setTimeout(() => reject(new Error("Cloud confirmation timed out.")), 12000);
			})
		]);
	} finally {
		window.clearTimeout(timeoutId);
	}
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
	return writeJson(pendingStorageKey, pendingWishes);
}

async function flushPendingWishes() {
	if (!pendingWishes.length || flushingPending) {
		return;
	}

	flushingPending = true;
	try {
		const remainingWishes = [];
		for (const pendingWish of pendingWishes) {
			try {
				await saveCloudWish(pendingWish);
				wishes = [pendingWish, ...wishes.filter((wish) => wish.name !== pendingWish.name || wish.message !== pendingWish.message)].slice(0, MAX_LOCAL_WISHES);
			} catch {
				remainingWishes.push(pendingWish);
			}
		}
		pendingWishes = remainingWishes;
		savePendingWishes();
		saveWishes();
		renderWishes();
		if (pendingWishes.length === 0) {
			formStatus.textContent = "Pending wishes have been confirmed in the cloud.";
		} else {
			formStatus.textContent = "Some wishes are still awaiting cloud confirmation.";
		}
	} finally {
		flushingPending = false;
	}
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
		saveWishes();
		formStatus.textContent = "Your wish has been sent.";
		wishForm.reset();
		showThankYou(name);
	} catch (error) {
		if (error?.message === "Invalid wish.") {
			formStatus.textContent = "Please check your name and message, then try again.";
		} else {
			const alreadyQueued = pendingWishes.some((wish) => wish.name === newWish.name && wish.message === newWish.message);
			if (!alreadyQueued && pendingWishes.length >= MAX_PENDING_WISHES) {
				formStatus.textContent = "The retry queue is full. Keep this message and try again after earlier wishes reconnect.";
			} else {
				if (!alreadyQueued) pendingWishes = [newWish, ...pendingWishes];
				if (savePendingWishes()) {
					formStatus.textContent = "Connection unavailable. Your wish is awaiting cloud confirmation and will retry automatically.";
					wishForm.reset();
				} else {
					formStatus.textContent = "We could not reach the server or save a retry. Please keep this page open and try again.";
				}
			}
		}
	}

	renderWishes();
	tickerIndex = 0;
	showNextWish();
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
startWishUpdates();
flushPendingWishes();
window.addEventListener("online", flushPendingWishes);
window.setInterval(() => {
	if (!document.hidden) flushPendingWishes();
}, 30000);
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
		startWishUpdates();
	}
});

window.addEventListener("pageshow", () => {
	if (!document.hidden) startWishUpdates();
});

window.addEventListener("blur", () => setPrivacyMode(true));
window.addEventListener("focus", () => {
	if (!document.hidden) {
		setPrivacyMode(false);
	}
});

setPrivacyMode(document.hidden || !document.hasFocus());
