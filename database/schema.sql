-- ================================================================================
-- DATABASE SCHEMA - SISTEM INFORMASI KESEHATAN
-- EB4007 - Tugas Besar
-- ================================================================================

SET time_zone = '+07:00';

-- ================================================================================
-- DROP TABLES (reverse dependency order)
-- ================================================================================
DROP TABLE IF EXISTS wearable_data;
DROP TABLE IF EXISTS UrinTest;
DROP TABLE IF EXISTS Ronsen;
DROP TABLE IF EXISTS monitoring_sessions;
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
-- TABLE: users
-- ================================================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'staff_registration', 'doctor', 'staff_pharmacy', 'staff_lab', 'staff_cashier') NOT NULL,
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
-- TABLE: Dokter
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
-- TABLE: Operasional
-- ================================================================================
CREATE TABLE Operasional (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- TABLE: Resepsionis
-- ================================================================================
CREATE TABLE Resepsionis (
    ID_karyawan VARCHAR(20) PRIMARY KEY,
    FOREIGN KEY (ID_karyawan) REFERENCES Karyawan(ID_karyawan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Receptionist staff';

-- ================================================================================
-- TABLE: Perawat
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
-- TABLE: Hasil_Pemeriksaan (FINAL)
-- ================================================================================
CREATE TABLE Hasil_Pemeriksaan (
    ID_hasil VARCHAR(20) PRIMARY KEY,
    ID_pertemuan VARCHAR(20) NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    detak_jantung INT,
    kadar_oksigen DECIMAL(5,2),
    treatment_plan TEXT,
    notes TEXT,
    status ENUM('draft','completed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_pertemuan) REFERENCES Pertemuan(ID_pertemuan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- TABLE: Hasil_Obat
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
    FOREIGN KEY (ID_Obat) REFERENCES Obat(ID_obat) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- TABLE: Ronsen
-- ================================================================================
CREATE TABLE Ronsen (
    ID_ronsen VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    imgSrc VARCHAR(255),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- TABLE: UrinTest
-- ================================================================================
CREATE TABLE UrinTest (
    ID_uji VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    pH FLOAT,
    Protein ENUM('Negatif','Trace','+1','+2','+3','+4'),
    Glukosa ENUM('Negatif','Trace','+1','+2','+3','+4'),
    Ketone ENUM('Negatif','Trace','+1','+2','+3'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- TABLE: Billing
-- ================================================================================
CREATE TABLE Billing (
    ID_billing VARCHAR(20) PRIMARY KEY,
    ID_pasien VARCHAR(20) NOT NULL,
    ID_pertemuan VARCHAR(20),
    Total_harga DECIMAL(15,2) DEFAULT 0,
    Jenis_pembayaran ENUM('Cash', 'Debit', 'Credit'),
    isLunas BOOLEAN DEFAULT FALSE,
    Lunas_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_pasien) REFERENCES Pasien(ID_pasien),
    INDEX idx_isLunas (isLunas),
    INDEX idx_lunas_date (Lunas_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- TABLE: Billing_Farmasi
-- ================================================================================
CREATE TABLE Billing_Farmasi (
    ID_billing_farmasi VARCHAR(20) PRIMARY KEY,
    ID_hasil VARCHAR(20) NOT NULL,
    ID_pasien VARCHAR(20) NOT NULL,
    Total_harga DECIMAL(15,2),
    Jenis_pembayaran ENUM('Cash', 'Debit', 'Credit'),
    status_proses ENUM('pending', 'processed', 'completed') DEFAULT 'pending',
    isLunas BOOLEAN DEFAULT FALSE,
    Lunas_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_hasil) REFERENCES Hasil_Pemeriksaan(ID_hasil),
    FOREIGN KEY (ID_pasien) REFERENCES Pasien(ID_pasien),
    INDEX idx_isLunas (isLunas),
    INDEX idx_lunas_date (Lunas_date),
    INDEX idx_status_proses (status_proses)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- TABLE: monitoring_sessions
-- ================================================================================
CREATE TABLE monitoring_sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL,
    doctor_id VARCHAR(20) NOT NULL,
    appointment_id VARCHAR(20),
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    avg_heart_rate DECIMAL(10,2),
    min_heart_rate DECIMAL(10,2),
    max_heart_rate DECIMAL(10,2),
    avg_spo2 DECIMAL(10,2),
    min_spo2 DECIMAL(10,2),
    max_spo2 DECIMAL(10,2),
    has_anomaly BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES Pasien(ID_pasien),
    FOREIGN KEY (doctor_id) REFERENCES Karyawan(ID_karyawan),
    INDEX idx_status (status),
    INDEX idx_patient (patient_id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IoT monitoring sessions for real-time health monitoring';

-- ================================================================================
-- TABLE: wearable_data
-- ================================================================================
CREATE TABLE wearable_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50),
    patient_id VARCHAR(20) NOT NULL,
    measurement_type ENUM('heart_rate','spo2'),
    value DECIMAL(10,2),
    unit VARCHAR(10),
    status ENUM('normal', 'warning', 'critical'),
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES monitoring_sessions(session_id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES Pasien(ID_pasien),
    INDEX idx_session (session_id),
    INDEX idx_patient (patient_id),
    INDEX idx_measured_at (measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Time-series data from wearable IoT devices (stored every 5 seconds)';

-- ================================================================================
-- END OF SCHEMA
-- ================================================================================


-- Migration: Add kadar_oksigen column to Hasil_Pemeriksaan table
-- Date: 2025-12-18

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = "Hasil_Pemeriksaan";
SET @columnname = "kadar_oksigen";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " DECIMAL(5,2) AFTER detak_jantung")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
