# Panduan Setup Lengkap

Dokumen ini berisi panduan lengkap untuk setup dan menjalankan Sistem Informasi Kesehatan.

## Persyaratan Sistem

- Windows/Mac/Linux
- Node.js v18+ ([Download](https://nodejs.org/))
- MySQL
- Browser modern (Chrome, Firefox, Edge, dll)

## Langkah-Langkah Setup

### 1. Setup XAMPP (jika menggunakan XAMPP)

1. Install XAMPP dari [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Jalankan XAMPP Control Panel
3. Start **Apache** dan **MySQL**
4. Klik **Admin** pada MySQL untuk membuka phpMyAdmin

### 2. Clone/Download Project

Jika menggunakan Git:
```bash
git clone <repository-url>
cd Tugas-Besar-EB4007
```

Atau download ZIP dan extract.

### 3. Install Dependencies

Buka terminal/command prompt di folder project, lalu jalankan:

```bash
npm install
```

Tunggu hingga proses selesai (sekitar 1-3 menit).

### 4. Setup Database

#### Cara 1: Menggunakan phpMyAdmin (Paling Mudah)

1. Buka browser dan akses [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Klik tab **"SQL"** di bagian atas
3. Copy seluruh isi dari file `database/schema.sql` dan paste ke editor SQL
4. Klik **"Go"** untuk menjalankan query
5. Ulangi langkah 3-4 untuk file `database/seed.sql`

#### Cara 2: Menggunakan Command Line

```bash
# Buat database
mysql -u root -p -e "CREATE DATABASE hospital_system;"

# Import schema
mysql -u root -p hospital_system < database/schema.sql

# Import data seeding
mysql -u root -p hospital_system < database/seed.sql
```

**Note:** Jika MySQL tidak memiliki password, hilangkan flag `-p`

#### Verifikasi Database

Setelah import, pastikan:
- Database `hospital_system` sudah dibuat
- Ada 15 tabel (users, patients, doctors, dst.)
- Tabel berisi data (minimal ada data di tabel users dan patients)

### 5. Konfigurasi Environment

File `.env.local` sudah tersedia dengan konfigurasi default untuk XAMPP:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hospital_system
DB_PORT=3306
```

**Ubah jika diperlukan:**
- Jika MySQL memiliki password, isi `DB_PASSWORD=your_password`
- Jika port MySQL berbeda, ubah `DB_PORT`

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Output yang diharapkan:
```
  ▲ Next.js 16.0.6
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

### 7. Akses Aplikasi

Buka browser dan akses: [http://localhost:3000](http://localhost:3000)

Anda akan melihat halaman landing. Klik **"Masuk ke Sistem"** untuk login.

## Login Pertama Kali

Gunakan kredensial berikut untuk testing:

**Untuk Dokter:**
- Username: `dr_andy`
- Password: `password123`

**Untuk Pasien:**
- Username: `patient001`
- Password: `password123`

**Untuk Staf Pendaftaran:**
- Username: `staff_reg001`
- Password: `password123`

Lihat README.md untuk kredensial lengkap semua role.

## Troubleshooting

### Problem: npm install error

**Solusi:**
- Pastikan Node.js sudah terinstall (cek dengan `node --version`)
- Hapus folder `node_modules` dan file `package-lock.json`, lalu `npm install` lagi
- Coba gunakan `npm install --legacy-peer-deps`

### Problem: Database connection error

**Solusi:**
1. Pastikan MySQL sudah running (cek di XAMPP Control Panel)
2. Cek kredensial di `.env.local` sudah benar
3. Test koneksi database di phpMyAdmin
4. Pastikan database `hospital_system` sudah dibuat

### Problem: Port 3000 already in use

**Solusi:**
Jalankan di port lain:
```bash
npm run dev -- -p 3001
```

Atau matikan aplikasi lain yang menggunakan port 3000.

### Problem: Halaman login tidak bisa submit

**Solusi:**
1. Cek console browser (F12) untuk error
2. Pastikan API routes berjalan (cek terminal)
3. Clear browser cache dan cookies
4. Coba browser lain

### Problem: Data tidak muncul di dashboard

**Solusi:**
1. Pastikan data seeding sudah di-import
2. Cek tabel di phpMyAdmin apakah ada data
3. Cek Network tab di browser (F12) untuk response API
4. Restart aplikasi (`Ctrl+C` lalu `npm run dev` lagi)

## Tips Development

### Restart Aplikasi
Jika ada perubahan pada file `.env.local` atau terjadi error:
```bash
# Tekan Ctrl+C untuk stop
# Lalu jalankan lagi
npm run dev
```

### Lihat Log Database
Semua query dan error database akan muncul di terminal tempat `npm run dev` berjalan.

### Reset Database
Jika ingin reset database ke kondisi awal:
```bash
mysql -u root -p hospital_system < database/schema.sql
mysql -u root -p hospital_system < database/seed.sql
```

### Build Production
Untuk deploy production:
```bash
npm run build
npm start
```

## Kontak Support

Jika mengalami kendala yang tidak bisa diselesaikan, hubungi:
- [Nama Anggota 1] - [email/wa]
- [Nama Anggota 2] - [email/wa]
- [Nama Anggota 3] - [email/wa]

## Checklist Setup

Gunakan checklist ini untuk memastikan setup sukses:

- [ ] XAMPP terinstall dan MySQL running
- [ ] Node.js terinstall (v18+)
- [ ] Project sudah di-clone/download
- [ ] `npm install` berhasil tanpa error
- [ ] Database `hospital_system` sudah dibuat
- [ ] Schema database sudah di-import
- [ ] Data seeding sudah di-import
- [ ] File `.env.local` sudah dikonfigurasi
- [ ] `npm run dev` berhasil dan server running
- [ ] Bisa akses [http://localhost:3000](http://localhost:3000)
- [ ] Bisa login dengan kredensial demo
- [ ] Dashboard muncul setelah login

Jika semua checklist terpenuhi, setup berhasil! 🎉
