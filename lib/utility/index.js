const semver = require("semver");

/**
 * Utility untuk mendeteksi jenis versi dari perbedaan (diff).
 */
class Utility {
  /**
   * Mendeteksi jenis versi dari diff git.
   * @param {string} diffLines - Perubahan dari git diff.
   * @returns {string} Jenis versi (major, minor, patch).
   */
  detectVersionTypeFromDiff(diffLines) {
    if (!diffLines || typeof diffLines !== "string") {
      return "patch"; // Default jika tidak ada diff atau diff tidak valid
    }
    // Proses diffLines untuk menentukan tipe versi (major, minor, patch)
    const lines = diffLines.split("\n");
    // Logic untuk menentukan tipe versi berdasarkan diffLines
    // Contoh sederhana:
    if (lines.some(line => line.includes("BREAKING CHANGE"))) {
      return "major";
    } else if (lines.some(line => line.includes("feat:"))) {
      return "minor";
    } else {
      return "patch";
    }
  }

  /**
   * Menambah versi berdasarkan jenis.
   * @param {string} version - Versi saat ini.
   * @param {string} type - Jenis versi (major, minor, patch).
   * @returns {string} Versi yang diperbarui.
   */
  incrementVersion(version, type) {
    const [major, minor, patch] = version.split(".").map(Number);

    switch (type) {
      case "major":
        return `${major + 1}.0.0`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      case "patch":
        return `${major}.${minor}.${patch + 1}`;
      default:
        throw new Error(`Jenis versi tidak dikenal: ${type}`);
    }
  }
}

module.exports = Utility;
