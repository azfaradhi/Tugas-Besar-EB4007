import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appointment_id,
      patient_id,
      doctor_id,
      diagnosis,
      symptoms,
      vital_signs,
      notes,
      treatment_plan,
      status
    } = body;

    if (!appointment_id || !patient_id || !doctor_id) {
      return NextResponse.json(
        { error: "appointment_id, patient_id, dan doctor_id wajib diisi." },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
        `INSERT INTO medical_records 
            (appointment_id, patient_id, doctor_id, diagnosis, symptoms, vital_signs, notes, treatment_plan, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            appointment_id,
            patient_id,
            doctor_id,
            diagnosis || null,
            symptoms || null,
            JSON.stringify(vital_signs || {}), 
            notes || null,
            treatment_plan || null,
            status || "completed"
        ]
    );

    return NextResponse.json({
      message: "Rekam medis berhasil disimpan.",
      medical_record_id: result.insertId
    });
  } catch (error) {
    console.error("Create medical record error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
