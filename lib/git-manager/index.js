const { exec } = require("child_process");

class GitManager {
  constructor(commitJsonPath) {
    this.commitJsonPath = commitJsonPath;
  }

  /**
   * Memeriksa apakah repository Git sudah diinisialisasi.
   * @returns {Promise<boolean>}
   */
  async isGitRepository() {
    try {
      await this.executeCommand("git rev-parse --is-inside-work-tree");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Menginisialisasi repository Git.
   */
  async initializeGitRepository() {
    try {
      await this.executeCommand("git init");
      console.log("Repository Git berhasil diinisialisasi.");
    } catch (error) {
      console.error("Gagal menginisialisasi repository Git:", error);
    }
  }

  /**
   * Mengeksekusi perintah Git dan mengembalikan hasilnya.
   * @param {string} command Perintah Git yang akan dieksekusi.
   * @returns {Promise<string>}
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stderr });
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Mendapatkan perbedaan Git antara commit terakhir dan commit sebelumnya.
   * @returns {Promise<string[]>}
   */
  async getGitDiff() {
    try {
      // Cek apakah ada commit sebelumnya
      const hasCommits = await this.hasCommits();
      if (!hasCommits) {
        console.log("Tidak ada commit sebelumnya.");
        return [];
      }

      // Ambil perbedaan git
      const diffOutput = await this.executeCommand("git diff --name-status HEAD~1 HEAD");
      return diffOutput.split("\n");
    } catch (error) {
      console.error("Kesalahan mengambil perbedaan git:", error);
      throw error;
    }
  }

  /**
   * Memeriksa apakah repository memiliki commit.
   * @returns {Promise<boolean>}
   */
  async hasCommits() {
    try {
      await this.executeCommand("git log -1");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Melakukan commit dengan pesan tertentu.
   * @param {string} message Pesan commit.
   */
  async performCommit(message) {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(`git add . && git commit -m "${message}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Kesalahan saat melakukan commit: ${stderr}`);
          reject(error);
        } else {
          console.log(`Commit berhasil: ${stdout}`);
          resolve(stdout);
        }
      });
    });
  }
}

module.exports = GitManager;
