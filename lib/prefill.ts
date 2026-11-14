// Link Google Form điền sẵn (003 US2, FR-014). Dựng HOÀN TOÀN trên máy từ hồ sơ của người dùng: máy chủ chỉ cho biết
// câu nào hỏi gì (form_meta), không bao giờ nhận hay ghép dữ liệu cá nhân vào URL. Link chỉ MỞ form đã điền —
// người dùng tự xem lại và tự bấm Gửi; app không gửi form thay ai.

import type { FormMeta, FormRole } from './types';

export type PrefillValues = Partial<Record<FormRole, string>>;

const FORM_ID = /^[A-Za-z0-9_-]{20,100}$/;
const ENTRY = /^\d{1,20}$/;

/** Trả về link viewform đã điền các câu có dữ liệu, hoặc null nếu không điền được câu nào / form_meta không hợp lệ. */
export function prefillUrl(meta: FormMeta | null | undefined, values: PrefillValues): string | null {
  if (!meta || typeof meta.form_id !== 'string' || !FORM_ID.test(meta.form_id) || !Array.isArray(meta.fields)) return null;
  const parts: string[] = [];
  for (const f of meta.fields) {
    if (!f || typeof f.entry !== 'string' || !ENTRY.test(f.entry)) continue;
    const v = (values[f.role] ?? '').trim();
    if (v) parts.push(`entry.${f.entry}=${encodeURIComponent(v.slice(0, 200))}`);
  }
  if (!parts.length) return null;
  return `https://docs.google.com/forms/d/e/${meta.form_id}/viewform?usp=pp_url&${parts.join('&')}`;
}

/** Số câu sẽ được điền sẵn (để ghi trên nút). */
export function prefillCount(meta: FormMeta | null | undefined, values: PrefillValues): number {
  const url = prefillUrl(meta, values);
  return url ? url.split('&entry.').length - 1 : 0;
}
