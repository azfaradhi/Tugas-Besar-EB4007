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
  created_at: Date;
  updated_at: Date;
}

export interface Patient {
  id: number;
  user_id?: number;
  patient_number: string;
  name: string;
  date_of_birth: Date;
  gender: 'male' | 'female';
  blood_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Doctor {
  id: number;
  user_id?: number;
  doctor_number: string;
  name: string;
  specialization: string;
  license_number: string;
  phone?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Staff {
  id: number;
  user_id?: number;
  staff_number: string;
  name: string;
  position: 'registration' | 'pharmacy' | 'laboratory' | 'cashier';
  phone?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  appointment_date: Date;
  appointment_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  complaint?: string;
  registered_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface MedicalRecord {
  id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  symptoms?: string;
  vital_signs?: any;
  notes?: string;
  treatment_plan?: string;
  status: 'active' | 'completed' | 'referred';
  created_at: Date;
  updated_at: Date;
}

export interface Medication {
  id: number;
  code: string;
  name: string;
  description?: string;
  unit: string;
  stock: number;
  price: number;
  created_at: Date;
  updated_at: Date;
}

export interface Prescription {
  id: number;
  prescription_number: string;
  medical_record_id: number;
  patient_id: number;
  doctor_id: number;
  status: 'pending' | 'prepared' | 'dispensed' | 'completed';
  notes?: string;
  prepared_by?: number;
  prepared_at?: Date;
  dispensed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PrescriptionItem {
  id: number;
  prescription_id: number;
  medication_id: number;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  created_at: Date;
}

export interface LabTest {
  id: number;
  test_number: string;
  medical_record_id: number;
  patient_id: number;
  test_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  ordered_by: number;
  processed_by?: number;
  requested_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface LabResult {
  id: number;
  lab_test_id: number;
  parameter: string;
  result: string;
  unit?: string;
  reference_range?: string;
  status?: 'normal' | 'abnormal' | 'critical';
  notes?: string;
  created_at: Date;
}

export interface Payment {
  id: number;
  payment_number: string;
  patient_id: number;
  appointment_id?: number;
  total_amount: number;
  payment_method: 'cash' | 'debit' | 'credit' | 'transfer' | 'insurance';
  payment_status: 'pending' | 'paid' | 'cancelled';
  paid_at?: Date;
  processed_by?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentItem {
  id: number;
  payment_id: number;
  item_type: 'consultation' | 'medication' | 'lab_test' | 'procedure' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
}

export interface Referral {
  id: number;
  referral_number: string;
  medical_record_id: number;
  patient_id: number;
  referring_doctor_id: number;
  referred_to: string;
  specialization?: string;
  reason: string;
  diagnosis?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  referral_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WearableData {
  id: number;
  patient_id: number;
  device_id?: string;
  measurement_type: 'heart_rate' | 'blood_pressure' | 'temperature' | 'oxygen_saturation' | 'steps' | 'sleep' | 'calories';
  value: string;
  unit?: string;
  measured_at: Date;
  status: 'normal' | 'warning' | 'critical';
  notes?: string;
  created_at: Date;
}
