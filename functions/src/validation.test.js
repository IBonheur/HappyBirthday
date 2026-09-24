const test = require("node:test");
const assert = require("node:assert/strict");
const {cleanWish} = require("./validation");

test("validates and trims wishes", () => {
  const validWish = {name: " Aline ", message: " Happy birthday! "};
  assert.deepEqual(cleanWish(validWish), {
    name: "Aline",
    message: "Happy birthday!",
  });
  assert.equal(cleanWish({name: "", message: "Hello"}), null);
  assert.deepEqual(cleanWish({name: "Bonheur", message: "Hello"}), {name: "Bonheur", message: "Hello"});
  assert.deepEqual(cleanWish({
    name: "Bonheur",
    message: "Hello",
    clientId: "abcdefghijklmnopqrst",
  }), {
    name: "Bonheur",
    message: "Hello",
    clientId: "abcdefghijklmnopqrst",
  });
});
