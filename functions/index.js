const crypto = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const config = require("./src/config");
const { createApi } = require("./src/api");

initializeApp();
const db = getFirestore();
const auth = getAuth();

exports.wishesApi = onRequest({ region: "us-central1" }, createApi({
	db,
	auth,
	FieldValue,
	crypto,
	config
}));
