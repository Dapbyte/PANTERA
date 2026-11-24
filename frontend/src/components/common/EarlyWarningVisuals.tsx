import React from 'react';
import type { EarlyWarningAnalysis, EarlyWarningStatus } from '../../types/api';
import { getEarlyWarningTone } from '../../lib/earlyWarningTheme';
import { formatRupiah } from '../../lib/formatters';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const EarlyWarningStatusBadge: React.FC<{ status: EarlyWarningStatus }> = ({ status }) => {
  const tone = getEarlyWarningTone(status);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tone.badge}`}
    >
      {status === 'Aman' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'Waspada' && <AlertTriangle className="h-3 w-3" />}
      {status === 'Kritis' && <ShieldAlert className="h-3 w-3" />}
      <span>{tone.label}</span>
    </span>
  );
};

interface EarlyWarningStatusBannerProps {
  analysis: EarlyWarningAnalysis;
}

export const EarlyWarningStatusBanner: React.FC<EarlyWarningStatusBannerProps> = ({
  analysis,
}) => {
  const tone = getEarlyWarningTone(analysis.status);
  const { status, termin_berjalan, progres, prediksi, faktor_penyebab, rekomendasi } = analysis;

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 space-y-2.5 ${tone.banner}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          {status === 'Aman' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
          {status === 'Waspada' && (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          )}
          {status === 'Kritis' && <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />}
          <span>
            {status === 'Aman'
              ? 'Status Early Warning: Aman — Proyek Berjalan Sesuai Kurva S'
              : status === 'Waspada'
                ? 'Status Early Warning: Waspada — Terdeteksi Potensi Keterlambatan'
                : 'Status Early Warning: Kritis — Risiko Tinggi Penundaan Termin'}
          </span>
        </div>
        <EarlyWarningStatusBadge status={status} />
      </div>

      <p className="text-xs leading-relaxed opacity-90">
        {rekomendasi?.teks ||
          (status === 'Aman'
            ? 'Progres fisik berada dalam batas aman. Pertahankan ritme pekerjaan dan lengkapi berkas termin sejak dini.'
            : 'Perlu tindak lanjut mitigasi progres dan kelengkapan berkas termin.')}
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-medium pt-1">
        <span>
          Realisasi: <strong>{progres.realisasi_terakhir}%</strong>
          {termin_berjalan
            ? ` (Target Termin ${termin_berjalan.nomor_termin}: ${termin_berjalan.target_persentase}%)`
            : ''}
        </span>
        <span>
          Estimasi Telat: <strong>{prediksi.estimasi_hari_terlambat} hari</strong>
        </span>
        <span>
          Estimasi Dampak Kas: <strong>{formatRupiah(prediksi.estimasi_kerugian)}</strong>
        </span>
      </div>

      {faktor_penyebab.length > 0 && (
        <ul className="list-disc list-inside text-[11px] space-y-0.5 pt-1 opacity-90">
          {faktor_penyebab.map((f, idx) => (
            <li key={idx}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
