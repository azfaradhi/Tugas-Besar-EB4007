-- =====================================================================
-- DATA SEED UNTUK SCHEMA BARU (BERBAHASA INDONESIA)
-- EB4007 - Tugas Besar
-- =====================================================================

-- Insert Users (password: "password123" - hashed dengan bcrypt)
-- Hash: $2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq
INSERT INTO users (username, password, role, profile_id) VALUES
-- Pasien
('patient001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', '1'),
('patient002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', '2'),
('patient003', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', '3'),
('patient004', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient', '4'),
-- Staff Pendaftaran
('staff_reg001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration', '3'),
('staff_reg002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration', '5'),
-- Dokter
('dr_andy', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor', '1'),
('dr_clara', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor', '2'),
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
-- 1. Pasien
-- ============================
INSERT INTO Pasien (ID_pasien, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah, Riwayat_penyakit, Nama_ibu_kandung) VALUES
('1', 'Budi Santoso', '3201010100000001', '1985-05-12', 39, 'Laki-laki', '081234567001', 'Jl. Ganesha No. 10, Bandung', 'O', 'Hipertensi', 'Siti Aminah'),
('2', 'Siti Nurhaliza', '3201010100000002', '1990-03-22', 34, 'Perempuan', '081234567002', 'Jl. Sudirman No. 25, Jakarta', 'A', 'Asma', 'Rina Dewi'),
('3', 'Andi Wijaya', '3201010100000003', '2000-11-01', 24, 'Laki-laki', '081234567003', 'Jl. Dipatiukur No. 35, Surabaya', 'B', NULL, 'Dewi Lestari'),
('4', 'Rina Kusuma', '3201010100000004', '1995-08-15', 29, 'Perempuan', '081234567004', 'Jl. Dago No. 45, Bandung', 'AB', NULL, 'Sari Indah');

-- ============================
-- 2. Karyawan
-- ============================
INSERT INTO Karyawan (ID_karyawan, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat) VALUES
('1', 'Dr. Andika Pratama', '3301010100000001', '1975-02-10', 49, 'Laki-laki', '0812000001', 'Jl. Pasteur No. 1, Bandung'),
('2', 'Dr. Clara Meilani', '3301010100000002', '1980-06-17', 44, 'Perempuan', '0812000002', 'Jl. Setiabudi No. 2, Jakarta'),
('3', 'Rina Saputra', '3301010100000003', '1995-03-20', 29, 'Perempuan', '0812000003', 'Jl. Cihampelas No. 3, Cimahi'),
('4', 'Anton Wijaya', '3301010100000004', '1990-08-05', 34, 'Laki-laki', '0812000004', 'Jl. Riau No. 4, Bandung'),
('5', 'Maya Lestari', '3301010100000005', '1998-01-15', 26, 'Perempuan', '0812000005', 'Jl. Buah Batu No. 5, Bandung');

-- ============================
-- 3. Dokter
-- ============================
INSERT INTO Dokter (ID_karyawan, Spesialis, STR, Status, Shift) VALUES
('1', 'Umum', 'STR001', 'Aktif', 'Pagi'),
('2', 'Penyakit Dalam', 'STR002', 'Aktif', 'Siang');

-- ============================
-- 4. Operasional
-- ============================
INSERT INTO Operasional (ID_karyawan) VALUES
('4');

-- ============================
-- 5. Resepsionis
-- ============================
INSERT INTO Resepsionis (ID_karyawan) VALUES
('3'),
('5');

-- ============================
-- 6. Departemen
-- ============================
INSERT INTO Departemen (ID_Department, Nama) VALUES
('1', 'Umum'),
('2', 'Penyakit Dalam'),
('3', 'Radiologi'),
('4', 'Laboratorium');

-- ============================
-- 7. Gedung
-- ============================
INSERT INTO Gedung (ID_gedung, Nama, Latitude, Longitude) VALUES
('1', 'Gedung A', '-6.914744', '107.609810'),
('2', 'Gedung B', '-6.915200', '107.610300');

-- ============================
-- 8. Ruangan
-- ============================
INSERT INTO Ruangan (ID_ruangan, ID_gedung, Lantai) VALUES
('1', '1', 1),
('2', '1', 2),
('3', '2', 1);

-- ============================
-- 9. Perawat
-- ============================
INSERT INTO Perawat (ID_perawat, Nama, NIK, Kontak, Shift) VALUES
('1', 'Perawat Lina', '3401010100000001', '0813000001', 'Pagi'),
('2', 'Perawat Dedi', '3401010100000002', '0813000002', 'Siang');

-- ============================
-- 10. Jadwal Praktik
-- ============================
INSERT INTO Jadwal_Praktik (ID_jadwal, Date) VALUES
('1', '2024-05-10 09:00:00'),
('2', '2024-05-10 13:00:00');

-- ============================
-- 11. Pertemuan
-- ============================
-- Tabel Pertemuan dimulai kosong agar sistem dimulai bersih
-- User dapat membuat appointment baru melalui aplikasi

-- ============================
-- 12. Obat
-- ============================

-- ============================
-- 13. Hasil Pemeriksaan
-- ============================
-- Tabel dimulai kosong, akan terisi setelah dokter melakukan pemeriksaan

-- ============================
-- 14. Hasil_Obat
-- ============================
-- Tabel dimulai kosong

-- ============================
-- 15. Ronsen
-- ============================
-- Tabel dimulai kosong

-- ============================
-- 16. UrinTest
-- ============================
-- Tabel dimulai kosong

-- ============================
-- 17. Billing
-- ============================
-- Tabel dimulai kosong

-- =====================================================================
-- END OF SEED DATA
-- =====================================================================
