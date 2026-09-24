const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {cleanWish, wishId} = require("./validation");

test("validates and trims wishes", () => {
  const validWish = {name: " Aline ", message: " Happy birthday! "};
  assert.deepEqual(cleanWish(validWish), {
    name: "Aline",
    message: "Happy birthday!",
  });
  assert.equal(cleanWish({name: "", message: "Hello"}), null);
  assert.equal(cleanWish({name: "Bonheur", message: "Hello"}), null);
});

test("creates deterministic ids", () => {
  const wish = {name: "Bonheur", message: "Happy birthday!"};
  assert.equal(wishId(wish, crypto), wishId(wish, crypto));
});
