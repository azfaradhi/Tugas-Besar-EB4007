import { NextResponse, NextRequest } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [prescriptions] = await db.query(`
      SELECT
        pr.*,
        p.name as patient_name,
        d.name as doctor_name
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN doctors d ON pr.doctor_id = d.id
      ORDER BY pr.created_at DESC
    `);

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      medical_record_id,
      patient_id,
      doctor_id,
      items,
      status
    } = body;

    if (!medical_record_id || !patient_id || !doctor_id) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items resep tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Generate nomor resep
    const prescription_number = `RX-${new Date().getFullYear()}-${Date.now()}`;

    // Insert ke prescriptions
    const [prescriptionResult]: any = await db.query(
      `
        INSERT INTO prescriptions 
        (prescription_number, medical_record_id, patient_id, doctor_id, status)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        prescription_number,
        medical_record_id,
        patient_id,
        doctor_id,
        status || "pending"
      ]
    );

    const prescriptionId = prescriptionResult.insertId;

    // Insert item satu per satu
    for (const item of items) {
      const { medication_id, quantity, dosage, frequency, duration, instructions } = item;

      if (!medication_id || !quantity || !dosage || !frequency || !duration) {
        return NextResponse.json(
          { error: "Data item resep tidak lengkap" },
          { status: 400 }
        );
      }

      await db.query(
        `
          INSERT INTO prescription_items
          (prescription_id, medication_id, quantity, dosage, frequency, duration, instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          prescriptionId,
          medication_id,
          quantity,
          dosage,
          frequency,
          duration,
          instructions || null
        ]
      );
    }

    return NextResponse.json({
      message: "Resep berhasil dibuat",
      prescription_id: prescriptionId,
      prescription_number
    });

  } catch (error: any) {
    console.error("Create prescription error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}