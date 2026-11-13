// Deep link "mstudent://share?text=…&source=zalo": dùng cho Phím tắt iOS (bản ký bằng Apple ID miễn phí không có
// share extension). Chỉ ĐIỀN SẴN nội dung vào màn hình Thêm thông báo; người dùng vẫn phải bấm gửi, nên một app/trang web
// lạ gọi link này cũng không tự tạo được việc.

import type { Source } from './types';

export const MAX_SHARED_CHARS = 8000; // khớp giới hạn `body` ở backend
const SOURCES: readonly Source[] = ['zalo', 'email', 'lms', 'manual'];

type Param = string | string[] | undefined;

const first = (v: Param) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Đọc tham số của deep link; nội dung rỗng → null. Nguồn lạ → 'zalo' (trường hợp phổ biến nhất của phím tắt). */
export function parseShareLink(params: { text?: Param; source?: Param }): { text: string; source: Source } | null {
  const text = first(params.text).replace(/\r\n?/g, '\n').trim().slice(0, MAX_SHARED_CHARS);
  if (!text) return null;
  const s = first(params.source).toLowerCase() as Source;
  return { text, source: SOURCES.includes(s) ? s : 'zalo' };
}
