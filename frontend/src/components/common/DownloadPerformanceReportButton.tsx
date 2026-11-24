import React, { useState } from 'react';
import { bankCreditService } from '../../services';
import { extractApiError } from '../../lib/api';
import { buildPerformanceReportXlsx } from '../../lib/xlsxExport';
import { useUiFeedback } from '../../context/uiFeedbackStore';
import { Download, Loader2 } from 'lucide-react';

interface DownloadPerformanceReportButtonProps {
  proyekId: number;
  kodeProyek?: string;
  label?: string;
  filePrefix?: string;
  variant?: 'pill' | 'block';
  className?: string;
  onError?: (message: string) => void;
}

/**
 * Komponen tombol unduh laporan performa proyek (.xlsx) reusable
 * untuk halaman Pemantauan Proyek & Kredit & Dinas (1.2 Refactor).
 */
export const DownloadPerformanceReportButton: React.FC<DownloadPerformanceReportButtonProps> = ({
  proyekId,
  kodeProyek,
  label = 'Unduh Laporan Performa (.xlsx)',
  filePrefix = 'laporan-performa',
  variant = 'pill',
  className = '',
  onError,
}) => {
  const { showAutoPopup, showToast } = useUiFeedback();
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const report = await bankCreditService.getPerformanceReport(proyekId);
      const kode = kodeProyek || report.proyek_detail?.proyek?.kode_proyek || String(proyekId);
      const blob = buildPerformanceReportXlsx(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filePrefix}-${kode}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      showAutoPopup({
        title: 'Laporan Performa Diunduh',
        message: `Laporan performa proyek ${kode} untuk bank (.xlsx) berhasil diunduh.`,
        autoCloseSeconds: 10,
      });
    } catch (err: unknown) {
      const msg = extractApiError(err, 'Gagal mengunduh laporan performa proyek.');
      if (onError) {
        onError(msg);
      } else {
        showToast({ type: 'error', message: msg });
      }
    } finally {
      setDownloading(false);
    }
  };

  const baseClass =
    variant === 'block'
      ? 'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60'
      : 'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-100 disabled:opacity-60';

  return (
    <button
      type="button"
      disabled={downloading}
      onClick={() => void handleClick()}
      className={`${baseClass} ${className}`}
    >
      {downloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1877F2]" />
      ) : (
        <Download className="h-3.5 w-3.5 text-[#1877F2]" />
      )}
      <span>{downloading ? 'Menyiapkan .xlsx…' : label}</span>
    </button>
  );
};
