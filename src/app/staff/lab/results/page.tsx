'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type UrinEnumProtein = 'Negatif' | 'Trace' | '+1' | '+2' | '+3' | '+4' | '';
type UrinEnumKetone = 'Negatif' | 'Trace' | '+1' | '+2' | '+3' | '';

function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type'); // 'urin' | 'ronsen'
  const id = searchParams.get('id');     // ID_hasil

  // ✅ view-only param (accept: view=1 / view=true / readonly=1)
  const viewParam = (searchParams.get('view') ?? searchParams.get('readonly') ?? '').toLowerCase();
  const startReadOnly = useMemo(() => viewParam === '1' || viewParam === 'true' || viewParam === 'yes', [viewParam]);

  // editing state (kalau view-only, default false; kalau bukan, default true)
  const [isEditing, setIsEditing] = useState(!startReadOnly);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testInfo, setTestInfo] = useState<any>(null);

  // ✅ sesuai schema UrinTest
  const [urinData, setUrinData] = useState<{
    pH: string;
    Protein: UrinEnumProtein;
    Glukosa: UrinEnumProtein;
    Ketone: UrinEnumKetone;
  }>({
    pH: '',
    Protein: '',
    Glukosa: '',
    Ketone: '',
  });

  // ✅ ronsen minimal: imgSrc
  const [ronsenData, setRonsenData] = useState<{ imgSrc: string }>({
    imgSrc: '',
  });

  // kalau param view berubah (user navigate), sync state
  useEffect(() => {
    setIsEditing(!startReadOnly);
  }, [startReadOnly]);

  useEffect(() => {
    if (!id) return;
    fetchTestInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTestInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hasil-pemeriksaan?id=${id}`);
      if (!response.ok) return;

      const data = await response.json();
      if (!data?.hasil_pemeriksaan?.length) return;

      const test = data.hasil_pemeriksaan[0];
      setTestInfo(test);

      if (type === 'urin' && test.urin_test) {
        setUrinData((prev) => ({
          ...prev,
          pH: test.urin_test.pH != null ? String(test.urin_test.pH) : '',
          Protein: test.urin_test.Protein ?? '',
          Glukosa: test.urin_test.Glukosa ?? '',
          Ketone: test.urin_test.Ketone ?? '',
        }));
      }

      if (type === 'ronsen') {
        const img =
          test?.ronsen?.imgSrc ??
          (Array.isArray(test?.ronsen) ? test.ronsen?.[0]?.imgSrc : '') ??
          '';
        setRonsenData({ imgSrc: img });
      }
    } catch (error) {
      console.error('Error fetching test info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrinTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!isEditing) return;

    if (!urinData.pH && !urinData.Protein && !urinData.Glukosa && !urinData.Ketone) {
      alert('Isi minimal salah satu hasil urin sebelum menyimpan.');
      return;
    }

    setSaving(true);
    try {
      const cleanData = Object.fromEntries(Object.entries(urinData).filter(([_, v]) => v !== ''));

      const payload = {
        ID_hasil: id,
        urin_test: {
          ...cleanData,
          ...(cleanData.pH ? { pH: Number(cleanData.pH) } : {}),
        },
      };

      const response = await fetch('/api/hasil-pemeriksaan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Hasil tes urin berhasil disimpan!');
        // setelah save, kalau awalnya view-only, balik ke view mode
        if (startReadOnly) setIsEditing(false);
        router.push('/staff/lab/requests');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err?.error || 'Gagal menyimpan hasil tes urin');
      }
    } catch (error) {
      console.error('Error saving urin test:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRonsen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!isEditing) return;

    if (!ronsenData.imgSrc.trim()) {
      alert('URL gambar rontgen wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/hasil-pemeriksaan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_hasil: id,
          ronsen: [{ imgSrc: ronsenData.imgSrc }],
        }),
      });

      if (response.ok) {
        alert('Hasil rontgen berhasil disimpan!');
        if (startReadOnly) setIsEditing(false);
        router.push('/staff/lab/requests');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err?.error || 'Gagal menyimpan hasil rontgen');
      }
    } catch (error) {
      console.error('Error saving ronsen:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  if (!type || !id || (type !== 'urin' && type !== 'ronsen')) {
    return (
      <div className="p-8">
        <p className="text-red-600">Parameter tidak valid</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-indigo-600 hover:text-indigo-800 mb-2">
            ← Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {type === 'urin' ? 'Hasil Tes Urin' : 'Hasil Rontgen'}
          </h1>
          <p className="text-gray-600">
            {startReadOnly && !isEditing ? 'Mode: View-only' : 'Mode: Edit'}
          </p>
        </div>

        {/* ✅ tombol Edit / Batal Edit (khusus view-only) */}
        {startReadOnly && (
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchTestInfo(); // reset ke data DB
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Batal Edit
              </button>
            )}
          </div>
        )}
      </div>

      {testInfo && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Pasien</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nama Pasien</p>
              <p className="font-medium text-gray-900">{testInfo.nama_pasien}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dokter</p>
              <p className="font-medium text-gray-900">{testInfo.nama_dokter}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tanggal</p>
              <p className="font-medium text-gray-900">
                {testInfo.tanggal_pertemuan ? new Date(testInfo.tanggal_pertemuan).toLocaleDateString('id-ID') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Diagnosis</p>
              <p className="font-medium text-gray-900">{testInfo.diagnosis || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ URIN */}
      {type === 'urin' && (
        <form onSubmit={handleSaveUrinTest} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Hasil Tes Urin</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
              <input
                type="number"
                step="0.1"
                value={urinData.pH}
                onChange={(e) => setUrinData({ ...urinData, pH: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="contoh: 6.5"
                disabled={!isEditing || saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein</label>
              <select
                value={urinData.Protein}
                onChange={(e) => setUrinData({ ...urinData, Protein: e.target.value as UrinEnumProtein })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!isEditing || saving}
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Trace">Trace</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
                <option value="+4">+4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Glukosa</label>
              <select
                value={urinData.Glukosa}
                onChange={(e) => setUrinData({ ...urinData, Glukosa: e.target.value as UrinEnumProtein })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!isEditing || saving}
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Trace">Trace</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
                <option value="+4">+4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ketone</label>
              <select
                value={urinData.Ketone}
                onChange={(e) => setUrinData({ ...urinData, Ketone: e.target.value as UrinEnumKetone })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!isEditing || saving}
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Trace">Trace</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
              </select>
            </div>
          </div>

          {/* ✅ tombol save hanya aktif kalau isEditing */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={saving || !isEditing}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Menyimpan...' : 'Simpan Hasil'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Kembali
            </button>
          </div>

          {!isEditing && (
            <p className="mt-3 text-sm text-gray-500">
              View-only aktif. Klik tombol <b>Edit</b> untuk mengubah data.
            </p>
          )}
        </form>
      )}

      {/* ✅ RONSEN */}
      {type === 'ronsen' && (
        <form onSubmit={handleSaveRonsen} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Hasil Rontgen</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">URL Gambar Rontgen</label>
            <input
              type="text"
              value={ronsenData.imgSrc}
              onChange={(e) => setRonsenData({ imgSrc: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              disabled={!isEditing || saving}
            />
          </div>

          {ronsenData.imgSrc && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <img
                src={ronsenData.imgSrc}
                alt="Rontgen Preview"
                className="max-w-md border border-gray-300 rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                }}
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || !isEditing}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Menyimpan...' : 'Simpan Hasil'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Kembali
            </button>
          </div>

          {!isEditing && (
            <p className="mt-3 text-sm text-gray-500">
              Klik tombol <b>Edit</b> untuk mengubah data.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  );
}
