export interface ProgresFotoItem {
  id: string;
  capaian: string;
  judul: string;
  tanggal: string;
  imageUrl: string;
}

export interface RequestMaterialItem {
  id: string;
  tanggal: string;
  pengaju: string;
  rolePengaju: string;
  sifat: 'Darurat' | 'Rutin Mingguan';
  totalEstimasi: number;
  status: 'Pending' | 'Tervalidasi Keuangan' | 'Disetujui';
}

export interface BerkasChecklistItem {
  id: string;
  kode: string;
  judul: string;
  tanggal: string;
  status: 'Terverifikasi' | 'Menunggu tanda tangan';
  type: 'doc' | 'calc' | 'photo';
  subtext?: string;
  canUpload?: boolean;
}

export interface WeatherDay {
  day: number;
  icon: string;
  temp: number;
  humid: number;
}
