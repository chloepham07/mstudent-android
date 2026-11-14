// Logic thuần cho màn "Bạn học ở đâu?" (003 US1): tìm trường theo tên / tên viết tắt (không dấu), ngành theo bậc.

export type DegreeLevel = 'dai_hoc' | 'thac_si' | 'tien_si';

export const LEVEL_LABEL: Record<DegreeLevel, string> = { dai_hoc: 'Đại học', thac_si: 'Thạc sĩ', tien_si: 'Tiến sĩ' };

export interface School {
  name: string;
  abbr: string;
  en: string;
  group: string;
  place: string;
}
export interface Major {
  code: string;
  name: string;
}
export interface Catalog {
  schools: School[];
  majors: Record<DegreeLevel, Major[]>;
  programs: Record<string, Partial<Record<DegreeLevel, Major[]>>>;
  sources: Record<string, { source?: string; fetched?: string; updated?: string }>;
}

/** Bỏ dấu, viết thường, gộp khoảng trắng: "Đại học Việt Nhật" → "dai hoc viet nhat". */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const compact = (s: string) => fold(s).replace(/[\s\-_.]/g, '');

/** Trường khớp: viết tắt khớp chính xác > viết tắt chứa > tên chứa (mọi từ). Tối đa `limit`. */
export function searchSchools(schools: School[], q: string, limit = 20): School[] {
  const query = fold(q);
  if (!query) return [];
  const cq = compact(q);
  const words = query.split(' ');
  const scored: [number, School][] = [];
  for (const s of schools) {
    const ab = compact(s.abbr);
    const parts = s.abbr.split(/[-\s]/).map(compact);
    const name = fold(`${s.name} ${s.en}`);
    let score = 0;
    if (ab && (ab === cq || parts.includes(cq))) score = 3;
    else if (ab && ab.includes(cq)) score = 2;
    else if (words.every((w) => name.includes(w))) score = 1;
    if (score) scored.push([score, s]);
  }
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].name.length - b[1].name.length)
    .slice(0, limit)
    .map(([, s]) => s);
}

/** Ngành theo bậc: chương trình riêng của trường (nếu có) đứng trước, sau đó danh mục quốc gia; lọc theo tên/mã. */
export function majorsFor(
  cat: Catalog,
  schoolAbbr: string,
  level: DegreeLevel,
  q: string,
  limit = 40,
): { own: Major[]; national: Major[] } {
  const query = fold(q);
  const match = (m: Major) => !query || fold(m.name).includes(query) || m.code.toLowerCase().startsWith(query);
  const own = (cat.programs[schoolAbbr]?.[level] ?? []).filter(match);
  const ownNames = new Set(own.map((m) => fold(m.name)));
  const national = (cat.majors[level] ?? []).filter((m) => match(m) && !ownNames.has(fold(m.name))).slice(0, limit);
  return { own, national };
}
