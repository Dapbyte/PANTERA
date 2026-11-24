import type { PerformanceReport } from '../types/api';

type SheetCell = string | number | null | undefined;
type SheetRows = SheetCell[][];

interface SheetDef {
  name: string;
  rows: SheetRows;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLetter(indexZeroBased: number): string {
  let n = indexZeroBased + 1;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function buildWorksheetXml(rows: SheetRows): string {
  const rowXml = rows
    .map((cells, rIdx) => {
      const rowNum = rIdx + 1;
      const cellXml = cells
        .map((cell, cIdx) => {
          const ref = `${colLetter(cIdx)}${rowNum}`;
          if (typeof cell === 'number' && Number.isFinite(cell)) {
            return `<c r="${ref}" s="${rIdx === 0 ? 1 : 0}"><v>${cell}</v></c>`;
          }
          const text = cell === null || cell === undefined ? '' : String(cell);
          return `<c r="${ref}" t="inlineStr" s="${rIdx === 0 ? 1 : 0}"><is><t xml:space="preserve">${escapeXml(
            text
          )}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowNum}">${cellXml}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function createZipBlob(entries: Array<{ name: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = encoder.encode(entry.content);
    const crc = crc32(dataBytes);

    // Local file header (30 bytes + name)
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // stored (no compression)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    // Central directory header (46 bytes + name)
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    localParts.push(local, dataBytes);
    centralParts.push(central);
    offset += local.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const c of centralParts) centralSize += c.length;

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const allParts: BlobPart[] = [
    ...localParts.map((u) => new Uint8Array(u)),
    ...centralParts.map((u) => new Uint8Array(u)),
    new Uint8Array(end),
  ];

  return new Blob(allParts, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function buildXlsxBlob(sheets: SheetDef[]): Blob {
  const safeSheets = sheets.map((s, i) => ({
    name: s.name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || `Sheet${i + 1}`,
    rows: s.rows,
  }));

  const entries: Array<{ name: string; content: string }> = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${safeSheets
    .map(
      (_, idx) =>
        `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('\n  ')}
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${safeSheets
      .map(
        (s, idx) =>
          `<sheet name="${escapeXml(s.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`
      )
      .join('\n    ')}
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${safeSheets
    .map(
      (_, idx) =>
        `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
    )
    .join('\n  ')}
  <Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEAF3FF"/></patternFill></fill>
  </fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`,
    },
    ...safeSheets.map((s, idx) => ({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      content: buildWorksheetXml(s.rows),
    })),
  ];

  return createZipBlob(entries);
}

/**
 * Mengekspor paket laporan performa proyek resmi untuk bank dalam format Excel (.xlsx) - KEU-05.
 */
export function buildPerformanceReportXlsx(report: PerformanceReport): Blob {
  const proyek = report.proyek_detail.proyek;
  const rekapProgres = report.proyek_detail.rekap_progres;
  const rekapTermin = report.proyek_detail.rekap_termin;
  const ew = report.early_warning;

  const summaryRows: SheetRows = [
    ['Atribut Laporan', 'Nilai'],
    ['Tanggal Dibuat', report.generated_at],
    ['Kode Proyek', proyek.kode_proyek],
    ['Nama Proyek', proyek.nama_proyek],
    ['Dinas Pemberi Kerja', proyek.dinas_pemberi_kerja],
    ['Status Proyek', proyek.status_proyek],
    ['Nilai Kontrak (Rp)', Number(proyek.nilai_kontrak) || 0],
    ['Total Pagu RAB (Rp)', Number(proyek.rab?.total_pagu ?? 0)],
    ['Sisa Pagu RAB (Rp)', Number(proyek.rab?.sisa_pagu ?? 0)],
    ['Periode Kontrak', `${proyek.tanggal_mulai} s/d ${proyek.tanggal_selesai}`],
    ['Progres Fisik Terakhir (%)', rekapProgres.persentase_realisasi_terakhir],
    ['Termin Cair', `${rekapTermin.termin_cair} / ${rekapTermin.total_termin}`],
    ['Total Tagihan Cair (Rp)', rekapTermin.total_tagihan_cair],
    ['Sisa Tagihan (Rp)', rekapTermin.sisa_tagihan],
    ['Status Early Warning', ew.status],
    ['Estimasi Hari Terlambat', ew.prediksi.estimasi_hari_terlambat],
    ['Estimasi Dampak Kas (Rp)', ew.prediksi.estimasi_kerugian],
    ['Rekomendasi Sistem', ew.rekomendasi?.teks ?? '-'],
  ];

  const terminRows: SheetRows = [
    ['No Termin', 'Target (%)', 'Nilai Tagihan (Rp)', 'Tenggat Waktu', 'Status Penagihan', 'Nomor SP2D', 'Tanggal Cair'],
    ...(proyek.termin ?? []).map((t) => [
      t.nomor_termin,
      Number(t.target_persentase),
      Number(t.nilai_tagihan),
      t.tenggat_waktu,
      t.status_penagihan,
      t.nomor_sp2d ?? '-',
      t.tanggal_cair ?? '-',
    ]),
  ];

  const kreditRows: SheetRows = [
    ['Nama Bank', 'No. Fasilitas', 'Plafon Kredit (Rp)', 'Tenor (Bulan)', 'Suku Bunga (%)', 'Jatuh Tempo Baru', 'Status Koordinasi', 'Catatan'],
    ...(report.fasilitas_kredit ?? []).map((k) => [
      k.nama_bank,
      k.nomor_fasilitas ?? '-',
      Number(k.plafon_kredit),
      Number(k.tenor_bulan),
      k.suku_bunga !== null ? Number(k.suku_bunga) : '-',
      k.tanggal_jatuh_tempo_baru ?? '-',
      k.status_koordinasi,
      k.catatan_kesepakatan ?? '-',
    ]),
  ];

  return buildXlsxBlob([
    { name: 'Ringkasan Proyek', rows: summaryRows },
    { name: 'Jadwal Termin', rows: terminRows },
    { name: 'Fasilitas Kredit', rows: kreditRows },
  ]);
}
