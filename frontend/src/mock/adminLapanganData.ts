import type {
  ProgresFotoItem,
  RequestMaterialItem,
  BerkasChecklistItem,
  WeatherDay,
} from '../types/adminLapangan';

export const initialProgresFotoList: ProgresFotoItem[] = [
  {
    id: '1',
    capaian: '68,5%',
    judul: 'Pengecoran Pier Cap Pilar P6',
    tanggal: '18 Feb 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '2',
    capaian: '72,0%',
    judul: 'Pemasangan Bekisting Abutment A1',
    tanggal: '16 Feb 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop',
  },
];

export const initialRequestMaterialList: RequestMaterialItem[] = [
  {
    id: '0010013630',
    tanggal: '03 Juni 2030',
    pengaju: 'Budi Santoso',
    rolePengaju: 'Pelaksana Lapangan',
    sifat: 'Darurat',
    totalEstimasi: 128500000,
    status: 'Pending',
  },
  {
    id: '0010024630',
    tanggal: '04 Juni 2030',
    pengaju: 'Ahmad Fauzi',
    rolePengaju: 'Site Manager Sipil',
    sifat: 'Rutin Mingguan',
    totalEstimasi: 214250000,
    status: 'Pending',
  },
  {
    id: '0010035630',
    tanggal: '05 Juni 2030',
    pengaju: 'Dewi Lestari',
    rolePengaju: 'Logistik & Pengadaan',
    sifat: 'Rutin Mingguan',
    totalEstimasi: 39400000,
    status: 'Tervalidasi Keuangan',
  },
  {
    id: '0010046630',
    tanggal: '06 Juni 2030',
    pengaju: 'Budi Santoso',
    rolePengaju: 'Pelaksana Lapangan',
    sifat: 'Rutin Mingguan',
    totalEstimasi: 106000000,
    status: 'Disetujui',
  },
];

export const initialChecklistBerkas: BerkasChecklistItem[] = [
  {
    id: '1',
    kode: 'BK-2026-071',
    judul: 'Laporan mingguan kemajuan fisik',
    tanggal: '14 Feb 2026',
    status: 'Terverifikasi',
    type: 'doc',
  },
  {
    id: '2',
    kode: 'BK-2026-072',
    judul: 'Back-up data hitungan volume',
    tanggal: '15 Feb 2026',
    status: 'Terverifikasi',
    type: 'calc',
  },
  {
    id: '3',
    kode: 'BK-2026-073',
    judul: 'Foto progres pekerjaan lapangan',
    tanggal: '17 Feb 2026',
    status: 'Terverifikasi',
    type: 'photo',
  },
  {
    id: '4',
    kode: '',
    judul: 'Berita acara kemajuan pekerjaan',
    tanggal: '',
    subtext: 'Menunggu penandatanganan Pejabat Pembuat Komitmen (PPK)',
    status: 'Menunggu tanda tangan',
    type: 'doc',
    canUpload: true,
  },
];

export const weatherDays: WeatherDay[] = [
  { day: 1, icon: 'rain-storm', temp: 16, humid: 53 },
  { day: 2, icon: 'rain', temp: 18, humid: 53 },
  { day: 3, icon: 'rain', temp: 19, humid: 67 },
  { day: 4, icon: 'cloud-sun', temp: 30, humid: 87 },
  { day: 5, icon: 'rain', temp: 15, humid: 73 },
  { day: 6, icon: 'rain', temp: 30, humid: 57 },
  { day: 7, icon: 'cloud', temp: 19, humid: 79 },
  { day: 8, icon: 'cloud-sun', temp: 27, humid: 80 },
  { day: 9, icon: 'rain', temp: 23, humid: 61 },
  { day: 10, icon: 'rain', temp: 15, humid: 49 },
  { day: 11, icon: 'rain', temp: 25, humid: 74 },
  { day: 12, icon: 'rain', temp: 27, humid: 44 },
  { day: 13, icon: 'rain', temp: 18, humid: 81 },
  { day: 14, icon: 'rain', temp: 30, humid: 47 },
  { day: 15, icon: 'rain', temp: 17, humid: 41 },
  { day: 16, icon: 'cloud', temp: 21, humid: 51 },
  { day: 17, icon: 'cloud', temp: 29, humid: 62 },
  { day: 18, icon: 'cloud', temp: 26, humid: 78 },
  { day: 19, icon: 'rain', temp: 16, humid: 87 },
  { day: 20, icon: 'rain', temp: 16, humid: 61 },
  { day: 21, icon: 'cloud', temp: 21, humid: 46 },
  { day: 22, icon: 'cloud-sun', temp: 25, humid: 45 },
  { day: 23, icon: 'cloud-sun', temp: 17, humid: 73 },
  { day: 24, icon: 'cloud', temp: 29, humid: 43 },
  { day: 25, icon: 'cloud-sun', temp: 21, humid: 46 },
];
