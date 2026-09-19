const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { cleanWish, getWishId } = require("./validation");

test("cleanWish trims valid input and rejects oversized fields", () => {
	assert.deepEqual(cleanWish({ name: " Bonheur ", message: " Happy birthday! " }), {
		name: "Bonheur",
		message: "Happy birthday!"
	});
	assert.equal(cleanWish({ name: "A", message: "x".repeat(141) }), null);
	assert.equal(cleanWish({ name: "", message: "Hello" }), null);
});

test("getWishId is deterministic for the same normalized wish", () => {
	const wish = { name: "Bonheur", message: "Happy birthday!" };
	assert.equal(getWishId(wish, crypto), getWishId(wish, crypto));
	assert.notEqual(getWishId(wish, crypto), getWishId({ ...wish, message: "Different" }, crypto));
});
