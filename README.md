vtes
====

vtes adalah alat penguji versi yang menyinkronkan dan memperbarui nomor versi di berbagai file konfigurasi JSON berdasarkan mode pengembangan atau produksi saat ini dalam file konfigurasi YAML. vtes juga melakukan commit perubahan ke repositori Git.

Struktur Direktori
------------------

```
proyek-anda/
├── perform-version-tests/
│   ├── config/
│   │   └── config.yaml
│   ├── development.json
│   ├── production.json
│   └── commit.json
└── package.json
```

- `perform-version-tests/config/config.yaml`: File konfigurasi untuk menentukan mode (`development` atau `production`).
- `perform-version-tests/development.json`: File JSON untuk konfigurasi pengembangan.
- `perform-version-tests/production.json`: File JSON untuk konfigurasi produksi.
- `perform-version-tests/commit.json`: File JSON untuk menentukan pesan commit.
- `package.json`: File paket utama.

Memulai
-------

### Prasyarat

- Node.js (versi 10 atau lebih tinggi)
- Git
- Template .gitignore (opsional)

### Instalasi

  npm:

   ```sh
   npm install -g vtes
   ```
   
Setelah instalasi selesai jalankan perintah `vtes -h` (alias untuk `--help`) untuk melihat [`opsi`]

Konfigurasi
-----------

1. Buat file `config.yaml` jika belum ada. File ini harus berada di `perform-version-tests/config/config.yaml` dan seharusnya terlihat seperti ini:

   ```yaml
    # mode: dev (alias untuk development) atau mode: prod (alias untuk production)
    mode: development
    # atau
    # mode: production
   ```

2. Buat file `commit.json` jika belum ada. File ini harus berada di `perform-version-tests/commit.json` dan seharusnya terlihat seperti ini:

   ```json
   {
     "commitMessage": "Pesan commit Anda di sini"
   }
   ```

Penggunaan
----------

Untuk menjalankan vtes, gunakan perintah berikut:

```sh
vtes
```

Skrip ini akan:

- Menginisialisasi repositori `.git` jika belum ada.
- Membuat file Konfigurasi `config.yaml` jika belum ada.
- Membuat file `commit.json` jika belum ada.
- Membuat file `package.json` jika belum ada.
- Membuat file (`development.json` dan `production.json`) jika belum ada.
- Menyinkronkan konten `development.json` dan `production.json` dengan `package.json`.
- Menaikkan versi di `development.json` jika mode adalah `development`.
- Menaikkan versi di `production.json` jika mode adalah `production`.
- Melakukan commit perubahan ke repositori Git dengan pesan commit yang ditentukan di `commit.json`.

Contoh
------

### `config.yaml`:

```yaml
# mode: dev (alias untuk development) atau mode: prod (alias untuk production)
mode: development
# atau
# mode: production
```

### `commit.json`:

```json
{
  "commitMessage": "Pesan commit Anda di sini"
}
```

Output
------

- Memperbarui versi `development.json` atau `production.json` berdasarkan mode.
- Melakukan commit perubahan ke repositori Git.

Pemecahan Masalah
-----------------

- Jika Anda mengalami kesalahan terkait kunci Git, pastikan tidak ada proses Git lain yang berjalan dan hapus file `.git/index.lock` secara manual jika ada.
- Pastikan file `config.yaml` dan `commit.json` sudah diformat dengan benar dan ditempatkan di direktori yang benar.
- Dan sebelum melakukannya, pastikan Anda memiliki template `.gitignore` terlebih dahulu agar direktori `node_modules` diabaikan.

Kontribusi
----------

Silakan buka isu atau kirim pull request untuk perbaikan dan fitur baru.

Lisensi
-------

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file LICENSE untuk detail lebih lanjut.
