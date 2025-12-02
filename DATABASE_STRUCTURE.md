# Struktur Database - Sistem Informasi Kesehatan

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   USERS     │
│─────────────│
│ id (PK)     │
│ username    │
│ password    │
│ role        │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ↓                                  ↓
┌─────────────┐                    ┌─────────────┐
│  PATIENTS   │                    │   DOCTORS   │
│─────────────│                    │─────────────│
│ id (PK)     │                    │ id (PK)     │
│ user_id(FK) │                    │ user_id(FK) │
│ patient_no  │                    │ doctor_no   │
│ name        │                    │ name        │
│ dob         │                    │ specializ.  │
│ gender      │                    │ license_no  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │        ┌─────────────────────────┤
       │        │                         │
       ↓        ↓                         │
┌──────────────────┐                     │
│   APPOINTMENTS   │                     │
│──────────────────│                     │
│ id (PK)          │                     │
│ patient_id (FK)  │                     │
│ doctor_id (FK)   │────────────────────┘
│ appt_date        │
│ appt_time        │
│ status           │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ MEDICAL_RECORDS  │
│──────────────────│
│ id (PK)          │
│ appointment_id(FK│
│ patient_id (FK)  │
│ doctor_id (FK)   │
│ diagnosis        │
│ vital_signs      │
└────┬─────────┬───┘
     │         │
     │         └──────────────────┐
     ↓                            ↓
┌──────────────┐          ┌──────────────┐
│ PRESCRIPTIONS│          │  LAB_TESTS   │
│──────────────│          │──────────────│
│ id (PK)      │          │ id (PK)      │
│ med_rec_id(FK│          │ med_rec_id(FK│
│ patient_id(FK│          │ patient_id(FK│
│ doctor_id(FK)│          │ test_type    │
│ status       │          │ status       │
└──────┬───────┘          └──────┬───────┘
       │                         │
       ↓                         ↓
┌──────────────────┐      ┌──────────────┐
│PRESCRIPTION_ITEMS│      │ LAB_RESULTS  │
│──────────────────│      │──────────────│
│ id (PK)          │      │ id (PK)      │
│ prescription_id(FK│      │ lab_test_id(FK│
│ medication_id(FK)│      │ parameter    │
│ quantity         │      │ result       │
│ dosage           │      │ status       │
└──────────────────┘      └──────────────┘
       ↑
       │
┌──────────────┐
│  MEDICATIONS │
│──────────────│
│ id (PK)      │
│ code         │
│ name         │
│ stock        │
│ price        │
└──────────────┘

┌──────────────┐          ┌──────────────┐
│  REFERRALS   │          │ WEARABLE_DATA│
│──────────────│          │──────────────│
│ id (PK)      │          │ id (PK)      │
│ med_rec_id(FK│          │ patient_id(FK│
│ patient_id(FK│          │ device_id    │
│ doctor_id(FK)│          │ measure_type │
│ referred_to  │          │ value        │
│ reason       │          │ measured_at  │
└──────────────┘          │ status       │
                          └──────────────┘

┌──────────────┐
│   PAYMENTS   │
│──────────────│
│ id (PK)      │
│ patient_id(FK│
│ appt_id (FK) │
│ total_amount │
│ method       │
│ status       │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│PAYMENT_ITEMS │
│──────────────│
│ id (PK)      │
│ payment_id(FK│
│ item_type    │
│ description  │
│ subtotal     │
└──────────────┘

┌──────────────┐
│    STAFF     │
│──────────────│
│ id (PK)      │
│ user_id (FK) │
│ staff_number │
│ name         │
│ position     │
└──────────────┘
```

---

## Detail Tabel dan Relasi

### 1. USERS (Tabel Autentikasi)
**Primary Key:** id
**Purpose:** Menyimpan kredensial login untuk semua pengguna

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| username | VARCHAR(50) | Username unik |
| password | VARCHAR(255) | Password ter-hash (bcrypt) |
| role | ENUM | patient, staff_registration, doctor, staff_pharmacy, staff_lab, staff_cashier |
| created_at | TIMESTAMP | Waktu pembuatan |

**Relasi:**
- 1:1 dengan PATIENTS (user_id)
- 1:1 dengan DOCTORS (user_id)
- 1:1 dengan STAFF (user_id)

---

### 2. PATIENTS (Data Pasien)
**Primary Key:** id
**Foreign Key:** user_id → users(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| user_id | INT | FK ke users (nullable untuk pasien tanpa akun) |
| patient_number | VARCHAR(20) | Nomor pasien unik (P-YYYY-XXX) |
| name | VARCHAR(100) | Nama lengkap |
| date_of_birth | DATE | Tanggal lahir |
| gender | ENUM | male, female |
| blood_type | VARCHAR(5) | Golongan darah (A+, B-, dll) |
| phone | VARCHAR(15) | Nomor telepon |
| email | VARCHAR(100) | Email |
| address | TEXT | Alamat lengkap |
| emergency_contact | VARCHAR(100) | Kontak darurat |
| emergency_phone | VARCHAR(15) | Telepon kontak darurat |

**Relasi:**
- 1:N dengan APPOINTMENTS (patient_id)
- 1:N dengan MEDICAL_RECORDS (patient_id)
- 1:N dengan WEARABLE_DATA (patient_id)

---

### 3. DOCTORS (Data Dokter)
**Primary Key:** id
**Foreign Key:** user_id → users(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| user_id | INT | FK ke users |
| doctor_number | VARCHAR(20) | Nomor dokter unik (DOC-XXX) |
| name | VARCHAR(100) | Nama lengkap + gelar |
| specialization | VARCHAR(100) | Spesialisasi (Penyakit Dalam, Anak, dll) |
| license_number | VARCHAR(50) | Nomor SIP (Surat Ijin Praktik) |
| phone | VARCHAR(15) | Nomor telepon |
| email | VARCHAR(100) | Email |

**Relasi:**
- 1:N dengan APPOINTMENTS (doctor_id)
- 1:N dengan MEDICAL_RECORDS (doctor_id)

---

### 4. STAFF (Data Staf)
**Primary Key:** id
**Foreign Key:** user_id → users(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| user_id | INT | FK ke users |
| staff_number | VARCHAR(20) | Nomor staf unik |
| name | VARCHAR(100) | Nama lengkap |
| position | ENUM | registration, pharmacy, laboratory, cashier |
| phone | VARCHAR(15) | Nomor telepon |
| email | VARCHAR(100) | Email |

**Relasi:**
- 1:N dengan APPOINTMENTS (registered_by)
- 1:N dengan PRESCRIPTIONS (prepared_by)
- 1:N dengan LAB_TESTS (processed_by)

---

### 5. APPOINTMENTS (Pendaftaran/Janji Temu)
**Primary Key:** id
**Foreign Keys:**
- patient_id → patients(id)
- doctor_id → doctors(id)
- registered_by → staff(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| appointment_number | VARCHAR(20) | Nomor pendaftaran (APT-YYYY-XXX) |
| patient_id | INT | FK ke patients |
| doctor_id | INT | FK ke doctors |
| appointment_date | DATE | Tanggal janji temu |
| appointment_time | TIME | Waktu janji temu |
| status | ENUM | scheduled, in_progress, completed, cancelled |
| complaint | TEXT | Keluhan pasien |
| registered_by | INT | FK ke staff (staf pendaftaran) |

**Relasi:**
- 1:N dengan MEDICAL_RECORDS (appointment_id)
- 1:1 dengan PAYMENTS (appointment_id)

---

### 6. MEDICAL_RECORDS (Rekam Medis)
**Primary Key:** id
**Foreign Keys:**
- appointment_id → appointments(id)
- patient_id → patients(id)
- doctor_id → doctors(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| appointment_id | INT | FK ke appointments |
| patient_id | INT | FK ke patients |
| doctor_id | INT | FK ke doctors |
| diagnosis | TEXT | Diagnosis penyakit |
| symptoms | TEXT | Gejala yang dialami |
| vital_signs | JSON | {"temperature": 38.5, "bp": "120/80", ...} |
| notes | TEXT | Catatan dokter |
| treatment_plan | TEXT | Rencana pengobatan |
| status | ENUM | active, completed, referred |

**Relasi:**
- 1:N dengan PRESCRIPTIONS (medical_record_id)
- 1:N dengan LAB_TESTS (medical_record_id)
- 1:N dengan REFERRALS (medical_record_id)

---

### 7. MEDICATIONS (Master Data Obat)
**Primary Key:** id

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| code | VARCHAR(20) | Kode obat unik (MED-XXX) |
| name | VARCHAR(100) | Nama obat |
| description | TEXT | Deskripsi/indikasi |
| unit | VARCHAR(20) | Satuan (tablet, kapsul, botol) |
| stock | INT | Jumlah stok |
| price | DECIMAL(10,2) | Harga per unit |

**Relasi:**
- 1:N dengan PRESCRIPTION_ITEMS (medication_id)

---

### 8. PRESCRIPTIONS (Resep)
**Primary Key:** id
**Foreign Keys:**
- medical_record_id → medical_records(id)
- patient_id → patients(id)
- doctor_id → doctors(id)
- prepared_by → staff(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| prescription_number | VARCHAR(20) | Nomor resep (RX-YYYY-XXX) |
| medical_record_id | INT | FK ke medical_records |
| patient_id | INT | FK ke patients |
| doctor_id | INT | FK ke doctors |
| status | ENUM | pending, prepared, dispensed, completed |
| notes | TEXT | Catatan farmasi |
| prepared_by | INT | FK ke staff (staf farmasi) |
| prepared_at | TIMESTAMP | Waktu diproses |
| dispensed_at | TIMESTAMP | Waktu diserahkan |

**Relasi:**
- 1:N dengan PRESCRIPTION_ITEMS (prescription_id)

---

### 9. PRESCRIPTION_ITEMS (Detail Resep)
**Primary Key:** id
**Foreign Keys:**
- prescription_id → prescriptions(id)
- medication_id → medications(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| prescription_id | INT | FK ke prescriptions |
| medication_id | INT | FK ke medications |
| quantity | INT | Jumlah obat |
| dosage | VARCHAR(100) | Dosis (500mg, 10ml, dll) |
| frequency | VARCHAR(100) | Frekuensi (3x sehari, dll) |
| duration | VARCHAR(50) | Durasi (5 hari, 2 minggu) |
| instructions | TEXT | Instruksi khusus |

---

### 10. LAB_TESTS (Pemeriksaan Lab)
**Primary Key:** id
**Foreign Keys:**
- medical_record_id → medical_records(id)
- patient_id → patients(id)
- ordered_by → doctors(id)
- processed_by → staff(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| test_number | VARCHAR(20) | Nomor tes (LAB-YYYY-XXX) |
| medical_record_id | INT | FK ke medical_records |
| patient_id | INT | FK ke patients |
| test_type | VARCHAR(100) | Jenis tes (Darah Lengkap, Urin, dll) |
| status | ENUM | pending, in_progress, completed, cancelled |
| ordered_by | INT | FK ke doctors |
| processed_by | INT | FK ke staff (staf lab) |
| requested_at | TIMESTAMP | Waktu order |
| completed_at | TIMESTAMP | Waktu selesai |

**Relasi:**
- 1:N dengan LAB_RESULTS (lab_test_id)

---

### 11. LAB_RESULTS (Hasil Lab)
**Primary Key:** id
**Foreign Key:** lab_test_id → lab_tests(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| lab_test_id | INT | FK ke lab_tests |
| parameter | VARCHAR(100) | Parameter yang diukur (Hemoglobin, Leukosit) |
| result | VARCHAR(255) | Nilai hasil |
| unit | VARCHAR(50) | Satuan (g/dL, 10^3/uL) |
| reference_range | VARCHAR(100) | Nilai normal (13.0-17.0) |
| status | ENUM | normal, abnormal, critical |
| notes | TEXT | Catatan hasil |

---

### 12. PAYMENTS (Pembayaran)
**Primary Key:** id
**Foreign Keys:**
- patient_id → patients(id)
- appointment_id → appointments(id)
- processed_by → staff(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| payment_number | VARCHAR(20) | Nomor pembayaran (PAY-YYYY-XXX) |
| patient_id | INT | FK ke patients |
| appointment_id | INT | FK ke appointments |
| total_amount | DECIMAL(10,2) | Total tagihan |
| payment_method | ENUM | cash, debit, credit, transfer, insurance |
| payment_status | ENUM | pending, paid, cancelled |
| paid_at | TIMESTAMP | Waktu pembayaran |
| processed_by | INT | FK ke staff (kasir) |
| notes | TEXT | Catatan |

**Relasi:**
- 1:N dengan PAYMENT_ITEMS (payment_id)

---

### 13. PAYMENT_ITEMS (Detail Pembayaran)
**Primary Key:** id
**Foreign Key:** payment_id → payments(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| payment_id | INT | FK ke payments |
| item_type | ENUM | consultation, medication, lab_test, procedure, other |
| description | VARCHAR(255) | Deskripsi item |
| quantity | INT | Jumlah |
| unit_price | DECIMAL(10,2) | Harga satuan |
| subtotal | DECIMAL(10,2) | Subtotal (quantity × unit_price) |

---

### 14. REFERRALS (Rujukan)
**Primary Key:** id
**Foreign Keys:**
- medical_record_id → medical_records(id)
- patient_id → patients(id)
- referring_doctor_id → doctors(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| referral_number | VARCHAR(20) | Nomor rujukan (REF-YYYY-XXX) |
| medical_record_id | INT | FK ke medical_records |
| patient_id | INT | FK ke patients |
| referring_doctor_id | INT | FK ke doctors (dokter perujuk) |
| referred_to | VARCHAR(255) | Tujuan rujukan (RS/klinik) |
| specialization | VARCHAR(100) | Spesialisasi tujuan |
| reason | TEXT | Alasan rujukan |
| diagnosis | TEXT | Diagnosis sementara |
| notes | TEXT | Catatan tambahan |
| status | ENUM | pending, accepted, completed, cancelled |
| referral_date | DATE | Tanggal rujukan |

---

### 15. WEARABLE_DATA (Data Wearable Device)
**Primary Key:** id
**Foreign Key:** patient_id → patients(id)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| patient_id | INT | FK ke patients |
| device_id | VARCHAR(50) | ID device (WATCH-XXX) |
| measurement_type | ENUM | heart_rate, blood_pressure, temperature, oxygen_saturation, steps, sleep, calories |
| value | VARCHAR(50) | Nilai pengukuran |
| unit | VARCHAR(20) | Satuan (bpm, mmHg, °C, %) |
| measured_at | TIMESTAMP | Waktu pengukuran |
| status | ENUM | normal, warning, critical |
| notes | TEXT | Catatan |

**Indexes:**
- idx_patient_measured (patient_id, measured_at)
- idx_measurement_type (measurement_type)

---

## Relasi Antar Tabel (Summary)

### One-to-One (1:1)
- users → patients (user_id)
- users → doctors (user_id)
- users → staff (user_id)
- appointments → payments (appointment_id)

### One-to-Many (1:N)
- patients → appointments
- doctors → appointments
- patients → medical_records
- doctors → medical_records
- appointments → medical_records
- medical_records → prescriptions
- medical_records → lab_tests
- medical_records → referrals
- medications → prescription_items
- prescriptions → prescription_items
- lab_tests → lab_results
- payments → payment_items
- patients → wearable_data

---

## Normalisasi Database

Database ini telah dinormalisasi hingga **Third Normal Form (3NF)**:

### 1NF (First Normal Form)
✅ Semua atribut bernilai atomic (tidak ada multi-value)
✅ Tidak ada repeating groups

### 2NF (Second Normal Form)
✅ Sudah 1NF
✅ Semua non-key attributes bergantung penuh pada primary key

### 3NF (Third Normal Form)
✅ Sudah 2NF
✅ Tidak ada transitive dependency
✅ Contoh: medications terpisah dari prescription_items

---

## Indexes untuk Performance

```sql
-- Primary Keys (otomatis indexed)
-- Foreign Keys (otomatis indexed di MySQL dengan InnoDB)

-- Additional Indexes untuk query yang sering:
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_wearable_patient_measured ON wearable_data(patient_id, measured_at);
CREATE INDEX idx_wearable_type ON wearable_data(measurement_type);
```

---

## Data Integrity & Constraints

### Primary Keys
Setiap tabel memiliki primary key (id) yang auto-increment

### Foreign Keys with Referential Integrity
- ON DELETE CASCADE: Jika parent dihapus, child ikut terhapus
  - Contoh: appointments → medical_records
- ON DELETE SET NULL: Jika parent dihapus, FK di-set NULL
  - Contoh: staff (registered_by) di appointments

### Unique Constraints
- users.username
- patients.patient_number
- doctors.doctor_number, doctors.license_number
- appointments.appointment_number
- prescriptions.prescription_number
- lab_tests.test_number
- payments.payment_number
- referrals.referral_number
- medications.code

### Check Constraints (via ENUM)
- users.role
- patients.gender
- appointments.status
- medical_records.status
- prescriptions.status
- lab_tests.status
- lab_results.status
- payments.payment_method, payment_status
- payment_items.item_type
- referrals.status
- wearable_data.measurement_type, status

---

## Ukuran Database (Estimasi)

Dengan data seeding:
- 15 users
- 4 patients
- 3 doctors
- 8 staff
- 5 appointments
- 2 medical records
- 10 medications
- 2 prescriptions
- 5 prescription items
- 3 lab tests
- 6 lab results
- 2 payments
- 7 payment items
- 1 referral
- 16 wearable data entries

**Total Rows**: ~80 baris
**Estimated Size**: <1 MB

Untuk produksi dengan 1000 pasien aktif:
- ~50,000 appointments/tahun
- ~100,000 medical records
- ~50,000 prescriptions
- ~500,000 wearable data/bulan

**Estimated Size**: 1-5 GB/tahun

---

## Backup & Maintenance

### Backup Strategy
```sql
-- Full backup
mysqldump -u root -p hospital_system > backup_YYYYMMDD.sql

-- Schema only
mysqldump -u root -p --no-data hospital_system > schema_backup.sql

-- Data only
mysqldump -u root -p --no-create-info hospital_system > data_backup.sql
```

### Maintenance Tasks
- Daily: Backup incremental
- Weekly: Full backup
- Monthly: Optimize tables
- Quarterly: Review indexes & query performance

---

## Security Considerations

1. **Password**: Ter-hash dengan bcrypt (10 rounds)
2. **Sensitive Data**: Tidak ada plain text password
3. **Access Control**: Role-based via aplikasi
4. **Audit**: Timestamps pada semua tabel
5. **Encryption**: TLS untuk koneksi database (production)

---

## Migration & Versioning

File SQL untuk setup:
1. `database/schema.sql` - Create tables
2. `database/seed.sql` - Insert initial data

Future migrations:
- `migrations/001_add_column_x.sql`
- `migrations/002_create_table_y.sql`

Version control dengan Git untuk track changes.
