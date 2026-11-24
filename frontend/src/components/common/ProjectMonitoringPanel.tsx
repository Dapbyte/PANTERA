import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  kendalaService,
  progressService,
  type KendalaLapangan,
  type ProgresFisik,
} from '../../services';
import { formatTanggal } from '../../lib/formatters';
import { SkeletonTable } from '../ui';
import { PhotoThumbnailGrid } from './MultiPhotoPicker';
import { normalizeFotoPaths } from '../../lib/mediaHelpers';
import { Activity, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ProjectMonitoringPanelProps {
  proyekId: number;
}

/**
 * Panel pemantauan Progres Fisik & Riwayat Kendala Lapangan (beserta multi-foto)
 * yang dipakai bersama oleh Keuangan dan Direktur agar tidak ada blind-spot.
 */
export const ProjectMonitoringPanel: React.FC<ProjectMonitoringPanelProps> = ({ proyekId }) => {
  const { data: progressList = [], isLoading: loadingProg } = useQuery<ProgresFisik[]>({
    queryKey: ['progress', 'list', proyekId],
    queryFn: () => progressService.list(proyekId),
  });

  const { data: kendalaList = [], isLoading: loadingKendala } = useQuery<KendalaLapangan[]>({
    queryKey: ['kendala', 'list', proyekId],
    queryFn: () => kendalaService.list(proyekId),
  });

  return (
    <div className="space-y-5 text-xs">
      {/* Penjelasan peran Progres & Kendala vs Termin agar tidak rancu (A4) */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1877F2]" />
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          <strong className="text-gray-900">Keterkaitan Data Lapangan &amp; Termin:</strong>
          <p>
            <strong>Progres Fisik</strong> menggerakkan Kurva S realisasi proyek, sedangkan{' '}
            <strong>Kendala Lapangan</strong> memicu peringatan keterlambatan &amp; estimasi risiko kas
            pada <em>Early Warning</em>. Kelengkapan penagihan termin tetap mengikuti verifikasi{' '}
            <em>Berkas Checklist</em>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Kolom 1: Riwayat Progres Fisik + Multi-Foto */}
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <Activity className="h-4 w-4 text-[#1877F2]" />
              <span>Riwayat Progres Fisik ({progressList.length})</span>
            </div>
          </div>

          {loadingProg ? (
            <SkeletonTable rows={3} cols={2} />
          ) : progressList.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-6 text-center text-gray-400">
              Belum ada laporan progres fisik yang diunggah Admin Lapangan.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
              {progressList.map((prog) => {
                const photos = normalizeFotoPaths(prog);
                return (
                  <div
                    key={prog.id_progres}
                    className="space-y-2.5 rounded-2xl border border-gray-100 bg-slate-50/70 p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-[#1877F2] px-2.5 py-0.5 font-bold text-white">
                        {prog.persentase_realisasi}%
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {formatTanggal(prog.tanggal_lapor)} • {prog.pelapor?.nama ?? 'Lapangan'}
                      </span>
                    </div>

                    <p className="leading-relaxed text-gray-800">{prog.deskripsi_pekerjaan}</p>

                    <PhotoThumbnailGrid
                      paths={photos}
                      altPrefix={`Foto Progres ${prog.persentase_realisasi}%`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom 2: Riwayat Kendala (Aktif & Resolved) + Multi-Foto */}
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Riwayat Kendala Lapangan ({kendalaList.length})</span>
            </div>
          </div>

          {loadingKendala ? (
            <SkeletonTable rows={3} cols={2} />
          ) : kendalaList.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <div className="font-bold">Tidak Ada Kendala Dilaporkan</div>
              <p className="mt-0.5 text-[11px]">
                Belum ada hambatan operasional yang tercatat pada proyek ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
              {kendalaList.map((k) => {
                const photos = normalizeFotoPaths(k);
                const isAktif = k.status_penanganan === 'Aktif';
                return (
                  <div
                    key={k.id_kendala}
                    className={`space-y-2 rounded-2xl border p-3.5 ${
                      isAktif
                        ? 'border-amber-200 bg-amber-50/60'
                        : 'border-gray-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-gray-900">
                        {k.kategori_kendala} • {k.tingkat_keparahan} ({k.estimasi_hari_tertunda} hari)
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isAktif
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {!isAktif && <CheckCircle2 className="h-3 w-3" />}
                        <span>{k.status_penanganan}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500">
                      Kejadian: {formatTanggal(k.tanggal_kejadian)}
                    </div>

                    <p className="leading-relaxed text-gray-800">{k.deskripsi_kendala}</p>

                    <PhotoThumbnailGrid
                      paths={photos}
                      altPrefix={`Foto Kendala ${k.kategori_kendala}`}
                    />

                    {!isAktif && k.catatan_penyelesaian && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                        <strong>Solusi ({formatTanggal(k.tanggal_resolved)}):</strong>{' '}
                        {k.catatan_penyelesaian}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
