import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  earlyWarningService,
  materialService,
  projectService,
  type EarlyWarningPortfolio,
  type EarlyWarningStatus,
  type ProjectListItem,
  type RequestMaterial,
  type StatusApprovalMaterial,
} from '../../services';
import { extractApiError } from '../../lib/api';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { getEarlyWarningTone } from '../../lib/earlyWarningTheme';
import { SkeletonDashboard } from '../../components/ui';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface SekretarisBerandaPageProps {
  onSelectPengajuan: (idRequest: number) => void;
}

export const SekretarisBerandaPage: React.FC<SekretarisBerandaPageProps> = ({
  onSelectPengajuan,
}) => {
  const [filterTab, setFilterTab] = useState<StatusApprovalMaterial | 'Semua'>('Diajukan');

  const {
    data: requests = [],
    isLoading: loadingReq,
    error: errReq,
  } = useQuery<RequestMaterial[]>({
    queryKey: ['material-requests', 'keuangan'],
    queryFn: () => materialService.list(),
  });

  const { data: projects = [], isLoading: loadingProj } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'keuangan-summary'],
    queryFn: () => projectService.getProjects(),
  });

  const { data: portfolio = null } = useQuery<EarlyWarningPortfolio>({
    queryKey: ['early-warning', 'portfolio'],
    queryFn: () => earlyWarningService.getPortfolio(),
  });

  const totalSisaPagu = projects.reduce((sum, p) => sum + (p.ringkasan_rab?.sisa_pagu ?? 0), 0);
  const diajukanList = requests.filter((r) => r.status_approval === 'Diajukan');
  const daruratCount = diajukanList.filter((r) => r.sifat_pengajuan === 'Darurat').length;
  const displayedList =
    filterTab === 'Semua'
      ? requests
      : requests.filter((r) => r.status_approval === filterTab);

  const hasKritis = portfolio?.proyek.some((p) => p.status === 'Kritis') ?? false;
  const hasWaspada = portfolio?.proyek.some((p) => p.status === 'Waspada') ?? false;
  const portfolioStatus: EarlyWarningStatus = hasKritis
    ? 'Kritis'
    : hasWaspada
      ? 'Waspada'
      : 'Aman';
  const ewTone = getEarlyWarningTone(portfolioStatus);

  const getStatusBadge = (status: StatusApprovalMaterial) => {
    switch (status) {
      case 'Diajukan':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Menunggu Direktur':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'Selesai':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Perlu Revisi':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
  };

  const loading = loadingReq || loadingProj;
  const errorMsg = errReq ? extractApiError(errReq, 'Gagal memuat dasbor Keuangan.') : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
        Beranda Keuangan
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
              Ringkasan
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="flex h-[125px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Total Sisa Pagu RAB
                </div>
                <div className="text-2xl font-bold tracking-tight text-gray-900">
                  {formatRupiah(totalSisaPagu)}
                </div>
                <div className="text-xs text-gray-400">
                  Tersebar pada {projects.length} proyek terdaftar
                </div>
              </div>

              <div
                className={`flex h-[125px] flex-col justify-between rounded-2xl p-5 shadow-md ${ewTone.cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider ${ewTone.cardSubtext}`}
                  >
                    Peringatan Dini
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ring-2 ${ewTone.dot}`} />
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {portfolioStatus === 'Aman'
                    ? 'Aman'
                    : portfolioStatus === 'Waspada'
                      ? 'Perlu Perhatian'
                      : 'Kondisi Kritis'}
                </div>
                <div className={`text-xs ${ewTone.cardSubtext}`}>
                  {portfolio?.ringkasan.proyek_berisiko
                    ? `${portfolio.ringkasan.proyek_berisiko} proyek berpotensi terlambat`
                    : '0 proyek berisiko • Semua aman sesuai Kurva S'}
                </div>
              </div>

              <div className="flex h-[125px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Antrean Review Keuangan
                </div>
                <div className="text-2xl font-bold tracking-tight text-gray-900">
                  {diajukanList.length} pengajuan
                </div>
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      daruratCount > 0
                        ? 'bg-rose-600 text-white'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {daruratCount > 0
                      ? `${daruratCount} pengajuan sifat darurat`
                      : 'Tidak ada antrean darurat'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Review Harga &amp; Vendor Pengajuan Material
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: 'Diajukan', label: `Perlu Review (${diajukanList.length})` },
                    { key: 'Menunggu Direktur', label: 'Menunggu Direktur' },
                    { key: 'Perlu Revisi', label: 'Perlu Revisi' },
                    { key: 'Selesai', label: 'Selesai' },
                    { key: 'Semua', label: 'Semua' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterTab(tab.key)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      filterTab === tab.key
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {displayedList.length === 0 ? (
                <div className="p-10 text-center text-xs text-gray-400">
                  Tidak ada pengajuan material pada filter ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-white text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        <th className="py-3 px-4 pl-6">No. Request</th>
                        <th className="py-3 px-4">Proyek / Dinas</th>
                        <th className="py-3 px-4">Pengaju</th>
                        <th className="py-3 px-4 text-center">Sifat</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Total Harga</th>
                        <th className="py-3 px-4">Tgl Butuh</th>
                        <th className="w-12 py-3 pl-2 pr-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/80">
                      {displayedList.map((item) => (
                        <tr
                          key={item.id_request}
                          onClick={() => onSelectPengajuan(item.id_request)}
                          className="group cursor-pointer text-xs text-gray-800 transition hover:bg-blue-50/50"
                        >
                          <td className="py-3.5 px-4 pl-6 font-mono font-semibold text-[#1877F2]">
                            <div>{item.no_request}</div>
                            {item.melebihi_rab && item.status_approval !== 'Selesai' && (
                              <span className="mt-0.5 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                                Melebihi RAB
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-gray-900">
                              {item.proyek?.nama_proyek || `Proyek #${item.id_proyek}`}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {item.proyek?.dinas_pemberi_kerja}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">{item.pengaju?.nama || '—'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                item.sifat_pengajuan === 'Darurat'
                                  ? 'border border-rose-200 bg-rose-50 text-rose-600'
                                  : 'border border-blue-200 bg-blue-50 text-blue-600'
                              }`}
                            >
                              {item.sifat_pengajuan}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-medium ${getStatusBadge(
                                item.status_approval
                              )}`}
                            >
                              {item.status_approval}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-900">
                            {item.total_estimasi !== null
                              ? formatRupiah(item.total_estimasi)
                              : 'Perlu diisi Keuangan'}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {formatTanggal(item.tanggal_butuh ?? item.tanggal_pengajuan)}
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
          </div>
        </>
      )}
    </div>
  );
};
