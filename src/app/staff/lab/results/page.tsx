'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [testInfo, setTestInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [urinData, setUrinData] = useState({
    Warna: '',
    pH: '',
    Protein: '',
    Glukosa: '',
    Ketone: '',
    Bilirubin: '',
    Urobilin: '',
    Hemoglobin: '',
    Sel_darah_putih: '',
    Sel_darah_merah: '',
    Bakteri: '',
    Sel_epitheal: '',
    Crystals: '',
    Casts: '',
    Organisme_terisolasi: '',
    Antimicrobial: '',
    Trimethoprim: '',
    Cefuroxime: '',
    Amoxycillin_Clavulanic_acid: '',
    Cephalexin: '',
    Nitrofurantoin: '',
    Ciprofloxacin: '',
    Doxycycline: '',
    Gentamicin: '',
  });

  const [ronsenData, setRonsenData] = useState({
    imgSrc: '',
  });

  useEffect(() => {
    if (id) {
      fetchTestInfo();
    }
  }, [id]);

  const fetchTestInfo = async () => {
    try {
      const response = await fetch(`/api/hasil-pemeriksaan?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasil_pemeriksaan && data.hasil_pemeriksaan.length > 0) {
          const test = data.hasil_pemeriksaan[0];
          setTestInfo(test);

          if (type === 'urin' && test.urin_test) {
            setUrinData({ ...urinData, ...test.urin_test });
          } else if (type === 'ronsen' && test.ronsen && test.ronsen.length > 0) {
            setRonsenData({ imgSrc: test.ronsen[0].imgSrc || '' });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching test info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrinTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const cleanData = Object.fromEntries(
        Object.entries(urinData).filter(([_, v]) => v !== '')
      );

      const response = await fetch('/api/hasil-pemeriksaan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_hasil: id,
          urin_test: cleanData,
        }),
      });

      if (response.ok) {
        alert('Hasil tes urin berhasil disimpan!');
        router.push('/staff/lab/requests');
      } else {
        alert('Gagal menyimpan hasil tes');
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
    setSaving(true);

    try {
      const response = await fetch('/api/hasil-pemeriksaan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_hasil: id,
          ronsen: [ronsenData],
        }),
      });

      if (response.ok) {
        alert('Hasil rontgen berhasil disimpan!');
        router.push('/staff/lab/requests');
      } else {
        alert('Gagal menyimpan hasil rontgen');
      }
    } catch (error) {
      console.error('Error saving ronsen:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  if (!type || !id) {
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
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-2"
        >
          ← Kembali
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {type === 'urin' ? 'Hasil Tes Urin' : 'Hasil Rontgen'}
        </h1>
        <p className="text-gray-600">Input hasil pemeriksaan laboratorium</p>
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
                {new Date(testInfo.tanggal_pertemuan).toLocaleDateString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Diagnosis</p>
              <p className="font-medium text-gray-900">{testInfo.diagnosis || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {type === 'urin' && (
        <form onSubmit={handleSaveUrinTest} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Hasil Tes Urin</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
              <select
                value={urinData.Warna}
                onChange={(e) => setUrinData({ ...urinData, Warna: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Kuning Muda">Kuning Muda</option>
                <option value="Kuning">Kuning</option>
                <option value="Kuning Tua">Kuning Tua</option>
                <option value="Merah">Merah</option>
                <option value="Coklat">Coklat</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
              <input
                type="number"
                step="0.1"
                value={urinData.pH}
                onChange={(e) => setUrinData({ ...urinData, pH: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein</label>
              <select
                value={urinData.Protein}
                onChange={(e) => setUrinData({ ...urinData, Protein: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                onChange={(e) => setUrinData({ ...urinData, Glukosa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                onChange={(e) => setUrinData({ ...urinData, Ketone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Trace">Trace</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bilirubin</label>
              <select
                value={urinData.Bilirubin}
                onChange={(e) => setUrinData({ ...urinData, Bilirubin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urobilin</label>
              <select
                value={urinData.Urobilin}
                onChange={(e) => setUrinData({ ...urinData, Urobilin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Normal">Normal</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hemoglobin</label>
              <select
                value={urinData.Hemoglobin}
                onChange={(e) => setUrinData({ ...urinData, Hemoglobin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Trace">Trace</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sel Darah Putih</label>
              <select
                value={urinData.Sel_darah_putih}
                onChange={(e) => setUrinData({ ...urinData, Sel_darah_putih: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="0-5">0-5</option>
                <option value="5-10">5-10</option>
                <option value="10-20">10-20</option>
                <option value=">20">&gt;20</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sel Darah Merah</label>
              <select
                value={urinData.Sel_darah_merah}
                onChange={(e) => setUrinData({ ...urinData, Sel_darah_merah: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="0-3">0-3</option>
                <option value="3-5">3-5</option>
                <option value="5-10">5-10</option>
                <option value=">10">&gt;10</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bakteri</label>
              <select
                value={urinData.Bakteri}
                onChange={(e) => setUrinData({ ...urinData, Bakteri: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
                <option value="+3">+3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sel Epitel</label>
              <select
                value={urinData.Sel_epitheal}
                onChange={(e) => setUrinData({ ...urinData, Sel_epitheal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Sedikit">Sedikit</option>
                <option value="Sedang">Sedang</option>
                <option value="Banyak">Banyak</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kristal</label>
              <select
                value={urinData.Crystals}
                onChange={(e) => setUrinData({ ...urinData, Crystals: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Oksalat">Oksalat</option>
                <option value="Urat">Urat</option>
                <option value="Fosfat">Fosfat</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Casts</label>
              <select
                value={urinData.Casts}
                onChange={(e) => setUrinData({ ...urinData, Casts: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-</option>
                <option value="Negatif">Negatif</option>
                <option value="Hialin">Hialin</option>
                <option value="Granuler">Granuler</option>
                <option value="Eritrosit">Eritrosit</option>
                <option value="Leukosit">Leukosit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisme Terisolasi</label>
              <input
                type="text"
                value={urinData.Organisme_terisolasi}
                onChange={(e) => setUrinData({ ...urinData, Organisme_terisolasi: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sensitivitas Antibiotik</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Antimicrobial', key: 'Antimicrobial' },
                { label: 'Trimethoprim', key: 'Trimethoprim' },
                { label: 'Cefuroxime', key: 'Cefuroxime' },
                { label: 'Amoxycillin Clavulanic acid', key: 'Amoxycillin_Clavulanic_acid' },
                { label: 'Cephalexin', key: 'Cephalexin' },
                { label: 'Nitrofurantoin', key: 'Nitrofurantoin' },
                { label: 'Ciprofloxacin', key: 'Ciprofloxacin' },
                { label: 'Doxycycline', key: 'Doxycycline' },
                { label: 'Gentamicin', key: 'Gentamicin' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                  <select
                    value={(urinData as any)[item.key]}
                    onChange={(e) => setUrinData({ ...urinData, [item.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-</option>
                    <option value="Sensitif">Sensitif</option>
                    <option value="Intermediet">Intermediet</option>
                    <option value="Resisten">Resisten</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Menyimpan...' : 'Simpan Hasil'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {type === 'ronsen' && (
        <form onSubmit={handleSaveRonsen} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Hasil Rontgen</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Gambar Rontgen
            </label>
            <input
              type="text"
              value={ronsenData.imgSrc}
              onChange={(e) => setRonsenData({ imgSrc: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Menyimpan...' : 'Simpan Hasil'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
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
