import { createWish, watchWishes } from "./api.js";
import { MAX_DISPLAY_WISHES } from "./config.js";
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

let wishes = [];
let stopWatching;
let watchGeneration = 0;
let tickerTimer;
let imageTimer;
let sceneTimer;
let imageIndex = 0;
let sceneIndex = 0;
let tickerIndex = 0;
let sending = false;

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
		const unsubscribe = await watchWishes((latest) => {
			wishes = latest.map(normalizeWish).filter(Boolean);
			renderWishes();
			tickerIndex = 0;
			showNextWish();
		}, () => showStatus("Wishes are temporarily unavailable. Please try again later.", true));
		if (generation !== watchGeneration || document.hidden) {
			unsubscribe();
			return;
		}
		stopWatching = unsubscribe;
	} catch {
		showStatus("Wishes are temporarily unavailable. Please try again later.", true);
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
		wishes = [wish, ...wishes.filter((item) => item.name !== wish.name || item.message !== wish.message)].slice(0, MAX_DISPLAY_WISHES);
		showStatus("Your wish has been sent.");
		form.reset();
		toast.textContent = `Thank you, ${wish.name}! Your wish has been sent.`;
		toast.classList.add("is-visible");
		window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
	} catch {
		showStatus("Your wish hasn't been sent yet. Please try again.", true);
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
});
window.addEventListener("pageshow", () => {
	if (!document.hidden) {
		setPrivacyMode(false);
		startPageWork();
	}
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		setPrivacyMode(true);
		stopPageWork();
	} else {
		setPrivacyMode(false);
		startPageWork();
	}
});

renderWishes();
showNextWish();
startPageWork();
window.setTimeout(() => {
	wishPanel.hidden = false;
}, 10000);
