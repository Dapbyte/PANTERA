export type SifatPengajuan = 'Darurat' | 'Rutin Mingguan';
export type JenisPengajuan = 'RAB' | 'Surat' | 'Dokumen';

export interface MaterialItem {
  id: string;
  material: string;
  volume: string;
  harga: number;
  subtotal: number;
}

export interface Pengajuan {
  id: string;
  tender: string;
  namaProyek: string;
  sifat: SifatPengajuan;
  jenis: JenisPengajuan;
  totalEstimasi: number;
  tanggalPengajuan: string;
  sisaPaguRab: number;
  statusVerifikasi: string;
  isVendorTersedia: boolean;
  keteranganKhusus?: string;
  items?: MaterialItem[];
  documentUrl?: string;
  documentTitle?: string;
}

export type TipeArsip = 'Berita acara' | 'Kwitansi' | 'Kontrak';

export interface ArsipItem {
  id: string;
  kode: string;
  judulDokumen: string;
  tanggal: string;
  tipe: TipeArsip;
  lokasiArsip: string;
}
