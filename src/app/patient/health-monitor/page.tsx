'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WearableData } from '@/types';

export default function HealthMonitorPage() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<WearableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Real-time device state
  const [isConnected, setIsConnected] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  const [realtimeData, setRealtimeData] = useState<{ heart_rate: number; spo2: number } | null>(null);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<any> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);


  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        
        const data = await res.json();
        setUser(data.user);

        if (!data.user || !data.user.profileId) {
          setError('Akun Anda belum terhubung dengan profil pasien. Silakan hubungi administrasi untuk menautkan akun Anda.');
          return;
        }

        const measurementsRes = await fetch(`/api/wearable?patientId=${data.user.profileId}`);
        if (measurementsRes.ok) {
          const result = await measurementsRes.json();
          setMeasurements(result.data || []);
        } else {
          setError('Gagal memuat data pengukuran');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Cleanup on component unmount
    return () => {
      if (portRef.current) {
        handleDisconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleConnect = async () => {
    if (!('serial' in navigator)) {
      setDeviceError('Web Serial API tidak didukung browser ini. Gunakan Chrome, Edge, atau Opera untuk koneksi USB Serial.');
      return;
    }

    try {
      setDeviceError('');

      // Clean up any existing connection first
      if (portRef.current) {
        await handleDisconnect();
      }

      const port = await (navigator as any).serial.requestPort();

      // Check if port is already open
      if (port.readable && port.writable) {
        // Port is already open, use it directly
        portRef.current = port;
      } else {
        // Port is closed, open it
        await port.open({ baudRate: 9600 });
        portRef.current = port;
      }

      setIsConnected(true);

      // Connect to WebSocket server
      wsRef.current = new WebSocket('ws://localhost:8080');
      wsRef.current.onopen = () => console.log('WebSocket connected');
      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setDeviceError('WebSocket connection failed. Ensure the WebSocket server is running (npm run ws:dev).');
        handleDisconnect(); // Disconnect serial as well if WS fails
      };
      wsRef.current.onclose = () => console.log('WebSocket disconnected');


      // Setup TextDecoderStream and reader once
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      try {
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // Reader has been canceled.
            break;
          }

          // DEBUG: Log raw data dari Arduino
          console.log('Raw data from Arduino:', value);

          // Tambahkan ke buffer
          buffer += value;

          // Cari JSON objects dalam buffer
          const jsonMatches = buffer.match(/\{[^}]+\}/g);

          if (jsonMatches) {
            for (const jsonStr of jsonMatches) {
              console.log('Found JSON:', jsonStr);
              try {
                const data = JSON.parse(jsonStr);
                console.log('Parsed data:', data);

                if (data.heart_rate && data.spo2) {
                  setRealtimeData(data);
                  console.log('Data updated in UI');
                  // Send data to WebSocket server
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ ...data, patientId: user.profileId }));
                  }
                }
                if (data.error) { // Error message from Arduino
                  setDeviceError(data.message || data.error);
                } else {
                  setDeviceError(''); // Clear device error if data comes in
                }

                // Hapus JSON yang sudah diproses dari buffer
                buffer = buffer.replace(jsonStr, '');
              } catch (parseError) {
                console.warn('Could not parse JSON:', jsonStr, parseError);
              }
            }
          }

          // Bersihkan buffer jika terlalu panjang (lebih dari 1000 karakter)
          if (buffer.length > 1000) {
            buffer = buffer.slice(-500);
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') { // AbortError is expected on disconnect
           setDeviceError('Error reading from device: ' + (error as Error).message);
        }
      } finally {
        reader.releaseLock();
        await readableStreamClosed.catch((e: any) => {
          if (portRef.current?.readable) { // If the readable stream is still there, it might be a real error
            console.error("Pipe to TextDecoderStream error:", e);
          }
        });
      }

    } catch (err) {
      if ((err as Error).name === 'NotFoundError') {
        setDeviceError('Tidak ada perangkat serial yang dipilih atau terdeteksi.'); // No device selected or detected
      } else {
        setDeviceError('Terjadi kesalahan saat menghubungkan perangkat: ' + (err as Error).message);
      }
      setIsConnected(false); // Ensure connection status is false on error
    }
  };

  const handleDisconnect = async () => {
    // Close WebSocket connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch(e) {
        console.log('Error closing WebSocket:', e);
      }
      wsRef.current = null;
    }

    // Close Serial Port Reader
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch(e) {
        console.log('Error canceling reader:', e);
      }
      try {
        readerRef.current.releaseLock();
      } catch(e) {
        console.log('Error releasing reader lock:', e);
      }
      readerRef.current = null;
    }

    // Close Serial Port
    if (portRef.current) {
      try {
        // Only close if it's actually open
        if (portRef.current.readable || portRef.current.writable) {
          await portRef.current.close();
        }
      } catch(e) {
        console.log('Error closing port:', e);
      }
      portRef.current = null;
    }

    setIsConnected(false);
    setRealtimeData(null);
    setDeviceError('');
  };


  // Group measurements by date and type
  const groupedMeasurements = measurements.reduce((acc: any, measurement) => {
    const date = new Date(measurement.measured_at).toLocaleDateString('id-ID');
    const time = new Date(measurement.measured_at).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (!acc[date]) {
      acc[date] = {};
    }

    if (!acc[date][time]) {
      acc[date][time] = {
        heart_rate: null,
        spo2: null,
        measured_at: measurement.measured_at
      };
    }

    if (measurement.measurement_type === 'heart_rate') {
      acc[date][time].heart_rate = measurement;
    } else if (measurement.measurement_type === 'spo2') {
      acc[date][time].spo2 = measurement;
    }

    return acc;
  }, {});

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'normal':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'critical':
        return 'Kritis';
      case 'warning':
        return 'Peringatan';
      case 'normal':
        return 'Normal';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monitor Kesehatan</h1>
            <p className="text-gray-600 mt-1">Riwayat pengukuran Heart Rate & SpO2 dari MAX30102</p>
          </div>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={!user?.profileId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Connect USB Serial
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Disconnect
            </button>
          )}
        </div>

        {deviceError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
            <strong>Device Error:</strong> {deviceError}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Realtime Data */}
        {isConnected && (
          <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Monitoring</h2>
            {realtimeData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Real-time Heart Rate</h3>
                  <p className="text-4xl font-bold text-gray-900">
                    {realtimeData.heart_rate}
                    <span className="text-xl text-gray-500 ml-1">bpm</span>
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Real-time SpO2</h3>
                  <p className="text-4xl font-bold text-gray-900">
                    {realtimeData.spo2}
                    <span className="text-xl text-gray-500 ml-1">%</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Waiting for data from device...</p>
                <p className="text-sm text-gray-500 mt-1">Make sure your finger is placed correctly on the sensor.</p>
              </div>
            )}
          </div>
        )}

        {/* Latest Readings Card */}
        {measurements.length > 0 && !isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Latest Heart Rate */}
            {measurements.find(m => m.measurement_type === 'heart_rate') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Heart Rate Terakhir</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900">
                      {measurements.find(m => m.measurement_type === 'heart_rate')?.value}
                      <span className="text-xl text-gray-500 ml-1">bpm</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(measurements.find(m => m.measurement_type === 'heart_rate')?.measured_at || '').toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(measurements.find(m => m.measurement_type === 'heart_rate')?.status)}`}>
                    {getStatusLabel(measurements.find(m => m.measurement_type === 'heart_rate')?.status)}
                  </span>
                </div>
              </div>
            )}

            {/* Latest SpO2 */}
            {measurements.find(m => m.measurement_type === 'spo2') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">SpO2 Terakhir</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900">
                      {measurements.find(m => m.measurement_type === 'spo2')?.value}
                      <span className="text-xl text-gray-500 ml-1">%</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(measurements.find(m => m.measurement_type === 'spo2')?.measured_at || '').toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(measurements.find(m => m.measurement_type === 'spo2')?.status)}`}>
                    {getStatusLabel(measurements.find(m => m.measurement_type === 'spo2')?.status)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Measurement History Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Pengukuran</h2>
          </div>

          {measurements.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data pengukuran</h3>
              <p className="mt-1 text-sm text-gray-500">Mulai pengukuran dengan MAX30102 sensor untuk melihat data di sini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {measurements.map((measurement, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(measurement.measured_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {measurement.measurement_type === 'heart_rate' ? 'Heart Rate' : 'SpO2'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {measurement.value} {measurement.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(measurement.status)}`}>
                          {getStatusLabel(measurement.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Connection Info Card */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">Cara Koneksi Perangkat</h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-2"><strong>Mendukung:</strong> Arduino/ESP32 via USB Serial (COM Port)</p>
                <ul className="list-decimal list-inside space-y-1 ml-2">
                  <li>Hubungkan Arduino via <strong>kabel USB</strong> ke komputer</li>
                  <li>Upload sketch yang mengirim data JSON: <code className="bg-green-100 px-1 rounded">{'{"heart_rate":75,"spo2":98}'}</code></li>
                  <li>Gunakan browser <strong>Chrome, Edge, atau Opera</strong> (Web Serial API)</li>
                  <li>Klik tombol "Connect to Device"</li>
                  <li>Pilih port Arduino (misal: COM3, /dev/ttyUSB0)</li>
                  <li>Baudrate: 9600</li>
                </ul>
                <p className="mt-2 text-xs">
                  <strong>Note:</strong> Firefox dan Safari belum mendukung Web Serial API.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Informasi Threshold</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Heart Rate Normal:</strong> 60-100 bpm</li>
                  <li><strong>Heart Rate Warning:</strong> &lt;60 atau &gt;100 bpm</li>
                  <li><strong>Heart Rate Critical:</strong> &lt;50 atau &gt;120 bpm</li>
                  <li><strong>SpO2 Normal:</strong> ≥95%</li>
                  <li><strong>SpO2 Warning:</strong> 90-94%</li>
                  <li><strong>SpO2 Critical:</strong> &lt;90%</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
