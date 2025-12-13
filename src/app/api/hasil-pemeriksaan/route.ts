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
      const obatResult = await query(
        `SELECT ho.*, o.Nama, o.Kategori
         FROM Hasil_Obat ho
         LEFT JOIN Obat o ON ho.ID_Obat = o.ID_obat
         WHERE ho.ID_hasil = ?`,
        [result.ID_hasil]
      );
      result.obat = obatResult;

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
      next_step,
      obat, 
      ronsen, 
      urin_test 
    } = body;

    if (!ID_pertemuan) {
      return NextResponse.json({ error: 'ID_pertemuan is required' }, { status: 400 });
    }

    const vital_signs_str = vital_signs ? JSON.stringify(vital_signs) : null;
    const finalNotes = upsertNextStepToNotes(notes || null, next_step || null);

    const getCount : any = await query('SELECT COUNT(*) as count FROM Hasil_Pemeriksaan');
    const count = getCount[0].count;
    const ID_hasil = `${String(count + 1)}`;

    const insertResult: any = await query(
      `INSERT INTO Hasil_Pemeriksaan 
       (ID_Hasil, ID_pertemuan, diagnosis, symptoms, vital_signs, treatment_plan, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ID_hasil, ID_pertemuan, diagnosis || null, symptoms || null, vital_signs_str, treatment_plan || null, finalNotes, status || 'completed']
    );

    // Detail obat (opsional)
    if (obat && Array.isArray(obat) && obat.length > 0) {
      for (const item of obat) {
        const idObat = item.ID_Obat ?? item.id_obat ?? item.obat_id;
        if (!idObat) continue;

        await query(
          `INSERT INTO Hasil_Obat 
           (ID_hasil, ID_Obat, Dosis, Frekuensi, Durasi_hari, Qty) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ID_hasil,
            idObat,
            item.dosage ?? item.Dosis ?? null,
            item.frequency ?? item.Frekuensi ?? null,
            item.duration ?? item.Durasi_hari ?? null,
            item.quantity ?? item.Qty ?? null
          ]
        );
      }
    }

    // Ronsen (opsional)
    if (ronsen && Array.isArray(ronsen) && ronsen.length > 0) {
      for (const item of ronsen) {
        const rCount: any = await query('SELECT COUNT(*) as count FROM Ronsen');
        const ID_ronsen = `R${String(rCount[0].count + 1).padStart(6, '0')}`;
        await query('INSERT INTO Ronsen (ID_ronsen, ID_hasil, imgSrc) VALUES (?, ?, ?)', [
          ID_ronsen, ID_hasil, item.imgSrc
        ]);
      }
    }

    // Urin test (opsional)
    if (urin_test) {
      const uCount: any = await query('SELECT COUNT(*) as count FROM UrinTest');
      const ID_uji = `UT${String(uCount[0].count + 1).padStart(6, '0')}`;
      const fields = Object.keys(urin_test).filter(k => k !== 'ID_uji');
      const values = fields.map(k => urin_test[k]);
      await query(
        `INSERT INTO UrinTest (ID_uji, ID_hasil, ${fields.join(', ')})
         VALUES (?, ?, ${fields.map(() => '?').join(', ')})`,
        [ID_uji, ID_hasil, ...values]
      );
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
    const { ID_hasil, obat, ronsen, urin_test, next_step, notes } = body;

    if (!ID_hasil) {
      return NextResponse.json({ error: 'ID_hasil is required' }, { status: 400 });
    }

    // Update notes / next_step bila dikirim
    if (next_step !== undefined || notes !== undefined) {
      const existing: any = await query('SELECT notes FROM Hasil_Pemeriksaan WHERE ID_hasil = ?', [ID_hasil]);
      const oldNotes = existing?.[0]?.notes || null;
      const finalNotes = upsertNextStepToNotes(
        notes !== undefined ? notes : oldNotes,
        next_step !== undefined ? next_step : extractNextStep(oldNotes)
      );
      await query('UPDATE Hasil_Pemeriksaan SET notes = ? WHERE ID_hasil = ?', [finalNotes, ID_hasil]);
    }

    // Replace-all daftar obat bila ada field "obat"
    if (obat !== undefined) {
      await query('DELETE FROM Hasil_Obat WHERE ID_hasil = ?', [ID_hasil]);
      if (Array.isArray(obat) && obat.length > 0) {
        for (const item of obat) {
          const idObat = item.ID_Obat ?? item.id_obat ?? item.obat_id;
          if (!idObat) continue;

          await query(
            `INSERT INTO Hasil_Obat 
             (ID_hasil, ID_Obat, Dosis, Frekuensi, Durasi_hari, Qty) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              ID_hasil,
              idObat,
              item.dosage ?? item.Dosis ?? null,
              item.frequency ?? item.Frekuensi ?? null,
              item.duration ?? item.Durasi_hari ?? null,
              item.quantity ?? item.Qty ?? null
            ]
          );
        }
      }
    }

    // Replace-all ronsen bila ada field "ronsen"
    if (ronsen !== undefined) {
      await query('DELETE FROM Ronsen WHERE ID_hasil = ?', [ID_hasil]);
      if (Array.isArray(ronsen) && ronsen.length > 0) {
        for (const item of ronsen) {
          const rCount: any = await query('SELECT COUNT(*) as count FROM Ronsen');
          const ID_ronsen = `R${String(rCount[0].count + 1).padStart(6, '0')}`;
          await query('INSERT INTO Ronsen (ID_ronsen, ID_hasil, imgSrc) VALUES (?, ?, ?)', [
            ID_ronsen, ID_hasil, item.imgSrc
          ]);
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
        const uCount: any = await query('SELECT COUNT(*) as count FROM UrinTest');
        const ID_uji = `UT${String(uCount[0].count + 1).padStart(6, '0')}`;
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
