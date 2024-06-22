const readline = require("readline");
const fs = require("fs-extra");
const path = require("path");

const FileSystemManager = require("../file-system");
const GitManager = require("../git-manager");
const Utility = require("../utility");

/**
 * Kelas VersionTester untuk menguji dan mengelola versi aplikasi.
 */
class VersionTester {
  /**
   * Membuat instance VersionTester dengan manajer file system, Git, dan utilitas.
   */
  constructor() {
    this.fileSystemManager = new FileSystemManager();
    this.gitManager = new GitManager(this.fileSystemManager.commitJsonPath);
    this.utility = new Utility();
    this.defaultPackageJson = {
      name: "project-name",
      version: "1.0.0",
      description: "",
      main: "index.js",
      scripts: {
        test: 'echo "Error: no test specified" && exit 1',
      },
      author: "",
      license: "ISC",
    };
  }

  /**
   * Membaca versi dari file package.json alat ini.
   *
   * @returns {Promise<string>} Versi alat
   */
  async readPackageJsonVtes() {
    try {
      const packageJsonVtes = await this.fileSystemManager.fs.readJson(
        this.fileSystemManager.toolPackageJsonPath,
      );
      return packageJsonVtes.version;
    } catch (error) {
      console.error("Kesalahan membaca package.json alat:", error);
      throw error;
    }
  }

  /**
   * Membaca versi dari file package.json proyek.
   * @returns {Promise<string>} Versi proyek
   */
  async readPackageJson() {
    try {
      if (
        await this.fileSystemManager.fs.pathExists(
          this.fileSystemManager.projectPackageJsonPath,
        )
      ) {
        const packageJson = await this.fileSystemManager.fs.readJson(
          this.fileSystemManager.projectPackageJsonPath,
        );
        return packageJson.version;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Kesalahan membaca package.json proyek:", error);
      throw error;
    }
  }

  /**
   * Membuat file default jika tidak ada
   */
  async createDefaultFiles() {
    try {
      await this.fileSystemManager.ensureDirectories();

      const packageJsonExists = await this.fileSystemManager.fs.pathExists(
        this.fileSystemManager.projectPackageJsonPath,
      );

      if (!packageJsonExists) {
        await this.fileSystemManager.fs.writeJson(
          this.fileSystemManager.projectPackageJsonPath,
          this.defaultPackageJson,
          { spaces: 2 },
        );
      }

      const packageJson = await this.fileSystemManager.fs.readJson(
        this.fileSystemManager.projectPackageJsonPath,
      );

      if (
        !(await this.fileSystemManager.fs.pathExists(
          this.fileSystemManager.developmentJsonPath,
        ))
      ) {
        await this.fileSystemManager.fs.writeJson(
          this.fileSystemManager.developmentJsonPath,
          packageJson,
          {
            spaces: 2,
          },
        );
      }

      if (
        !(await this.fileSystemManager.fs.pathExists(
          this.fileSystemManager.productionJsonPath,
        ))
      ) {
        await this.fileSystemManager.fs.writeJson(
          this.fileSystemManager.productionJsonPath,
          packageJson,
          {
            spaces: 2,
          },
        );
      }

      if (
        !(await this.fileSystemManager.fs.pathExists(
          this.fileSystemManager.configPath,
        ))
      ) {
        await this.fileSystemManager.createConfig();
      }

      if (
        !(await this.fileSystemManager.fs.pathExists(
          this.fileSystemManager.commitJsonPath,
        ))
      ) {
        await this.fileSystemManager.createCommitConfig();
      }

      // Inisialisasi repositori Git jika belum ada
      if (!(await this.gitManager.isGitRepository())) {
        await this.gitManager.initializeGitRepository();
      }

      // Prompt untuk memilih template .gitignore jika belum ada, hanya saat --gitignore atau -git digunakan
      const gitIgnorePath = `${this.projectDir}/.gitignore`;
      if (!(await this.fileSystemManager.fs.pathExists(gitIgnorePath))) {
        const args = process.argv.slice(2);
        if (args.includes("--gitignore") || args.includes("-ignore")) {
          await this.selectGitIgnoreTemplate();
        }
      }
    } catch (err) {
      console.error("Kesalahan membuat file default:", err);
      throw err;
    }
  }

  /**
   * Memperbarui file JSON dengan versi baru.
   * @param {string} jsonPath - Path ke file JSON yang akan diperbarui.
   * @param {string} newVersion - Versi baru yang akan di-set di file JSON.
   */
  async updateJsonFile(jsonPath, newVersion) {
    try {
      const jsonFile = await this.fileSystemManager.fs.readJson(jsonPath);
      jsonFile.version = newVersion;
      await this.fileSystemManager.fs.writeJson(jsonPath, jsonFile, {
        spaces: 2,
      });
      console.log(`Berhasil memperbarui ${jsonPath} ke versi ${newVersion}`);
    } catch (err) {
      console.error(`Kesalahan memperbarui ${jsonPath}:`, err);
      throw err;
    }
  }

  /**
   * Proses utama
   * @param {boolean} watch - Apakah akan menjalankan dalam mode pemantauan
   */
  async main(watch = false) {
    try {
    await this.fileSystemManager.ensureDirectories();
    await this.createDefaultFiles();

    const config = await this.fileSystemManager.readConfig();
    const commitConfig = await this.fileSystemManager.readCommitConfig();

    if (!commitConfig.commitMessage) {
      console.log("Pesan commit tidak tersedia atau kosong.");
      return;
    }

    const jsonPath =
      config.mode === "development" || config.mode === "dev"
        ? this.fileSystemManager.developmentJsonPath
        : config.mode === "production" || config.mode === "prod"
        ? this.fileSystemManage.productionJsonPath
        : null;
        if (jsonPath === null) {
          console.log("Mode yang dipilih salah");
        } else {
          console.log(`Mode yang dipilih ${jsonPath}`);
        }
    const jsonFile = await this.fileSystemManager.fs.readJson(jsonPath);
    const currentVersion = jsonFile.version;

    // Ambil perubahan dari git diff
    let diffLines;
    try {
      diffLines = await this.gitManager.getGitDiff();
      if (typeof diffLines !== "string") {
        console.log("Tidak ada perbedaan git atau tidak ada commit sebelumnya.");
        diffLines = "";
      }
    } catch (error) {
      console.error("Kesalahan mengambil perbedaan git:", error);
      diffLines = "";
    }

    // Tentukan jenis peningkatan versi
    const versionType = this.utility.detectVersionTypeFromDiff(diffLines);
    const newVersion = this.utility.incrementVersion(
      currentVersion,
      versionType,
    );

    await this.updateJsonFile(jsonPath, newVersion);

    console.log("Melakukan commit dengan pesan:", commitConfig.commitMessage);
    await this.gitManager.performCommit(commitConfig.commitMessage);

    // Kosongkan commit.json setelah commit berhasil
    await this.fileSystemManager.fs.writeJson(
      this.fileSystemManager.commitJsonPath,
      { commitMessage: "" },
      { spaces: 2 },
    );
    console.log("commit.json telah dikosongkan.");

    // Lakukan commit untuk mengosongkan commit.json
    await this.gitManager.performCommit("Kosongkan commit.json setelah commit");

  } catch (error) {
    console.error("Kesalahan dalam proses utama:", error);
  }
  }

  /**
   * Memulai proses pemantauan atau menjalankan proses utama
   * @param {boolean} watch - Apakah akan menjalankan dalam mode pemantauan
   */
  async start(watch) {
    if (watch) {
      console.log("Memulai pemantauan perubahan di commit.json...");
      this.fileSystemManager.fs.watchFile(
        this.fileSystemManager.commitJsonPath,
        async (curr, prev) => {
          if (curr.mtime !== prev.mtime) {
            console.log(
              "Perubahan terdeteksi di commit.json, menjalankan proses utama...",
            );
            await this.main(watch);
          }
        },
      );
    } else {
      await this.main(watch);
    }
  }

  /**
   * Menangani argumen baris perintah
   */
  async handleCommandLineArgs() {
    const args = process.argv.slice(2);

    if (args.includes("--Version") || args.includes("-V")) {
      const versionVtes = await this.readPackageJsonVtes();
      console.log(`v${versionVtes}`);
      process.exit(0);
    }
    
    if (args.includes("--version") || args.includes("-v")) {
      const versionApp = await this.readPackageJson();
      console.log(`Versi Proyek: ${versionApp}`);
      process.exit(0);
    }

    if (args.includes("--help") || args.includes("-h")) {
      this.displayHelp();
      process.exit(0);
    }

    // Hanya memunculkan prompt untuk .gitignore jika --gitignore atau -git digunakan
    if (args.includes("--gitignore") || args.includes("-ignore")) {
      await this.selectGitIgnoreTemplate();
      process.exit(0);
    }

    await this.start(args.includes("--write") || args.includes("-w"));
  }

  /**
   * Menampilkan pesan bantuan
   */
  displayHelp() {
    console.log(`
Penggunaan: vtes [opsi]

Opsi:
-h, --help            Menampilkan pesan bantuan ini
-V, --Version         Menampilkan informasi versi version-tester
-v, --version         Menampilkan informasi versi proyek anda
-w, --watch           Memantau perubahan di commit.json
-ignore, --gitignore  Memilih template .gitignore
    `);
  }

  /**
   * Memilih template .gitignore dari daftar yang tersedia
   */
  async selectGitIgnoreTemplate() {
    const templates = [
    "AL",
    "Actionscript",
    "Ada",
    "Agda",
    "Android",
    "AppEngine",
    "AppceleratorTitanium",
    "ArchLinuxPackages",
    "Autotools",
    "Ballerina",
    "C++",
    "C",
    "CFWheels",
    "CMake",
    "CUDA",
    "CakePHP",
    "ChefCookbook",
    "Clojure",
    "CodeIgniter",
    "CommonLisp",
    "Composer",
    "Concrete5",
    "Coq",
    "CraftCMS",
    "D",
    "DM",
    "Dart",
    "Delphi",
    "Drupal",
    "EPiServer",
    "Eagle",
    "Elisp",
    "Elixir",
    "Elm",
    "Erlang",
    "ExpressionEngine",
    "ExtJs",
    "Fancy",
    "Finale",
    "FlaxEngine",
    "ForceDotCom",
    "Fortran",
    "FuelPHP",
    "GWT",
    "Gcov",
    "GitBook",
    "GitHubPages",
    "Go",
    "Godot",
    "Gradle",
    "Grails",
    "Haskell",
    "IAR",
    "IGORPro",
    "Idris",
    "JBoss",
    "JENKINS_HOME",
    "Java",
    "Jekyll",
    "Joomla",
    "Julia",
    "KiCad",
    "Kohana",
    "Kotlin",
    "LabVIEW",
    "Laravel",
    "Leiningen",
    "LemonStand",
    "Lilypond",
    "Lithium",
    "Lua",
    "Magento",
    "Maven",
    "Mercury",
    "MetaProgrammingSystem",
    "Nanoc",
    "Nim",
    "Node",
    "OCaml",
    "Objective-C",
    "Opa",
    "OpenCart",
    "OracleForms",
    "Packer",
    "Perl",
    "Phalcon",
    "PlayFramework",
    "Plone",
    "Prestashop",
    "Processing",
    "PureScript",
    "Python",
    "Qooxdoo",
    "Qt",
    "R",
    "ROS",
    "Racket",
    "Rails",
    "Raku",
    "RhodesRhomobile",
    "Ruby",
    "Rust",
    "SCons",
    "Sass",
    "Scala",
    "Scheme",
    "Scrivener",
    "Sdcc",
    "SeamGen",
    "SketchUp",
    "Smalltalk",
    "Stella",
    "SugarCRM",
    "Swift",
    "Symfony",
    "SymphonyCMS",
    "TeX",
    "Terraform",
    "Textpattern",
    "TurboGears2",
    "TwinCAT3",
    "Typo3",
    "Unity",
    "UnrealEngine",
    "VVVV",
    "VisualStudio",
    "Waf",
    "WordPress",
    "Xojo",
    "Yeoman",
    "Yii",
    "ZendFramework",
    "Zephir"
]


    console.log("Pilih template .gitignore yang ingin Anda gunakan:");
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template}`);
    });

    const { templateIndex } = await this.promptTemplateSelection();

    if (templateIndex >= 0 && templateIndex < templates.length) {
      const templateName = templates[templateIndex];
      await this.fileSystemManager.fetchGitIgnoreTemplate(templateName);
    } else {
      console.log("Pilihan tidak valid. Membatalkan proses pengambilan template .gitignore.");
    }
  }

  /**
   * Prompt untuk memilih template .gitignore
   * @returns {Promise<number>} Indeks template yang dipilih
   */
  async promptTemplateSelection() {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question("Masukkan nomor template: ", (answer) => {
        const templateIndex = parseInt(answer) - 1;
        resolve({ templateIndex });
        readline.close();
      });
    });
  }
}

module.exports = VersionTester;
