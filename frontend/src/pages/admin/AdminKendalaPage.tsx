import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  kendalaService,
  projectService,
  type KategoriKendala,
  type KendalaLapangan,
  type ProjectListItem,
  type TingkatKeparahan,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatTanggal } from '../../lib/formatters';
import {
  MultiPhotoPicker,
  PhotoThumbnailGrid,
} from '../../components/common/MultiPhotoPicker';
import { normalizeFotoPaths } from '../../lib/mediaHelpers';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { useRealtimeSync } from '../../context/realtimeSyncStore';
import {
  CustomSelect,
  FieldError,
  NumberInput,
  SkeletonTable,
  SkeletonWeather,
  WheelDatePicker,
} from '../../components/ui';
import {
  AlertCircle,
  Clock,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Send,
  Sun,
  X,
} from 'lucide-react';

interface WeatherDay {
  date: string;
  tempMax: number;
  humidity: number;
  code: number;
}

const WEATHER_CACHE_KEY = 'pantera_weather_cache_v1';
const WEATHER_TTL_MS = 30 * 60 * 1000;

const KATEGORI_LIST: KategoriKendala[] = [
  'Cuaca',
  'Material',
  'Tenaga Kerja',
  'Peralatan',
  'Teknis',
];

const KEPARAHAN_LIST: TingkatKeparahan[] = ['Ringan', 'Sedang', 'Berat'];

function describeWeather(code: number): { label: string; isRainy: boolean } {
  if (code >= 80) return { label: 'Hujan Lebat', isRainy: true };
  if (code >= 51) return { label: 'Hujan Ringan', isRainy: true };
  if (code >= 3) return { label: 'Berawan', isRainy: false };
  if (code === 2) return { label: 'Cerah Berawan', isRainy: false };
  return { label: 'Cerah', isRainy: false };
}

function formatDayShortId(isoDate: string, idx: number): { dayName: string; shortDate: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(isoDate);
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dayName = idx === 0 ? 'Hari Ini' : dayNames[d.getDay()] ?? '';
  const fullDay = idx === 0 ? `Hari Ini (${fullDayNames[d.getDay()]})` : fullDayNames[d.getDay()];
  return {
    dayName: idx === 0 ? fullDay : dayName,
    shortDate: `${d.getDate()} ${monthNames[d.getMonth()]}`,
  };
}

async function fetchWeatherWithCache(): Promise<{ days: WeatherDay[]; offline: boolean }> {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { ts: number; days: WeatherDay[] };
      if (Array.isArray(parsed.days) && Date.now() - parsed.ts < WEATHER_TTL_MS) {
        return { days: parsed.days, offline: false };
      }
    }
  } catch {
    // Abaikan cache rusak
  }

  try {
    const resp = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-7.2575&longitude=112.7521&daily=weathercode,temperature_2m_max,relative_humidity_2m_mean&timezone=Asia%2FJakarta'
    );
    if (!resp.ok) throw new Error('Weather unavailable');
    const json = await resp.json();
    const days: WeatherDay[] = (json.daily.time as string[]).map((d, i) => ({
      date: d,
      tempMax: Math.round(json.daily.temperature_2m_max?.[i] ?? 30),
      humidity: Math.round(json.daily.relative_humidity_2m_mean?.[i] ?? 75),
      code: Number(json.daily.weathercode?.[i] ?? 0),
    }));
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ts: Date.now(), days }));
    return { days, offline: false };
  } catch {
    return { days: [], offline: true };
  }
}

export const AdminKendalaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useUiFeedback();
  const { triggerSyncNow } = useRealtimeSync();

  const [userProjectId, setUserProjectId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [kategori, setKategori] = useState<KategoriKendala>('Cuaca');
  const [keparahan, setKeparahan] = useState<TingkatKeparahan>('Sedang');
  const [tanggalKejadian, setTanggalKejadian] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [deskripsi, setDeskripsi] = useState('');
  const [estimasiHari, setEstimasiHari] = useState(1);
  const [fotos, setFotos] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ deskripsi?: string }>({});

  // Resolve modal
  const [resolvingItem, setResolvingItem] = useState<KendalaLapangan | null>(null);
  const [catatanSelesai, setCatatanSelesai] = useState('');
  const [tanggalResolved, setTanggalResolved] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [resolvingSubmit, setResolvingSubmit] = useState(false);
  const [resolveErr, setResolveErr] = useState<string | null>(null);

  const { data: projects = [], isLoading: loadingProjects } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'admin-kendala'],
    queryFn: () => projectService.getProjects(),
  });

  const selectedProjectId = userProjectId ?? (projects[0]?.id_proyek ?? null);

  const { data: kendalaList = [], isLoading: loadingKendala } = useQuery<KendalaLapangan[]>({
    queryKey: ['kendala', 'list', selectedProjectId],
    enabled: Boolean(selectedProjectId),
    queryFn: () => kendalaService.list(selectedProjectId!),
  });

  const { data: weatherResult, isLoading: loadingWeather } = useQuery({
    queryKey: ['weather', 'forecast'],
    queryFn: fetchWeatherWithCache,
    staleTime: WEATHER_TTL_MS,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!deskripsi.trim()) {
      setFieldErrors({ deskripsi: 'Deskripsi kendala wajib diisi.' });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setError(null);

    try {
      const res = await kendalaService.create(selectedProjectId, {
        kategori_kendala: kategori,
        tingkat_keparahan: keparahan,
        tanggal_kejadian: tanggalKejadian,
        deskripsi_kendala: deskripsi.trim(),
        estimasi_hari_tertunda: estimasiHari,
        fotos,
      });
      setDeskripsi('');
      setFotos([]);
      showToast({
        type: 'success',
        message: `Kendala dilaporkan. Status Early Warning proyek: ${res.early_warning.status}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['kendala'] });
      await queryClient.invalidateQueries({ queryKey: ['early-warning'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setError(
        extractApiError(
          err,
          'Gagal melaporkan kendala. Pastikan progres fisik proyek sudah pernah diinput.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem || !selectedProjectId) return;
    if (!catatanSelesai.trim()) {
      setResolveErr('Catatan solusi penanganan wajib diisi.');
      return;
    }

    setResolveErr(null);
    setResolvingSubmit(true);
    setError(null);

    try {
      const res = await kendalaService.resolve(resolvingItem.id_kendala, {
        catatan_penyelesaian: catatanSelesai.trim(),
        tanggal_resolved: tanggalResolved,
      });
      setResolvingItem(null);
      setCatatanSelesai('');
      showToast({
        type: 'success',
        message: `Kendala ditandai selesai. Status Early Warning terbaru: ${res.early_warning.status}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['kendala'] });
      await queryClient.invalidateQueries({ queryKey: ['early-warning'] });
      await triggerSyncNow();
    } catch (err: unknown) {
      setError(extractApiError(err, 'Gagal menyelesaikan kendala.'));
    } finally {
      setResolvingSubmit(false);
    }
  };

  const renderWeatherIcon = (code: number, sizeClass = 'w-5 h-5') => {
    if (code >= 51) return <CloudRain className={`${sizeClass} text-[#1877F2]`} />;
    if (code >= 2) return <CloudSun className={`${sizeClass} text-amber-500`} />;
    if (code === 0 || code === 1) return <Sun className={`${sizeClass} text-amber-500`} />;
    return <Cloud className={`${sizeClass} text-slate-400`} />;
  };

  const weatherDays = weatherResult?.days ?? [];
  const todayWeather = weatherDays[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#1877F2] sm:text-2xl">
          Kendala Lapangan Proyek
        </h1>
        <p className="text-xs text-gray-500">
          Pelaporan hambatan cuaca, material, tenaga kerja, peralatan, dan penyelesaian kendala
        </p>
      </div>

      {/* Weather Forecast Widget seperti Aplikasi Cuaca Nyata + Cache & Skeleton (LAP-04 & LAP-05) */}
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Prakiraan Cuaca Lokasi Proyek</h3>
            <p className="flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin className="h-3 w-3 text-[#1877F2]" />
              <span>Referensi Lapangan 7 Hari (Open-Meteo Cached)</span>
            </p>
          </div>
        </div>

        {loadingWeather ? (
          <SkeletonWeather />
        ) : weatherResult?.offline || weatherDays.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-gray-600">
            Prakiraan cuaca sedang tidak tersedia (offline) — Anda tetap dapat melaporkan kendala
            cuaca di formulir di bawah.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Hero Cuaca Hari Ini */}
            {todayWeather && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#1877F2] to-sky-500 p-4 text-white shadow-md sm:flex-row sm:items-center sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 shadow-sm">
                    {renderWeatherIcon(todayWeather.code, 'h-7 w-7')}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                      {formatDayShortId(todayWeather.date, 0).dayName} •{' '}
                      {formatDayShortId(todayWeather.date, 0).shortDate}
                    </div>
                    <div className="text-lg font-bold">
                      {describeWeather(todayWeather.code).label}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[10px] uppercase text-white/75">Suhu Maks</div>
                    <div className="font-mono text-2xl font-black">{todayWeather.tempMax}°C</div>
                  </div>
                  <div className="border-l border-white/25 pl-5">
                    <div className="text-[10px] uppercase text-white/75">Kelembapan</div>
                    <div className="flex items-center gap-1 font-mono text-lg font-bold">
                      <Droplets className="h-4 w-4 text-sky-100" />
                      <span>{todayWeather.humidity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Strip 7 Hari (Nama Hari Indonesia + Tgl, Grid Desktop / Scroll Mobile) */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
              {weatherDays.map((w, idx) => {
                const { dayName, shortDate } = formatDayShortId(w.date, idx);
                const info = describeWeather(w.code);
                return (
                  <div
                    key={w.date}
                    className={`flex min-w-[96px] flex-col items-center justify-between gap-1.5 rounded-2xl border p-3 text-center sm:min-w-0 ${
                      idx === 0
                        ? 'border-blue-200 bg-blue-50/70'
                        : 'border-gray-100 bg-slate-50/70'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-800">
                        {idx === 0 ? 'Hari Ini' : dayName}
                      </div>
                      <div className="text-[10px] text-gray-400">{shortDate}</div>
                    </div>
                    {renderWeatherIcon(w.code, 'h-5 w-5')}
                    <div className="text-[10px] font-medium text-gray-600">{info.label}</div>
                    <div className="font-mono text-xs font-extrabold text-gray-900">
                      {w.tempMax}°C
                    </div>
                    <div className="font-mono text-[10px] text-gray-400">{w.humidity}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Daftar Kendala */}
        <div className="order-1 space-y-3 lg:order-2 lg:col-span-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Riwayat Kendala Proyek ({kendalaList.length})
          </div>

          {loadingProjects || loadingKendala ? (
            <SkeletonTable rows={3} cols={2} />
          ) : kendalaList.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-xs text-emerald-800">
              <div className="font-bold">Belum Ada Kendala Dilaporkan</div>
              <p className="mt-1">Proyek ini tidak memiliki hambatan operasional tercatat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kendalaList.map((k) => {
                const fotoPaths = normalizeFotoPaths(k);
                const isAktif = k.status_penanganan === 'Aktif';
                return (
                  <div
                    key={k.id_kendala}
                    className={`space-y-2.5 rounded-2xl border p-4 text-xs shadow-sm ${
                      isAktif ? 'border-amber-200 bg-[#FFFDF5]' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isAktif
                              ? 'bg-amber-100 text-amber-900'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {k.status_penanganan}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {k.tingkat_keparahan}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {k.kategori_kendala}
                      </span>
                    </div>

                    <p className="leading-relaxed text-gray-800">{k.deskripsi_kendala}</p>

                    <PhotoThumbnailGrid
                      paths={fotoPaths}
                      altPrefix={`Foto Kendala ${k.kategori_kendala}`}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/60 pt-2 text-[11px] text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        Tertunda {k.estimasi_hari_tertunda} hari •{' '}
                        {formatTanggal(k.tanggal_kejadian)}
                      </span>
                      {fotoPaths.length > 0 && (
                        <span className="font-semibold text-[#1877F2]">
                          {fotoPaths.length} foto terlampir
                        </span>
                      )}
                    </div>

                    {isAktif ? (
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingItem(k);
                          setResolveErr(null);
                        }}
                        className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Tandai Selesai (Resolve)
                      </button>
                    ) : (
                      k.catatan_penyelesaian && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5 text-[11px] text-emerald-900">
                          <strong>Solusi ({formatTanggal(k.tanggal_resolved)}):</strong>{' '}
                          {k.catatan_penyelesaian}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Lapor Kendala Baru */}
        <div className="order-2 space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7 lg:order-1 lg:col-span-7">
          <div className="border-b border-gray-100 pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Lapor Kendala Baru
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">Pilih Proyek</label>
                <CustomSelect
                  ariaLabel="Pilih Proyek"
                  value={selectedProjectId ? String(selectedProjectId) : ''}
                  onChange={(val) => setUserProjectId(Number(val))}
                  options={projects.map((p) => ({
                    value: String(p.id_proyek),
                    label: `${p.kode_proyek} — ${p.nama_proyek}`,
                  }))}
                  placeholder="Pilih proyek..."
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-gray-700">Tanggal Kejadian</label>
                <WheelDatePicker
                  ariaLabel="Tanggal Kejadian Kendala"
                  value={tanggalKejadian}
                  onChange={(val) => setTanggalKejadian(val)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-gray-700">Kategori kendala</label>
              <div className="flex flex-wrap gap-2">
                {KATEGORI_LIST.map((kat) => (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setKategori(kat)}
                    className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                      kategori === kat
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'border border-gray-200 bg-slate-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {kat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-gray-700">
                Tingkat keparahan
              </label>
              <div className="flex flex-wrap gap-2">
                {KEPARAHAN_LIST.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setKeparahan(lvl)}
                    className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                      keparahan === lvl
                        ? lvl === 'Berat'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : lvl === 'Sedang'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-gray-200 bg-slate-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700">Deskripsi kendala</label>
              <textarea
                rows={4}
                value={deskripsi}
                onChange={(e) => {
                  setDeskripsi(e.target.value);
                  setFieldErrors({});
                }}
                placeholder="Jelaskan hambatan lapangan dan dampaknya terhadap pekerjaan..."
                className={`w-full resize-none rounded-xl border bg-slate-50 p-3.5 leading-relaxed focus:bg-white focus:outline-none ${
                  fieldErrors.deskripsi
                    ? 'border-rose-400'
                    : 'border-gray-200 focus:border-[#1877F2]'
                }`}
              />
              <FieldError message={fieldErrors.deskripsi} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Estimasi hari terhenti
                </label>
                <NumberInput
                  ariaLabel="Estimasi hari terhenti"
                  min={0}
                  max={365}
                  value={estimasiHari}
                  onChange={(val) => setEstimasiHari(val)}
                  className="font-semibold max-w-xs"
                />
              </div>

              {/* LAP-06 & 2.1: Multi-foto dengan pilihan Kamera vs Galeri */}
              <MultiPhotoPicker
                files={fotos}
                onChange={setFotos}
                label="Foto bukti kendala (opsional, dapat lebih dari satu)"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || !selectedProjectId}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 py-3 text-xs font-medium text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-60 sm:w-auto"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{submitting ? 'Mengirim…' : 'Kirim laporan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Resolve Kendala */}
      {resolvingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setResolvingItem(null)}
        >
          <form
            onSubmit={handleResolveSubmit}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tandai Kendala Selesai</h3>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setResolvingItem(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-gray-700">Tanggal Selesai</label>
                <WheelDatePicker
                  ariaLabel="Tanggal Selesai Kendala"
                  value={tanggalResolved}
                  onChange={(val) => setTanggalResolved(val)}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-gray-700">
                  Catatan Solusi Penanganan
                </label>
                <textarea
                  rows={3}
                  value={catatanSelesai}
                  onChange={(e) => {
                    setCatatanSelesai(e.target.value);
                    setResolveErr(null);
                  }}
                  placeholder="Jelaskan tindakan penyelesaian yang telah dilakukan..."
                  className={`w-full rounded-xl border bg-slate-50 p-3 focus:bg-white focus:outline-none ${
                    resolveErr ? 'border-rose-400' : 'border-gray-200 focus:border-[#1877F2]'
                  }`}
                />
                <FieldError message={resolveErr} />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => setResolvingItem(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={resolvingSubmit}
                className="rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {resolvingSubmit ? 'Menyimpan…' : 'Simpan Penyelesaian'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
