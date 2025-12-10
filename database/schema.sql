-- ================================================================================
-- DATABASE SCHEMA - SISTEM INFORMASI KESEHATAN
-- EB4007 - Tugas Besar
-- ================================================================================
SET time_zone = '+07:00';
-- Drop tables if exists
DROP TABLE IF EXISTS UrinTest;
DROP TABLE IF EXISTS Ronsen;
DROP TABLE IF EXISTS Hasil_Obat;
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
DROP TABLE IF EXISTS users;

-- Tabel Users (untuk autentikasi)
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
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    FOREIGN KEY (ID_Pasien) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE,
    FOREIGN KEY (ID_Dokter) REFERENCES Dokter(ID_karyawan) ON DELETE CASCADE,
    FOREIGN KEY (ID_Perawat) REFERENCES Perawat(ID_perawat) ON DELETE SET NULL,
    FOREIGN KEY (ID_ruangan) REFERENCES Ruangan(ID_ruangan) ON DELETE SET NULL
);

-- Tabel Obat
CREATE TABLE Obat (
    ID_obat VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    Kategori ENUM('Kapsul', 'Tablet', 'Cair', 'Injeksi', 'Salep', 'Lainnya'),
    Aturan_pakai VARCHAR(100),
    Harga_satuan DECIMAL(15,2)
);


-- Tabel Hasil Pemeriksaan
CREATE TABLE Hasil_Pemeriksaan (
    ID_hasil VARCHAR(20) PRIMARY KEY,
    ID_pertemuan VARCHAR(20) NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    vital_signs TEXT,
    treatment_plan TEXT,
    notes TEXT,
    status ENUM('draft', 'completed') DEFAULT 'completed',
    FOREIGN KEY (ID_pertemuan) REFERENCES Pertemuan(ID_pertemuan) ON DELETE CASCADE
);

-- Tabel relasi many-to-many antara Hasil_Pemeriksaan dan Obat
CREATE TABLE Hasil_Obat (
    ID_hasil VARCHAR(20) NOT NULL,
    ID_Obat VARCHAR(20) NOT NULL,
    Dosis VARCHAR(50),
    Frekuensi VARCHAR(50),
    Durasi_hari INT,
    Qty INT,
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

-- Tabel Billing_Farmasi
CREATE TABLE Billing_Farmasi (
    ID_billing_farmasi VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    ID_pasien VARCHAR(20) NOT NULL,
    Total_harga DECIMAL(15,2) NOT NULL,
    Lunas_date DATE,
    Jenis_pembayaran ENUM('Credit', 'Debit', 'Cash'),
    isLunas BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE,
    FOREIGN KEY (ID_pasien) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE
);


-- Indexes untuk performa
CREATE INDEX idx_pertemuan_pasien ON Pertemuan(ID_Pasien);
CREATE INDEX idx_pertemuan_dokter ON Pertemuan(ID_Dokter);
CREATE INDEX idx_pertemuan_tanggal ON Pertemuan(Tanggal);
CREATE INDEX idx_billing_pasien ON Billing(ID_pasien);
CREATE INDEX idx_hasil_pertemuan ON Hasil_Pemeriksaan(ID_pertemuan);
