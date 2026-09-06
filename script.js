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
const blockedShortcuts = new Set(["s", "u", "p"]);

let wishes = loadWishes();
let tickerIndex = 0;
let tickerTimer;
let imageIndex = 0;
let imageTimer;

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
			? savedWishes.map((wish) => typeof wish === "string" ? { name: "A friend", message: wish } : wish).filter((wish) => wish?.name && wish?.message).slice(0, 20)
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

function renderWishes() {
	wishList.replaceChildren();
	wishes.forEach((wish) => {
		const wishItem = document.createElement("li");
		wishItem.textContent = `${wish.name}: ${wish.message}`;
		wishList.append(wishItem);
	});
	wishCount.textContent = wishes.length;
}

function showThankYou() {
	toast.textContent = "Thank you for your lovely wish!";
	toast.classList.add("is-visible");
	window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

wishForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const name = wishName.value.trim();
	const wish = wishInput.value.trim();

	if (!name || !wish) {
		formStatus.textContent = "Please add your name and wish.";
		(name ? wishInput : wishName).focus();
		return;
	}

	wishes = [{ name, message: wish }, ...wishes].slice(0, 20);
	saveWishes();
	renderWishes();
	tickerIndex = 0;
	showNextWish();
	wishForm.reset();
	formStatus.textContent = "Wish added.";
	showThankYou();
});

renderWishes();
startTicker();
imageTimer = window.setInterval(rotateBirthdayImage, imageChangeDelay);
window.setTimeout(() => {
	wishPanel.hidden = false;
	wishInput.focus({ preventScroll: true });
}, revealDelay);

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		window.clearInterval(tickerTimer);
		window.clearInterval(imageTimer);
	} else {
		startTicker();
		imageTimer = window.setInterval(rotateBirthdayImage, imageChangeDelay);
	}
});
