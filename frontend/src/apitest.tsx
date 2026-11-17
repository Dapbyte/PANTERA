import { useEffect, useState } from 'react';
import { api } from './lib/api';

interface HealthResponse {
  status: string;
  message: string;
}

export default function ApiTest() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  const checkAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/health');
      if (typeof response.data !== 'object' || response.data === null) {
        throw new Error('Response bukan JSON: ' + JSON.stringify(response.data));
      }
      setData(response.data as HealthResponse);
    } catch (err: unknown) {
      console.error('API ERROR:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat menghubungkan API');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAPI();
  }, []);

  const mockData: HealthResponse = {
    status: 'success (mocked)',
    message: 'PANTERA Mock API is active for Frontend Development',
  };

  const activeData = useMock ? mockData : data;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">PANTERA</h1>
            <p className="text-xs text-slate-400">Pemantauan Arsip, Termin, dan Risiko - PT. DMP</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              activeData
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {loading ? 'Connecting...' : activeData ? 'Connected' : 'Backend Offline'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center space-x-3 text-slate-300 py-6">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Menghubungkan ke API Backend (/api/health)...</span>
          </div>
        ) : error && !useMock ? (
          <div className="space-y-4">
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-sm">
              <p className="font-semibold text-rose-200 mb-1">Status Error: {error}</p>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                Penyebab status <strong>502 Bad Gateway</strong>: Proxy Vite di port 5174 mencoba
                meneruskan request <code className="bg-rose-900/60 px-1 py-0.5 rounded">/api/health</code> ke server backend Laravel di port 8000, namun backend belum dinyalakan.
              </p>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-700 text-xs space-y-2">
              <p className="font-medium text-slate-300">Cara Mengaktifkan Backend Riil (Docker):</p>
              <ol className="list-decimal list-inside text-slate-400 space-y-1">
                <li>Buka aplikasi <strong>Docker Desktop</strong> di laptop Anda.</li>
                <li>Jalankan perintah: <code className="text-indigo-300">docker compose up -d</code></li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={checkAPI}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Coba Hubungkan Ulang
              </button>
              <button
                onClick={() => setUseMock(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Gunakan Mode Mock (Bypass Backend)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-lg">
              <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
                API Response Payload
              </p>
              <pre className="text-xs bg-slate-950 p-3 rounded text-emerald-300 overflow-x-auto font-mono">
                {JSON.stringify(activeData, null, 2)}
              </pre>
            </div>

            {useMock && (
              <div className="flex items-center justify-between text-xs text-amber-400 bg-amber-950/30 border border-amber-800/60 px-3 py-2 rounded-lg">
                <span>Saat ini menggunakan data tiruan (Mock Mode) untuk frontend testing.</span>
                <button
                  onClick={() => setUseMock(false)}
                  className="text-amber-300 underline font-medium hover:text-white cursor-pointer"
                >
                  Coba API Riil
                </button>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500 border-t border-slate-700/60 pt-3 flex justify-between items-center">
          <span>PANTERA Frontend Client</span>
          <span>Port: 5174</span>
        </div>
      </div>
    </div>
  );
}
