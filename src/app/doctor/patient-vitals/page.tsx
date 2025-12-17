'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  patient_name: string;
  status: string;
  started_at: string;
}

export default function DoctorPatientVitalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Session state
  const [activeSession, setActiveSession] = useState<MonitoringSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Real-time data
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [chartData, setChartData] = useState<{hr: number[], spo2: number[], labels: string[]}>({
    hr: [],
    spo2: [],
    labels: []
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDataPoints = 30;

  useEffect(() => {
    fetchInitialData();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      
      const data = await res.json();
      if (data.user.role !== 'doctor') {
        router.push('/dashboard');
        return;
      }
      setUser(data.user);

      // Check for active session (patient-initiated)
      checkForActiveSession();

      // Poll for new sessions every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        checkForActiveSession();
      }, 5000);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const checkForActiveSession = async () => {
    try {
      const sessionRes = await fetch('/api/monitoring/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.session) {
          // New session detected
          if (!activeSession || sessionData.session.session_id !== activeSession.session_id) {
            setActiveSession(sessionData.session);
            connectToSession(sessionData.session);
          }
        } else if (activeSession) {
          // Session ended
          setActiveSession(null);
          setIsConnected(false);
          setRealtimeData(null);
          setChartData({ hr: [], spo2: [], labels: [] });
          if (wsRef.current) {
            wsRef.current.close();
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const connectToSession = (session: MonitoringSession) => {
    if (!user) return;

    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'connect',
          data: {
            userId: user.profileId,
            role: 'doctor',
            sessionId: session.session_id
          }
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'connected') {
          setIsConnected(true);
          setError('');
        }
        
        if (msg.type === 'vitals') {
          setRealtimeData(msg.data);
          
          // Update chart
          setChartData(prev => {
            const newHr = [...prev.hr, msg.data.heart_rate];
            const newSpo2 = [...prev.spo2, msg.data.spo2];
            const newLabels = [...prev.labels, new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })];

            // Keep only last N data points
            if (newHr.length > maxDataPoints) {
              newHr.shift();
              newSpo2.shift();
              newLabels.shift();
            }

            return { hr: newHr, spo2: newSpo2, labels: newLabels };
          });
        }

        if (msg.type === 'session_ended') {
          setActiveSession(null);
          setIsConnected(false);
          setRealtimeData(null);
          setChartData({ hr: [], spo2: [], labels: [] });
        }

        if (msg.type === 'error') {
          setError(msg.message);
        }
      };

      ws.onerror = () => {
        setError('Gagal terhubung ke server monitoring');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

    } catch (err) {
      console.error('Connection error:', err);
      setError('Gagal membuat koneksi');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 40,
        max: 140,
        title: {
          display: true,
          text: 'Heart Rate (bpm)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 85,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'SpO2 (%)'
        }
      },
    },
  };

  const chartDataConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Heart Rate',
        data: chartData.hr,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'SpO2',
        data: chartData.spo2,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitor Vital Signs Pasien</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring dengan MAX30102 (Passive Viewer)</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!activeSession ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Menunggu Pasien Memulai Monitoring
              </h2>
              <p className="text-gray-600">
                Sesi monitoring akan dimulai otomatis ketika pasien menekan tombol "Mulai Monitoring" di halaman mereka.
              </p>
              <p className="text-sm text-blue-600 mt-4">
                ✓ Status diperbarui setiap 5 detik secara otomatis
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sesi Monitoring Aktif
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Pasien: <strong>{activeSession.patient_name}</strong>
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
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 italic">
                    (Pasien mengendalikan sesi)
                  </div>
                </div>
              </div>

              {isConnected && realtimeData && (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Heart Rate</p>
                          <p className="text-4xl font-bold text-gray-900 mt-1">
                            {realtimeData.heart_rate}
                            <span className="text-lg text-gray-500 ml-1">bpm</span>
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(realtimeData.hr_status)}`}></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">SpO2</p>
                          <p className="text-4xl font-bold text-gray-900 mt-1">
                            {realtimeData.spo2}
                            <span className="text-lg text-gray-500 ml-1">%</span>
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(realtimeData.spo2_status)}`}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Grafik Real-time (30 detik terakhir)
                    </h3>
                    <div style={{ height: '300px' }}>
                      <Line options={chartOptions} data={chartDataConfig} />
                    </div>
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                  <p>Menunggu pasien menyambungkan sensor...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
