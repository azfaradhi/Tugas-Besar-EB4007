-- Seeding Data untuk Sistem Informasi Kesehatan
-- EB4007 - Tugas Besar

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