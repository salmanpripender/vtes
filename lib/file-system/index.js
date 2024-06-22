const fs = require("fs-extra");
const yaml = require("js-yaml");
const path = require("path");
const axios = require("axios");

/**
 * Kelas untuk mengelola operasi sistem berkas.
 */
class FileSystemManager {
  constructor() {
    this.toolPackageJsonPath = path.join(__dirname, "config", "../../../package.json");
    this.projectDir = process.cwd();
    this.projectPackageJsonPath = `${this.projectDir}/package.json`;
    this.configPath = `${this.projectDir}/perform-version-tests/config/config.yaml`;
    this.commitJsonPath = `${this.projectDir}/perform-version-tests/commit.json`;
    this.developmentJsonPath = `${this.projectDir}/perform-version-tests/development.json`;
    this.productionJsonPath = `${this.projectDir}/perform-version-tests/production.json`;

    this.fs = fs;
    this.yaml = yaml;
    this.axios = axios;
  }

  /**
   * Memastikan direktori yang dibutuhkan ada
   */
  async ensureDirectories() {
    await this.fs.ensureDir(path.dirname(this.configPath));
    await this.fs.ensureDir(path.dirname(this.commitJsonPath));
  }

  /**
   * Membaca file konfigurasi
   * @returns {Promise<Object>} Objek konfigurasi
   */
  async readConfig() {
    try {
      const configFile = await this.fs.readFile(this.configPath, "utf8");
      return this.yaml.load(configFile);
    } catch (error) {
      console.error(`Kesalahan membaca config.yaml: ${error.message}`);
      throw error; // Dilempar kembali agar dapat ditangani di tempat lain jika perlu
    }
  }

  /**
   * Membaca file commit.json
   * @returns {Promise<Object>} Objek konfigurasi commit
   */
  async readCommitConfig() {
    try {
      return this.fs.readJson(this.commitJsonPath);
    } catch (error) {
      console.error(`Kesalahan membaca commit.json: ${error.message}`);
      throw error;
    }
  }

  /**
   * Membuat file konfigurasi default jika tidak ada
   */
  // async createConfig() {
  //   const defaultConfig = {
  //     mode: "development",
  //   };
  //   await this.fs.writeFile(this.configPath, this.yaml.dump(defaultConfig), "utf8");
  // }
  async createConfig() {
    const defaultConfig = `# mode: dev (alias untuk development) atau mode: prod (alias untuk production)
mode: development
# atau
# mode: production
`;
    await this.fs.writeFile(this.configPath, defaultConfig, "utf8");
  }

  /**
   * Membuat file commit.json default jika tidak ada
   */
  async createCommitConfig() {
    const defaultCommitConfig = {
      commitMessage: "",
    };
    await this.fs.writeJson(this.commitJsonPath, defaultCommitConfig, { spaces: 2 });
  }

  /**
   * Mengambil template .gitignore dari repositori GitHub
   * @param {string} templateName - Nama template .gitignore yang diinginkan
   * @returns {Promise<void>}
   */
  async fetchGitIgnoreTemplate(templateName) {
    const url = `https://raw.githubusercontent.com/github/gitignore/master/${templateName}.gitignore`;
    try {
      const response = await this.axios.get(url);
      await this.fs.writeFile(`${this.projectDir}/.gitignore`, response.data, "utf8");
      console.log(`Berhasil menyimpan template .gitignore: ${templateName}`);
    } catch (error) {
      console.error(`Gagal mengambil template .gitignore: ${error.message}`);
      throw error;
    }
  }
}

module.exports = FileSystemManager;
