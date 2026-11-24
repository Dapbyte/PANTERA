export function formatRupiah(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(safe)
    .replace('IDR', 'Rp');
}

export function formatRupiahCompact(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  const safe = Number.isFinite(num) ? num : 0;
  if (Math.abs(safe) >= 1_000_000_000) {
    return `Rp ${(safe / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  }
  if (Math.abs(safe) >= 1_000_000) {
    return `Rp ${(safe / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  }
  return formatRupiah(safe);
}

export function formatTanggal(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format angka dengan pemisah titik ribuan Indonesia untuk input nominal (DIR-04).
 */
export function formatRibuan(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const digits = typeof value === 'number'
    ? String(Math.max(0, Math.round(value)))
    : value.replace(/\D/g, '');
  const clean = digits.replace(/^0+(?=\d)/, '') || '0';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseRibuan(input: string): number {
  const digits = input.replace(/\D/g, '');
  if (!digits) return 0;
  const num = Number(digits);
  return Number.isFinite(num) ? num : 0;
}
