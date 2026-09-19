const allowedOrigins = new Set([
	"https://happybirthday-6d8ee.web.app",
	"https://happybirthday-6d8ee.firebaseapp.com",
	"https://ibonheur.github.io"
]);

module.exports = {
	allowedOrigins,
	githubApi: "https://api.github.com",
	githubOwner: "IBonheur",
	githubRepo: "HappyBirthday",
	githubBackupDirectory: "backups/wishes",
	maxWishes: 50,
	requestWindowMs: 60 * 1000,
	maxWritesPerWindow: 5
};
