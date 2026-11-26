import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SkeletonWeather } from '../ui';
import { Cloud, CloudRain, CloudSun, Droplets, MapPin, Sun } from 'lucide-react';

interface WeatherDay {
  date: string;
  tempMax: number;
  humidity: number;
  code: number;
}

const WEATHER_CACHE_KEY = 'pantera_weather_cache_v1';
const WEATHER_TTL_MS = 30 * 60 * 1000;

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

function renderWeatherIcon(code: number, sizeClass = 'w-5 h-5') {
  if (code >= 51) return <CloudRain className={`${sizeClass} text-[#1877F2]`} />;
  if (code >= 2) return <CloudSun className={`${sizeClass} text-amber-500`} />;
  if (code === 0 || code === 1) return <Sun className={`${sizeClass} text-amber-500`} />;
  return <Cloud className={`${sizeClass} text-slate-400`} />;
}

/**
 * Widget prakiraan cuaca 7 hari responsif (scroll horizontal di mobile, grid 7 kolom di desktop).
 */
export const WeatherForecastWidget: React.FC = () => {
  const { data: weatherResult, isLoading: loadingWeather } = useQuery({
    queryKey: ['weather', 'forecast'],
    queryFn: fetchWeatherWithCache,
    staleTime: WEATHER_TTL_MS,
  });

  const weatherDays = weatherResult?.days ?? [];
  const todayWeather = weatherDays[0];

  return (
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
          Prakiraan cuaca sedang tidak tersedia (offline) — Anda tetap dapat melanjutkan pelaporan lapangan.
        </div>
      ) : (
        <div className="space-y-3">
          {todayWeather && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#1877F2] to-sky-500 p-4 text-white shadow-md sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/95 shadow-sm">
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

          <div className="flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
            {weatherDays.map((w, idx) => {
              const { dayName, shortDate } = formatDayShortId(w.date, idx);
              const info = describeWeather(w.code);
              return (
                <div
                  key={w.date}
                  className={`flex min-w-[92px] flex-col items-center justify-between gap-1.5 rounded-2xl border p-3 text-center sm:min-w-0 ${
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
  );
};
