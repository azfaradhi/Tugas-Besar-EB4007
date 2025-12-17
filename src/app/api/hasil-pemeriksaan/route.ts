import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ===== Helpers =====
function extractNextStep(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/NextStep:\s*([^\n\r]+)/i);
  return m ? m[1].trim() : null;
}

function upsertNextStepToNotes(notes: string | null, nextStep?: string | null) {
  if (!nextStep) return notes || null;
  // buang NextStep lama, sisip yang baru
  const cleaned = (notes || '').replace(/NextStep:\s*[^\n\r]+/i, '').trim();
  const base = cleaned ? cleaned + '\n' : '';
  return `${base}NextStep: ${nextStep}`;
}

// ===== GET =====

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pertemuanId = searchParams.get('pertemuanId');
    const patientId = searchParams.get('patientId');

    let sql = `
      SELECT
        hp.*,
        p.ID_Pasien,
        p.ID_Dokter,
        p.Tanggal as tanggal_pertemuan,
        p.Waktu_mulai,
        p.Waktu_selesai,
        pas.Nama as nama_pasien,
        k.Nama as nama_dokter,
        d.Spesialis
      FROM Hasil_Pemeriksaan hp
      LEFT JOIN Pertemuan p ON hp.ID_pertemuan = p.ID_pertemuan
      LEFT JOIN Pasien pas ON p.ID_Pasien = pas.ID_pasien
      LEFT JOIN Dokter d ON p.ID_Dokter = d.ID_karyawan
      LEFT JOIN Karyawan k ON d.ID_karyawan = k.ID_karyawan
      WHERE 1=1
    `;
    const params: any[] = [];

    if (id) {
      sql += ' AND hp.ID_hasil = ?';
      params.push(id);
    }
    if (pertemuanId) {
      sql += ' AND hp.ID_pertemuan = ?';
      params.push(pertemuanId);
    }
    if (patientId) {
      sql += ' AND p.ID_Pasien = ?';
      params.push(patientId);
    }

    sql += ' ORDER BY p.Tanggal DESC, p.Waktu_mulai DESC';

    const results = (await query(sql, params)) as unknown as RowDataPacket[];

    for (const result of results) {
      const obatResult: any = await query(
        `SELECT ho.*, o.Nama, o.Kategori, o.Aturan_pakai, o.Harga_satuan
         FROM Hasil_Obat ho
         LEFT JOIN Obat o ON ho.ID_Obat = o.ID_obat
         WHERE ho.ID_hasil = ?`,
        [result.ID_hasil]
      );

      // Map medication fields to match frontend expectations
      result.obat = obatResult.map((med: any) => ({
        ID_obat: med.ID_Obat,
        nama_obat: med.Nama,
        kategori: med.Kategori,
        dosis: med.Dosis,
        frekuensi: med.Frekuensi,
        durasi_hari: med.Durasi_hari,
        qty: med.Qty,
        harga_satuan: med.Harga_satuan,
        subtotal: (med.Harga_satuan || 0) * (med.Qty || 0),
        catatan: med.Aturan_pakai
      }));

      const ronsenResult: any = await query(`SELECT * FROM Ronsen WHERE ID_hasil = ?`, [result.ID_hasil]);
      result.ronsen = ronsenResult;

      const urinResult: any = await query(`SELECT * FROM UrinTest WHERE ID_hasil = ?`, [result.ID_hasil]);
      result.urin_test = urinResult.length > 0 ? urinResult[0] : null;

      result.next_step = extractNextStep(result.notes || null);
      const createdISO = result.tanggal_pertemuan
        ? new Date(`${result.tanggal_pertemuan}T${(result.Waktu_mulai || '00:00:00')}`).toISOString()
        : new Date().toISOString();
      result.created_at = createdISO;
    }

    const records = results.map(r => ({
      ID_hasil: r.ID_hasil,
      diagnosis: r.diagnosis || null,
      symptoms: r.symptoms || null,
      treatment_plan: r.treatment_plan || null,
      notes: r.notes || null,
      next_step: r.next_step || null,
      created_at: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      hasil_pemeriksaan: results,
      records,
    });
  } catch (error) {
    console.error('Error fetching hasil pemeriksaan:', error);
    return NextResponse.json({ error: 'Failed to fetch hasil pemeriksaan' }, { status: 500 });
  }
}

// ===== POST =====
// Body contoh:
/*
{
  "ID_pertemuan": "PT001",
  "diagnosis": "xyz",
  "symptoms": "abc",
  "vital_signs": {"bp":"120/80"},
  "treatment_plan": "istirahat",
  "notes": "catatan",
  "next_step": "Rawat Inap",
  "status": "completed",
  "obat": [
    { "ID_Obat": "OB001", "dosage": "500 mg", "frequency": "3x sehari", "duration": 5, "quantity": 15 },
    { "ID_Obat": "OB003", "dosage": "200 mg", "frequency": "2x sehari", "duration": 3, "quantity": 6 }
  ],
  "ronsen": [{ "imgSrc": "/xray/a.png" }],
  "urin_test": { "Warna": "Kuning", "pH": 6.5, ... }
}
*/
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ID_pertemuan,
      diagnosis,
      symptoms,
      vital_signs,
      treatment_plan,
      notes,
      status,
      obat,
      ronsen,
      urin_test
    } = body;

    if (!ID_pertemuan) {
      return NextResponse.json(
        { error: 'ID_pertemuan is required' },
        { status: 400 }
      );
    }

    const countResult: any = await query(
      'SELECT COUNT(*) as count FROM Hasil_Pemeriksaan'
    );
    const count = countResult[0].count;
    const ID_hasil = `HSL${String(count + 1).padStart(3, '0')}`;

    await query(
      `INSERT INTO Hasil_Pemeriksaan
       (ID_hasil, ID_pertemuan, diagnosis, symptoms, vital_signs, treatment_plan, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_hasil, ID_pertemuan, diagnosis, symptoms, vital_signs_str, treatment_plan, notes, status || 'completed']
    );

    // Update Pertemuan: set status to 'completed' and Waktu_selesai to current time
    const currentTime = new Date().toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    await query(
      `UPDATE Pertemuan
       SET status = 'completed', Waktu_selesai = ?
       WHERE ID_pertemuan = ?`,
      [currentTime, ID_pertemuan]
    );

    let totalHargaObat = 0;

    if (obat && Array.isArray(obat) && obat.length > 0) {
      for (const item of obat) {
        const idObat = item.ID_Obat ?? item.id_obat ?? item.obat_id;
        if (!idObat) continue;

        await query(
          'INSERT INTO Hasil_Obat (ID_hasil, ID_Obat, Dosis, Frekuensi, Durasi_hari, Qty) VALUES (?, ?, ?, ?, ?, ?)',
          [ID_hasil, item.ID_Obat, item.Dosis || null, item.Frekuensi || null, item.Durasi_hari || null, item.Qty || null]
        );

        // Get harga obat untuk calculate total
        const obatData: any = await query(
          'SELECT Harga_satuan FROM Obat WHERE ID_obat = ?',
          [item.ID_Obat]
        );
        if (obatData && obatData.length > 0) {
          const hargaSatuan = obatData[0].Harga_satuan || 0;
          const qty = item.Qty || 0;
          totalHargaObat += hargaSatuan * qty;
        }
      }
    }

    // Ronsen (opsional)
    if (ronsen && Array.isArray(ronsen) && ronsen.length > 0) {
      for (const item of ronsen) {
        const ronsenCount: any = await query(
          'SELECT COUNT(*) as count FROM Ronsen'
        );
        const ID_ronsen = `RNS${String(ronsenCount[0].count + 1).padStart(3, '0')}`;

        await query(
          'INSERT INTO Ronsen (ID_ronsen, ID_hasil, imgSrc, keterangan) VALUES (?, ?, ?, ?)',
          [ID_ronsen, ID_hasil, item.imgSrc, item.keterangan || null]
        );
      }
    }

    // Urin test (opsional)
    if (urin_test) {
      const urinCount: any = await query(
        'SELECT COUNT(*) as count FROM UrinTest'
      );
      const ID_uji = `UJI${String(urinCount[0].count + 1).padStart(3, '0')}`;

      const fields = Object.keys(urin_test).filter(k => k !== 'ID_uji');
      const values = fields.map(k => urin_test[k]);
      await query(
        `INSERT INTO UrinTest (ID_uji, ID_hasil, ${fields.join(', ')})
         VALUES (?, ?, ${fields.map(() => '?').join(', ')})`,
        [ID_uji, ID_hasil, ...values]
      );
    }

    // AUTO-CREATE BILLING
    // Get ID_Pasien from Pertemuan
    const pertemuanData: any = await query(
      'SELECT ID_Pasien FROM Pertemuan WHERE ID_pertemuan = ?',
      [ID_pertemuan]
    );

    if (pertemuanData && pertemuanData.length > 0) {
      const ID_Pasien = pertemuanData[0].ID_Pasien;

      // 1. Create Billing untuk biaya konsultasi/pemeriksaan
      const biayaKonsultasi = 100000; // Rp 100.000 (bisa disesuaikan)
      const countBilling: any = await query(
        'SELECT COUNT(*) as count FROM Billing'
      );
      const ID_billing = `BIL${String(countBilling[0].count + 1).padStart(3, '0')}`;

      await query(
        `INSERT INTO Billing
         (ID_billing, ID_pasien, ID_pertemuan, Total_harga, isLunas)
         VALUES (?, ?, ?, ?, FALSE)`,
        [ID_billing, ID_Pasien, ID_pertemuan, biayaKonsultasi]
      );

      // 2. Create Billing_Farmasi untuk obat (jika ada)
      if (totalHargaObat > 0) {
        const countBillingFarmasi: any = await query(
          'SELECT COUNT(*) as count FROM Billing_Farmasi'
        );
        const ID_billing_farmasi = `BF${String(countBillingFarmasi[0].count + 1).padStart(6, '0')}`;

        await query(
          `INSERT INTO Billing_Farmasi
           (ID_billing_farmasi, ID_hasil, ID_pasien, Total_harga, isLunas)
           VALUES (?, ?, ?, ?, FALSE)`,
          [ID_billing_farmasi, ID_hasil, ID_Pasien, totalHargaObat]
        );
      }
    }

    return NextResponse.json({
      success: true,
      ID_hasil,
      message: 'Hasil pemeriksaan created successfully'
    });
  } catch (error) {
    console.error('Error creating hasil pemeriksaan:', error);
    return NextResponse.json({ error: 'Failed to create hasil pemeriksaan' }, { status: 500 });
  }
}

// ===== PUT =====
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ID_hasil, obat, ronsen, urin_test, ...updates } = body;

    if (!ID_hasil) {
      return NextResponse.json(
        { error: 'ID_hasil is required' },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length > 0) {
      const setParts = Object.keys(updates).map(key => `${key} = ?`);
      const values = Object.values(updates);

      await query(
        `UPDATE Hasil_Pemeriksaan SET ${setParts.join(', ')} WHERE ID_hasil = ?`,
        [...values, ID_hasil]
      );
    }

    if (obat !== undefined) {
      await query('DELETE FROM Hasil_Obat WHERE ID_hasil = ?', [ID_hasil]);
      if (Array.isArray(obat) && obat.length > 0) {
        for (const item of obat) {
          const idObat = item.ID_Obat ?? item.id_obat ?? item.obat_id;
          if (!idObat) continue;

          await query(
            'INSERT INTO Hasil_Obat (ID_hasil, ID_Obat, Dosis, Frekuensi, Durasi_hari, Qty) VALUES (?, ?, ?, ?, ?, ?)',
            [ID_hasil, item.ID_Obat, item.Dosis || null, item.Frekuensi || null, item.Durasi_hari || null, item.Qty || null]
          );
        }
      }
    }

    // Replace-all ronsen bila ada field "ronsen"
    if (ronsen !== undefined) {
      await query('DELETE FROM Ronsen WHERE ID_hasil = ?', [ID_hasil]);
      if (Array.isArray(ronsen) && ronsen.length > 0) {
        for (const item of ronsen) {
          const ronsenCount: any = await query(
            'SELECT COUNT(*) as count FROM Ronsen'
          );
          const ID_ronsen = `RNS${String(ronsenCount[0].count + 1).padStart(3, '0')}`;

          await query(
            'INSERT INTO Ronsen (ID_ronsen, ID_hasil, imgSrc, keterangan) VALUES (?, ?, ?, ?)',
            [ID_ronsen, ID_hasil, item.imgSrc, item.keterangan || null]
          );
        }
      }
    }

    // Upsert urin test
    if (urin_test !== undefined) {
      const existingUrin: any = await query('SELECT ID_uji FROM UrinTest WHERE ID_hasil = ?', [ID_hasil]);

      if (existingUrin.length > 0) {
        const fields = Object.keys(urin_test).filter(k => k !== 'ID_uji' && k !== 'ID_hasil');
        const setParts = fields.map(k => `${k} = ?`);
        const values = fields.map(k => urin_test[k]);
        await query(
          `UPDATE UrinTest SET ${setParts.join(', ')} WHERE ID_uji = ?`,
          [...values, existingUrin[0].ID_uji]
        );
      } else {
        const urinCount: any = await query(
          'SELECT COUNT(*) as count FROM UrinTest'
        );
        const ID_uji = `UJI${String(urinCount[0].count + 1).padStart(3, '0')}`;

        const fields = Object.keys(urin_test).filter(k => k !== 'ID_uji');
        const values = fields.map(k => urin_test[k]);
        await query(
          `INSERT INTO UrinTest (ID_uji, ID_hasil, ${fields.join(', ')})
           VALUES (?, ?, ${fields.map(() => '?').join(', ')})`,
          [ID_uji, ID_hasil, ...values]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Hasil pemeriksaan updated successfully' });
  } catch (error) {
    console.error('Error updating hasil pemeriksaan:', error);
    return NextResponse.json({ error: 'Failed to update hasil pemeriksaan' }, { status: 500 });
  }
}
