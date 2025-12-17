# Sistem Informasi Kesehatan (SIK)

Sistem Informasi Kesehatan berbasis web yang terintegrasi dengan perangkat IoT untuk monitoring kesehatan pasien secara real-time.

## 📋 Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Teknologi](#teknologi)
- [Role & Pengguna](#role--pengguna)
- [Acceptance Criteria](#acceptance-criteria)
- [Alur Sistem](#alur-sistem)
- [Integrasi IoT](#integrasi-iot)
- [Instalasi](#instalasi)

## 🎯 Gambaran Umum

Sistem Informasi Kesehatan adalah platform komprehensif yang mendukung operasional rumah sakit dengan fitur-fitur modern termasuk:
- Manajemen pasien dan karyawan
- Pendaftaran kunjungan dan rawat inap
- Pemeriksaan medis dan resep obat
- Farmasi dan billing
- Laboratorium (Urin Test, Rontgen)
- Integrasi perangkat wearable IoT (MAX30102)
- Standar FHIR untuk interoperabilitas data

## 🔧 Teknologi

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL/MariaDB
- **IoT**: Arduino (MAX30102), WebSocket
- **Standards**: HL7 FHIR R4
- **Authentication**: Session-based with bcrypt

## 👥 Role & Pengguna

### 1. **Patient (Pasien)**
- Mendaftar akun sendiri
- Melihat data kesehatan pribadi
- Mendaftar kunjungan
- Melihat resep dan tagihan
- Monitoring data wearable

### 2. **Doctor (Dokter)**
- Melihat daftar pasien
- Melakukan pemeriksaan
- Menulis resep
- Melihat data vital signs dari IoT
- Merujuk ke laboratorium

### 3. **Receptionist (Resepsionis)**
- Mendaftarkan pasien baru
- Membuat jadwal kunjungan
- Mengelola data pasien

### 4. **Pharmacist (Apoteker)**
- Mengelola stok obat
- Memproses resep
- Membuat billing farmasi

### 5. **Lab Staff (Petugas Lab)**
- Menerima permintaan lab
- Input hasil tes
- Mengelola riwayat tes

### 6. **Admin**
- Mengelola karyawan
- Melihat dashboard keseluruhan
- Konfigurasi sistem

---

## ✅ Acceptance Criteria

### A. Modul Autentikasi & Registrasi

#### AC-A1: Registrasi Pasien Baru
**Sebagai**: Calon pasien
**Saya ingin**: Mendaftar akun baru
**Sehingga**: Saya dapat menggunakan layanan rumah sakit

**Kriteria Penerimaan**:
- [ ] Form registrasi memiliki field: username, password, confirm password, nama lengkap, tanggal lahir, jenis kelamin, golongan darah, telepon, email, alamat
- [ ] Password minimal 6 karakter
- [ ] Sistem menghitung umur otomatis dari tanggal lahir
- [ ] ID pasien digenerate otomatis dengan format `P{Year}{Month}{Sequential}` (contoh: P20250100001)
- [ ] Sistem mencatat user_id untuk linking antara users dan Pasien table
- [ ] Password di-hash menggunakan bcrypt
- [ ] Redirect ke halaman login setelah berhasil
- [ ] Tampilkan error jika username sudah terdaftar

**Flow**:
```
1. User mengakses halaman /register
2. User mengisi form registrasi
3. User klik "Daftar"
4. Sistem validasi input
5. Sistem generate ID_pasien
6. Sistem hitung umur dari tanggal lahir
7. Sistem hash password
8. Sistem simpan ke tabel users dan Pasien
9. Tampilkan alert sukses
10. Redirect ke /login
```

#### AC-A2: Login Pengguna
**Sebagai**: Pengguna terdaftar
**Saya ingin**: Login ke sistem
**Sehingga**: Saya dapat mengakses fitur sesuai role saya

**Kriteria Penerimaan**:
- [ ] Form login memiliki field: username dan password
- [ ] Sistem verifikasi username dan password dari database
- [ ] Sistem create session setelah login berhasil
- [ ] Redirect ke dashboard sesuai role (patient/doctor/staff)
- [ ] Tampilkan error jika kredensial salah
- [ ] Session tersimpan di cookie dengan secure flag

**Flow**:
```
1. User mengakses halaman /login
2. User input username dan password
3. User klik "Login"
4. Sistem query database untuk username
5. Sistem verify password dengan bcrypt
6. Jika valid, create session dan simpan di cookie
7. Redirect ke dashboard sesuai role
8. Jika invalid, tampilkan error message
```

---

### B. Modul Pasien (Patient)

#### AC-B1: Dashboard Pasien
**Sebagai**: Pasien
**Saya ingin**: Melihat ringkasan data kesehatan saya
**Sehingga**: Saya dapat memantau kondisi kesehatan

**Kriteria Penerimaan**:
- [ ] Menampilkan informasi profil pasien
- [ ] Menampilkan jumlah kunjungan mendatang
- [ ] Menampilkan jumlah resep aktif
- [ ] Menampilkan jumlah tagihan belum lunas
- [ ] Quick access ke fitur utama (pendaftaran kunjungan, resep, monitoring)

#### AC-B2: Pendaftaran Kunjungan
**Sebagai**: Pasien
**Saya ingin**: Mendaftar kunjungan ke dokter
**Sehingga**: Saya dapat berobat sesuai jadwal

**Kriteria Penerimaan**:
- [ ] Form memiliki field: pilih dokter, tanggal, jam, metode pembayaran
- [ ] Menampilkan daftar dokter dengan spesialis
- [ ] Tanggal minimal hari ini
- [ ] Jam kunjungan: 08:00-17:00 (exclude 12:00)
- [ ] Untuk pendaftaran hari ini, hanya tampilkan jam yang tersedia setelah waktu saat ini + 1 jam
- [ ] ID_pertemuan digenerate otomatis format `PRT{Sequential}` (PRT001)
- [ ] Status pertemuan: "scheduled"
- [ ] Sistem create billing record dengan status "belum lunas"
- [ ] Tampilkan konfirmasi dengan nomor pendaftaran

**Flow**:
```
1. Patient akses /patient/visit-registration
2. Patient pilih tanggal kunjungan
3. Sistem tampilkan slot waktu yang tersedia
4. Patient pilih jam
5. Patient pilih dokter dari dropdown
6. Patient pilih metode pembayaran
7. Patient klik "Simpan Pendaftaran"
8. Sistem validasi input
9. Sistem generate ID_pertemuan
10. Sistem simpan ke tabel Pertemuan
11. Sistem create billing record
12. Tampilkan alert dengan nomor pendaftaran
13. Redirect ke dashboard
```

#### AC-B3: Lihat Resep Obat
**Sebagai**: Pasien
**Saya ingin**: Melihat daftar resep obat saya
**Sehingga**: Saya tahu obat yang harus diminum

**Kriteria Penerimaan**:
- [ ] Tampilkan resep dalam 2 kategori: Aktif (7 hari terakhir) dan Riwayat
- [ ] Setiap resep menampilkan: ID hasil, tanggal, dokter, diagnosis
- [ ] Detail obat: nama, kategori, dosis, frekuensi, durasi, aturan pakai
- [ ] Tampilkan status billing (lunas/belum lunas)
- [ ] Tampilkan total tagihan farmasi
- [ ] Filter dan search resep

**Flow**:
```
1. Patient akses /patient/pharmacy
2. Sistem query resep berdasarkan ID_pasien
3. Sistem join dengan Pertemuan, Hasil_Pemeriksaan, Hasil_Obat, Obat
4. Sistem klasifikasi resep aktif (7 hari terakhir) vs riwayat
5. Tampilkan dalam UI dengan grouping
6. Patient dapat lihat detail setiap resep
```

#### AC-B4: Monitoring Data Wearable
**Sebagai**: Pasien
**Saya ingin**: Melihat data kesehatan dari perangkat wearable
**Sehingga**: Saya dapat monitor kondisi real-time

**Kriteria Penerimaan**:
- [ ] Tampilkan data vital signs: heart rate, SpO2, temperature
- [ ] Data ditampilkan dalam grafik/chart
- [ ] Tampilkan timestamp setiap pengukuran
- [ ] Indikator status (normal/warning/danger)
- [ ] Refresh data otomatis setiap 5 detik
- [ ] Tampilkan riwayat 24 jam terakhir

**Flow**:
```
1. Patient akses /patient/health-monitor
2. Patient sambungkan perangkat MAX30102
3. Data dari sensor dikirim via WebSocket
4. Sistem terima data dan simpan ke tabel Wearable
5. Frontend fetch data terbaru setiap 5 detik
6. Tampilkan dalam chart dan card statistics
7. Sistem evaluasi threshold untuk warning
```

#### AC-B5: Lihat Jadwal Rawat Inap
**Sebagai**: Pasien
**Saya ingin**: Melihat jadwal rawat inap saya
**Sehingga**: Saya tahu kapan harus datang

**Kriteria Penerimaan**:
- [ ] Tampilkan jadwal mendatang dan riwayat
- [ ] Informasi: tanggal, jam, dokter, perawat, ruangan (lantai & gedung)
- [ ] Status: scheduled, in_progress, completed
- [ ] Tampilkan billing rawat inap
- [ ] Filter berdasarkan status

---

### C. Modul Dokter (Doctor)

#### AC-C1: Dashboard Dokter
**Sebagai**: Dokter
**Saya ingin**: Melihat ringkasan pasien hari ini
**Sehingga**: Saya dapat bersiap melakukan pemeriksaan

**Kriteria Penerimaan**:
- [ ] Tampilkan jumlah pasien hari ini
- [ ] Tampilkan jadwal kunjungan hari ini
- [ ] Quick access ke daftar pasien
- [ ] Informasi profil dokter (spesialis, STR)

#### AC-C2: Daftar Pasien
**Sebagai**: Dokter
**Saya ingin**: Melihat daftar pasien saya
**Sehingga**: Saya dapat memilih pasien untuk diperiksa

**Kriteria Penerimaan**:
- [ ] Tampilkan daftar pasien dengan kunjungan ke dokter ini
- [ ] Informasi: nama pasien, umur, jenis kelamin, tanggal kunjungan
- [ ] Search berdasarkan nama atau ID pasien
- [ ] Filter berdasarkan status kunjungan
- [ ] Tombol "Mulai Pemeriksaan" untuk setiap pasien
- [ ] Tampilkan riwayat pemeriksaan pasien

**Flow**:
```
1. Doctor akses /doctor/patients
2. Sistem query Pertemuan WHERE ID_Dokter = {current_doctor_id}
3. Join dengan Pasien untuk dapat nama dan data demografi
4. Tampilkan dalam tabel dengan pagination
5. Doctor dapat search/filter
6. Doctor klik nama pasien untuk lihat detail
7. Doctor klik "Mulai Pemeriksaan" untuk mulai examine
```

#### AC-C3: Pemeriksaan Pasien
**Sebagai**: Dokter
**Saya ingin**: Melakukan pemeriksaan dan mencatat hasil
**Sehingga**: Pasien mendapat diagnosis dan resep yang tepat

**Kriteria Penerimaan**:
- [ ] Tampilkan informasi pasien lengkap
- [ ] Form input: gejala, diagnosis, rencana perawatan, catatan
- [ ] Input vital signs: tekanan darah, detak jantung, suhu, respirasi, saturasi O2, berat, tinggi
- [ ] Tampilkan data wearable jika tersedia
- [ ] Pilihan langkah selanjutnya: Rawat Jalan, Rawat Inap, Laboratorium
- [ ] Section untuk menambah resep obat
- [ ] Modal untuk pilih obat dari master data
- [ ] Input dosis, frekuensi, durasi, quantity per obat
- [ ] Tampilkan riwayat pemeriksaan sebelumnya
- [ ] Generate ID_hasil otomatis format `HSL{Sequential}` (HSL001)
- [ ] Status hasil: "completed"

**Flow**:
```
1. Doctor akses /doctor/examination/{id_pertemuan}
2. Sistem fetch data pasien dan pertemuan
3. Sistem fetch master obat untuk dropdown
4. Sistem fetch data wearable terbaru (opsional)
5. Doctor isi form pemeriksaan
6. Doctor tambah obat:
   a. Klik "Tambah Obat"
   b. Pilih obat dari modal
   c. Input dosis, frekuensi, durasi, qty
   d. Klik "Tambah"
   e. Obat masuk ke tabel resep
7. Doctor klik "Simpan Pemeriksaan"
8. Sistem validasi input (diagnosis wajib)
9. Sistem generate ID_hasil
10. Sistem simpan ke Hasil_Pemeriksaan
11. Sistem simpan setiap obat ke Hasil_Obat
12. Tampilkan alert sukses
13. Update tabel riwayat pemeriksaan di UI
```

#### AC-C4: Lihat Vital Signs dari IoT
**Sebagai**: Dokter
**Saya ingin**: Melihat data vital signs pasien dari perangkat IoT
**Sehingga**: Saya dapat membuat keputusan medis yang lebih akurat

**Kriteria Penerimaan**:
- [ ] Pada halaman pemeriksaan, tampilkan section "Data Wearable Device"
- [ ] Tampilkan 4 measurement terakhir
- [ ] Setiap data menampilkan: tipe pengukuran, nilai, unit, waktu
- [ ] Data diambil dari tabel Wearable
- [ ] Jika tidak ada data, section tidak tampil

#### AC-C5: Rujukan Laboratorium
**Sebagai**: Dokter
**Saya ingin**: Merujuk pasien ke laboratorium
**Sehingga**: Pasien dapat melakukan tes yang diperlukan

**Kriteria Penerimaan**:
- [ ] Pada form pemeriksaan, ada pilihan "Langkah Selanjutnya"
- [ ] Jika pilih "Laboratorium", sistem catat di field next_step
- [ ] Field next_step tersimpan di Hasil_Pemeriksaan
- [ ] Petugas lab dapat melihat permintaan lab ini

---

### D. Modul Resepsionis (Receptionist)

#### AC-D1: Pendaftaran Pasien Baru
**Sebagai**: Resepsionis
**Saya ingin**: Mendaftarkan pasien baru yang datang langsung
**Sehingga**: Pasien dapat terdaftar di sistem

**Kriteria Penerimaan**:
- [ ] Form input: nama lengkap, tanggal lahir, jenis kelamin, telepon, alamat, golongan darah, riwayat penyakit, nama ibu kandung
- [ ] Sistem hitung umur otomatis
- [ ] Generate ID_pasien otomatis format `P{Sequential}` (P001)
- [ ] Opsi untuk create akun login untuk pasien
- [ ] Jika create akun, input username dan password
- [ ] Simpan ke tabel Pasien dan users (jika create akun)
- [ ] Tampilkan ID_pasien setelah berhasil

**Flow**:
```
1. Receptionist akses /staff/registration/new-patient
2. Receptionist isi form data pasien
3. Receptionist centang "Buat akun login" jika diperlukan
4. Jika centang, input username dan password
5. Receptionist klik "Daftar Pasien"
6. Sistem validasi input
7. Sistem hitung umur dari tanggal lahir
8. Sistem generate ID_pasien
9. Sistem simpan ke Pasien
10. Jika create akun:
    a. Hash password
    b. Simpan ke users dengan role='patient' dan dapatkan user_id
    c. Update Pasien dengan user_id
11. Tampilkan alert dengan ID_pasien
12. Redirect ke daftar pasien
```

#### AC-D2: Lihat Daftar Pasien
**Sebagai**: Resepsionis
**Saya ingin**: Melihat daftar semua pasien
**Sehingga**: Saya dapat mencari dan mengelola data pasien

**Kriteria Penerimaan**:
- [ ] Tampilkan tabel pasien dengan kolom: ID, Nama, Jenis Kelamin, Umur, Telepon
- [ ] Search berdasarkan nama atau ID
- [ ] Statistik: total pasien, laki-laki, perempuan, rata-rata usia
- [ ] Tombol "Detail" untuk lihat info lengkap
- [ ] Modal detail menampilkan semua data pasien
- [ ] Tombol "Daftar Kunjungan" dari modal detail

**Flow**:
```
1. Receptionist akses /staff/registration/patients
2. Sistem query semua data dari tabel Pasien
3. Tampilkan dalam tabel dengan search
4. Receptionist klik "Detail" pada pasien
5. Sistem tampilkan modal dengan data lengkap
6. Receptionist dapat klik "Daftar Kunjungan"
7. Redirect ke form kunjungan dengan ID_pasien pre-filled
```

#### AC-D3: Pendaftaran Kunjungan untuk Pasien
**Sebagai**: Resepsionis
**Saya ingin**: Mendaftarkan kunjungan untuk pasien
**Sehingga**: Pasien dapat berobat sesuai jadwal

**Kriteria Penerimaan**:
- [ ] Form input: cari pasien (autocomplete), dokter, ruangan, tanggal, jam
- [ ] Autocomplete pasien berdasarkan nama atau ID
- [ ] Dropdown dokter menampilkan nama dan spesialis
- [ ] Dropdown ruangan (opsional)
- [ ] Validasi tanggal minimal hari ini
- [ ] Generate ID_pertemuan otomatis
- [ ] Status: "scheduled"
- [ ] Simpan ke tabel Pertemuan

**Flow**:
```
1. Receptionist akses /staff/registration/visit-registration
2. Receptionist ketik nama/ID pasien di search box
3. Sistem tampilkan autocomplete hasil
4. Receptionist pilih pasien (ID_pasien tersimpan)
5. Receptionist pilih dokter
6. Receptionist pilih tanggal dan jam
7. Receptionist pilih ruangan (opsional)
8. Receptionist klik "Simpan"
9. Sistem validasi input
10. Sistem generate ID_pertemuan
11. Sistem simpan ke Pertemuan
12. Tampilkan alert sukses
13. Redirect ke daftar pasien
```

---

### E. Modul Farmasi (Pharmacy)

#### AC-E1: Kelola Stok Obat
**Sebagai**: Apoteker
**Saya ingin**: Mengelola data obat
**Sehingga**: Data obat selalu update

**Kriteria Penerimaan**:
- [ ] Tampilkan tabel obat: ID, Nama, Kategori, Aturan Pakai, Harga Satuan
- [ ] Statistik: total obat, per kategori
- [ ] Search berdasarkan nama atau ID obat
- [ ] Filter berdasarkan kategori (Tablet, Kapsul, Cair, Injeksi, Salep, Lainnya)
- [ ] Tombol "Tambah Obat" membuka modal
- [ ] Modal tambah: input Nama, Kategori, Aturan Pakai, Harga
- [ ] Generate ID_obat otomatis
- [ ] Tombol "Edit" dan "Hapus" pada setiap obat
- [ ] Modal edit untuk update data obat

**Flow Tambah Obat**:
```
1. Pharmacist akses /staff/pharmacy/medications
2. Pharmacist klik "Tambah Obat"
3. Sistem tampilkan modal form
4. Pharmacist input data obat
5. Pharmacist klik "Simpan"
6. Sistem validasi input
7. Sistem generate ID_obat
8. Sistem simpan ke tabel Obat
9. Close modal dan refresh list
10. Tampilkan alert sukses
```

#### AC-E2: Proses Resep Masuk
**Sebagai**: Apoteker
**Saya ingin**: Memproses resep dari dokter
**Sehingga**: Pasien dapat menebus obat

**Kriteria Penerimaan**:
- [ ] Tampilkan daftar resep dengan status: Belum Diproses, Belum Bayar, Sudah Bayar
- [ ] Setiap resep menampilkan: ID hasil, pasien, dokter, tanggal, diagnosis
- [ ] Detail obat dalam resep: nama, dosis, frekuensi, durasi, qty, harga, subtotal
- [ ] Hitung total harga otomatis (harga_satuan × qty)
- [ ] Tombol "Proses Resep" untuk resep yang belum diproses
- [ ] Proses resep membuat record Billing_Farmasi
- [ ] Filter: Semua, Belum Bayar, Sudah Bayar
- [ ] Search berdasarkan nama pasien atau nomor resep

**Flow**:
```
1. Pharmacist akses /staff/pharmacy/prescriptions
2. Sistem fetch dari Hasil_Pemeriksaan JOIN Hasil_Obat JOIN Obat
3. Sistem fetch billing dari Billing_Farmasi
4. Tampilkan list resep dengan status billing
5. Pharmacist klik "Proses Resep"
6. Sistem hitung total: SUM(harga_satuan × qty)
7. Sistem generate ID_billing_farmasi
8. Sistem create record di Billing_Farmasi:
   - ID_billing_farmasi
   - ID_hasil
   - ID_pasien
   - Total_harga
   - isLunas = 0
   - Jenis_pembayaran = NULL (diisi saat bayar)
9. Refresh list dan update status
10. Tampilkan alert sukses
```

---

### F. Modul Laboratorium (Laboratory)

#### AC-F1: Lihat Permintaan Lab
**Sebagai**: Petugas Lab
**Saya ingin**: Melihat permintaan tes dari dokter
**Sehingga**: Saya dapat memproses tes

**Kriteria Penerimaan**:
- [ ] Tampilkan daftar hasil pemeriksaan dengan next_step = 'Laboratorium'
- [ ] Join dengan Pertemuan untuk data pasien dan dokter
- [ ] Informasi: ID hasil, pasien, dokter, tanggal, tipe tes, status
- [ ] Tipe tes ditentukan dari keberadaan record di UrinTest atau Ronsen
- [ ] Status: Pending (belum ada hasil), Completed (sudah ada hasil)
- [ ] Filter: Semua, Tes Urin, Rontgen
- [ ] Search berdasarkan nama pasien atau ID hasil
- [ ] Tombol "Proses" untuk input hasil

#### AC-F2: Input Hasil Tes Urin
**Sebagai**: Petugas Lab
**Saya ingin**: Input hasil tes urin
**Sehingga**: Dokter dapat melihat hasil tes

**Kriteria Penerimaan**:
- [ ] Form input parameter urin: pH, Protein, Glukosa, Keton, Bilirubin, Blood, dll
- [ ] Generate ID_uji otomatis format `UJI{Sequential}` (UJI001)
- [ ] Link dengan ID_hasil
- [ ] Simpan ke tabel UrinTest
- [ ] Tampilkan konfirmasi

**Flow**:
```
1. Lab Staff klik "Proses" pada permintaan tes urin
2. Sistem redirect ke /staff/lab/results?type=urin&id={ID_hasil}
3. Sistem tampilkan form input parameter urin
4. Lab Staff input nilai setiap parameter
5. Lab Staff klik "Simpan Hasil"
6. Sistem validasi input
7. Sistem generate ID_uji
8. Sistem simpan ke UrinTest
9. Tampilkan alert sukses
10. Redirect ke daftar permintaan
```

#### AC-F3: Input Hasil Rontgen
**Sebagai**: Petugas Lab
**Saya ingin**: Upload hasil rontgen
**Sehingga**: Dokter dapat melihat gambar

**Kriteria Penerimaan**:
- [ ] Upload gambar rontgen
- [ ] Input keterangan
- [ ] Generate ID_ronsen otomatis format `RNS{Sequential}` (RNS001)
- [ ] Simpan path gambar sebagai imgSrc
- [ ] Link dengan ID_hasil
- [ ] Simpan ke tabel Ronsen

---

### G. Modul Integrasi IoT

#### AC-G1: Koneksi Perangkat Wearable
**Sebagai**: Pasien
**Saya ingin**: Menghubungkan perangkat wearable saya
**Sehingga**: Data kesehatan terekam otomatis

**Kriteria Penerimaan**:
- [ ] Perangkat: Arduino + MAX30102 Sensor
- [ ] Sensor mengukur: Heart Rate (BPM), SpO2 (%), Body Temperature
- [ ] Data dikirim via Serial ke komputer
- [ ] WebSocket server menerima data dari serial port
- [ ] Data disimpan ke tabel Wearable setiap kali ada pembacaan baru
- [ ] Format data di WebSocket: JSON dengan fields measurement_type, value, unit, measured_at
- [ ] Frontend subscribe ke WebSocket untuk update real-time

**Flow**:
```
1. Pasien pasang sensor MAX30102 di jari
2. Arduino mulai baca data sensor setiap 5 detik
3. Arduino kirim data via Serial: "{hr},{spo2},{temp}"
4. Node.js WebSocket server baca serial port
5. Server parse data dan broadcast via WebSocket
6. Server simpan ke database:
   INSERT INTO Wearable (patient_id, measurement_type, value, unit, measured_at)
   VALUES (?, 'heart_rate', ?, 'bpm', NOW()),
          (?, 'spo2', ?, '%', NOW()),
          (?, 'temperature', ?, '°C', NOW())
7. Frontend terima data via WebSocket
8. Frontend update UI dengan data terbaru
9. Ulangi setiap 5 detik
```

#### AC-G2: Tampilkan Data Real-time di Dashboard
**Sebagai**: Pasien
**Saya ingin**: Melihat data kesehatan real-time
**Sehingga**: Saya tahu kondisi saya saat ini

**Kriteria Penerimaan**:
- [ ] Halaman /patient/health-monitor
- [ ] Card untuk setiap metrik: Heart Rate, SpO2, Temperature
- [ ] Indikator status berdasarkan threshold:
  - Heart Rate: normal (60-100), warning (50-59 atau 101-120), danger (<50 atau >120)
  - SpO2: normal (>95), warning (90-95), danger (<90)
  - Temperature: normal (36-37.5), warning (37.6-38), danger (>38 atau <36)
- [ ] Grafik untuk setiap metrik (last 24 hours)
- [ ] Auto-refresh setiap 5 detik
- [ ] Timestamp pembacaan terakhir

---

### H. Modul FHIR Integration

#### AC-H1: Endpoint FHIR Patient
**Sebagai**: Sistem eksternal
**Saya ingin**: Mengakses data pasien dalam format FHIR
**Sehingga**: Data dapat diintegrasikan dengan sistem lain

**Kriteria Penerimaan**:
- [ ] GET /api/fhir/Patient
- [ ] Support query parameters: _id, identifier, name
- [ ] Response format: FHIR Bundle (searchset)
- [ ] POST /api/fhir/Patient untuk create pasien baru
- [ ] Validasi resourceType = "Patient"

**Mapping**:
- resourceType: "Patient"
- id: ID_pasien
- identifier: ID_pasien dengan system "urn:oid:2.16.840.1.113883.2.4.6.3"
- active: true
- name: Nama (use: "official")
- telecom: No_telpon (system: "phone")
- gender: "male" atau "female"
- birthDate: Tanggal_lahir
- address: Alamat
- extension: Golongan_darah (patient-bloodType)

#### AC-H2: Endpoint FHIR Practitioner
**Sebagai**: Sistem eksternal
**Saya ingin**: Mengakses data dokter dalam format FHIR
**Sehingga**: Data dokter dapat diintegrasikan

**Kriteria Penerimaan**:
- [ ] GET /api/fhir/Practitioner
- [ ] Support query parameters: _id, identifier, name
- [ ] Response format: FHIR Bundle (searchset)

**Mapping**:
- resourceType: "Practitioner"
- id: ID_karyawan
- identifier: STR dengan system "http://terminology.kemkes.go.id/CodeSystem/practitioner-license-number"
- active: Status === 'Aktif'
- name: Nama
- telecom: No_telpon
- gender: "male" atau "female"
- birthDate: Tanggal_lahir
- qualification: Spesialis

---

## 🔄 Alur Sistem Lengkap

### Skenario 1: Pasien Baru Registrasi hingga Berobat

```
1. REGISTRASI PASIEN
   Patient → /register
   - Input data diri
   - Submit form
   - Sistem create user + pasien (ID: P202501001)
   - Redirect ke /login

2. LOGIN
   Patient → /login
   - Input username & password
   - Submit
   - Sistem verify dan create session
   - Redirect ke /dashboard (patient)

3. PENDAFTARAN KUNJUNGAN
   Patient → /patient/visit-registration
   - Pilih tanggal: 2025-01-15
   - Pilih jam: 09:00
   - Pilih dokter: Dr. Andy (Spesialis Jantung)
   - Pilih metode: Tunai
   - Submit
   - Sistem create Pertemuan (ID: PRT001, status: scheduled)
   - Sistem create Billing (isLunas: 0)
   - Alert konfirmasi: "Pendaftaran berhasil! Nomor: PRT001"

4. PASANG WEARABLE (OPSIONAL)
   Patient → /patient/health-monitor
   - Pasang sensor MAX30102
   - Arduino kirim data via serial
   - WebSocket server simpan ke Wearable
   - Dashboard update real-time:
     * Heart Rate: 75 bpm (Normal)
     * SpO2: 98% (Normal)
     * Temperature: 36.5°C (Normal)

5. DATANG KE RUMAH SAKIT
   Tanggal: 2025-01-15, 09:00
   - Pasien check-in di resepsionis
   - Resepsionis update status Pertemuan: in_progress

6. PEMERIKSAAN DOKTER
   Doctor → /doctor/patients
   - Lihat daftar pasien hari ini
   - Klik "Mulai Pemeriksaan" untuk P202501001

   Doctor → /doctor/examination/PRT001
   - Lihat data pasien
   - Lihat data wearable (jika ada)
   - Input pemeriksaan:
     * Gejala: "Nyeri dada saat beraktivitas"
     * Diagnosis: "Angina Pektoris"
     * Vital Signs: BP 130/85, HR 78, Temp 36.7
     * Treatment Plan: "Istirahat, pantau kondisi"
     * Next Step: "Laboratorium"
   - Tambah Resep:
     * Pilih obat: "Isosorbide Dinitrate 5mg"
     * Dosis: "5mg"
     * Frekuensi: "3x sehari"
     * Durasi: "14"
     * Qty: "42"
   - Klik "Simpan Pemeriksaan"
   - Sistem create Hasil_Pemeriksaan (ID: HSL001)
   - Sistem create Hasil_Obat

7. PROSES RESEP DI FARMASI
   Pharmacist → /staff/pharmacy/prescriptions
   - Lihat resep HSL001
   - Detail obat: Isosorbide Dinitrate 5mg, Qty: 42, Harga: Rp 500
   - Total: Rp 21,000
   - Klik "Proses Resep"
   - Sistem create Billing_Farmasi (ID: BF001)

   Pharmacist → /staff/pharmacy/sales
   - Pasien datang ambil obat
   - Klik "Proses Pembayaran"
   - Pilih metode: "Tunai"
   - Submit
   - Sistem update Billing_Farmasi (isLunas: 1)
   - Print receipt

8. PASIEN LIHAT RESEP
   Patient → /patient/pharmacy
   - Lihat resep aktif: HSL001
   - Detail obat dan aturan minum
   - Status: Lunas

SELESAI - Pasien sudah mendapat diagnosis, obat, dan semua tagihan lunas
```

### Skenario 2: Monitoring Pasien dengan Wearable IoT

```
1. SETUP PERANGKAT
   - Pasien pasang sensor MAX30102 di jari
   - Connect Arduino ke komputer via USB
   - Jalankan WebSocket server: node websocket-server.js

2. PEMBACAAN SENSOR
   Arduino (Loop setiap 5 detik):
   - Baca heart rate, SpO2, temperature
   - Kirim via Serial: "75,98,36.5"

3. WEBSOCKET SERVER
   Node.js Server:
   - Terima data dari serial: "75,98,36.5"
   - Parse data: hr=75, spo2=98, temp=36.5
   - Broadcast via WebSocket
   - Simpan ke database Wearable

4. FRONTEND DASHBOARD
   Patient → /patient/health-monitor
   - Connect ke WebSocket
   - Terima data real-time
   - Update UI:
     * Heart Rate: 75 bpm 🟢 Normal
     * SpO2: 98% 🟢 Normal
     * Temperature: 36.5°C 🟢 Normal
   - Update chart
   - Refresh setiap 5 detik

5. DOKTER LIHAT DATA
   Doctor → /doctor/examination/PRT002
   - Section "Data Wearable Device"
   - Tampilkan 4 pembacaan terakhir
   - Dokter analisa dan buat keputusan
```

---

## 📦 Instalasi

### Prerequisites
- Node.js 18+
- MySQL/MariaDB
- Arduino IDE (untuk IoT)
- MAX30102 Sensor

### Setup Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### Setup Backend
```bash
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database
npm run dev
```

### Setup WebSocket Server (untuk IoT)
```bash
node websocket-server.js
```

### Setup Arduino (Opsional)
```bash
# Buka arduino/max30102_monitor/max30102_monitor.ino
# Install library MAX30102
# Upload ke Arduino board
```

### Access Application
```
http://localhost:3000
```

### Default Users
```
Username: patient001 | Password: password123 | Role: Patient
Username: dr_andy    | Password: password123 | Role: Doctor
Username: receptionist1 | Password: password123 | Role: Staff
Username: pharmacist1 | Password: password123 | Role: Staff
Username: lab_staff1 | Password: password123 | Role: Staff
```

---

## 📊 Database Schema

Sistem menggunakan 20+ tabel utama:
- **Users & Auth**: users
- **Master Data**: Pasien, Karyawan, Dokter, Perawat, Resepsionis, Operasional
- **Medical**: Pertemuan, Hasil_Pemeriksaan, Hasil_Obat, Obat
- **Laboratory**: UrinTest, Ronsen
- **Facilities**: Ruangan, Departemen, Gedung
- **Billing**: Billing, Billing_Farmasi
- **IoT**: Wearable
- **Scheduling**: Jadwal_Praktik

Lihat `database/schema.sql` untuk detail lengkap.

---

## 🔐 Security

- Password hashing dengan bcrypt (10 rounds)
- Session-based authentication
- Protected API routes dengan middleware
- Input validation di frontend dan backend
- SQL injection prevention dengan parameterized queries

---

## 🎓 Kontributor

- Mayla Yaffa L
- Adinda Putri
- Azfa Radhiyya Hakim

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
