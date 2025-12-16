// Type definitions untuk aplikasi

export type UserRole =
  | 'patient'
  | 'staff_registration'
  | 'doctor'
  | 'staff_pharmacy'
  | 'staff_lab'
  | 'staff_cashier';

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  profile_id?: string;  // Changed to string (VARCHAR(20))
  created_at: Date;
  updated_at: Date;
}

export interface Patient {
  ID_pasien: string;  // VARCHAR(20) PRIMARY KEY
  user_id?: number;  // INT UNIQUE - foreign key to users.id
  Nama: string;
  Tanggal_lahir: Date;
  Umur?: number;
  Jenis_kelamin: 'Laki-laki' | 'Perempuan';
  No_telpon?: string;
  Alamat?: string;
  Golongan_darah?: string;
  Riwayat_penyakit?: string;
  Nama_ibu_kandung?: string;
}

// Karyawan base interface
export interface Karyawan {
  ID_karyawan: string;  // VARCHAR(20) PRIMARY KEY
  user_id?: number;  // INT UNIQUE - foreign key to users.id
  Nama: string;
  Tanggal_lahir: Date;
  Umur?: number;
  Jenis_kelamin: 'Laki-laki' | 'Perempuan';
  No_telpon?: string;
  Alamat?: string;
}

// Doctor extends Karyawan
export interface Doctor extends Karyawan {
  Spesialis?: string;
  STR?: string;  // Surat Tanda Registrasi
  Status?: string;
  Shift?: string;
}

// Staff types (Operasional, Resepsionis)
export interface Operasional {
  ID_karyawan: string;  // References Karyawan
}

export interface Resepsionis {
  ID_karyawan: string;  // References Karyawan
}

// Pertemuan (Appointment)
export interface Appointment {
  ID_pertemuan: string;  // VARCHAR(20) PRIMARY KEY
  ID_Pasien: string;
  ID_Dokter: string;
  ID_Perawat?: string;
  ID_ruangan?: string;
  Tanggal: Date;
  Waktu_mulai: string;  // TIME
  Waktu_selesai?: string;  // TIME
}

// Hasil_Pemeriksaan (Medical Record)
export interface MedicalRecord {
  ID_hasil: string;  // VARCHAR(20) PRIMARY KEY
  ID_pertemuan: string;
}

// Perawat
export interface Perawat {
  ID_perawat: string;  // VARCHAR(20) PRIMARY KEY
  Nama: string;
  NIK: string;  // CHAR(16)
  Kontak?: string;
  Shift?: string;
}

// Obat (Medication)
export interface Medication {
  ID_obat: string;  // VARCHAR(20) PRIMARY KEY
  Nama: string;
  Kategori?: 'Kapsul' | 'Tablet' | 'Cair' | 'Injeksi' | 'Salep' | 'Lainnya';
}

// Hasil_Obat (many-to-many relationship)
export interface HasilObat {
  ID_hasil: string;
  ID_Obat: string;
}

// Ruangan
export interface Ruangan {
  ID_ruangan: string;  // VARCHAR(20) PRIMARY KEY
  ID_gedung?: string;
  Lantai?: number;
}

// Gedung
export interface Gedung {
  ID_gedung: string;  // VARCHAR(20) PRIMARY KEY
  Nama: string;
  Latitude?: string;
  Longitude?: string;
}

// Departemen
export interface Departemen {
  ID_Department: string;  // VARCHAR(20) PRIMARY KEY
  Nama: string;
}

// Jadwal_Praktik
export interface JadwalPraktik {
  ID_jadwal: string;  // VARCHAR(20) PRIMARY KEY
  Date: Date;
}

// Ronsen
export interface Ronsen {
  ID_ronsen: string;  // VARCHAR(20) PRIMARY KEY
  ID_hasil: string;
  imgSrc?: string;
}

// UrinTest
export interface UrinTest {
  ID_uji: string;  // VARCHAR(20) PRIMARY KEY
  ID_hasil: string;
  Warna?: 'Kuning Muda' | 'Kuning' | 'Kuning Tua' | 'Merah' | 'Coklat' | 'Lainnya';
  pH?: number;
  Protein?: 'Negatif' | 'Trace' | '+1' | '+2' | '+3' | '+4';
  Glukosa?: 'Negatif' | 'Trace' | '+1' | '+2' | '+3' | '+4';
  Ketone?: 'Negatif' | 'Trace' | '+1' | '+2' | '+3';
  Bilirubin?: 'Negatif' | '+1' | '+2' | '+3';
  Urobilin?: 'Negatif' | 'Normal' | '+1' | '+2' | '+3';
  Hemoglobin?: 'Negatif' | 'Trace' | '+1' | '+2' | '+3';
  Sel_darah_putih?: '0-5' | '5-10' | '10-20' | '>20';
  Sel_darah_merah?: '0-3' | '3-5' | '5-10' | '>10';
  Bakteri?: 'Negatif' | '+1' | '+2' | '+3';
  Sel_epitheal?: 'Sedikit' | 'Sedang' | 'Banyak';
  Crystals?: 'Negatif' | 'Oksalat' | 'Urat' | 'Fosfat' | 'Lainnya';
  Casts?: 'Negatif' | 'Hialin' | 'Granuler' | 'Eritrosit' | 'Leukosit';
  Organisme_terisolasi?: string;
  Antimicrobial?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Trimethoprim?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Cefuroxime?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Amoxycillin_Clavulanic_acid?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Cephalexin?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Nitrofurantoin?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Ciprofloxacin?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Doxycycline?: 'Sensitif' | 'Intermediet' | 'Resisten';
  Gentamicin?: 'Sensitif' | 'Intermediet' | 'Resisten';
}

// Billing (Payment)
export interface Billing {
  ID_billing: string;  // VARCHAR(20) PRIMARY KEY
  ID_pasien: string;
  Lunas_date?: Date;
  Jenis_pembayaran?: 'Credit' | 'Debit' | 'Cash';
  isLunas?: boolean;
}

// Wearable Data (MAX30102 Sensor Measurements)
export interface WearableData {
  id: number;
  patient_id: number;
  device_id?: string;
  measurement_type: 'heart_rate' | 'spo2' | 'blood_pressure' | 'temperature' | 'oxygen_saturation' | 'steps' | 'sleep' | 'calories';
  value: string;
  unit?: string;
  measured_at: Date | string;
  status?: 'normal' | 'warning' | 'critical';
  notes?: string;
  created_at?: Date;
}

// For displaying patient vital signs with patient info
export interface PatientVitalSigns {
  patient_id: number;
  patient_name: string;
  latest_heart_rate?: number;
  latest_spo2?: number;
  latest_measurement_time?: Date;
  status: 'normal' | 'warning' | 'critical';
}
