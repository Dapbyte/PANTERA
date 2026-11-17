import type { ProyekTermin, BerkasTerminItem, BankContact, TenderContact } from '../types/sekretaris';

export const initialProyekTerminList: ProyekTermin[] = [
  {
    id: 'P001',
    tender: 'PT Sinar Jaya',
    namaProyek: 'Air Mancur',
    posisiTermin: 'Termin 2',
    terminSelanjutnya: '14 Maret 2034',
    status: 'Aman',
  },
  {
    id: 'P002',
    tender: 'PT Mitra Abadi',
    namaProyek: 'Kantin UPN',
    posisiTermin: 'Termin 2',
    terminSelanjutnya: '7 Januari 2031',
    status: 'Aman',
  },
  {
    id: 'P003',
    tender: 'PT Bumi Indah',
    namaProyek: 'Warkop Kopdes',
    posisiTermin: 'Termin 2',
    terminSelanjutnya: '23 Agustus 2038',
    status: 'Aman',
  },
  {
    id: 'P004',
    tender: 'PT Citra Prima',
    namaProyek: 'Kedai Kopi Kita',
    posisiTermin: 'Termin 3',
    terminSelanjutnya: '9 Juni 2035',
    status: 'Aman',
  },
  {
    id: 'P005',
    tender: 'PT Surya Karya',
    namaProyek: 'Taman Santai',
    posisiTermin: 'Termin 5',
    terminSelanjutnya: '18 April 2032',
    status: 'Aman',
  },
  {
    id: 'P006',
    tender: 'PT Duta Makmur',
    namaProyek: 'Warung Sederhana',
    posisiTermin: 'Termin 2',
    terminSelanjutnya: '3 November 2039',
    status: 'Aman',
  },
  {
    id: 'P007',
    tender: 'PT Tunas Jaya',
    namaProyek: 'Cafe Sehat',
    posisiTermin: 'Termin 1',
    terminSelanjutnya: '26 Februari 2033',
    status: 'Tidak Aman',
  },
  {
    id: 'P008',
    tender: 'PT Nusa Karya',
    namaProyek: 'Pondok Kopi',
    posisiTermin: 'Termin 1',
    terminSelanjutnya: '12 Juli 2037',
    status: 'Tidak Aman',
  },
  {
    id: 'P009',
    tender: 'PT Mega Sentosa',
    namaProyek: 'Kedai Makan Enak',
    posisiTermin: 'Termin 1',
    terminSelanjutnya: '5 Oktober 2036',
    status: 'Tidak Aman',
  },
];

export const initialBerkasTerminList: BerkasTerminItem[] = [
  {
    id: '1',
    kode: '004140226001',
    judulDokumen: 'Berkas Pelaporan',
    tenggat: '14 Feb 2028',
    tipe: 'Pelaporan',
    statusPengajuan: 'Belum Diajukan',
    statusWaktu: 'Terlambat',
  },
  {
    id: '2',
    kode: '003080226001',
    judulDokumen: 'Berkas Pelaporan',
    tenggat: '16 Feb 2028',
    tipe: 'Kwitansi',
    statusPengajuan: 'Belum Diajukan',
    statusWaktu: 'Terlambat',
  },
  {
    id: '3',
    kode: '001050126001',
    judulDokumen: 'Berkas Pelaporan',
    tenggat: '16 Feb 2028',
    tipe: 'Kontrak',
    statusPengajuan: 'Belum Diajukan',
    statusWaktu: '102 Hari lagi',
  },
];

export const kurvaSData = [
  { minggu: 'M-1', target: 20, realisasi: 18 },
  { minggu: 'M-2', target: 30, realisasi: 28 },
  { minggu: 'M-3', target: 45, realisasi: 42 },
  { minggu: 'M-4', target: 55, realisasi: 52 },
  { minggu: 'M-5', target: 62, realisasi: 60 },
  { minggu: 'M-6', target: 72, realisasi: 69 },
  { minggu: 'M-7', target: 80, realisasi: 78.5 },
];

export const bankContactList: BankContact[] = [
  { id: '1', name: 'Bank Negara Indonesia', shortName: 'BNI', type: 'bank', bgColor: '#F15A24' },
  { id: '2', name: 'Bank Central Asia', shortName: 'BCA', type: 'bank', bgColor: '#005EAA' },
  { id: '3', name: 'Bank Rakyat Indonesia', shortName: 'BRI', type: 'bank', bgColor: '#00529C' },
  { id: '4', name: 'balé by BTN', shortName: 'balé by btn', type: 'bank', bgColor: '#E61E2A' },
  { id: '5', name: 'NEXT Project Finance', shortName: 'NEXT Finance', type: 'bank', bgColor: '#2563EB' },
];

export const tenderContactList: TenderContact[] = [
  { id: '1', name: 'PT Sinar Jaya', type: 'tender' },
  { id: '2', name: 'PT Mitra Abadi', type: 'tender' },
  { id: '3', name: 'PT Bumi Indah', type: 'tender' },
  { id: '4', name: 'PT Citra Prima', type: 'tender' },
  { id: '5', name: 'PT Surya Karya', type: 'tender' },
  { id: '6', name: 'PT Duta Makmur', type: 'tender' },
  { id: '7', name: 'PT Tunas Jaya', type: 'tender' },
  { id: '8', name: 'PT Nusa Karya', type: 'tender' },
  { id: '9', name: 'PT Mega Sentosa', type: 'tender' },
  { id: '10', name: 'PT Sinar Jaya Cabang', type: 'tender' },
  { id: '11', name: 'PT Mitra Abadi Teknik', type: 'tender' },
  { id: '12', name: 'PT Bumi Indah Mandiri', type: 'tender' },
];
