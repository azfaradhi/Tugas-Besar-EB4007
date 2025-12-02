# Proses Bisnis Sistem Informasi Kesehatan

Dokumen ini menjelaskan alur proses bisnis lengkap dalam sistem.

## 1. Alur Pendaftaran Pasien

### Pasien Baru
1. **Pasien datang** ke fasilitas kesehatan
2. **Staf Pendaftaran** membuat akun pasien baru
   - Input data: nama, tanggal lahir, gender, kontak, dll
   - Generate nomor pasien otomatis (P-YYYY-XXX)
3. **Staf Pendaftaran** membuat janji temu
   - Pilih dokter yang tersedia
   - Tentukan tanggal dan waktu
   - Catat keluhan pasien
   - Generate nomor pendaftaran (APT-YYYY-XXX)
4. **Pasien** menunggu giliran pemeriksaan

### Pasien Lama
1. **Pasien** login ke sistem (atau datang langsung)
2. **Staf Pendaftaran** cari data pasien
3. **Staf Pendaftaran** buat janji temu baru
4. **Pasien** menunggu giliran

---

## 2. Alur Pemeriksaan Dokter

1. **Dokter** login ke sistem
2. **Dokter** melihat daftar pasien hari ini
3. **Dokter** memanggil pasien sesuai urutan
4. **Dokter** melakukan pemeriksaan:
   - Anamnesis (tanya jawab)
   - Pemeriksaan fisik
   - Input vital signs:
     - Tekanan darah
     - Suhu tubuh
     - Denyut nadi
     - Saturasi oksigen
5. **Dokter** melihat data wearable device pasien (jika ada)
6. **Dokter** membuat diagnosis
7. **Dokter** menentukan tindakan:
   - **Pasien Sembuh**: Langsung ke pembayaran
   - **Perlu Obat**: Buat resep → ke farmasi
   - **Perlu Lab**: Order tes lab → ke laboratorium
   - **Perlu Rujukan**: Buat surat rujukan

---

## 3. Alur Resep & Farmasi

### Jika Pasien Memerlukan Obat:

1. **Dokter** membuat resep elektronik:
   - Pilih obat dari database
   - Tentukan dosis, frekuensi, durasi
   - Tambah instruksi khusus
2. **Sistem** generate nomor resep (RX-YYYY-XXX)
3. **Pasien** ke bagian farmasi
4. **Staf Farmasi** melihat resep yang pending
5. **Staf Farmasi** menyiapkan obat:
   - Cek stok obat
   - Racik/siapkan obat sesuai resep
   - Update status resep
6. **Staf Farmasi** serahkan obat + instruksi ke pasien
7. **Pasien** ke kasir untuk pembayaran

---

## 4. Alur Laboratorium

### Jika Pasien Memerlukan Tes Lab:

1. **Dokter** order tes laboratorium:
   - Pilih jenis tes (Darah Lengkap, Urin, dll)
   - Tambah catatan jika perlu
2. **Sistem** generate nomor tes (LAB-YYYY-XXX)
3. **Pasien** ke laboratorium
4. **Staf Lab** melihat order yang pending
5. **Staf Lab** ambil sampel dari pasien
6. **Staf Lab** proses sampel
7. **Staf Lab** input hasil tes:
   - Parameter (contoh: Hemoglobin, Leukosit)
   - Nilai hasil
   - Status (normal/abnormal/critical)
   - Catatan
8. **Sistem** kirim notifikasi ke dokter
9. **Dokter** review hasil lab
10. **Dokter** tentukan tindakan lanjutan

---

## 5. Alur Pembayaran

1. **Pasien** selesai dari dokter/farmasi/lab
2. **Pasien** ke kasir
3. **Kasir** buat tagihan pembayaran:
   - Biaya konsultasi dokter
   - Biaya obat (jika ada)
   - Biaya tes lab (jika ada)
   - Biaya tindakan lain
4. **Sistem** hitung total biaya
5. **Kasir** input metode pembayaran:
   - Tunai (Cash)
   - Debit/Credit
   - Transfer
   - Asuransi
6. **Kasir** cetak struk/kwitansi
7. **Pasien** selesai

---

## 6. Alur Rujukan

### Jika Pasien Perlu Dirujuk:

1. **Dokter** buat surat rujukan:
   - Tujuan rujukan (RS/klinik lain)
   - Spesialisasi yang dituju
   - Diagnosis sementara
   - Alasan rujukan
   - Riwayat pemeriksaan
2. **Sistem** generate nomor rujukan (REF-YYYY-XXX)
3. **Dokter** cetak surat rujukan
4. **Pasien** bawa surat ke tempat rujukan
5. **Pasien** tetap bisa:
   - Bayar biaya konsultasi di kasir
   - Ambil obat jika ada resep
   - Lihat hasil lab

---

## 7. Monitoring Wearable Device

### Alur Continuous Monitoring:

1. **Pasien** menggunakan wearable device (smartwatch, fitness tracker)
2. **Device** kirim data kesehatan secara berkala:
   - Heart rate (denyut jantung)
   - Blood pressure (tekanan darah)
   - Temperature (suhu tubuh)
   - Oxygen saturation (saturasi oksigen)
   - Steps (jumlah langkah)
   - Sleep (kualitas tidur)
   - Calories (kalori terbakar)
3. **Sistem** simpan data ke database
4. **Sistem** analisis data:
   - Status normal: hijau
   - Status warning: kuning (butuh perhatian)
   - Status critical: merah (butuh tindakan cepat)
5. **Pasien** bisa lihat riwayat data di dashboard
6. **Dokter** bisa lihat data saat pemeriksaan
7. **Sistem** bisa kirim alert jika ada nilai abnormal

---

## Role & Akses dalam Sistem

### 1. Pasien
**Dapat:**
- Login ke sistem
- Lihat jadwal janji temu
- Lihat rekam medis
- Lihat resep obat
- Lihat hasil lab
- Lihat data wearable device sendiri
- Update profil

**Tidak Dapat:**
- Akses data pasien lain
- Ubah data medis
- Buat janji temu sendiri (harus via staf)

### 2. Staf Pendaftaran
**Dapat:**
- Daftar pasien baru
- Cari data pasien
- Buat janji temu
- Update data pasien
- Lihat jadwal dokter
- Cetak kartu berobat

**Tidak Dapat:**
- Input data medis
- Akses resep/lab
- Proses pembayaran

### 3. Dokter
**Dapat:**
- Lihat jadwal pasien
- Input rekam medis
- Buat diagnosis
- Buat resep
- Order tes lab
- Lihat hasil lab
- Buat rujukan
- Lihat data wearable pasien

**Tidak Dapat:**
- Proses farmasi
- Proses lab
- Proses pembayaran

### 4. Staf Farmasi
**Dapat:**
- Lihat resep yang masuk
- Proses resep
- Update stok obat
- Serahkan obat ke pasien

**Tidak Dapat:**
- Buat resep
- Ubah resep dokter
- Akses data medis detail

### 5. Staf Laboratorium
**Dapat:**
- Lihat order tes lab
- Proses sampel
- Input hasil tes
- Cetak hasil lab

**Tidak Dapat:**
- Order tes sendiri
- Ubah order dokter
- Akses resep

### 6. Kasir
**Dapat:**
- Buat tagihan
- Terima pembayaran
- Cetak kwitansi
- Lihat riwayat pembayaran
- Laporan keuangan

**Tidak Dapat:**
- Akses data medis
- Ubah harga layanan

---

## Integrasi Antar Fitur

```
Pendaftaran → Pemeriksaan → [Lab/Farmasi/Rujukan] → Pembayaran
                ↓
         Wearable Data (terus menerus)
```

### Contoh Kasus Lengkap:

**Skenario: Pasien dengan Demam**

1. Pasien datang dengan keluhan demam
2. Staf Pendaftaran → daftar ke Dr. Andy
3. Dr. Andy periksa → lihat data wearable:
   - Suhu: 38.5°C (warning)
   - Heart rate: 95 bpm (sedikit tinggi)
4. Dr. Andy order:
   - Tes Darah Lengkap
   - Tes CRP (inflamasi)
5. Pasien ke Lab → ambil sampel
6. Staf Lab → proses dan input hasil:
   - Leukosit: 12.5 (tinggi → infeksi)
   - CRP: 8.5 (tinggi → inflamasi)
7. Dr. Andy lihat hasil → diagnosis: ISPA
8. Dr. Andy buat resep:
   - Paracetamol 500mg - 3x sehari
   - Amoxicillin 500mg - 3x sehari
   - OBH Combi - 3x sehari
9. Pasien ke Farmasi → ambil obat
10. Pasien ke Kasir → bayar:
    - Konsultasi: Rp 150.000
    - Lab: Rp 125.000
    - Obat: Rp 10.000
    - **Total: Rp 285.000**
11. Pasien pulang dengan obat
12. Wearable device terus monitor → suhu turun setelah minum obat

---

## Keamanan & Privacy

### Prinsip Keamanan:
1. **Authentication**: Semua user harus login
2. **Authorization**: Akses sesuai role
3. **Audit Trail**: Semua aksi tercatat
4. **Data Encryption**: Password di-hash
5. **Session Management**: Auto logout setelah idle

### Privacy Data Pasien:
- Data medis hanya bisa diakses oleh dokter yang merawat
- Pasien bisa lihat data sendiri saja
- Staf hanya bisa akses data sesuai tugasnya
- Tidak ada export data massal

---

## Pelaporan & Statistik

### Laporan yang Tersedia:
1. **Pendaftaran**: Jumlah pasien per hari/bulan
2. **Pemeriksaan**: Jumlah kunjungan per dokter
3. **Farmasi**: Penggunaan obat, stok tersisa
4. **Lab**: Jumlah tes per jenis
5. **Keuangan**: Pendapatan per hari/bulan
6. **Wearable**: Trend data kesehatan pasien

---

## Flow Diagram (Simplified)

```
START
  ↓
[Login] → Cek Role
  ↓
┌─────────────────────┐
│ PASIEN              │
│ - Lihat Janji Temu  │
│ - Lihat Rekam Medis │
│ - Monitoring Device │
└─────────────────────┘
  ↓
┌─────────────────────┐
│ STAF PENDAFTARAN    │
│ - Daftar Pasien     │
│ - Buat Janji Temu   │
└─────────────────────┘
  ↓
┌─────────────────────┐
│ DOKTER              │
│ - Periksa Pasien    │
│ - Buat Diagnosis    │
│ - Resep/Lab/Rujukan │
└─────────────────────┘
  ↓
┌──────────┬──────────┬──────────┐
│ FARMASI  │   LAB    │  RUJUKAN │
└──────────┴──────────┴──────────┘
  ↓
┌─────────────────────┐
│ KASIR               │
│ - Hitung Tagihan    │
│ - Terima Pembayaran │
└─────────────────────┘
  ↓
END
```

---

## Kesimpulan

Sistem ini mengcover seluruh proses bisnis di fasilitas kesehatan:
- ✅ Pendaftaran & Administrasi
- ✅ Pemeriksaan & Diagnosis
- ✅ Resep & Farmasi
- ✅ Laboratorium
- ✅ Pembayaran
- ✅ Rujukan
- ✅ Monitoring Real-time (Wearable)

Semua proses terintegrasi dalam satu sistem untuk efisiensi dan akurasi data.
