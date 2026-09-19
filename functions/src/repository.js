function createWishRepository({ db, FieldValue, backupService, getWishId, maxWishes }) {
	const collection = db.collection("birthdayWishes");

	async function saveWish(wish) {
		const wishId = getWishId(wish);
		const reference = collection.doc(wishId);
		let isNewWish = false;

		await db.runTransaction(async (transaction) => {
			const snapshot = await transaction.get(reference);
			if (!snapshot.exists) {
				isNewWish = true;
				transaction.set(reference, { ...wish, createdAt: FieldValue.serverTimestamp(), backupStatus: "pending" });
			}
		});

		if (isNewWish) {
			try {
				await backupService.backupWish(wish, wishId);
				await reference.update({ backupStatus: "complete", backupUpdatedAt: FieldValue.serverTimestamp() });
			} catch (error) {
				console.error("GitHub backup is pending.", { wishId, error: error.message });
			}
		}

		return wishId;
	}

	async function listWishes() {
		const snapshot = await collection.orderBy("createdAt", "desc").limit(maxWishes).get();
		return snapshot.docs.map((document) => document.data());
	}

	async function retryPendingBackups() {
		const snapshot = await collection.where("backupStatus", "==", "pending").limit(25).get();
		for (const document of snapshot.docs) {
			try {
				await backupService.backupWish(document.data(), document.id);
				await document.ref.update({ backupStatus: "complete", backupUpdatedAt: FieldValue.serverTimestamp() });
			} catch (error) {
				console.error("GitHub backup retry is pending.", { wishId: document.id, error: error.message });
			}
		}
	}

	return { listWishes, retryPendingBackups, saveWish };
}

module.exports = { createWishRepository };
