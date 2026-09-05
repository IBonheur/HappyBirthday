

const wishForm = document.querySelector("#wish-form");
const wishInput = document.querySelector("#wish-input");
const wishList = document.querySelector("#wish-list");
const wishCount = document.querySelector("#wish-count");
const formStatus = document.querySelector("#form-status");
const storageKey = "bonheur-birthday-wishes";

let wishes = loadWishes();

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
	}
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

wishForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const wish = wishInput.value.trim();

	if (!wish) {
		formStatus.textContent = "Write a wish before sending it.";
		wishInput.focus();
		return;
	}

	wishes = [wish, ...wishes].slice(0, 20);
	saveWishes();
	renderWishes();
	wishForm.reset();
	formStatus.textContent = "Your birthday wish has been added.";
});

renderWishes();
