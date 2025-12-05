-- ================================================================================
-- COMPLETE DATABASE SCHEMA - SISTEM INFORMASI KESEHATAN
-- EB4007 - Tugas Besar
-- ================================================================================
-- File ini berisi:
-- 1. Schema Lama (Original)
-- 2. Schema Baru (Berdasarkan PDF)
-- 3. Script Migrasi dari Schema Lama ke Baru
-- 4. Data Seed untuk Testing
-- ================================================================================

-- ================================================================================
-- SECTION 1: SCHEMA LAMA (ORIGINAL)
-- ================================================================================

-- Drop tables if exists
DROP TABLE IF EXISTS wearable_data;
DROP TABLE IF EXISTS referrals;
DROP TABLE IF EXISTS payment_items;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS lab_results;
DROP TABLE IF EXISTS lab_tests;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

-- Tabel Users (untuk autentikasi)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'staff_registration', 'doctor', 'staff_pharmacy', 'staff_lab', 'staff_cashier') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Patients
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    patient_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    blood_type ENUM('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Doctors
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    doctor_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Staff
CREATE TABLE staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    staff_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    position ENUM('registration', 'pharmacy', 'laboratory', 'cashier') NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Appointments (Pendaftaran)
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    complaint TEXT,
    registered_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (registered_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- Tabel Medical Records (Rekam Medis)
CREATE TABLE medical_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    vital_signs JSON,
    notes TEXT,
    treatment_plan TEXT,
    status ENUM('active', 'completed', 'referred') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Tabel Medications (Data Obat)
CREATE TABLE medications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    stock INT DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Prescriptions (Resep)
CREATE TABLE prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_number VARCHAR(20) UNIQUE NOT NULL,
    medical_record_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    status ENUM('pending', 'prepared', 'dispensed', 'completed') DEFAULT 'pending',
    notes TEXT,
    prepared_by INT,
    prepared_at TIMESTAMP NULL,
    dispensed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (prepared_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- Tabel Prescription Items (Detail Resep)
CREATE TABLE prescription_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_id INT NOT NULL,
    medication_id INT NOT NULL,
    quantity INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
);

-- Tabel Lab Tests (Pemeriksaan Lab)
CREATE TABLE lab_tests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    test_number VARCHAR(20) UNIQUE NOT NULL,
    medical_record_id INT NOT NULL,
    patient_id INT NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    ordered_by INT NOT NULL,
    processed_by INT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (ordered_by) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- Tabel Lab Results (Hasil Lab)
CREATE TABLE lab_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lab_test_id INT NOT NULL,
    parameter VARCHAR(100) NOT NULL,
    result VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    status ENUM('normal', 'abnormal', 'critical'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
);

-- Tabel Payments (Pembayaran)
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    appointment_id INT,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'debit', 'credit', 'transfer', 'insurance') NOT NULL,
    payment_status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    processed_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- Tabel Payment Items (Detail Pembayaran)
CREATE TABLE payment_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    item_type ENUM('consultation', 'medication', 'lab_test', 'procedure', 'other') NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Tabel Referrals (Rujukan)
CREATE TABLE referrals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    referral_number VARCHAR(20) UNIQUE NOT NULL,
    medical_record_id INT NOT NULL,
    patient_id INT NOT NULL,
    referring_doctor_id INT NOT NULL,
    referred_to VARCHAR(255) NOT NULL,
    specialization VARCHAR(100),
    reason TEXT NOT NULL,
    diagnosis TEXT,
    notes TEXT,
    status ENUM('pending', 'accepted', 'completed', 'cancelled') DEFAULT 'pending',
    referral_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (referring_doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Tabel Wearable Data (Data dari Wearable Device)
CREATE TABLE wearable_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    device_id VARCHAR(50),
    measurement_type ENUM('heart_rate', 'blood_pressure', 'temperature', 'oxygen_saturation', 'steps', 'sleep', 'calories') NOT NULL,
    value VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    measured_at TIMESTAMP NOT NULL,
    status ENUM('normal', 'warning', 'critical') DEFAULT 'normal',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_patient_measured (patient_id, measured_at),
    INDEX idx_measurement_type (measurement_type)
);

-- Indexes untuk performa
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);
CREATE INDEX idx_payments_status ON payments(payment_status);


-- ================================================================================
-- SECTION 2: SCHEMA BARU (BERDASARKAN PDF)
-- ================================================================================

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
-- SECTION 3: SCRIPT MIGRASI (OLD TO NEW)
-- ================================================================================

-- Migration Script: Old Schema to New Schema (PDF-based)
-- Migrasi data dari schema lama ke schema baru sesuai PDF

-- Step 1: Migrasi data Pasien
INSERT INTO Pasien (ID_pasien, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat, Golongan_darah, Riwayat_penyakit, Nama_ibu_kandung)
SELECT
    CONCAT('P', LPAD(id, 6, '0')) as ID_pasien,
    name as Nama,
    COALESCE(phone, CONCAT('000000000', id)) as NIK,
    date_of_birth as Tanggal_lahir,
    YEAR(CURDATE()) - YEAR(date_of_birth) as Umur,
    CASE
        WHEN gender = 'male' THEN 'Laki-laki'
        WHEN gender = 'female' THEN 'Perempuan'
    END as Jenis_kelamin,
    phone as No_telpon,
    address as Alamat,
    blood_type as Golongan_darah,
    NULL as Riwayat_penyakit,
    NULL as Nama_ibu_kandung
FROM patients;

-- Step 2: Migrasi data Karyawan dari Doctors
INSERT INTO Karyawan (ID_karyawan, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat)
SELECT
    CONCAT('K', LPAD(id, 6, '0')) as ID_karyawan,
    name as Nama,
    COALESCE(license_number, CONCAT('DOC', id)) as NIK,
    COALESCE(CURDATE() - INTERVAL 30 YEAR, CURDATE() - INTERVAL 30 YEAR) as Tanggal_lahir,
    30 as Umur,
    'Laki-laki' as Jenis_kelamin,
    phone as No_telpon,
    NULL as Alamat
FROM doctors;

-- Step 3: Migrasi data Dokter
INSERT INTO Dokter (ID_karyawan, Spesialis, STR, Status, Shift)
SELECT
    CONCAT('K', LPAD(id, 6, '0')) as ID_karyawan,
    specialization as Spesialis,
    license_number as STR,
    'Aktif' as Status,
    NULL as Shift
FROM doctors;

-- Step 4: Migrasi data Karyawan dari Staff
INSERT INTO Karyawan (ID_karyawan, Nama, NIK, Tanggal_lahir, Umur, Jenis_kelamin, No_telpon, Alamat)
SELECT
    CONCAT('S', LPAD(id, 6, '0')) as ID_karyawan,
    name as Nama,
    COALESCE(staff_number, CONCAT('STF', id)) as NIK,
    COALESCE(CURDATE() - INTERVAL 25 YEAR, CURDATE() - INTERVAL 25 YEAR) as Tanggal_lahir,
    25 as Umur,
    'Laki-laki' as Jenis_kelamin,
    phone as No_telpon,
    NULL as Alamat
FROM staff;

-- Step 5: Migrasi Operasional dan Resepsionis
INSERT INTO Operasional (ID_karyawan)
SELECT CONCAT('S', LPAD(id, 6, '0'))
FROM staff
WHERE position IN ('laboratory', 'pharmacy', 'cashier');

INSERT INTO Resepsionis (ID_karyawan)
SELECT CONCAT('S', LPAD(id, 6, '0'))
FROM staff
WHERE position = 'registration';

-- Step 6: Migrasi data Obat
INSERT INTO Obat (ID_obat, Nama, Kategori)
SELECT
    CONCAT('O', LPAD(id, 6, '0')) as ID_obat,
    name as Nama,
    CASE
        WHEN unit LIKE '%kapsul%' THEN 'Kapsul'
        WHEN unit LIKE '%tablet%' THEN 'Tablet'
        WHEN unit LIKE '%ml%' THEN 'Cair'
        WHEN unit LIKE '%injeksi%' THEN 'Injeksi'
        WHEN unit LIKE '%salep%' THEN 'Salep'
        ELSE 'Lainnya'
    END as Kategori
FROM medications;

-- Step 7: Migrasi Pertemuan dari Appointments
INSERT INTO Pertemuan (ID_pertemuan, ID_Pasien, ID_Dokter, ID_Perawat, ID_ruangan, Tanggal, Waktu_mulai, Waktu_selesai)
SELECT
    CONCAT('PT', LPAD(a.id, 6, '0')) as ID_pertemuan,
    CONCAT('P', LPAD(a.patient_id, 6, '0')) as ID_Pasien,
    CONCAT('K', LPAD(a.doctor_id, 6, '0')) as ID_Dokter,
    NULL as ID_Perawat,
    NULL as ID_ruangan,
    a.appointment_date as Tanggal,
    a.appointment_time as Waktu_mulai,
    ADDTIME(a.appointment_time, '01:00:00') as Waktu_selesai
FROM appointments a;

-- Step 8: Migrasi Hasil Pemeriksaan dari Medical Records
INSERT INTO Hasil_Pemeriksaan (ID_hasil, ID_pertemuan)
SELECT
    CONCAT('HP', LPAD(id, 6, '0')) as ID_hasil,
    CONCAT('PT', LPAD(appointment_id, 6, '0')) as ID_pertemuan
FROM medical_records;

-- Step 9: Migrasi Billing dari Payments
INSERT INTO Billing (ID_billing, ID_pasien, Lunas_date, Jenis_pembayaran, isLunas)
SELECT
    CONCAT('B', LPAD(id, 6, '0')) as ID_billing,
    CONCAT('P', LPAD(patient_id, 6, '0')) as ID_pasien,
    paid_at as Lunas_date,
    CASE
        WHEN payment_method = 'cash' THEN 'Cash'
        WHEN payment_method = 'debit' THEN 'Debit'
        WHEN payment_method = 'credit' THEN 'Credit'
        ELSE 'Cash'
    END as Jenis_pembayaran,
    CASE
        WHEN payment_status = 'paid' THEN TRUE
        ELSE FALSE
    END as isLunas
FROM payments;

-- Note: Data untuk tabel berikut tidak ada di schema lama, perlu diisi manual atau dari sumber lain:
-- - Perawat (tidak ada di schema lama)
-- - Jadwal_Praktik (tidak ada di schema lama)
-- - Departemen (tidak ada di schema lama)
-- - Gedung (tidak ada di schema lama)
-- - Ruangan (tidak ada di schema lama)
-- - Ronsen (tidak ada data lab yang spesifik)
-- - UrinTest (tidak ada data lab yang spesifik)


-- ================================================================================
-- SECTION 4: DATA SEED (UNTUK TESTING)
-- ================================================================================

-- Insert Users (password: "password123" - hashed dengan bcrypt)
-- Hash: $2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq
INSERT INTO users (username, password, role) VALUES
-- Pasien
('patient001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient'),
('patient002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient'),
('patient003', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient'),
('patient004', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'patient'),
-- Staff Pendaftaran
('staff_reg001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration'),
('staff_reg002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_registration'),
-- Dokter
('dr_andy', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor'),
('dr_budi', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor'),
('dr_clara', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'doctor'),
-- Staff Farmasi
('pharmacy001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_pharmacy'),
('pharmacy002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_pharmacy'),
-- Staff Lab
('lab001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_lab'),
('lab002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_lab'),
-- Staff Kasir
('cashier001', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_cashier'),
('cashier002', '$2a$10$7pKVxKAMu4bwnHNHTQzPvu0SpYTsKqjJL6PJlmesqz1ZmlsSvWGPq', 'staff_cashier');

-- Insert Patients
INSERT INTO patients (user_id, patient_number, name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, emergency_phone) VALUES
(1, 'P-2024-001', 'Ahmad Yani', '1985-03-15', 'male', 'A+', '081234567890', 'ahmad.yani@email.com', 'Jl. Ganesha No. 10, Bandung', 'Siti Yani', '081234567891'),
(2, 'P-2024-002', 'Sari Dewi', '1990-07-20', 'female', 'B+', '081234567892', 'sari.dewi@email.com', 'Jl. Sudirman No. 25, Bandung', 'Budi Dewi', '081234567893'),
(3, 'P-2024-003', 'Budi Santoso', '1978-11-05', 'male', 'O+', '081234567894', 'budi.santoso@email.com', 'Jl. Dipatiukur No. 35, Bandung', 'Ani Santoso', '081234567895'),
(4, 'P-2024-004', 'Rina Wijaya', '1995-02-28', 'female', 'AB+', '081234567896', 'rina.wijaya@email.com', 'Jl. Dago No. 45, Bandung', 'Doni Wijaya', '081234567897');

-- Insert Doctors
INSERT INTO doctors (user_id, doctor_number, name, specialization, license_number, phone, email) VALUES
(7, 'DOC-001', 'dr. Andy Firmansyah, Sp.PD', 'Penyakit Dalam', 'SIP-001-2020', '081234560001', 'dr.andy@hospital.com'),
(8, 'DOC-002', 'dr. Budi Cahyono, Sp.OG', 'Obstetri & Ginekologi', 'SIP-002-2019', '081234560002', 'dr.budi@hospital.com'),
(9, 'DOC-003', 'dr. Clara Mulyani, Sp.A', 'Anak', 'SIP-003-2021', '081234560003', 'dr.clara@hospital.com');

-- Insert Staff
INSERT INTO staff (user_id, staff_number, name, position, phone, email) VALUES
(5, 'STF-REG-001', 'Dina Marlina', 'registration', '081234560010', 'dina@hospital.com'),
(6, 'STF-REG-002', 'Eka Pratama', 'registration', '081234560011', 'eka@hospital.com'),
(10, 'STF-PHM-001', 'Fitri Handayani', 'pharmacy', '081234560020', 'fitri@hospital.com'),
(11, 'STF-PHM-002', 'Gita Sari', 'pharmacy', '081234560021', 'gita@hospital.com'),
(12, 'STF-LAB-001', 'Hendra Kusuma', 'laboratory', '081234560030', 'hendra@hospital.com'),
(13, 'STF-LAB-002', 'Indah Permata', 'laboratory', '081234560031', 'indah@hospital.com'),
(14, 'STF-CSH-001', 'Joko Susilo', 'cashier', '081234560040', 'joko@hospital.com'),
(15, 'STF-CSH-002', 'Kartika Sari', 'cashier', '081234560041', 'kartika@hospital.com');

-- Insert Appointments
INSERT INTO appointments (appointment_number, patient_id, doctor_id, appointment_date, appointment_time, status, complaint, registered_by) VALUES
('APT-2024-001', 1, 1, '2024-12-04', '09:00:00', 'completed', 'Demam tinggi dan batuk sejak 3 hari', 1),
('APT-2024-002', 2, 2, '2024-12-04', '10:00:00', 'completed', 'Kontrol kehamilan rutin', 1),
('APT-2024-003', 3, 1, '2024-12-04', '11:00:00', 'in_progress', 'Nyeri dada dan sesak napas', 2),
('APT-2024-004', 4, 3, '2024-12-05', '09:00:00', 'scheduled', 'Imunisasi anak', 1),
('APT-2024-005', 1, 1, '2024-12-05', '10:00:00', 'scheduled', 'Kontrol hasil lab', 1);

-- Insert Medical Records
INSERT INTO medical_records (appointment_id, patient_id, doctor_id, diagnosis, symptoms, vital_signs, notes, treatment_plan, status) VALUES
(1, 1, 1, 'ISPA (Infeksi Saluran Pernapasan Atas)', 'Demam 38.5°C, batuk produktif, hidung tersumbat', '{"temperature": 38.5, "blood_pressure": "120/80", "heart_rate": 88, "respiratory_rate": 20}', 'Pasien mengeluh demam sejak 3 hari yang lalu disertai batuk berdahak', 'Istirahat cukup, minum air putih, konsumsi obat sesuai resep', 'completed'),
(2, 2, 2, 'Kehamilan normal trimester 2', 'Tidak ada keluhan', '{"blood_pressure": "110/70", "weight": 58, "fundal_height": 20}', 'Kehamilan 20 minggu, kondisi ibu dan janin baik', 'Kontrol rutin setiap bulan, konsumsi vitamin prenatal', 'completed');

-- Insert Medications
INSERT INTO medications (code, name, description, unit, stock, price) VALUES
('MED-001', 'Paracetamol 500mg', 'Obat penurun panas dan pereda nyeri', 'tablet', 1000, 500.00),
('MED-002', 'Amoxicillin 500mg', 'Antibiotik untuk infeksi bakteri', 'kapsul', 500, 2000.00),
('MED-003', 'OBH Combi', 'Obat batuk', 'botol', 200, 15000.00),
('MED-004', 'Vitamin B Complex', 'Suplemen vitamin B', 'tablet', 800, 1000.00),
('MED-005', 'Ibuprofen 400mg', 'Anti inflamasi dan pereda nyeri', 'tablet', 600, 800.00),
('MED-006', 'Antasida Sirup', 'Obat maag', 'botol', 150, 12000.00),
('MED-007', 'Cetirizine 10mg', 'Obat alergi', 'tablet', 400, 1500.00),
('MED-008', 'Salbutamol Inhaler', 'Obat asma', 'inhaler', 100, 45000.00),
('MED-009', 'Asam Folat 400mcg', 'Suplemen untuk ibu hamil', 'tablet', 500, 500.00),
('MED-010', 'Vitamin C 500mg', 'Suplemen vitamin C', 'tablet', 1000, 500.00);

-- Insert Prescriptions
INSERT INTO prescriptions (prescription_number, medical_record_id, patient_id, doctor_id, status, notes, prepared_by, prepared_at, dispensed_at) VALUES
('RX-2024-001', 1, 1, 1, 'completed', 'Diminum setelah makan', 1, '2024-12-04 10:30:00', '2024-12-04 11:00:00'),
('RX-2024-002', 2, 2, 2, 'completed', 'Dikonsumsi secara teratur', 2, '2024-12-04 11:30:00', '2024-12-04 12:00:00');

-- Insert Prescription Items
INSERT INTO prescription_items (prescription_id, medication_id, quantity, dosage, frequency, duration, instructions) VALUES
(1, 1, 15, '500mg', '3x sehari', '5 hari', 'Diminum setelah makan'),
(1, 2, 15, '500mg', '3x sehari', '5 hari', 'Diminum setelah makan, habiskan antibiotik'),
(1, 3, 1, '15ml', '3x sehari', '5 hari', 'Diminum setelah makan'),
(2, 9, 30, '400mcg', '1x sehari', '30 hari', 'Diminum pagi hari'),
(2, 4, 30, '1 tablet', '1x sehari', '30 hari', 'Diminum setelah makan');

-- Insert Lab Tests
INSERT INTO lab_tests (test_number, medical_record_id, patient_id, test_type, status, ordered_by, processed_by, requested_at, completed_at) VALUES
('LAB-2024-001', 1, 1, 'Darah Lengkap', 'completed', 1, 1, '2024-12-04 09:30:00', '2024-12-04 14:00:00'),
('LAB-2024-002', 1, 1, 'C-Reactive Protein (CRP)', 'completed', 1, 1, '2024-12-04 09:30:00', '2024-12-04 14:00:00'),
('LAB-2024-003', 2, 2, 'Hemoglobin', 'completed', 2, 2, '2024-12-04 10:30:00', '2024-12-04 15:00:00');

-- Insert Lab Results
INSERT INTO lab_results (lab_test_id, parameter, result, unit, reference_range, status, notes) VALUES
-- Darah Lengkap
(1, 'Hemoglobin', '14.2', 'g/dL', '13.0-17.0', 'normal', NULL),
(1, 'Leukosit', '12.5', '10^3/uL', '4.0-10.0', 'abnormal', 'Sedikit meningkat, kemungkinan infeksi'),
(1, 'Eritrosit', '5.2', '10^6/uL', '4.5-5.5', 'normal', NULL),
(1, 'Trombosit', '280', '10^3/uL', '150-400', 'normal', NULL),
-- CRP
(2, 'CRP', '8.5', 'mg/L', '<5.0', 'abnormal', 'Menandakan proses inflamasi'),
-- Hemoglobin ibu hamil
(3, 'Hemoglobin', '11.8', 'g/dL', '11.0-14.0', 'normal', 'Normal untuk ibu hamil');

-- Insert Payments
INSERT INTO payments (payment_number, patient_id, appointment_id, total_amount, payment_method, payment_status, paid_at, processed_by) VALUES
('PAY-2024-001', 1, 1, 285000.00, 'cash', 'paid', '2024-12-04 15:00:00', 1),
('PAY-2024-002', 2, 2, 242500.00, 'transfer', 'paid', '2024-12-04 16:00:00', 2);

-- Insert Payment Items
INSERT INTO payment_items (payment_id, item_type, description, quantity, unit_price, subtotal) VALUES
-- Pembayaran pasien 1
(1, 'consultation', 'Konsultasi Dokter Spesialis Penyakit Dalam', 1, 150000.00, 150000.00),
(1, 'lab_test', 'Pemeriksaan Darah Lengkap', 1, 75000.00, 75000.00),
(1, 'lab_test', 'Pemeriksaan CRP', 1, 50000.00, 50000.00),
(1, 'medication', 'Obat-obatan', 1, 10000.00, 10000.00),
-- Pembayaran pasien 2
(2, 'consultation', 'Konsultasi Dokter Spesialis Kandungan', 1, 200000.00, 200000.00),
(2, 'lab_test', 'Pemeriksaan Hemoglobin', 1, 40000.00, 40000.00),
(2, 'medication', 'Vitamin dan Suplemen', 1, 2500.00, 2500.00);

-- Insert Referrals (contoh rujukan)
INSERT INTO referrals (referral_number, medical_record_id, patient_id, referring_doctor_id, referred_to, specialization, reason, diagnosis, status, referral_date) VALUES
('REF-2024-001', 1, 1, 1, 'RS Hasan Sadikin', 'Pulmonologi', 'Perlu pemeriksaan lebih lanjut untuk kemungkinan pneumonia', 'ISPA dengan suspek pneumonia', 'pending', '2024-12-04');

-- Insert Wearable Data (data monitoring dari wearable device)
INSERT INTO wearable_data (patient_id, device_id, measurement_type, value, unit, measured_at, status, notes) VALUES
-- Data pasien 1 (Ahmad Yani)
(1, 'WATCH-001', 'heart_rate', '82', 'bpm', '2024-12-04 08:00:00', 'normal', NULL),
(1, 'WATCH-001', 'blood_pressure', '120/80', 'mmHg', '2024-12-04 08:00:00', 'normal', NULL),
(1, 'WATCH-001', 'temperature', '38.2', '°C', '2024-12-04 08:00:00', 'warning', 'Demam'),
(1, 'WATCH-001', 'oxygen_saturation', '97', '%', '2024-12-04 08:00:00', 'normal', NULL),
(1, 'WATCH-001', 'heart_rate', '78', 'bpm', '2024-12-04 12:00:00', 'normal', NULL),
(1, 'WATCH-001', 'temperature', '37.8', '°C', '2024-12-04 12:00:00', 'warning', 'Demam menurun'),
(1, 'WATCH-001', 'steps', '3240', 'steps', '2024-12-04 18:00:00', 'normal', NULL),
-- Data pasien 2 (Sari Dewi)
(2, 'WATCH-002', 'heart_rate', '76', 'bpm', '2024-12-04 08:00:00', 'normal', NULL),
(2, 'WATCH-002', 'blood_pressure', '110/70', 'mmHg', '2024-12-04 08:00:00', 'normal', NULL),
(2, 'WATCH-002', 'temperature', '36.8', '°C', '2024-12-04 08:00:00', 'normal', NULL),
(2, 'WATCH-002', 'steps', '5620', 'steps', '2024-12-04 18:00:00', 'normal', NULL),
-- Data pasien 3 (Budi Santoso)
(3, 'WATCH-003', 'heart_rate', '95', 'bpm', '2024-12-04 10:00:00', 'warning', 'Detak jantung sedikit tinggi'),
(3, 'WATCH-003', 'blood_pressure', '145/95', 'mmHg', '2024-12-04 10:00:00', 'warning', 'Tekanan darah tinggi'),
(3, 'WATCH-003', 'oxygen_saturation', '94', '%', '2024-12-04 10:00:00', 'warning', 'Saturasi oksigen rendah'),
-- Data pasien 4 (Rina Wijaya)
(4, 'WATCH-004', 'heart_rate', '72', 'bpm', '2024-12-04 09:00:00', 'normal', NULL),
(4, 'WATCH-004', 'blood_pressure', '115/75', 'mmHg', '2024-12-04 09:00:00', 'normal', NULL),
(4, 'WATCH-004', 'temperature', '36.6', '°C', '2024-12-04 09:00:00', 'normal', NULL),
(4, 'WATCH-004', 'steps', '7850', 'steps', '2024-12-04 18:00:00', 'normal', NULL);

-- ================================================================================
-- END OF COMPLETE SCHEMA
-- ================================================================================
