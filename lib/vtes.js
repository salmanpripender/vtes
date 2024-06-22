const VersionTester = require("./version-tester");

/**
 * Fungsi utama untuk menjalankan VersionTester.
 */
async function Vtes() {
  const tester = new VersionTester();
  await tester.handleCommandLineArgs();
}

Vtes().catch((err) => {
  console.error("Kesalahan menjalankan tester:", err);
});
