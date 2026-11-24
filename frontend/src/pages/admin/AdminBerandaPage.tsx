import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  earlyWarningService,
  projectService,
  type EarlyWarningStatus,
  type ProjectListItem,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatTanggal } from '../../lib/formatters';
import { EarlyWarningStatusBadge } from '../../components/common/EarlyWarningVisuals';
import { getEarlyWarningTone } from '../../lib/earlyWarningTheme';
import { SkeletonDashboard } from '../../components/ui';
import { AlertCircle, ChevronRight, Lock, Search } from 'lucide-react';

interface AdminBerandaPageProps {
  onSelectProyek: (idProyek: number) => void;
}

export const AdminBerandaPage: React.FC<AdminBerandaPageProps> = ({ onSelectProyek }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'Semua' | EarlyWarningStatus>('Semua');

  const {
    data: projects = [],
    isLoading: loadingProj,
    error: errProj,
  } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'admin-beranda'],
    queryFn: () => projectService.getProjects(),
  });

  const { data: statusMap = {} } = useQuery<Record<number, EarlyWarningStatus>>({
    queryKey: ['early-warning', 'admin-map', projects.map((p) => p.id_proyek).join(',')],
    enabled: projects.length > 0,
    queryFn: async () => {
      const settled = await Promise.allSettled(
        projects.map((p) => earlyWarningService.getProjectAnalysis(p.id_proyek))
      );
      const map: Record<number, EarlyWarningStatus> = {};
      settled.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          map[projects[idx].id_proyek] = res.value.status;
        }
      });
      return map;
    },
  });

  const enriched = projects.map((p) => ({
    ...p,
    ewStatus: statusMap[p.id_proyek] ?? ('Aman' as EarlyWarningStatus),
  }));

  const filteredList = enriched.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.nama_proyek.toLowerCase().includes(q) ||
      item.dinas_pemberi_kerja.toLowerCase().includes(q) ||
      item.kode_proyek.toLowerCase().includes(q);
    const matchStatus = selectedStatus === 'Semua' || item.ewStatus === selectedStatus;
    return matchSearch && matchStatus;
  });

  const riskyCount = enriched.filter((p) => p.ewStatus !== 'Aman').length;
  const hasKritis = enriched.some((p) => p.ewStatus === 'Kritis');
  const overallStatus: EarlyWarningStatus = hasKritis
    ? 'Kritis'
    : riskyCount > 0
      ? 'Waspada'
      : 'Aman';
  const tone = getEarlyWarningTone(overallStatus);

  const errorMsg = errProj
    ? extractApiError(errProj, 'Gagal memuat daftar proyek lapangan.')
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#1877F2] sm:text-2xl">
          Daftar Proyek Lapangan
        </h1>
        <p className="text-xs text-gray-500">
          Pilih proyek yang ditugaskan kepada Anda untuk input progres, material, atau termin
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loadingProj ? (
        <SkeletonDashboard />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                Proyek Ditugaskan
              </div>
              <div className="text-xl font-bold leading-tight tracking-tight text-gray-900">
                {projects.length} Proyek
              </div>
            </div>

            <div className={`flex flex-col gap-1 rounded-2xl p-4 shadow-md ${tone.cardBg}`}>
              <div className="flex items-start justify-between gap-1">
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wider leading-tight ${tone.cardSubtext}`}
                >
                  Status Early Warning
                </span>
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ring-2 ${tone.dot}`} />
              </div>
              <div className="text-xl font-bold leading-tight tracking-tight">
                {riskyCount === 0 ? 'Aman (0 Berisiko)' : `${riskyCount} Proyek Berisiko`}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode atau nama proyek..."
                className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 shadow-sm focus:border-[#1877F2] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['Semua', 'Aman', 'Waspada', 'Kritis'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    selectedStatus === st
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center text-xs text-amber-900 space-y-2">
              <Lock className="mx-auto h-7 w-7 text-amber-600" />
              <div className="font-bold text-sm">Belum Ada Penugasan Proyek</div>
              <p className="text-amber-800">
                Hubungi Direktur untuk mendapatkan hak akses proyek lapangan pada akun Anda.
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-xs text-gray-400">
              Tidak ada proyek yang sesuai pencarian.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredList.map((item) => (
                <button
                  key={item.id_proyek}
                  type="button"
                  onClick={() => onSelectProyek(item.id_proyek)}
                  className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/20"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1877F2]">
                      {item.kode_proyek}
                    </span>
                    <EarlyWarningStatusBadge status={item.ewStatus} />
                  </div>

                  <div className="mb-2.5">
                    <h4 className="text-sm font-bold leading-snug text-gray-900">
                      {item.nama_proyek}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {item.dinas_pemberi_kerja} • Realisasi{' '}
                      <strong>{item.progres_fisik_terakhir.persentase_realisasi}%</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                        Termin Berjalan
                      </div>
                      <div className="text-xs font-semibold text-gray-800">
                        {item.posisi_termin_berjalan
                          ? `Termin ${item.posisi_termin_berjalan.nomor_termin} (${item.posisi_termin_berjalan.status_penagihan})`
                          : 'Selesai'}
                      </div>
                    </div>

                    <div className="space-y-0.5 text-right">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                        Tenggat
                      </div>
                      <div className="text-xs font-medium text-gray-700">
                        {formatTanggal(item.posisi_termin_berjalan?.tenggat_waktu)}
                      </div>
                    </div>

                    <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
