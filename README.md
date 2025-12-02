# Sistem Informasi Kesehatan

Tugas Besar EB4007 - Sistem Informasi Kesehatan

Aplikasi berbasis web untuk pelayanan di instansi kesehatan yang mencakup proses bisnis lengkap mulai dari pendaftaran pasien hingga pembayaran, dengan fitur monitoring wearable device.

## Fitur Utama

- **Multi-Role Authentication**: Login untuk Pasien, Dokter, Staf Pendaftaran, Farmasi, Lab, dan Kasir
- **Pendaftaran Pasien**: Registrasi dan pembuatan janji temu
- **Rekam Medis**: Pemeriksaan dokter dan pencatatan diagnosis
- **Farmasi**: Manajemen resep dan obat
- **Laboratorium**: Pemeriksaan lab dan hasil tes
- **Pembayaran**: Sistem kasir dan pembayaran
- **Wearable Device Monitoring**: Pemantauan kesehatan real-time
- **Sistem Rujukan**: Rujukan ke spesialis/rumah sakit lain

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: MySQL 8
- **Language**: TypeScript
- **Authentication**: Cookie-based sessions dengan bcrypt

## Prerequisites

Pastikan sudah terinstall:
- Node.js (v18 atau lebih baru)
- MySQL Server (atau XAMPP)
- npm atau yarn

## Setup & Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd Tugas-Besar-EB4007
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

#### a. Buat Database

Buka MySQL (via XAMPP atau command line) dan buat database baru:

```sql
CREATE DATABASE hospital_system;
```

#### b. Import Schema

Import file schema database:

```bash
mysql -u root -p hospital_system < database/schema.sql
```

Atau melalui phpMyAdmin:
1. Buka phpMyAdmin
2. Pilih database `hospital_system`
3. Klik tab "Import"
4. Pilih file `database/schema.sql`
5. Klik "Go"

#### c. Import Data Seeding

Import data sample untuk testing:

```bash
mysql -u root -p hospital_system < database/seed.sql
```

Atau melalui phpMyAdmin (sama seperti import schema).

### 4. Konfigurasi Environment

File `.env.local` sudah tersedia dengan konfigurasi default:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hospital_system
DB_PORT=3306
```

Sesuaikan konfigurasi jika diperlukan (misalnya jika MySQL password berbeda).

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di: [http://localhost:3000](http://localhost:3000)

## Kredensial Login (Demo)

### Pasien
- Username: `patient001`, `patient002`, `patient003`, `patient004`
- Password: `password123`

### Dokter
- Username: `dr_andy`, `dr_budi`, `dr_clara`
- Password: `password123`

### Staf Pendaftaran
- Username: `staff_reg001`, `staff_reg002`
- Password: `password123`

### Staf Farmasi
- Username: `pharmacy001`, `pharmacy002`
- Password: `password123`

### Staf Laboratorium
- Username: `lab001`, `lab002`
- Password: `password123`

### Kasir
- Username: `cashier001`, `cashier002`
- Password: `password123`

## Struktur Database

### Tabel Utama:

1. **users** - Autentikasi pengguna
2. **patients** - Data pasien
3. **doctors** - Data dokter
4. **staff** - Data staf (pendaftaran, farmasi, lab, kasir)
5. **appointments** - Janji temu/pendaftaran
6. **medical_records** - Rekam medis pemeriksaan
7. **medications** - Data obat
8. **prescriptions** - Resep obat
9. **prescription_items** - Detail item resep
10. **lab_tests** - Pemeriksaan laboratorium
11. **lab_results** - Hasil pemeriksaan lab
12. **payments** - Pembayaran
13. **payment_items** - Detail item pembayaran
14. **referrals** - Rujukan pasien
15. **wearable_data** - Data monitoring dari wearable device

## Struktur Folder

```
├── database/
│   ├── schema.sql       # Schema database
│   └── seed.sql         # Data seeding
├── src/
│   ├── app/
│   │   ├── api/         # API Routes
│   │   ├── dashboard/   # Dashboard page
│   │   └── login/       # Login page
│   ├── components/
│   │   ├── dashboards/  # Dashboard components per role
│   │   └── Navbar.tsx   # Navigation bar
│   ├── lib/
│   │   ├── db.ts        # Database connection
│   │   └── auth.ts      # Authentication functions
│   └── types/
│       └── index.ts     # TypeScript type definitions
└── .env.local           # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Data
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `GET /api/patients` - Get patients
- `GET /api/doctors` - Get doctors
- `GET /api/prescriptions` - Get prescriptions
- `GET /api/medications` - Get medications
- `GET /api/lab-tests` - Get lab tests
- `GET /api/payments` - Get payments
- `GET /api/wearable` - Get wearable data
- `POST /api/wearable` - Submit wearable data

## Build untuk Production

```bash
npm run build
npm start
```

## Troubleshooting

### Database Connection Error

Pastikan:
1. MySQL server sudah berjalan (jika pakai XAMPP, start Apache dan MySQL)
2. Database `hospital_system` sudah dibuat
3. Kredensial di `.env.local` sudah benar

### Port 3000 Already in Use

Ubah port di `package.json`:

```json
"scripts": {
  "dev": "next dev -p 3001"
}
```

## Kontributor

- [Nama Anggota 1]
- [Nama Anggota 2]
- [Nama Anggota 3]

## Lisensi

Tugas Besar EB4007 - Institut Teknologi Bandung
