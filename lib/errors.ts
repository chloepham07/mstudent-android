/** Câu báo lỗi dễ hiểu khi Google từ chối cấp quyền Gmail (app đang ở chế độ thử nghiệm, chỉ mở cho test user). */
export const GMAIL_TESTING_MESSAGE =
  'Gmail đang trong giai đoạn thử nghiệm, chỉ mở cho người dùng được mời. Bạn vẫn dùng được các tính năng khác.';

export function gmailGrantErrorMessage(e: unknown): string {
  const err = e as { code?: unknown; message?: unknown } | null;
  const text = `${String(err?.code ?? '')} ${String(err?.message ?? '')}`.toLowerCase();
  if (/access_denied|access blocked|not completed the google verification|org_internal/.test(text)) {
    return GMAIL_TESTING_MESSAGE;
  }
  return String(err?.message ?? '') || 'Không cấp được quyền Gmail';
}
