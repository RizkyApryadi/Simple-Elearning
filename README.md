# E-Learning System

Aplikasi web pembelajaran berbasis video dengan backend Laravel dan frontend React, dilengkapi manajemen kursus & pelajaran untuk admin serta katalog, pemutar video, pencarian, dan pagination untuk siswa.

## Requirement

- **PHP** >= 
- **Composer** >= 2.x
- **Node.js** >= 18.x & **npm**
- **MySQL** (atau MariaDB)

## Instalasi

1. **Clone repository & masuk ke folder project**
   ```bash
   git clone <url-repository-anda>
   cd <nama-folder-project>
   ```

2. **Install dependensi backend (PHP)**
   ```bash
   composer install
   ```

3. **Install dependensi frontend (Node.js)**
   ```bash
   npm install
   ```

4. **Salin file environment & generate application key**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

## Konfigurasi

1. **Atur koneksi database & storage pada `.env`**
   ```env
   APP_NAME="Ruang Belajar"
   APP_URL=http://127.0.0.1:8000

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=nama_database_anda
   DB_USERNAME=root
   DB_PASSWORD=
   ```

2. **Jalankan migrasi database & seeder**
   ```bash
   php artisan migrate --seed
   ```

3. **Buat symbolic link storage (jika menggunakan public storage untuk thumbnail/aset)**
   ```bash
   php artisan storage:link
   ```

## Cara Menjalankan

Jalankan server backend dan frontend development server pada terminal terpisah:

- **Backend Laravel**
  ```bash
  php artisan serve
  ```

- **Frontend Vite / React**
  ```bash
  npm run dev
  ```

## Akun Demo

Jika data seeder sudah dijalankan (atau disesuaikan dengan seeder/akun yang tersedia di aplikasi):

| Role | Email | Kata Sandi |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password` |
| **Student** | `student@example.com` | `password` |

