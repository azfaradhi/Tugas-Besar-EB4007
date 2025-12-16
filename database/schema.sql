-- ================================================================================
-- DATABASE SCHEMA - SISTEM INFORMASI KESEHATAN
-- EB4007 - Tugas Besar
-- Version: Consolidated with proper Foreign Keys
-- ================================================================================
SET time_zone = '+07:00';

-- ================================================================================
-- DROP TABLES (in reverse dependency order)
-- ================================================================================
DROP TABLE IF EXISTS wearable_data;
DROP TABLE IF EXISTS UrinTest;
DROP TABLE IF EXISTS Ronsen;
DROP TABLE IF EXISTS Hasil_Obat;
DROP TABLE IF EXISTS Billing_Farmasi;
DROP TABLE IF EXISTS Hasil_Pemeriksaan;
DROP TABLE IF EXISTS Billing;
DROP TABLE IF EXISTS Pertemuan;
DROP TABLE IF EXISTS Jadwal_Praktik;
DROP TABLE IF EXISTS Perawat;
DROP TABLE IF EXISTS Resepsionis;
DROP TABLE IF EXISTS Operasional;
DROP TABLE IF EXISTS Dokter;
DROP TABLE IF EXISTS Karyawan;
DROP TABLE IF EXISTS Pasien;
DROP TABLE IF EXISTS Obat;
DROP TABLE IF EXISTS Ruangan;
DROP TABLE IF EXISTS Gedung;
DROP TABLE IF EXISTS Departemen;
DROP TABLE IF EXISTS users;

-- ================================================================================
-- TABLE: users (Authentication & Authorization)
-- ================================================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'staff_registration', 'doctor', 'staff_pharmacy', 'staff_lab', 'staff_cashier') NOT NULL,
    profile_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User authentication and authorization';

-- ================================================================================
-- TABLE: Departemen
-- ================================================================================
CREATE TABLE Departemen (
    ID_Department VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    INDEX idx_nama (Nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Medical departments';

-- ================================================================================
-- TABLE: Gedung
-- ================================================================================
CREATE TABLE Gedung (
    ID_gedung VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    Latitude VARCHAR(50),
    Longitude VARCHAR(50),
    INDEX idx_nama (Nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Hospital buildings';

-- ================================================================================
-- TABLE: Ruangan
-- ================================================================================
CREATE TABLE Ruangan (
    ID_ruangan VARCHAR(20) PRIMARY KEY,
    ID_gedung VARCHAR(20) NOT NULL,
    Lantai INT,
    FOREIGN KEY (ID_gedung) REFERENCES Gedung(ID_gedung) ON DELETE CASCADE,
    INDEX idx_gedung (ID_gedung),
    INDEX idx_lantai (Lantai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Hospital rooms';

-- ================================================================================
-- TABLE: Pasien
-- ================================================================================
CREATE TABLE Pasien (
    ID_pasien VARCHAR(20) PRIMARY KEY,
    user_id INT UNIQUE,
    Nama VARCHAR(100) NOT NULL,
    Tanggal_lahir DATETIME NOT NULL,
    Umur INT,
    Jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    No_telpon VARCHAR(15),
    Alamat VARCHAR(255),
    Golongan_darah VARCHAR(5),
    Riwayat_penyakit TEXT,
    Nama_ibu_kandung VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nama (Nama),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Patient information';

-- ================================================================================
-- TABLE: Karyawan
-- ================================================================================
CREATE TABLE Karyawan (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    user_id INT UNIQUE,
    Nama VARCHAR(100) NOT NULL,
    Tanggal_lahir DATETIME NOT NULL,
    Umur INT,
    Jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    No_telpon VARCHAR(15),
    Alamat VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nama (Nama),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Employee base table';

-- ================================================================================
-- TABLE: Dokter (inherits from Karyawan)
-- ================================================================================
CREATE TABLE Dokter (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    ID_Department VARCHAR(20),
    Spesialis VARCHAR(100),
    STR VARCHAR(50) UNIQUE,
    Status VARCHAR(20),
    Shift VARCHAR(20),
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE,
    FOREIGN KEY (ID_Department) REFERENCES Departemen(ID_Department) ON DELETE SET NULL,
    INDEX idx_spesialis (Spesialis),
    INDEX idx_department (ID_Department),
    INDEX idx_str (STR)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Doctor information';

-- ================================================================================
-- TABLE: Operasional (inherits from Karyawan)
-- ================================================================================
CREATE TABLE Operasional (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Operational staff';

-- ================================================================================
-- TABLE: Resepsionis (inherits from Karyawan)
-- ================================================================================
CREATE TABLE Resepsionis (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Receptionist staff';

-- ================================================================================
-- TABLE: Perawat (inherits from Karyawan)
-- ================================================================================
CREATE TABLE Perawat (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    Shift VARCHAR(20),
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE,
    INDEX idx_shift (Shift)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Nurse information';

-- ================================================================================
-- TABLE: Jadwal_Praktik
-- ================================================================================
CREATE TABLE Jadwal_Praktik (
    ID_jadwal VARCHAR(20) PRIMARY KEY,
    ID_Dokter VARCHAR(20) NOT NULL,
    ID_ruangan VARCHAR(20),
    Date DATETIME NOT NULL,
    FOREIGN KEY (ID_Dokter) REFERENCES Dokter(ID_karyawan) ON DELETE CASCADE,
    FOREIGN KEY (ID_ruangan) REFERENCES Ruangan(ID_ruangan) ON DELETE SET NULL,
    INDEX idx_dokter (ID_Dokter),
    INDEX idx_date (Date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Doctor practice schedule';

-- ================================================================================
-- TABLE: Pertemuan
-- ================================================================================
CREATE TABLE Pertemuan (
    ID_pertemuan VARCHAR(20) PRIMARY KEY,
    ID_Pasien VARCHAR(20) NOT NULL,
    ID_Dokter VARCHAR(20) NOT NULL,
    ID_Perawat VARCHAR(20),
    ID_ruangan VARCHAR(20),
    Tanggal DATE NOT NULL,
    Waktu_mulai TIME NOT NULL,
    Waktu_selesai TIME,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    FOREIGN KEY (ID_Pasien) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE,
    FOREIGN KEY (ID_Dokter) REFERENCES Dokter(ID_karyawan) ON DELETE CASCADE,
    FOREIGN KEY (ID_Perawat) REFERENCES Perawat(ID_karyawan) ON DELETE SET NULL,
    FOREIGN KEY (ID_ruangan) REFERENCES Ruangan(ID_ruangan) ON DELETE SET NULL,
    INDEX idx_pasien (ID_Pasien),
    INDEX idx_dokter (ID_Dokter),
    INDEX idx_tanggal (Tanggal),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Patient appointments and visits';

-- ================================================================================
-- TABLE: Obat
-- ================================================================================
CREATE TABLE Obat (
    ID_obat VARCHAR(20) PRIMARY KEY,
    Nama VARCHAR(100) NOT NULL,
    Kategori ENUM('Kapsul', 'Tablet', 'Cair', 'Injeksi', 'Salep', 'Lainnya'),
    Aturan_pakai VARCHAR(100),
    Harga_satuan DECIMAL(15,2),
    Stok INT DEFAULT 0,
    INDEX idx_nama (Nama),
    INDEX idx_kategori (Kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Medicine inventory';

-- ================================================================================
-- TABLE: Hasil_Pemeriksaan
-- ================================================================================
CREATE TABLE Hasil_Pemeriksaan (
    ID_hasil VARCHAR(20) PRIMARY KEY,
    ID_pertemuan VARCHAR(20) NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    vital_signs TEXT,
    treatment_plan TEXT,
    notes TEXT,
    status ENUM('draft', 'completed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_pertemuan) REFERENCES Pertemuan(ID_pertemuan) ON DELETE CASCADE,
    INDEX idx_pertemuan (ID_pertemuan),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Examination results';

-- ================================================================================
-- TABLE: Hasil_Obat (Many-to-Many: Hasil_Pemeriksaan <-> Obat)
-- ================================================================================
CREATE TABLE Hasil_Obat (
    ID_hasil VARCHAR(20) NOT NULL,
    ID_Obat VARCHAR(20) NOT NULL,
    Dosis VARCHAR(50),
    Frekuensi VARCHAR(50),
    Durasi_hari INT,
    Qty INT,
    PRIMARY KEY (ID_hasil, ID_Obat),
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE,
    FOREIGN KEY (ID_Obat) REFERENCES Obat(ID_obat) ON DELETE CASCADE,
    INDEX idx_hasil (ID_hasil),
    INDEX idx_obat (ID_Obat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Prescription details';

-- ================================================================================
-- TABLE: Ronsen (X-Ray results)
-- ================================================================================
CREATE TABLE Ronsen (
    ID_ronsen VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    imgSrc VARCHAR(255),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE,
    INDEX idx_hasil (ID_hasil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='X-ray examination results';

-- ================================================================================
-- TABLE: UrinTest
-- ================================================================================
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE,
    INDEX idx_hasil (ID_hasil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Urine test results';

-- ================================================================================
-- TABLE: Billing
-- ================================================================================
CREATE TABLE Billing (
    ID_billing VARCHAR(20) PRIMARY KEY,
    ID_pasien VARCHAR(20) NOT NULL,
    ID_pertemuan VARCHAR(20),
    Total_harga DECIMAL(15,2) NOT NULL DEFAULT 0,
    Lunas_date DATE,
    Jenis_pembayaran ENUM('Credit', 'Debit', 'Cash'),
    isLunas BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_pasien) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE,
    FOREIGN KEY (ID_pertemuan) REFERENCES Pertemuan(ID_pertemuan) ON DELETE SET NULL,
    INDEX idx_pasien (ID_pasien),
    INDEX idx_pertemuan (ID_pertemuan),
    INDEX idx_isLunas (isLunas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Medical service billing';

-- ================================================================================
-- TABLE: Billing_Farmasi
-- ================================================================================
CREATE TABLE Billing_Farmasi (
    ID_billing_farmasi VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    ID_pasien VARCHAR(20) NOT NULL,
    Total_harga DECIMAL(15,2) NOT NULL,
    Lunas_date DATE,
    Jenis_pembayaran ENUM('Credit', 'Debit', 'Cash'),
    isLunas BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE,
    FOREIGN KEY (ID_pasien) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE,
    INDEX idx_hasil (ID_hasil),
    INDEX idx_pasien (ID_pasien),
    INDEX idx_isLunas (isLunas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Pharmacy billing';

-- ================================================================================
-- TABLE: wearable_data (IoT Sensor Data - MAX30102)
-- ================================================================================
CREATE TABLE wearable_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(20) NOT NULL,
    measurement_type ENUM('heart_rate', 'spo2') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(10),
    measured_at DATETIME NOT NULL,
    status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Pasien(ID_pasien) ON DELETE CASCADE,
    INDEX idx_patient_time (patient_id, measured_at DESC),
    INDEX idx_measurement_type (measurement_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MAX30102 sensor measurement data (temporary use during visits)';

-- ================================================================================
-- END OF SCHEMA
-- ================================================================================
