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

interface DirekturBerandaPageProps {
  onSelectPengajuan: (idRequest: number) => void;
  onGoToProyek?: () => void;
}

export const DirekturBerandaPage: React.FC<DirekturBerandaPageProps> = ({
  onSelectPengajuan,
  onGoToProyek,
}) => {
  const [filterTab, setFilterTab] = useState<StatusApprovalMaterial | 'Semua'>(
    'Menunggu Direktur'
  );

  const {
    data: requests = [],
    isLoading: loadingReq,
    error: errReq,
  } = useQuery<RequestMaterial[]>({
    queryKey: ['material-requests', 'direktur'],
    queryFn: () => materialService.list(),
  });

  const { data: projects = [], isLoading: loadingProj } = useQuery<ProjectListItem[]>({
    queryKey: ['projects', 'direktur-summary'],
    queryFn: () => projectService.getProjects(),
  });

  const { data: portfolio = null, isLoading: loadingPortfolio } = useQuery<EarlyWarningPortfolio>({
    queryKey: ['early-warning', 'portfolio'],
    queryFn: () => earlyWarningService.getPortfolio(),
  });

  const menungguList = requests.filter((r) => r.status_approval === 'Menunggu Direktur');
  const daruratCount = menungguList.filter((r) => r.sifat_pengajuan === 'Darurat').length;

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
  const errorMsg = errReq ? extractApiError(errReq, 'Gagal memuat ringkasan dasbor Direktur.') : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1877F2] tracking-tight">
        Beranda Eksekutif
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="flex h-[125px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Menunggu Persetujuan
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {menungguList.length} pengajuan
                </div>
                <div className="text-xs text-gray-400">Sudah dinilai Keuangan</div>
              </div>

              <div className="flex h-[125px] flex-col justify-between rounded-2xl bg-[#1877F2] p-5 text-white shadow-md shadow-blue-500/20">
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/80">
                  Pengajuan Darurat
                </div>
                <div className="text-2xl font-bold text-white">{daruratCount} pengajuan</div>
                <div className="text-xs text-white/80">Prioritas kebutuhan mendesak</div>
              </div>

              <button
                type="button"
                onClick={onGoToProyek}
                className={`flex h-[125px] w-full flex-col justify-between rounded-2xl p-5 text-left shadow-md transition ${
                  onGoToProyek ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'cursor-default'
                } ${
                  loadingPortfolio && !portfolio
                    ? 'border border-gray-100 bg-white text-gray-500'
                    : ewTone.cardBg
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider ${
                      loadingPortfolio && !portfolio ? 'text-gray-400' : ewTone.cardSubtext
                    }`}
                  >
                    Early Warning Proyek
                  </span>
                  {!(loadingPortfolio && !portfolio) && (
                    <span className={`h-2.5 w-2.5 rounded-full ring-2 ${ewTone.dot}`} />
                  )}
                </div>
                {loadingPortfolio && !portfolio ? (
                  <>
                    <div className="h-7 w-28 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{ewTone.label}</div>
                    <div className={`flex w-full items-center justify-between gap-1 text-xs ${ewTone.cardSubtext}`}>
                      <span className="truncate">
                        {portfolio?.ringkasan.proyek_berisiko
                          ? `${portfolio.ringkasan.proyek_berisiko} proyek berisiko terlambat`
                          : 'Semua proyek sesuai Kurva S'}
                      </span>
                      {onGoToProyek && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                    </div>
                  </>
                )}
              </button>

              <div className="flex h-[125px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Proyek Aktif
                </div>
                <div className="text-2xl font-bold text-gray-900">{projects.length} proyek</div>
                <div className="text-xs text-gray-400">
                  {portfolio
                    ? `Total proyek terpantau: ${portfolio.ringkasan.total_proyek}`
                    : 'Aktif berjalan'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Antrean Pengajuan Material
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: 'Menunggu Direktur', label: `Menunggu Direktur (${menungguList.length})` },
                    { key: 'Selesai', label: 'Selesai / PO' },
                    { key: 'Perlu Revisi', label: 'Perlu Revisi' },
                    { key: 'Semua', label: 'Semua Status' },
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
                              : 'Menunggu Keuangan'}
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
