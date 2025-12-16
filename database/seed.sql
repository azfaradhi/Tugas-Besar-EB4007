-- =====================================================================
-- DATA SEED UNTUK SISTEM INFORMASI KESEHATAN
-- EB4007 - Tugas Besar
-- Version: Consolidated with complete sample data
-- =====================================================================

-- ============================
-- 1. Users (Authentication)
-- ============================
-- Password untuk semua user: "password123"
-- Hash: $2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq
INSERT INTO users (username, password, role, profile_id) VALUES
-- Pasien
('patient001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', 'P001'),
('patient002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', 'P002'),
('patient003', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', 'P003'),
('patient004', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', 'P004'),
-- Staff Pendaftaran
('staff_reg001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration', 'K003'),
('staff_reg002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration', 'K005'),
-- Dokter
('dr_andy', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor', 'K001'),
('dr_clara', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor', 'K002'),
-- Staff Farmasi
('pharmacy001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_pharmacy', NULL),
('pharmacy002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_pharmacy', NULL),
-- Staff Lab
('lab001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_lab', NULL),
('lab002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_lab', NULL),
-- Staff Kasir
('cashier001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_cashier', NULL),
('cashier002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_cashier', NULL);

-- ============================
-- 2. Departemen
-- ============================
INSERT INTO Departemen (ID_Department, Nama) VALUES
('DEP001', 'Umum'),
('DEP002', 'Penyakit Dalam'),
('DEP003', 'Radiologi'),
('DEP004', 'Laboratorium'),
('DEP005', 'Bedah'),
('DEP006', 'Anak');

-- ============================
-- 3. Gedung
-- ============================
INSERT INTO Gedung (ID_gedung, Nama, Latitude, Longitude) VALUES
('GD001', 'Gedung A (Rawat Jalan)', '-6.914744', '107.609810'),
('GD002', 'Gedung B (Rawat Inap)', '-6.915200', '107.610300'),
('GD003', 'Gedung C (Laboratorium)', '-6.914900', '107.610100');

-- ============================
-- 4. Ruangan
-- ============================
INSERT INTO Ruangan (ID_ruangan, ID_gedung, Lantai) VALUES
('R001', 'GD001', 1),
('R002', 'GD001', 1),
('R003', 'GD001', 2),
('R004', 'GD002', 1),
('R005', 'GD002', 2),
('R006', 'GD003', 1);

-- ============================
-- 5. Pasien
-- ============================
INSERT INTO Pasien (ID_pasien, user_id, Nama, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah, Riwayat_penyakit, Nama_ibu_kandung) VALUES
('P001', 1, 'Budi Santoso', '1985-05-12', 39, 'Laki-laki', '081234567001', 'Jl. Ganesha No. 10, Bandung', 'O', 'Hipertensi', 'Siti Aminah'),
('P002', 2, 'Siti Nurhaliza', '1990-03-22', 34, 'Perempuan', '081234567002', 'Jl. Sudirman No. 25, Jakarta', 'A', 'Asma', 'Rina Dewi'),
('P003', 3, 'Andi Wijaya', '2000-11-01', 24, 'Laki-laki', '081234567003', 'Jl. Dipatiukur No. 35, Surabaya', 'B', NULL, 'Dewi Lestari'),
('P004', 4, 'Rina Kusuma', '1995-08-15', 29, 'Perempuan', '081234567004', 'Jl. Dago No. 45, Bandung', 'AB', NULL, 'Sari Indah');

-- ============================
-- 6. Karyawan
-- ============================
INSERT INTO Karyawan (ID_karyawan, user_id, Nama, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat) VALUES
('K001', 7, 'Dr. Andika Pratama', '1975-02-10', 49, 'Laki-laki', '0812000001', 'Jl. Pasteur No. 1, Bandung'),
('K002', 8, 'Dr. Clara Meilani', '1980-06-17', 44, 'Perempuan', '0812000002', 'Jl. Setiabudi No. 2, Jakarta'),
('K003', 5, 'Rina Saputra', '1995-03-20', 29, 'Perempuan', '0812000003', 'Jl. Cihampelas No. 3, Cimahi'),
('K004', NULL, 'Anton Wijaya', '1990-08-05', 34, 'Laki-laki', '0812000004', 'Jl. Riau No. 4, Bandung'),
('K005', 6, 'Maya Lestari', '1998-01-15', 26, 'Perempuan', '0812000005', 'Jl. Buah Batu No. 5, Bandung'),
('K006', NULL, 'Budi Perawat', '1992-05-20', 32, 'Laki-laki', '0812000006', 'Jl. Asia Afrika No. 6, Bandung'),
('K007', NULL, 'Sinta Perawat', '1993-07-15', 31, 'Perempuan', '0812000007', 'Jl. Merdeka No. 7, Bandung');

-- ============================
-- 7. Dokter
-- ============================
INSERT INTO Dokter (ID_karyawan, ID_Department, Spesialis, STR, Status, Shift) VALUES
('K001', 'DEP001', 'Umum', 'STR001', 'Aktif', 'Pagi'),
('K002', 'DEP002', 'Penyakit Dalam', 'STR002', 'Aktif', 'Siang');

-- ============================
-- 8. Operasional
-- ============================
INSERT INTO Operasional (ID_karyawan) VALUES
('K004');

-- ============================
-- 9. Resepsionis
-- ============================
INSERT INTO Resepsionis (ID_karyawan) VALUES
('K003'),
('K005');

-- ============================
-- 10. Perawat
-- ============================
INSERT INTO Perawat (ID_karyawan, Shift) VALUES
('K006', 'Pagi'),
('K007', 'Siang');

-- ============================
-- 11. Jadwal Praktik
-- ============================
INSERT INTO Jadwal_Praktik (ID_jadwal, ID_Dokter, ID_ruangan, Date) VALUES
('JDW001', 'K001', 'R001', '2024-12-16 09:00:00'),
('JDW002', 'K001', 'R001', '2024-12-17 09:00:00'),
('JDW003', 'K002', 'R002', '2024-12-16 13:00:00'),
('JDW004', 'K002', 'R002', '2024-12-17 13:00:00');

-- ============================
-- 12. Obat
-- ============================
INSERT INTO Obat (ID_obat, Nama, Kategori, Aturan_pakai, Harga_satuan, Stok) VALUES
('OBT001', 'Paracetamol 500mg', 'Tablet', '3x sehari sesudah makan', 5000.00, 500),
('OBT002', 'Amoxicillin 500mg', 'Kapsul', '3x sehari sesudah makan', 8000.00, 300),
('OBT003', 'OBH Combi', 'Cair', '3x sehari 1 sendok makan', 15000.00, 100),
('OBT004', 'Antasida Sirup', 'Cair', '3x sehari 1 sendok makan sebelum makan', 12000.00, 150),
('OBT005', 'Salbutamol Inhaler', 'Lainnya', 'Bila sesak napas', 85000.00, 50),
('OBT006', 'Cetirizine 10mg', 'Tablet', '1x sehari sebelum tidur', 3000.00, 400),
('OBT007', 'Vitamin C 1000mg', 'Tablet', '1x sehari sesudah makan', 2000.00, 600),
('OBT008', 'Metformin 500mg', 'Tablet', '2x sehari sesudah makan', 7000.00, 250),
('OBT009', 'Amlodipine 10mg', 'Tablet', '1x sehari pagi hari', 10000.00, 200),
('OBT010', 'Salep Hydrocortisone', 'Salep', 'Oleskan 2x sehari pada area yang sakit', 25000.00, 80);

-- ============================
-- 13. Pertemuan
-- ============================
INSERT INTO Pertemuan (ID_pertemuan, ID_Pasien, ID_Dokter, ID_Perawat, ID_ruangan, Tanggal, Waktu_mulai, Waktu_selesai, status) VALUES
('PRT001', 'P001', 'K001', 'K006', 'R001', '2024-12-10', '09:00:00', '09:30:00', 'completed'),
('PRT002', 'P002', 'K002', 'K007', 'R002', '2024-12-11', '13:00:00', '13:45:00', 'completed'),
('PRT003', 'P003', 'K001', 'K006', 'R001', '2024-12-12', '10:00:00', '10:30:00', 'completed'),
('PRT004', 'P004', 'K002', 'K007', 'R002', '2024-12-15', '14:00:00', NULL, 'scheduled'),
('PRT005', 'P001', 'K001', 'K006', 'R001', '2024-12-16', '09:30:00', NULL, 'scheduled');

-- ============================
-- 14. Hasil Pemeriksaan
-- ============================
INSERT INTO Hasil_Pemeriksaan (ID_hasil, ID_pertemuan, diagnosis, symptoms, vital_signs, treatment_plan, notes, status) VALUES
('HSL001', 'PRT001', 'Hipertensi Stage 2', 'Sakit kepala, pusing', 'TD: 160/100 mmHg, Nadi: 88 bpm, Suhu: 36.5°C', 'Terapi antihipertensi, diet rendah garam, olahraga teratur', 'Kontrol tekanan darah rutin setiap 2 minggu', 'completed'),
('HSL002', 'PRT002', 'Asma Bronkial', 'Sesak napas, batuk', 'TD: 120/80 mmHg, Nadi: 92 bpm, Suhu: 36.8°C, RR: 24/min', 'Bronkodilator, hindari alergen', 'Pasien disarankan membawa inhaler setiap saat', 'completed'),
('HSL003', 'PRT003', 'ISPA (Infeksi Saluran Pernapasan Akut)', 'Batuk, pilek, demam ringan', 'TD: 110/70 mmHg, Nadi: 80 bpm, Suhu: 37.5°C', 'Antibiotik, obat batuk, istirahat cukup', 'Kontrol jika demam tidak turun dalam 3 hari', 'completed');

-- ============================
-- 15. Hasil_Obat
-- ============================
INSERT INTO Hasil_Obat (ID_hasil, ID_Obat, Dosis, Frekuensi, Durasi_hari, Qty) VALUES
-- Untuk HSL001 (Hipertensi)
('HSL001', 'OBT009', '10mg', '1x sehari', 30, 30),
('HSL001', 'OBT007', '1000mg', '1x sehari', 30, 30),
-- Untuk HSL002 (Asma)
('HSL002', 'OBT005', '2 puff', 'Bila sesak', 30, 1),
('HSL002', 'OBT006', '10mg', '1x sehari', 14, 14),
-- Untuk HSL003 (ISPA)
('HSL003', 'OBT002', '500mg', '3x sehari', 7, 21),
('HSL003', 'OBT003', '1 sdm', '3x sehari', 7, 2),
('HSL003', 'OBT001', '500mg', '3x sehari bila demam', 7, 21);

-- ============================
-- 16. Ronsen
-- ============================
INSERT INTO Ronsen (ID_ronsen, ID_hasil, imgSrc, keterangan) VALUES
('RNS001', 'HSL002', '/images/xray/patient002_chest.jpg', 'Foto thorax PA menunjukkan hiperinflasi paru bilateral');

-- ============================
-- 17. UrinTest
-- ============================
INSERT INTO UrinTest (ID_uji, ID_hasil, Warna, pH, Protein, Glukosa, Ketone, Bilirubin, Urobilin, Hemoglobin, Sel_darah_putih, Sel_darah_merah, Bakteri, Sel_epitheal, Crystals, Casts) VALUES
('UJI001', 'HSL001', 'Kuning', 6.0, 'Negatif', 'Negatif', 'Negatif', 'Negatif', 'Normal', 'Negatif', '0-5', '0-3', 'Negatif', 'Sedikit', 'Negatif', 'Negatif');

-- ============================
-- 18. Billing
-- ============================
INSERT INTO Billing (ID_billing, ID_pasien, ID_pertemuan, Total_harga, Lunas_date, Jenis_pembayaran, isLunas) VALUES
('BIL001', 'P001', 'PRT001', 150000.00, '2024-12-10', 'Cash', TRUE),
('BIL002', 'P002', 'PRT002', 200000.00, '2024-12-11', 'Debit', TRUE),
('BIL003', 'P003', 'PRT003', 150000.00, NULL, NULL, FALSE);

-- ============================
-- 19. Billing_Farmasi
-- ============================
INSERT INTO Billing_Farmasi (ID_billing_farmasi, ID_hasil, ID_pasien, Total_harga, Lunas_date, Jenis_pembayaran, isLunas) VALUES
('BF001', 'HSL001', 'P001', 360000.00, '2024-12-10', 'Cash', TRUE),
('BF002', 'HSL002', 'P002', 127000.00, '2024-12-11', 'Debit', TRUE),
('BF003', 'HSL003', 'P003', 223000.00, NULL, NULL, FALSE);

-- ============================
-- 20. Wearable Data (Sample IoT Data)
-- ============================
INSERT INTO wearable_data (patient_id, measurement_type, value, unit, measured_at, status, notes) VALUES
-- Data untuk pasien P001
('P001', 'heart_rate', 78.00, 'bpm', '2024-12-10 09:15:00', 'normal', 'Pengukuran saat pemeriksaan'),
('P001', 'spo2', 98.00, '%', '2024-12-10 09:15:00', 'normal', 'Pengukuran saat pemeriksaan'),
('P001', 'heart_rate', 88.00, 'bpm', '2024-12-10 09:20:00', 'normal', 'Setelah aktivitas ringan'),
('P001', 'spo2', 97.50, '%', '2024-12-10 09:20:00', 'normal', 'Setelah aktivitas ringan'),
-- Data untuk pasien P002
('P002', 'heart_rate', 92.00, 'bpm', '2024-12-11 13:15:00', 'warning', 'Detak jantung sedikit tinggi'),
('P002', 'spo2', 94.00, '%', '2024-12-11 13:15:00', 'warning', 'SpO2 sedikit rendah saat sesak'),
('P002', 'heart_rate', 85.00, 'bpm', '2024-12-11 13:30:00', 'normal', 'Setelah pengobatan'),
('P002', 'spo2', 97.00, '%', '2024-12-11 13:30:00', 'normal', 'Setelah pengobatan'),
-- Data untuk pasien P003
('P003', 'heart_rate', 80.00, 'bpm', '2024-12-12 10:15:00', 'normal', 'Pengukuran saat pemeriksaan'),
('P003', 'spo2', 98.50, '%', '2024-12-12 10:15:00', 'normal', 'Pengukuran saat pemeriksaan');

-- =====================================================================
-- END OF SEED DATA
-- =====================================================================
