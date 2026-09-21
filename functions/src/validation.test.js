const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {cleanWish, wishId} = require("./validation");

test("validates and trims wishes", () => {
  assert.deepEqual(cleanWish({name: " Bonheur ", message: " Happy birthday! "}), {name: "Bonheur", message: "Happy birthday!"});
  assert.equal(cleanWish({name: "", message: "Hello"}), null);
});

test("creates deterministic ids", () => {
  const wish = {name: "Bonheur", message: "Happy birthday!"};
  assert.equal(wishId(wish, crypto), wishId(wish, crypto));
});
