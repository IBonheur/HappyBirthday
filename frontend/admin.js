import { auth, isAdmin, signInAsAdmin } from "./firebase.js";

const backendUrl = "https://us-central1-happybirthday-6d8ee.cloudfunctions.net/wishesApi";

export async function getAdminToken() {
	if (!isAdmin()) await signInAsAdmin();
	return auth.currentUser.getIdToken();
}

export async function listAdminWishes() {
	const token = await getAdminToken();
	const response = await fetch(`${backendUrl}/admin/wishes`, {
		headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
	});
	if (!response.ok) throw new Error("Administrator access was denied.");
	return (await response.json()).wishes || [];
}