const wishForm = document.querySelector("#wish-form");
const wishInput = document.querySelector("#wish-input");
const wishPanel = document.querySelector("#wish-panel");
const wishList = document.querySelector("#wish-list");
const wishCount = document.querySelector("#wish-count");
const tickerText = document.querySelector("#wish-ticker-text");
const formStatus = document.querySelector("#form-status");
const toast = document.querySelector("#toast");
const storageKey = "bonheur-birthday-wishes";
const revealDelay = 20000;
const starterWishes = [
	"Wishing you a year full of bright moments!",
	"May your birthday be as wonderful as you are.",
	"More joy, laughter, and beautiful memories!",
	"Cheers to your happiest year yet!"
];

let wishes = loadWishes();
let tickerIndex = 0;
let tickerTimer;

function loadWishes() {
	try {
		const savedWishes = JSON.parse(localStorage.getItem(storageKey));
		return Array.isArray(savedWishes) ? savedWishes.filter(Boolean).slice(0, 20) : [];
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
	tickerText.classList.remove("is-changing");
	void tickerText.offsetWidth;
	tickerText.textContent = availableWishes[tickerIndex % availableWishes.length];
	tickerText.classList.add("is-changing");
	tickerIndex += 1;
}

function startTicker() {
	window.clearInterval(tickerTimer);
	showNextWish();
	tickerTimer = window.setInterval(showNextWish, 4200);
}

function renderWishes() {
	wishList.replaceChildren();
	wishes.forEach((wish) => {
		const wishItem = document.createElement("li");
		wishItem.textContent = wish;
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
	const wish = wishInput.value.trim();

	if (!wish) {
		formStatus.textContent = "Please write a wish first.";
		wishInput.focus();
		return;
	}

	wishes = [wish, ...wishes].slice(0, 20);
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
window.setTimeout(() => {
	wishPanel.hidden = false;
	wishInput.focus({ preventScroll: true });
}, revealDelay);

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		window.clearInterval(tickerTimer);
	} else {
		startTicker();
	}
});
