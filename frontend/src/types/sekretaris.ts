export type StatusTermin = 'Aman' | 'Tidak Aman';

export interface ProyekTermin {
  id: string;
  tender: string;
  namaProyek: string;
  posisiTermin: string;
  terminSelanjutnya: string;
  status: StatusTermin;
}

export interface BerkasTerminItem {
  id: string;
  kode: string;
  judulDokumen: string;
  tenggat: string;
  tipe: string;
  statusPengajuan: 'Belum Diajukan' | 'Sudah Diajukan';
  statusWaktu: 'Terlambat' | string;
}

export interface BankContact {
  id: string;
  name: string;
  logoUrl?: string;
  type: 'bank';
  shortName: string;
  bgColor?: string;
}

export interface TenderContact {
  id: string;
  name: string;
  type: 'tender';
}
