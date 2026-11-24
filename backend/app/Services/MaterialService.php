<?php

namespace App\Services;

use App\Models\ItemMaterial;
use App\Models\Rab;
use App\Models\RequestMaterial;
use App\Models\RiwayatRevisiMaterial;
use App\Models\TransaksiPembelian;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MaterialService
{
    /**
     * Generate nomor pengajuan unik harian (REQ-YYYYMMDD-001).
     */
    public function generateNoRequest(): string
    {
        $prefix = 'REQ-'.now()->format('Ymd');

        $last = RequestMaterial::where('no_request', 'like', "{$prefix}-%")
            ->orderByDesc('id_request')
            ->first();

        if (! $last) {
            return "{$prefix}-001";
        }

        $parts = explode('-', (string) $last->no_request);
        $next = ((int) end($parts)) + 1;

        return sprintf('%s-%03d', $prefix, $next);
    }

    /**
     * Generate nomor Purchase Order unik harian (PO-YYYYMMDD-001).
     */
    public function generateNoPo(): string
    {
        $prefix = 'PO-'.now()->format('Ymd');

        $last = TransaksiPembelian::where('no_po', 'like', "{$prefix}-%")
            ->orderByDesc('id_transaksi')
            ->first();

        if (! $last) {
            return "{$prefix}-001";
        }

        $parts = explode('-', (string) $last->no_po);
        $next = ((int) end($parts)) + 1;

        return sprintf('%s-%03d', $prefix, $next);
    }

    /**
     * Daftar pengajuan material dengan filter proyek, status, sifat, dan akses Admin Lapangan.
     *
     * @param  array<string, mixed>  $filters
     * @param  list<int>|null  $allowedProjectIds
     * @return Collection<int, RequestMaterial>
     */
    public function list(array $filters = [], ?array $allowedProjectIds = null): Collection
    {
        if ($allowedProjectIds !== null && empty($allowedProjectIds)) {
            return new Collection;
        }

        $query = RequestMaterial::with([
            'proyek.rab',
            'pengaju:id_pengguna,nama,email,peran',
            'validator:id_pengguna,nama,email,peran',
            'direktur:id_pengguna,nama,email,peran',
            'itemMaterial',
            'transaksiPembelian',
            'arsipDokumen',
            'riwayatRevisi.pengguna:id_pengguna,nama,peran',
        ]);

        if ($allowedProjectIds !== null) {
            $query->whereIn('id_proyek', $allowedProjectIds);
        }

        if (! empty($filters['id_proyek'])) {
            $query->where('id_proyek', (int) $filters['id_proyek']);
        }

        if (! empty($filters['status_approval'])) {
            $query->where('status_approval', $filters['status_approval']);
        }

        if (! empty($filters['sifat_pengajuan'])) {
            $query->where('sifat_pengajuan', $filters['sifat_pengajuan']);
        }

        if (! empty($filters['q'])) {
            $q = (string) $filters['q'];
            $query->where(function ($sub) use ($q) {
                $sub->where('no_request', 'like', "%{$q}%")
                    ->orWhereHas('proyek', function ($p) use ($q) {
                        $p->where('nama_proyek', 'like', "%{$q}%")
                            ->orWhere('kode_proyek', 'like', "%{$q}%");
                    });
            });
        }

        $results = $query->latest('id_request')->get();

        $results->each(function (RequestMaterial $item) use ($allowedProjectIds) {
            $item->setAttribute(
                'sisa_pagu_rab',
                $allowedProjectIds === null ? $item->proyek?->rab?->getSisaPagu() : null
            );
        });

        return $results;
    }

    /**
     * Detail lengkap pengajuan material beserta item, riwayat revisi, sisa pagu RAB, dan PO.
     */
    public function findDetail(int $idRequest): ?RequestMaterial
    {
        $material = RequestMaterial::with([
            'proyek.rab',
            'pengaju:id_pengguna,nama,email,peran,lokasi_tugas',
            'validator:id_pengguna,nama,email,peran',
            'direktur:id_pengguna,nama,email,peran',
            'itemMaterial',
            'transaksiPembelian',
            'arsipDokumen.lokasiArsipFisik',
            'riwayatRevisi.pengguna:id_pengguna,nama,peran',
        ])->find($idRequest);

        if (! $material) {
            return null;
        }

        $material->setAttribute('sisa_pagu_rab', $material->proyek?->rab?->getSisaPagu());

        return $material;
    }

    /**
     * Membuat pengajuan material baru oleh Admin Lapangan (hanya kebutuhan & volume, TANPA harga).
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $pengaju): RequestMaterial
    {
        return DB::transaction(function () use ($data, $pengaju) {
            $request = RequestMaterial::create([
                'no_request' => $this->generateNoRequest(),
                'id_proyek' => $data['id_proyek'],
                'id_pengaju' => $pengaju->id_pengguna,
                'id_arsip_ref' => $data['id_arsip_ref'] ?? null,
                'tanggal_pengajuan' => now()->toDateString(),
                'tanggal_butuh' => $data['tanggal_butuh'] ?? now()->toDateString(),
                'sifat_pengajuan' => $data['sifat_pengajuan'],
                'catatan_lapangan' => $data['catatan_lapangan'] ?? null,
                'status_approval' => RequestMaterial::STATUS_DIAJUKAN,
                'total_estimasi' => null,
                'melebihi_rab' => false,
            ]);

            foreach ($data['items'] as $item) {
                $request->itemMaterial()->create([
                    'nama_material' => $item['nama_material'],
                    'volume' => $item['volume'],
                    'satuan' => $item['satuan'],
                    'estimasi_harga' => null,
                    'ketersediaan_vendor' => false,
                    'vendor_nama' => null,
                    'vendor_pengganti' => null,
                ]);
            }

            $this->catatRiwayat($request, $pengaju, 'Diajukan', $data['catatan_lapangan'] ?? null);

            return $this->findDetail((int) $request->id_request) ?? $request->load('itemMaterial');
        });
    }

    /**
     * Memperbaiki & mengajukan ulang request material berstatus 'Perlu Revisi' (TANPA harga).
     *
     * @param  array<string, mixed>  $data
     */
    public function revise(RequestMaterial $request, User $pengaju, array $data): RequestMaterial
    {
        if ($request->status_approval !== RequestMaterial::STATUS_PERLU_REVISI) {
            throw ValidationException::withMessages([
                'status_approval' => 'Hanya pengajuan berstatus Perlu Revisi yang dapat diperbaiki dan diajukan ulang.',
            ]);
        }

        return DB::transaction(function () use ($request, $pengaju, $data) {
            $request->itemMaterial()->delete();

            foreach ($data['items'] as $item) {
                $request->itemMaterial()->create([
                    'nama_material' => $item['nama_material'],
                    'volume' => $item['volume'],
                    'satuan' => $item['satuan'],
                    'estimasi_harga' => null,
                    'ketersediaan_vendor' => false,
                    'vendor_nama' => null,
                    'vendor_pengganti' => null,
                ]);
            }

            $request->update([
                'sifat_pengajuan' => $data['sifat_pengajuan'],
                'tanggal_butuh' => $data['tanggal_butuh'] ?? $request->tanggal_butuh,
                'catatan_lapangan' => $data['catatan_lapangan'] ?? $request->catatan_lapangan,
                'id_arsip_ref' => $data['id_arsip_ref'] ?? $request->id_arsip_ref,
                'tanggal_pengajuan' => now()->toDateString(),
                'total_estimasi' => null,
                'status_approval' => RequestMaterial::STATUS_DIAJUKAN,
                'id_validator' => null,
                'id_direktur' => null,
                'catatan_keuangan' => null,
                'catatan_direktur' => null,
                'alasan_penolakan' => null,
                'melebihi_rab' => false,
                'skema_pembayaran' => null,
            ]);

            $this->catatRiwayat($request, $pengaju, 'Diajukan Ulang', $data['catatan_lapangan'] ?? null);

            return $this->findDetail((int) $request->id_request) ?? $request->refresh();
        });
    }

    /**
     * Review Keuangan: tolak/minta revisi (wajib alasan) atau isi vendor + harga satuan per item
     * dan teruskan ke Direktur ('Menunggu Direktur'), dengan tanda melebihi RAB jika over-pagu.
     *
     * @param  array<string, mixed>  $data
     */
    public function validateFinance(RequestMaterial $request, User $validator, array $data): RequestMaterial
    {
        if ($request->status_approval !== RequestMaterial::STATUS_DIAJUKAN) {
            throw ValidationException::withMessages([
                'status_approval' => 'Pengajuan tidak berada pada tahap review Keuangan (status Diajukan).',
            ]);
        }

        return DB::transaction(function () use ($request, $validator, $data) {
            $keputusan = (string) $data['keputusan'];

            if ($keputusan === 'Revisi') {
                $alasan = trim((string) ($data['alasan_penolakan'] ?? ''));

                $request->update([
                    'id_validator' => $validator->id_pengguna,
                    'status_approval' => RequestMaterial::STATUS_PERLU_REVISI,
                    'alasan_penolakan' => $alasan,
                    'catatan_keuangan' => $alasan,
                    'skema_pembayaran' => null,
                    'total_estimasi' => null,
                    'melebihi_rab' => false,
                ]);

                $this->catatRiwayat($request, $validator, 'Ditolak Keuangan', $alasan);

                return $this->findDetail((int) $request->id_request) ?? $request->refresh();
            }

            // Keuangan menyetujui dan menginput vendor + harga satuan per item
            $submittedItems = collect($data['items'] ?? [])->keyBy(fn ($it) => (int) $it['id_item']);
            $existingItems = $request->itemMaterial()->get();

            if ($existingItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'Pengajuan tidak memiliki item material.',
                ]);
            }

            $total = 0.0;
            foreach ($existingItems as $dbItem) {
                $payloadItem = $submittedItems->get((int) $dbItem->id_item);
                if (! is_array($payloadItem)) {
                    throw ValidationException::withMessages([
                        'items' => "Item '{$dbItem->nama_material}' wajib dilengkapi harga dan data vendor oleh Keuangan.",
                    ]);
                }

                $vendorTersedia = (bool) $payloadItem['ketersediaan_vendor'];
                $vendorNama = $vendorTersedia
                    ? trim((string) ($payloadItem['vendor_nama'] ?? ''))
                    : (isset($payloadItem['vendor_nama']) && trim((string) $payloadItem['vendor_nama']) !== ''
                        ? trim((string) $payloadItem['vendor_nama'])
                        : null);
                $vendorPengganti = ! $vendorTersedia
                    ? trim((string) ($payloadItem['vendor_pengganti'] ?? ''))
                    : null;
                $hargaSatuan = round((float) $payloadItem['harga_satuan'], 2);

                /** @var ItemMaterial $dbItem */
                $dbItem->update([
                    'ketersediaan_vendor' => $vendorTersedia,
                    'vendor_nama' => $vendorNama,
                    'vendor_pengganti' => $vendorPengganti,
                    'estimasi_harga' => $hargaSatuan,
                ]);

                $total += round((float) $dbItem->volume * $hargaSatuan, 2);
            }

            $total = round($total, 2);
            /** @var Rab|null $rab */
            $rab = Rab::where('id_proyek', $request->id_proyek)->first();
            $melebihiRab = $rab ? ! $rab->cekKetersediaanPagu($total) : false;
            $skema = (string) ($data['skema_pembayaran'] ?? 'Kas');
            $catatan = isset($data['catatan_keuangan']) && trim((string) $data['catatan_keuangan']) !== ''
                ? trim((string) $data['catatan_keuangan'])
                : null;

            $request->update([
                'id_validator' => $validator->id_pengguna,
                'status_approval' => RequestMaterial::STATUS_MENUNGGU_DIREKTUR,
                'total_estimasi' => $total,
                'skema_pembayaran' => $skema,
                'catatan_keuangan' => $catatan,
                'alasan_penolakan' => null,
                'melebihi_rab' => $melebihiRab,
            ]);

            $this->catatRiwayat(
                $request,
                $validator,
                $melebihiRab ? 'Diteruskan Keuangan (Melebihi Pagu RAB)' : 'Diteruskan Keuangan ke Direktur',
                $catatan
            );

            return $this->findDetail((int) $request->id_request) ?? $request->refresh();
        });
    }

    /**
     * Persetujuan akhir Direktur: setujui (status 'Selesai', terbit PO & potong sisa pagu RAB)
     * atau tolak/revisi kembali ke Admin Lapangan (status 'Perlu Revisi').
     *
     * @param  array<string, mixed>  $data
     */
    public function approve(RequestMaterial $request, User $direktur, array $data): RequestMaterial
    {
        if ($request->status_approval !== RequestMaterial::STATUS_MENUNGGU_DIREKTUR) {
            throw ValidationException::withMessages([
                'status_approval' => 'Pengajuan belum melewati review harga oleh Keuangan (status Menunggu Direktur).',
            ]);
        }

        $keputusan = (string) $data['keputusan'];

        if ($keputusan === 'Revisi') {
            $alasan = trim((string) ($data['alasan_penolakan'] ?? ''));

            return DB::transaction(function () use ($request, $direktur, $alasan) {
                $request->update([
                    'id_direktur' => $direktur->id_pengguna,
                    'status_approval' => RequestMaterial::STATUS_PERLU_REVISI,
                    'alasan_penolakan' => $alasan,
                    'catatan_direktur' => $alasan,
                ]);

                $this->catatRiwayat($request, $direktur, 'Ditolak Direktur', $alasan);

                return $this->findDetail((int) $request->id_request) ?? $request->refresh();
            });
        }

        return DB::transaction(function () use ($request, $direktur, $data) {
            $total = round((float) ($request->total_estimasi ?? 0), 2);

            /** @var Rab|null $rab */
            $rab = Rab::where('id_proyek', $request->id_proyek)
                ->lockForUpdate()
                ->first();

            $melebihiSaatApprove = false;
            if ($rab) {
                $melebihiSaatApprove = ! $rab->cekKetersediaanPagu($total);
                $rab->updateRealisasi($total);
            }

            $arsipRef = $data['id_arsip_ref'] ?? $request->id_arsip_ref;
            $catatan = isset($data['catatan_direktur']) && trim((string) $data['catatan_direktur']) !== ''
                ? trim((string) $data['catatan_direktur'])
                : null;

            $request->update([
                'id_direktur' => $direktur->id_pengguna,
                'status_approval' => RequestMaterial::STATUS_SELESAI,
                'catatan_direktur' => $catatan,
                'alasan_penolakan' => null,
                'melebihi_rab' => (bool) ($request->melebihi_rab || $melebihiSaatApprove),
                'id_arsip_ref' => $arsipRef,
            ]);

            TransaksiPembelian::create([
                'no_po' => $this->generateNoPo(),
                'id_request' => $request->id_request,
                'id_proyek' => $request->id_proyek,
                'id_direktur' => $direktur->id_pengguna,
                'id_arsip_ref' => $arsipRef,
                'tanggal_po' => now()->toDateString(),
                'total_nominal' => $total,
                'status_po' => TransaksiPembelian::STATUS_DITERBITKAN,
                'catatan' => $catatan,
            ]);

            $this->catatRiwayat($request, $direktur, 'Disetujui Direktur (PO Terbit)', $catatan);

            return $this->findDetail((int) $request->id_request) ?? $request->refresh();
        });
    }

    /**
     * Menghapus seluruh field harga saat data dikirim ke Admin Lapangan.
     *
     * @return array<string, mixed>
     */
    public function serializeForUser(RequestMaterial $material, User $user): array
    {
        $data = $material->toArray();

        if (! $user->isAdminLapangan()) {
            return $data;
        }

        $data['total_estimasi'] = null;
        $data['sisa_pagu_rab'] = null;
        $data['skema_pembayaran'] = null;
        $data['melebihi_rab'] = false;

        if (isset($data['proyek']) && is_array($data['proyek'])) {
            unset($data['proyek']['rab'], $data['proyek']['nilai_kontrak']);
        }

        if (isset($data['item_material']) && is_array($data['item_material'])) {
            $data['item_material'] = array_map(function ($item) {
                if (is_array($item)) {
                    $item['estimasi_harga'] = null;
                }

                return $item;
            }, $data['item_material']);
        }

        if (isset($data['transaksi_pembelian']) && is_array($data['transaksi_pembelian'])) {
            unset($data['transaksi_pembelian']['total_nominal']);
        }

        return $data;
    }

    protected function catatRiwayat(
        RequestMaterial $request,
        User $actor,
        string $aksi,
        ?string $alasan = null
    ): void {
        RiwayatRevisiMaterial::create([
            'id_request' => $request->id_request,
            'id_pengguna' => $actor->id_pengguna,
            'peran' => $actor->peran,
            'aksi' => $aksi,
            'alasan' => $alasan,
            'created_at' => now(),
        ]);
    }
}
