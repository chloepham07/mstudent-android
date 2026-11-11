/** "192.168.1.5:8000" → "http://192.168.1.5:8000"; giữ nguyên nếu đã có http(s); bỏ dấu / cuối. */
export function normalizeUrl(input: string): string {
  const v = input.trim().replace(/\/+$/, '');
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `http://${v}`;
}
