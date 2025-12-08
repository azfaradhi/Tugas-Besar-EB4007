
-- Drop tables if exists
DROP TABLE IF EXISTS UrinTest;
DROP TABLE IF EXISTS Ronsen;
DROP TABLE IF EXISTS Hasil_Pemeriksaan;
DROP TABLE IF EXISTS Billing;
DROP TABLE IF EXISTS Pertemuan;
DROP TABLE IF EXISTS Perawat;
DROP TABLE IF EXISTS Jadwal_Praktik;
DROP TABLE IF EXISTS Departemen;
DROP TABLE IF EXISTS Resepsionis;
DROP TABLE IF EXISTS Operasional;
DROP TABLE IF EXISTS Dokter;
DROP TABLE IF EXISTS Karyawan;
DROP TABLE IF EXISTS Pasien;
DROP TABLE IF EXISTS Obat;
DROP TABLE IF EXISTS Ruangan;
DROP TABLE IF EXISTS Gedung;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'staff_registration', 'doctor', 'staff_pharmacy', 'staff_lab', 'staff_cashier') NOT NULL,
    profile_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Pasien
CREATE TABLE Pasien (
    ID_pasien VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    NIK CHAR(16) UNIQUE NOT NULL,
    Tanggal_lahir DATETIME NOT NULL,
    Umur INT,
    Jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    No_telpon VARCHAR(15),
    Alamat VARCHAR(255),
    Golongan_darah VARCHAR(5),
    Riwayat_penyakit TEXT,
    Nama_ibu_kandung VARCHAR(100)
);

-- Tabel Karyawan
CREATE TABLE Karyawan (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    NIK CHAR(16) UNIQUE NOT NULL,
    Tanggal_lahir DATETIME NOT NULL,
    Umur INT,
    Jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    No_telpon VARCHAR(15),
    Alamat VARCHAR(255)
);

-- Tabel Dokter (inheritance dari Karyawan)
CREATE TABLE Dokter (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    Spesialis VARCHAR(100),
    STR VARCHAR(50) UNIQUE,
    Status VARCHAR(20),
    Shift VARCHAR(20),
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE
);

-- Tabel Operasional (inheritance dari Karyawan)
CREATE TABLE Operasional (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE
);

-- Tabel Resepsionis (inheritance dari Karyawan)
CREATE TABLE Resepsionis (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE
);

-- Tabel Departemen
CREATE TABLE Departemen (
    ID_Department VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL
);

-- Tabel Gedung
CREATE TABLE Gedung (
    ID_gedung VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    Latitude VARCHAR(50),
    Longitude VARCHAR(50)
);

-- Tabel Ruangan
CREATE TABLE Ruangan (
    ID_ruangan VARCHAR(20) PRIMARY KEY,
    ID_gedung VARCHAR(20),
    Lantai INT,
    FOREIGN KEY (ID_gedung) REFERENCES Gedung(ID_gedung) ON DELETE SET NULL
);

-- Tabel Perawat
CREATE TABLE Perawat (
    ID_perawat VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    NIK CHAR(16) UNIQUE NOT NULL,
    Kontak VARCHAR(15),
    Shift VARCHAR(20)
);

-- Tabel Jadwal Praktik
CREATE TABLE Jadwal_Praktik (
    ID_jadwal VARCHAR(20) PRIMARY KEY,
    Date DATETIME NOT NULL
);

-- Tabel Pertemuan
CREATE TABLE Pertemuan (
    ID_pertemuan VARCHAR(20) PRIMARY KEY,
    ID_Pasien VARCHAR(20) NOT NULL,
    ID_Dokter VARCHAR(20) NOT NULL,
    ID_Perawat VARCHAR(20),
    ID_ruangan VARCHAR(20),
    Tanggal DATE NOT NULL,
    Waktu_mulai TIME NOT NULL,
    Waktu_selesai TIME,
    FOREIGN KEY (ID_Pasien) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE,
    FOREIGN KEY (ID_Dokter) REFERENCES Dokter(ID_karyawan) ON DELETE CASCADE,
    FOREIGN KEY (ID_Perawat) REFERENCES Perawat(ID_perawat) ON DELETE SET NULL,
    FOREIGN KEY (ID_ruangan) REFERENCES Ruangan(ID_ruangan) ON DELETE SET NULL
);

-- Tabel Obat
CREATE TABLE Obat (
    ID_obat VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    Kategori ENUM('Kapsul', 'Tablet', 'Cair', 'Injeksi', 'Salep', 'Lainnya')
);

-- Tabel Hasil Pemeriksaan
CREATE TABLE Hasil_Pemeriksaan (
    ID_hasil VARCHAR(20) PRIMARY KEY,
    ID_pertemuan VARCHAR(20) NOT NULL,
    FOREIGN KEY (ID_pertemuan) REFERENCES Pertemuan(ID_pertemuan) ON DELETE CASCADE
);

-- Tabel relasi many-to-many antara Hasil_Pemeriksaan dan Obat
CREATE TABLE Hasil_Obat (
    ID_hasil VARCHAR(20),
    ID_Obat VARCHAR(20),
    PRIMARY KEY (ID_hasil, ID_Obat),
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE,
    FOREIGN KEY (ID_Obat) REFERENCES Obat(ID_obat) ON DELETE CASCADE
);

-- Tabel Ronsen
CREATE TABLE Ronsen (
    ID_ronsen VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    imgSrc VARCHAR(255),
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE
);

-- Tabel UrinTest
CREATE TABLE UrinTest (
    ID_uji VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    Warna ENUM('Kuning Muda', 'Kuning', 'Kuning Tua', 'Merah', 'Coklat', 'Lainnya'),
    pH FLOAT,
    Protein ENUM('Negatif', 'Trace', '+1', '+2', '+3', '+4'),
    Glukosa ENUM('Negatif', 'Trace', '+1', '+2', '+3', '+4'),
    Ketone ENUM('Negatif', 'Trace', '+1', '+2', '+3'),
    Bilirubin ENUM('Negatif', '+1', '+2', '+3'),
    Urobilin ENUM('Negatif', 'Normal', '+1', '+2', '+3'),
    Hemoglobin ENUM('Negatif', 'Trace', '+1', '+2', '+3'),
    Sel_darah_putih ENUM('0-5', '5-10', '10-20', '>20'),
    Sel_darah_merah ENUM('0-3', '3-5', '5-10', '>10'),
    Bakteri ENUM('Negatif', '+1', '+2', '+3'),
    Sel_epitheal ENUM('Sedikit', 'Sedang', 'Banyak'),
    Crystals ENUM('Negatif', 'Oksalat', 'Urat', 'Fosfat', 'Lainnya'),
    Casts ENUM('Negatif', 'Hialin', 'Granuler', 'Eritrosit', 'Leukosit'),
    Organisme_terisolasi VARCHAR(100),
    Antimicrobial ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Trimethoprim ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Cefuroxime ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Amoxycillin_Clavulanic_acid ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Cephalexin ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Nitrofurantoin ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Ciprofloxacin ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Doxycycline ENUM('Sensitif', 'Intermediet', 'Resisten'),
    Gentamicin ENUM('Sensitif', 'Intermediet', 'Resisten'),
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE
);

-- Tabel Billing
CREATE TABLE Billing (
    ID_billing VARCHAR(20) PRIMARY KEY,
    ID_pasien VARCHAR(20) NOT NULL,
    Lunas_date DATE,
    Jenis_pembayaran ENUM('Credit', 'Debit', 'Cash'),
    isLunas BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ID_pasien) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE
);

-- Indexes untuk performa
CREATE INDEX idx_pertemuan_pasien ON Pertemuan(ID_Pasien);
CREATE INDEX idx_pertemuan_dokter ON Pertemuan(ID_Dokter);
CREATE INDEX idx_pertemuan_tanggal ON Pertemuan(Tanggal);
CREATE INDEX idx_billing_pasien ON Billing(ID_pasien);
CREATE INDEX idx_hasil_pertemuan ON Hasil_Pemeriksaan(ID_pertemuan);

-- ================================================================================
-- SECTION 4: DATA SEED (UNTUK TESTING)
-- ================================================================================

-- Insert Users (password: "password123" - hashed dengan bcrypt)
-- Hash: $2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq
INSERT INTO users (username, password, role, profile_id) VALUES
-- Pasien
('patient001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient',1),
('patient002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient',2),
('patient003', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient',3),
('patient004', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient',4),
-- Staff Pendaftaran
('staff_reg001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration', 3),
('staff_reg002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration'1),
-- Dokter
('dr_andy', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor', 1),
('dr_clara', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor', 2),
-- Staff Farmasi
('pharmacy001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_pharmacy'),
('pharmacy002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_pharmacy'),
-- Staff Lab
('lab001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_lab', 3),
('lab002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_lab', 4),
-- Staff Kasir
('cashier001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_cashier', 3),
('cashier002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_cashier',4);

-- =====================================================================
-- DATA SEED UNTUK SCHEMA BARU (BERBAHASA INDONESIA)
-- =====================================================================

-- ============================
-- 1. Pasien
-- ============================
INSERT INTO Pasien (ID_pasien, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah, Riwayat_penyakit, Nama_ibu_kandung) VALUES
(1, 'Budi Santoso', '3201010100000001', '1985-05-12', 39, 'Laki-laki', '081234567001', 'Bandung', 'O', 'Hipertensi', 'Siti Aminah'),
(2, 'Siti Nurhaliza', '3201010100000002', '1990-03-22', 34, 'Perempuan', '081234567002', 'Jakarta', 'A', 'Asma', 'Rina Dewi'),
(3, 'Andi Wijaya', '3201010100000003', '2000-11-01', 24, 'Laki-laki', '081234567003', 'Surabaya', 'B', NULL, 'Dewi Lestari');

-- ============================
-- 2. Karyawan
-- ============================
INSERT INTO Karyawan (ID_karyawan, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat) VALUES
(1, 'Dr. Andika Pratama', '3301010100000001', '1975-02-10', 49, 'Laki-laki', '0812000001', 'Bandung'),
(2, 'Dr. Clara Meilani', '3301010100000002', '1980-06-17', 44, 'Perempuan', '0812000002', 'Jakarta'),
(3, 'Rina Saputra', '3301010100000003', '1995-03-20', 29, 'Perempuan', '0812000003', 'Cimahi'),
(4, 'Anton Wijaya', '3301010100000004', '1990-08-05', 34, 'Laki-laki', '0812000004', 'Bandung'),
(5, 'Maya Lestari', '3301010100000005', '1998-01-15', 26, 'Perempuan', '0812000005', 'Bandung');

-- ============================
-- 3. Dokter
-- ============================
INSERT INTO Dokter (ID_karyawan, Spesialis, STR, Status, Shift) VALUES
(1, 'Umum', 'STR001', 'Aktif', 'Pagi'),
(2, 'Penyakit Dalam', 'STR002', 'Aktif', 'Siang');

-- ============================
-- 4. Operasional
-- ============================
INSERT INTO Operasional (ID_karyawan) VALUES
(4);

-- ============================
-- 5. Resepsionis
-- ============================
INSERT INTO Resepsionis (ID_karyawan) VALUES
(3),
(5);

-- ============================
-- 6. Departemen
-- ============================
INSERT INTO Departemen (ID_Department, Nama) VALUES
(1, 'Umum'),
(2, 'Penyakit Dalam'),
(3, 'Radiologi'),
(4, 'Laboratorium');

-- ============================
-- 7. Gedung
-- ============================
INSERT INTO Gedung (ID_gedung, Nama, Latitude, Longitude) VALUES
(1, 'Gedung A', '-6.914744', '107.609810'),
(2, 'Gedung B', '-6.915200', '107.610300');

-- ============================
-- 8. Ruangan
-- ============================
INSERT INTO Ruangan (ID_ruangan, ID_gedung, Lantai) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1);

-- ============================
-- 9. Perawat
-- ============================
INSERT INTO Perawat (ID_perawat, Nama, NIK, Kontak, Shift) VALUES
(1, 'Perawat Lina', '3401010100000001', '0813000001', 'Pagi'),
(2, 'Perawat Dedi', '3401010100000002', '0813000002', 'Siang');

-- ============================
-- 10. Jadwal Praktik
-- ============================
INSERT INTO Jadwal_Praktik (ID_jadwal, Date) VALUES
(1, '2024-05-10 09:00:00'),
(2, '2024-05-10 13:00:00');

-- ============================
-- 11. Pertemuan
-- ============================
INSERT INTO Pertemuan (ID_pertemuan, ID_Pasien, ID_Dokter, ID_Perawat, ID_ruangan, Tanggal, Waktu_mulai, Waktu_selesai) VALUES
(1, 1, 1, 1, 1, '2024-05-10', '09:00:00', '09:30:00'),
(2, 2, 2, 2, 2, '2024-05-10', '13:00:00', '13:45:00'),
(3, 3, 1, NULL, 3, '2024-05-11', '10:00:00', NULL);

-- ============================
-- 12. Obat
-- ============================
INSERT INTO Obat (ID_obat, Nama, Kategori) VALUES
(1, 'Paracetamol', 'Tablet'),
(2, 'Amoxicillin', 'Kapsul'),
(3, 'Ibuprofen', 'Tablet'),
(4, 'Vitamin C', 'Tablet');

-- ============================
-- 13. Hasil Pemeriksaan
-- ============================
INSERT INTO Hasil_Pemeriksaan (ID_hasil, ID_pertemuan) VALUES
(1, 1),
(2, 2),
(3, 3);

-- ============================
-- 14. Hasil_Obat
-- ============================
INSERT INTO Hasil_Obat (ID_hasil, ID_Obat) VALUES
(1, 1),
(1, 4),
(2, 2),
(3, 1),
(3, 3);

-- ============================
-- 15. Ronsen
-- ============================
INSERT INTO Ronsen (ID_ronsen, ID_hasil, imgSrc) VALUES
(1, 1, 'uploads/ronsen1.png'),
(2, 2, 'uploads/ronsen2.png');

-- ============================
-- 16. UrinTest
-- ============================
INSERT INTO UrinTest (
    ID_uji, ID_hasil, Warna, pH, Protein, Glukosa, Ketone, Bilirubin,
    Urobilin, Hemoglobin, Sel_darah_putih, Sel_darah_merah,
    Bakteri, Sel_epitheal, Crystals, Casts, Organisme_terisolasi,
    Antimicrobial, Trimethoprim, Cefuroxime, Amoxycillin_Clavulanic_acid,
    Cephalexin, Nitrofurantoin, Ciprofloxacin, Doxycycline, Gentamicin
) VALUES
(1, 1, 'Kuning', 6.0, 'Negatif', 'Negatif', 'Negatif', 'Negatif',
 'Normal', 'Negatif', '0-5', '0-3', 'Negatif', 'Sedikit', 'Negatif', 'Negatif',
 NULL, 'Sensitif', 'Sensitif', 'Sensitif', 'Sensitif',
 'Sensitif', 'Sensitif', 'Sensitif', 'Sensitif', 'Sensitif'),

(2, 2, 'Kuning Tua', 5.5, '+1', 'Trace', 'Trace', '+1',
 '+1', '+1', '10-20', '5-10', '+1', 'Sedang', 'Oksalat', 'Hialin',
 'E.coli', 'Resisten', 'Sensitif', 'Resisten', 'Sensitif',
 'Resisten', 'Sensitif', 'Intermediet', 'Sensitif', 'Intermediet');

-- ============================
-- 17. Billing
-- ============================
INSERT INTO Billing (ID_billing, ID_pasien, Lunas_date, Jenis_pembayaran, isLunas) VALUES
(1, 1, '2024-05-10', 'Cash', TRUE),
(2, 2, NULL, 'Debit', FALSE),
(3, 3, '2024-05-11', 'Credit', TRUE);

INSERT INTO Pertemuan (ID_pertemuan, ID_Pasien, ID_Dokter, ID_Perawat, ID_ruangan, Tanggal, Waktu_mulai, Waktu_selesai) VALUES
(4, 1, 2, 1, 1, '2025-12-08', '15:00:00', '15:40:00'),

(5, 2, 1, 2, 1, '2025-12-09', '08:15:00', '08:50:00'),
(6, 3, 2, NULL, 2, '2025-12-09', '10:00:00', '10:30:00'),
(7, 1, 1, 1, 3, '2025-12-09', '13:30:00', '14:00:00'),
(8, 2, 2, 2, 1, '2025-12-09', '16:00:00', '16:30:00'),

(9, 3, 1, 2, 2, '2025-12-10', '08:00:00', '08:25:00'),
(10, 1, 2, NULL, 3, '2025-12-10', '09:30:00', '10:00:00'),
(11, 2, 1, 1, 1, '2025-12-10', '13:00:00', '13:20:00'),
(12, 3, 2, 2, 2, '2025-12-10', '15:30:00', '16:00:00'),

(13, 1, 1, 1, 2, '2025-12-11', '08:10:00', '08:40:00'),
(14, 2, 2, NULL, 1, '2025-12-11', '10:00:00', '10:35:00'),
(15, 3, 1, 2, 3, '2025-12-11', '14:00:00', '14:30:00'),
(16, 1, 2, 1, 1, '2025-12-11', '16:10:00', '16:45:00'),

(17, 2, 1, NULL, 2, '2025-12-12', '08:20:00', '08:50:00'),
(18, 3, 2, 2, 1, '2025-12-12', '09:45:00', '10:10:00'),
(19, 1, 1, 1, 3, '2025-12-12', '13:20:00', '13:50:00'),
(20, 2, 2, NULL, 2, '2025-12-12', '15:40:00', '16:10:00'),

(21, 3, 1, 1, 1, '2025-12-13', '08:00:00', '08:25:00'),
(22, 1, 2, 2, 2, '2025-12-13', '10:00:00', '10:30:00'),
(23, 2, 1, NULL, 3, '2025-12-13', '13:00:00', '13:40:00'),
(24, 3, 2, 1, 1, '2025-12-13', '15:20:00', '15:50:00'),

(25, 1, 1, NULL, 2, '2025-12-14', '08:30:00', '08:55:00'),
(26, 2, 2, 2, 1, '2025-12-14', '10:00:00', '10:25:00'),
(27, 3, 1, 1, 3, '2025-12-14', '13:10:00', '13:40:00'),
(28, 1, 2, NULL, 2, '2025-12-14', '16:00:00', '16:35:00'),

(29, 2, 1, 1, 1, '2025-12-15', '08:05:00', '08:30:00'),
(30, 3, 2, 2, 3, '2025-12-15', '09:50:00', '10:20:00'),
(31, 1, 1, NULL, 2, '2025-12-15', '13:30:00', '14:00:00'),
(32, 3, 2, 1, 1, '2025-12-15', '15:10:00', '15:45:00'),

(33, 1, 1, 2, 3, '2025-12-16', '08:10:00', '08:40:00'),
(34, 2, 2, NULL, 1, '2025-12-16', '09:30:00', '10:00:00'),
(35, 3, 1, 1, 2, '2025-12-16', '13:15:00', '13:45:00'),
(36, 2, 2, 2, 3, '2025-12-16', '16:00:00', '16:20:00'),

(37, 3, 1, NULL, 1, '2025-12-17', '08:00:00', '08:30:00'),
(38, 1, 2, 1, 2, '2025-12-17', '10:00:00', '10:25:00'),
(39, 2, 1, 2, 3, '2025-12-17', '13:30:00', '13:55:00'),
(40, 3, 2, NULL, 1, '2025-12-18', '08:30:00', '09:00:00');


-- =====================================================================
-- END OF SEED DATA
-- =====================================================================

