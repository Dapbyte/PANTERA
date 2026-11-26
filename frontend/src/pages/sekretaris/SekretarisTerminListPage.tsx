import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  earlyWarningService,
  projectService,
  type EarlyWarningPortfolio,
  type EarlyWarningStatus,
  type ProjectListItem,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { EarlyWarningStatusBadge } from '../../components/common/EarlyWarningVisuals';
import { getEarlyWarningTone } from '../../lib/earlyWarningTheme';
import { SkeletonDashboard } from '../../components/ui';
import { AlertCircle, ChevronRight, Search } from 'lucide-react';

interface SekretarisTerminListPageProps {
  onSelectProyek: (idProyek: number) => void;
}

export const SekretarisTerminListPage: React.FC<SekretarisTerminListPageProps> = ({
  onSelectProyek,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'Semua' | EarlyWarningStatus>('Semua');

  const {
    data: projects = [],
    isLoading: loadingProj,
    error: errProj,
  } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'keuangan-termin-list'],
    queryFn: () => projectService.getProjects(),
  });

  const { data: portfolio = null, isLoading: loadingEw } = useQuery<EarlyWarningPortfolio>({
    queryKey: ['early-warning', 'portfolio'],
    queryFn: () => earlyWarningService.getPortfolio(),
  });

  const ewByProject = new Map(
    (portfolio?.proyek ?? []).map((item) => [item.id_proyek, item])
  );

  const enriched = projects.map((proj) => {
    const ew = ewByProject.get(proj.id_proyek);
    const status: EarlyWarningStatus = ew?.status ?? 'Aman';
    return {
      ...proj,
      ewStatus: status,
      estimasiTelat: ew?.estimasi_hari_terlambat ?? 0,
      estimasiKerugian: ew?.estimasi_kerugian ?? 0,
    };
  });

  const filteredList = enriched.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.nama_proyek.toLowerCase().includes(q) ||
      item.dinas_pemberi_kerja.toLowerCase().includes(q) ||
      item.kode_proyek.toLowerCase().includes(q);
    const matchStatus = selectedStatus === 'Semua' || item.ewStatus === selectedStatus;
    return matchSearch && matchStatus;
  });

  const hasKritis = enriched.some((p) => p.ewStatus === 'Kritis');
  const hasWaspada = enriched.some((p) => p.ewStatus === 'Waspada');
  const summaryStatus: EarlyWarningStatus = hasKritis
    ? 'Kritis'
    : hasWaspada
      ? 'Waspada'
      : 'Aman';
  const summaryTone = getEarlyWarningTone(summaryStatus);

  const loading = loadingProj || loadingEw;
  const errorMsg = errProj ? extractApiError(errProj, 'Gagal memuat portofolio proyek.') : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
        Pemantauan Proyek &amp; Termin
      </h1>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <SkeletonDashboard />
      ) : (
        <>
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Ringkasan Portofolio
            </div>

            <div className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex h-[125px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Total Proyek Terdaftar
                </div>
                <div className="text-3xl font-bold tracking-tight text-gray-900">
                  {projects.length} Proyek
                </div>
              </div>

              <div
                className={`flex h-[125px] flex-col justify-between rounded-2xl p-6 shadow-md ${summaryTone.cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider ${summaryTone.cardSubtext}`}
                  >
                    Proyek Dengan Estimasi Keterlambatan
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ring-2 ${summaryTone.dot}`} />
                </div>
                <div>
                  <div className="text-3xl font-bold tracking-tight">
                    {portfolio?.ringkasan.proyek_berisiko ?? 0} Proyek
                  </div>
                  <div className={`mt-0.5 text-xs ${summaryTone.cardSubtext}`}>
                    {(portfolio?.ringkasan.proyek_berisiko ?? 0) === 0
                      ? 'Semua proyek aman sesuai Kurva S'
                      : `Potensi dampak kas: ${formatRupiah(
                          portfolio?.ringkasan.total_estimasi_kerugian ?? 0
                        )}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-0 pt-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative flex w-full items-center sm:w-64 sm:pb-2">
              <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode, dinas, atau judul..."
                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 shadow-sm focus:border-[#1877F2] focus:outline-none"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filter status pemantauan proyek"
              className="-mb-px flex items-center gap-5 overflow-x-auto px-1"
            >
              {(['Semua', 'Aman', 'Waspada', 'Kritis'] as const).map((st) => {
                const isActive = selectedStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedStatus(st)}
                    className={`shrink-0 whitespace-nowrap border-b-2 pb-2.5 pt-1 text-xs font-semibold transition ${
                      isActive
                        ? 'border-[#1877F2] text-[#1877F2]'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {filteredList.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-400">
                Tidak ada proyek yang sesuai filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-white text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <th className="py-3 px-4 pl-6">Kode</th>
                      <th className="py-3 px-4">Dinas Pemberi Kerja</th>
                      <th className="py-3 px-4">Nama Proyek</th>
                      <th className="py-3 px-4">Termin Berjalan</th>
                      <th className="py-3 px-4">Tenggat</th>
                      <th className="py-3 px-4 text-center">Early Warning</th>
                      <th className="w-12 py-3 pl-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80 text-xs text-gray-800">
                    {filteredList.map((item) => (
                      <tr
                        key={item.id_proyek}
                        onClick={() => onSelectProyek(item.id_proyek)}
                        className="group cursor-pointer transition hover:bg-blue-50/50"
                      >
                        <td className="py-3.5 px-4 pl-6 font-mono font-bold text-[#1877F2]">
                          {item.kode_proyek}
                        </td>
                        <td className="py-3.5 px-4">{item.dinas_pemberi_kerja}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          {item.nama_proyek}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {item.posisi_termin_berjalan
                            ? `Termin ${item.posisi_termin_berjalan.nomor_termin} (${item.posisi_termin_berjalan.status_penagihan})`
                            : 'Selesai'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {formatTanggal(item.posisi_termin_berjalan?.tenggat_waktu)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <EarlyWarningStatusBadge status={item.ewStatus} />
                        </td>
                        <td className="py-3.5 pl-2 pr-5 text-right">
                          <ChevronRight className="inline-block h-4 w-4 text-gray-400 transition group-hover:text-[#1877F2]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
