'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface RealtimeData {
  heart_rate: number;
  spo2: number;
  hr_status: string;
  spo2_status: string;
  timestamp: string;
}

interface MonitoringSession {
  session_id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  status: string;
  started_at: string;
}

interface MonitoringResult {
  sessionId: string;
  doctorName: string;
  startedAt: string;
  endedAt: string;
  summary: {
    heartRate: { average: number; minimum: number; maximum: number };
    spo2: { average: number; minimum: number; maximum: number };
    hasAnomaly: boolean;
  };
  notes?: string;
}

export default function HealthMonitorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Session state
  const [activeSession, setActiveSession] = useState<MonitoringSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);

  // Arduino state
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [arduinoStatus, setArduinoStatus] = useState('');
  const [arduinoError, setArduinoError] = useState('');

  // Historical results
  const [pastResults, setPastResults] = useState<MonitoringResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<MonitoringResult | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchInitialData();
    checkArduinoStatus();

    // Poll Arduino status every 3 seconds
    const intervalId = setInterval(checkArduinoStatus, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const checkArduinoStatus = async () => {
    try {
      const res = await fetch('http://localhost:8080/arduino/status');
      if (res.ok) {
        const data = await res.json();
        setArduinoConnected(data.connected && data.isOpen);
        if (data.connected && data.isOpen) {
          setArduinoStatus(`Terhubung di ${data.port}`);
          setArduinoError('');
        } else {
          setArduinoStatus('');
        }
      }
    } catch (error) {
      console.error('Error checking Arduino status:', error);
      setArduinoConnected(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setUser(data.user);

      if (!data.user?.profileId) {
        setError('Akun Anda belum terhubung dengan profil pasien.');
        setLoading(false);
        return;
      }

      // Check for active session
      const sessionRes = await fetch('/api/monitoring/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setActiveSession(sessionData.session);
      }

      // Fetch past results
      const resultsRes = await fetch(`/api/monitoring/results?patientId=${data.user.profileId}`);
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setPastResults(resultsData.results || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      // If no active session, create one based on active appointment
      if (!activeSession) {
        setError('');
        const createRes = await fetch('/api/monitoring/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: user.profileId,
            notes: ''
          })
        });

        if (!createRes.ok) {
          const errorData = await createRes.json();
          setError(errorData.error || 'Gagal memulai monitoring. Pastikan Anda memiliki appointment aktif dengan dokter.');
          return;
        }

        const sessionData = await createRes.json();
        setActiveSession(sessionData.session);
        
        // Small delay to ensure session is ready
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Connect to WebSocket
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'connect',
          data: {
            userId: user.profileId,
            role: 'patient',
            sessionId: activeSession?.session_id || sessionData.session.session_id
          }
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          setIsConnected(true);
          setError('');
        }

        if (msg.type === 'arduino_status') {
          if (msg.status === 'connected' || msg.status === 'ready') {
            setArduinoConnected(true);
            setArduinoStatus(msg.message || `Arduino terhubung di ${msg.port}`);
            setArduinoError('');
          } else if (msg.status === 'disconnected' || msg.status === 'error') {
            setArduinoConnected(false);
            setArduinoStatus('');
            setArduinoError(msg.message || 'Arduino tidak terhubung');
          }
        }

        if (msg.type === 'arduino_error') {
          setArduinoError(msg.error);
          // Clear error after showing it for a while if it's "no finger detected"
          if (msg.error === 'No finger detected') {
            setTimeout(() => {
              if (arduinoError === 'No finger detected') {
                setArduinoError('');
              }
            }, 3000);
          }
        }

        if (msg.type === 'vitals') {
          setRealtimeData(msg.data);
          // Clear "no finger" error when we receive valid data
          if (arduinoError === 'No finger detected') {
            setArduinoError('');
          }
        }

        if (msg.type === 'session_ended') {
          handleDisconnect();
          setActiveSession(null);
          fetchInitialData();
        }

        if (msg.type === 'error') {
          setError(msg.message);
          setIsConnected(false);
        }
      };

      ws.onerror = () => {
        setError('Gagal terhubung ke server monitoring');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setRealtimeData(null);
      };

    } catch (err) {
      console.error('Connection error:', err);
      setError('Gagal membuat koneksi ke server monitoring');
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }));
      wsRef.current.close();
    }
    setIsConnected(false);
    setRealtimeData(null);
  };

  const handleEndMonitoring = async () => {
    if (!activeSession) return;

    if (!confirm('Akhiri sesi monitoring? Hasil akan tersimpan di riwayat pemeriksaan.')) {
      return;
    }

    try {
      // Send end session signal via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'end_session' }));
        wsRef.current.close();
      }

      // Update session status via API
      const res = await fetch('/api/monitoring/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.session_id,
          notes: ''
        })
      });

      if (res.ok) {
        setActiveSession(null);
        setIsConnected(false);
        setRealtimeData(null);
        setError('');
        
        // Refresh data
        await fetchInitialData();
      } else {
        throw new Error('Gagal mengakhiri sesi');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Gagal mengakhiri sesi monitoring');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'critical': return 'Kritis';
      case 'warning': return 'Peringatan';
      case 'normal': return 'Normal';
      default: return '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitor Kesehatan Real-time</h1>
          <p className="text-gray-600 mt-1">Monitoring vital signs dengan perangkat MAX30102</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {activeSession ? (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sesi Monitoring Aktif</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Dokter: {activeSession.doctor_name}
                </p>
                <p className="text-xs text-gray-500">
                  Dimulai: {new Date(activeSession.started_at).toLocaleString('id-ID')}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  isConnected 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    isConnected ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {isConnected ? 'Terhubung' : 'Tidak Terhubung'}
                  </span>
                </div>
              </div>
            </div>

            {!isConnected ? (
              <div className="text-center py-8">
                {/* Arduino Status Indicator */}
                <div className="mb-6 max-w-md mx-auto">
                  <div className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 ${
                    arduinoConnected
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      arduinoConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <div className="text-left flex-1">
                      <p className={`font-semibold ${
                        arduinoConnected ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {arduinoConnected ? 'Arduino Terhubung' : 'Arduino Tidak Terhubung'}
                      </p>
                      <p className={`text-sm ${
                        arduinoConnected ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {arduinoStatus || (arduinoConnected ? 'Siap untuk monitoring' : 'Hubungkan Arduino ke server')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cara Memulai Monitoring
                  </h3>
                  <ol className="space-y-3 text-left max-w-md mx-auto">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Pastikan Perangkat Terhubung</p>
                        <p className="text-gray-600">Arduino Uno + MAX30102 terhubung ke server</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Klik Tombol Mulai</p>
                        <p className="text-gray-600">Koneksi akan dimulai ke server monitoring</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Letakkan Jari pada Sensor</p>
                        <p className="text-gray-600">Tetap tenang dan jangan bergerak selama pengukuran</p>
                      </div>
                    </li>
                  </ol>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={!arduinoConnected}
                  className={`px-8 py-3 rounded-lg transition-colors text-lg font-medium ${
                    arduinoConnected
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!arduinoConnected ? 'Arduino harus terhubung terlebih dahulu' : ''}
                >
                  Mulai Monitoring
                </button>
                {!arduinoConnected && (
                  <p className="mt-3 text-sm text-red-600">
                    Tombol akan aktif setelah Arduino terhubung
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Arduino Error Messages */}
                {arduinoError && (
                  <div className={`p-4 rounded-lg border-l-4 ${
                    arduinoError === 'MAX30102 not found'
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : arduinoError === 'No finger detected'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                      : 'bg-orange-50 border-orange-500 text-orange-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-semibold">
                          {arduinoError === 'MAX30102 not found' && 'Sensor MAX30102 Tidak Terdeteksi'}
                          {arduinoError === 'No finger detected' && 'Jari Tidak Terdeteksi'}
                          {arduinoError !== 'MAX30102 not found' && arduinoError !== 'No finger detected' && 'Peringatan Arduino'}
                        </p>
                        <p className="text-sm mt-1">
                          {arduinoError === 'MAX30102 not found' && 'Pastikan sensor MAX30102 terhubung dengan benar ke Arduino (SDA → A4, SCL → A5, VIN → 5V, GND → GND)'}
                          {arduinoError === 'No finger detected' && 'Letakkan jari Anda pada sensor MAX30102 untuk memulai pengukuran'}
                          {arduinoError !== 'MAX30102 not found' && arduinoError !== 'No finger detected' && arduinoError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`rounded-xl shadow-lg p-8 border-l-4 ${
                    realtimeData ? getStatusColor(realtimeData.hr_status) : 'border-gray-300'
                  }`}>
                    <p className="text-sm font-medium text-gray-500 mb-2">Heart Rate</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-6xl font-bold text-gray-900">
                          {realtimeData?.heart_rate || '--'}
                        </h3>
                        <p className="text-xl text-gray-500 mt-1">bpm</p>
                      </div>
                    </div>
                    {realtimeData && (
                      <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          getStatusColor(realtimeData.hr_status)
                        }`}>
                          {getStatusLabel(realtimeData.hr_status)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`rounded-xl shadow-lg p-8 border-l-4 ${
                    realtimeData ? getStatusColor(realtimeData.spo2_status) : 'border-gray-300'
                  }`}>
                    <p className="text-sm font-medium text-gray-500 mb-2">SpO2</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-6xl font-bold text-gray-900">
                          {realtimeData?.spo2 || '--'}
                        </h3>
                        <p className="text-xl text-gray-500 mt-1">%</p>
                      </div>
                    </div>
                    {realtimeData && (
                      <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          getStatusColor(realtimeData.spo2_status)
                        }`}>
                          {getStatusLabel(realtimeData.spo2_status)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleDisconnect}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Hentikan Monitoring
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-medium">Informasi Threshold:</p>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li>Heart Rate Normal: 60-100 bpm</li>
                    <li>SpO2 Normal: ≥ 95%</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Tidak Ada Sesi Monitoring Aktif
            </h3>
            <p className="text-yellow-700">
              Silakan tunggu dokter untuk memulai sesi pemeriksaan dengan monitoring vital signs.
            </p>
          </div>
        )}

        {pastResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Riwayat Pemeriksaan</h2>
            <div className="space-y-3">
              {pastResults.map((result) => (
                <div
                  key={result.sessionId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(result.endedAt).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">Dokter: {result.doctorName}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-600">
                        HR: {result.summary.heartRate.average.toFixed(1)} bpm
                      </p>
                      <p className="text-gray-600">
                        SpO2: {result.summary.spo2.average.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900">Detail Hasil Pemeriksaan</h3>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedResult.startedAt).toLocaleString('id-ID')} - {' '}
                  {new Date(selectedResult.endedAt).toLocaleString('id-ID')}
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Ringkasan Vital Signs</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Heart Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedResult.summary.heartRate.average.toFixed(1)} bpm
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Range: {selectedResult.summary.heartRate.minimum.toFixed(0)} - {selectedResult.summary.heartRate.maximum.toFixed(0)} bpm
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">SpO2</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedResult.summary.spo2.average.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Range: {selectedResult.summary.spo2.minimum.toFixed(0)} - {selectedResult.summary.spo2.maximum.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>

                {selectedResult.summary.hasAnomaly && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-900">Terdapat Anomali</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Nilai vital signs di luar batas normal terdeteksi selama pemeriksaan.
                    </p>
                  </div>
                )}

                {selectedResult.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Catatan Dokter</h4>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                      {selectedResult.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
