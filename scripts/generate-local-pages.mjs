import { mkdir, writeFile } from 'node:fs/promises';

const API_BASE_URL = 'https://wilayah.id/api';
const OUTPUT_FILE = 'src/data/localPages.ts';

const cityDistrictAreas = [
  'pusat kota',
  'area bisnis',
  'kawasan pendidikan',
  'sentra UMKM',
  'kawasan perkantoran',
  'area produksi',
  'pasar dan retail',
  'wilayah sekitar',
];

const businessTypes = [
  'digital printing',
  'percetakan offset',
  'print shop',
  'vendor merchandise',
  'percetakan undangan',
  'printing banner dan spanduk',
];

const normalizeName = (name) =>
  name
    .replace(/^Kabupaten\s+/i, '')
    .replace(/^Kota Administrasi\s+/i, '')
    .replace(/^Kabupaten Administrasi\s+/i, '')
    .replace(/^Kota\s+/i, '')
    .trim();

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatTargetLocation = (name) => normalizeName(name);

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
};

const provincesPayload = await fetchJson(`${API_BASE_URL}/provinces.json`);
const pages = [];

for (const province of provincesPayload.data) {
  const regenciesPayload = await fetchJson(`${API_BASE_URL}/regencies/${province.code}.json`);

  for (const regency of regenciesPayload.data) {
    const location = formatTargetLocation(regency.name);
    const isCity = /^Kota\b/i.test(regency.name) || /^Kota Administrasi\b/i.test(regency.name);
    const type = isCity ? 'Kota' : 'Kabupaten';
    const slugLocation = slugify(`${type} ${location}`);

    pages.push({
      code: regency.code,
      city: location,
      officialName: regency.name,
      type,
      province: province.name,
      slug: `aplikasi-percetakan-di-${slugLocation}`,
      title: `Aplikasi Percetakan di ${type} ${location} | POS Percetakan`,
      description: `POS Percetakan membantu bisnis percetakan di ${type} ${location} mengelola order, produksi, stok bahan, pembayaran, invoice, dan laporan penjualan dalam satu sistem.`,
      keywords: [
        `aplikasi percetakan di ${location}`,
        `aplikasi percetakan ${type} ${location}`,
        `software percetakan ${location}`,
        `POS percetakan ${location}`,
        `aplikasi kasir percetakan ${location}`,
        `sistem percetakan ${location}`,
      ].join(', '),
      areas: cityDistrictAreas.map((area) => `${area} ${location}`),
      businessTypes,
    });
  }
}

pages.sort((a, b) => a.slug.localeCompare(b.slug, 'id'));

const contents = `export const localPages = ${JSON.stringify(pages, null, 2)} as const;

export type LocalPage = (typeof localPages)[number];
`;

await mkdir('src/data', { recursive: true });
await writeFile(OUTPUT_FILE, contents);

console.log(`Generated ${pages.length} local SEO pages into ${OUTPUT_FILE}`);
