import { createWish, watchWishes } from "./api.js";
import { readJson, writeJson } from "./storage.js";
import { STORAGE_KEYS, MAX_LOCAL_WISHES, MAX_PENDING_WISHES } from "./config.js";
import { normalizeWish } from "./schema.js";

const form = document.querySelector("#wish-form");
const nameInput = document.querySelector("#wish-name");
const messageInput = document.querySelector("#wish-input");
const wishPanel = document.querySelector("#wish-panel");
const wishList = document.querySelector("#wish-list");
const tickerText = document.querySelector("#wish-ticker-text");
const tickerAuthor = document.querySelector("#wish-author");
const tickerMessage = document.querySelector("#wish-message");
const status = document.querySelector("#form-status");
const toast = document.querySelector("#toast");
const privacyScreen = document.querySelector(".privacy-screen");
const birthdayImage = document.querySelector("#birthday-image");
const background = document.querySelector(".body-bg");
const images = ["image/image1.jpg", "image/image2.jpg"];
const scenes = ["scene-balloons", "scene-cakes", "scene-hearts"];

let pending = readQueue();
let wishes = readCache().filter((wish) => !pending.some((queued) => sameWish(wish, queued)));
let stopWatching;
let watchGeneration = 0;
let tickerTimer;
let imageTimer;
let sceneTimer;
let retryTimer;
let imageIndex = 0;
let sceneIndex = 0;
let tickerIndex = 0;
let sending = false;

function sameWish(left, right) {
	return left.name === right.name && left.message === right.message;
}

function readCache() {
	const value = readJson(STORAGE_KEYS.wishes, []);
	return Array.isArray(value) ? value.map(normalizeWish).filter(Boolean).slice(0, MAX_LOCAL_WISHES) : [];
}

function readQueue() {
	const value = readJson(STORAGE_KEYS.pendingWishes, []);
	return Array.isArray(value) ? value.map(normalizeWish).filter(Boolean).slice(0, MAX_PENDING_WISHES) : [];
}

function showStatus(message, error = false) {
	status.textContent = message;
	status.classList.toggle("is-error", error);
}

function renderWishes() {
	wishList.replaceChildren();
	for (const wish of wishes) {
		const item = document.createElement("li");
		item.textContent = `${wish.name}: ${wish.message}`;
		wishList.append(item);
	}
}

function showNextWish() {
	const current = wishes.length
		? wishes[tickerIndex % wishes.length]
		: { name: "Birthday friends", message: "Your birthday wishes will appear here." };
	tickerText.classList.remove("is-changing");
	void tickerText.offsetWidth;
	tickerAuthor.textContent = current.name;
	tickerMessage.textContent = current.message;
	tickerText.classList.add("is-changing");
	tickerIndex = wishes.length ? (tickerIndex + 1) % wishes.length : 0;
}

function cacheWishes() {
	writeJson(STORAGE_KEYS.wishes, wishes.slice(0, MAX_LOCAL_WISHES));
}

function saveQueue() {
	return writeJson(STORAGE_KEYS.pendingWishes, pending);
}

async function withConfirmationTimeout(wish) {
	let timer;
	try {
		await Promise.race([
			createWish(wish),
			new Promise((_, reject) => {
				timer = window.setTimeout(() => reject(new Error("confirmation-timeout")), 12000);
			})
		]);
	} finally {
		window.clearTimeout(timer);
	}
}

async function startWishUpdates() {
	const generation = ++watchGeneration;
	stopWatching?.();
	stopWatching = undefined;
	try {
		const unsubscribe = await watchWishes((latest, fromCache) => {
			wishes = latest.map(normalizeWish).filter(Boolean);
			cacheWishes();
			renderWishes();
			tickerIndex = 0;
			showNextWish();
			if (fromCache && pending.length) showStatus("A wish is still waiting for cloud confirmation.");
		}, () => showStatus("We couldn't refresh wishes just now. Please try again shortly.", true));
		if (generation !== watchGeneration || document.hidden) {
			unsubscribe();
			return;
		}
		stopWatching = unsubscribe;
	} catch {
		showStatus("We couldn't connect to the wishes service just now. Please try again shortly.", true);
	}
}

async function flushPending() {
	if (sending || document.hidden || !pending.length) return;
	sending = true;
	try {
		const unsent = [];
		for (const wish of pending) {
			try {
				await withConfirmationTimeout(wish);
				wishes = [wish, ...wishes.filter((item) => !sameWish(item, wish))].slice(0, MAX_LOCAL_WISHES);
			} catch {
				unsent.push(wish);
			}
		}
		pending = unsent;
		saveQueue();
		cacheWishes();
		renderWishes();
		showNextWish();
		if (!pending.length) showStatus("Your pending wish has been delivered.");
	} finally {
		sending = false;
	}
}

function setPrivacyMode(enabled) {
	document.body.classList.toggle("privacy-mode", enabled);
	privacyScreen.setAttribute("aria-hidden", String(!enabled));
}

function stopPageWork() {
	watchGeneration += 1;
	stopWatching?.();
	stopWatching = undefined;
	window.clearInterval(tickerTimer);
	window.clearInterval(imageTimer);
	window.clearInterval(sceneTimer);
}

function startPageWork() {
	window.clearInterval(tickerTimer);
	window.clearInterval(imageTimer);
	window.clearInterval(sceneTimer);
	tickerTimer = window.setInterval(showNextWish, 4200);
	imageTimer = window.setInterval(() => {
		imageIndex = (imageIndex + 1) % images.length;
		birthdayImage.classList.add("is-changing");
		birthdayImage.addEventListener("animationend", () => birthdayImage.classList.remove("is-changing"), { once: true });
		birthdayImage.src = images[imageIndex];
	}, 30000);
	sceneTimer = window.setInterval(() => {
		background.classList.remove(...scenes);
		sceneIndex = (sceneIndex + 1) % scenes.length;
		background.classList.add(scenes[sceneIndex]);
	}, 12000);
	startWishUpdates();
}

birthdayImage.addEventListener("error", () => {
	imageIndex = 0;
	birthdayImage.src = images[0];
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	if (sending) return;
	const wish = normalizeWish({ name: nameInput.value, message: messageInput.value });
	if (!wish) {
		showStatus("Please enter your name and a message.", true);
		(nameInput.value.trim() ? messageInput : nameInput).focus();
		return;
	}

	const button = form.querySelector("button[type=submit]");
	sending = true;
	button.disabled = true;
	showStatus("");
	try {
		await withConfirmationTimeout(wish);
		wishes = [wish, ...wishes.filter((item) => !sameWish(item, wish))].slice(0, MAX_LOCAL_WISHES);
		cacheWishes();
		showStatus("Your wish has been sent.");
		form.reset();
		toast.textContent = `Thank you, ${wish.name}! Your wish has been sent.`;
		toast.classList.add("is-visible");
		window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
	} catch {
		const alreadyQueued = pending.some((item) => sameWish(item, wish));
		if (!alreadyQueued && pending.length >= MAX_PENDING_WISHES) {
			showStatus("Please keep this message and try again after the connection returns.", true);
		} else {
			if (!alreadyQueued) pending = [wish, ...pending];
			if (saveQueue()) {
				showStatus("Your wish is waiting to be delivered.");
				form.reset();
			} else {
				showStatus("We couldn't confirm delivery. Please keep the form open and try again.", true);
			}
		}
	} finally {
		sending = false;
		button.disabled = false;
	}
	renderWishes();
	showNextWish();
});

window.addEventListener("beforeprint", () => setPrivacyMode(true));
window.addEventListener("afterprint", () => setPrivacyMode(document.hidden || !document.hasFocus()));
window.addEventListener("blur", () => setPrivacyMode(true));
window.addEventListener("focus", () => {
	if (!document.hidden) setPrivacyMode(false);
});
window.addEventListener("pagehide", () => {
	setPrivacyMode(true);
	stopPageWork();
	window.clearInterval(retryTimer);
});
window.addEventListener("pageshow", () => {
	if (!document.hidden) {
		setPrivacyMode(false);
		startPageWork();
		flushPending();
		retryTimer = window.setInterval(flushPending, 30000);
	}
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		setPrivacyMode(true);
		stopPageWork();
	} else {
		setPrivacyMode(false);
		startPageWork();
		flushPending();
	}
});
window.addEventListener("online", flushPending);

renderWishes();
showNextWish();
startPageWork();
flushPending();
retryTimer = window.setInterval(flushPending, 30000);
window.setTimeout(() => {
	wishPanel.hidden = false;
}, 10000);
