/// <reference types="node" />
// Chạy: npm test  (node:test + tsx, không cần simulator)
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bucketOf, dayDiff, dayKey, fmtDue, moveToDay, relativeDay, startOfDay } from '../dates';
import { MAX_SCHEDULED, planReminders, signature } from '../reminders';
import type { Task } from '../types';

const NOW = new Date('2026-11-11T08:00:00+07:00'); // Thứ 4

function task(id: number, due: string | null, reminders: string[] = [], extra: Partial<Task> = {}): Task {
  return {
    id, title: `Việc ${id}`, course: null, category: 'deadline', due_at: due, location: null, action: null,
    priority: 'medium', source: 'zalo', message_id: `m${id}`, status: 'open', reminders, updated_from: [], ...extra,
  };
}

test('dayKey theo giờ VN, không phụ thuộc múi giờ máy', () => {
  assert.equal(dayKey('2026-11-11T23:30:00+07:00'), '2026-11-11');
  assert.equal(dayKey('2026-11-11T17:30:00Z'), '2026-11-12'); // 00:30 ngày 12 giờ VN
  assert.equal(startOfDay(NOW).toISOString(), '2026-11-10T17:00:00.000Z');
});

test('fmtDue / relativeDay / dayDiff', () => {
  assert.equal(fmtDue('2026-11-13T23:59:00+07:00'), '23:59 T6 13/11');
  assert.equal(fmtDue(null), 'Không có hạn');
  assert.equal(relativeDay('2026-11-11T23:59:00+07:00', NOW), 'hôm nay');
  assert.equal(relativeDay('2026-11-12T07:00:00+07:00', NOW), 'ngày mai');
  assert.equal(relativeDay('2026-11-15T07:00:00+07:00', NOW), 'còn 4 ngày');
  assert.equal(relativeDay('2026-11-09T07:00:00+07:00', NOW), 'quá hạn 2 ngày');
  assert.equal(dayDiff(NOW, '2026-11-18T00:10:00+07:00'), 7);
});

test('bucketOf', () => {
  assert.equal(bucketOf(null, NOW), 'Không có hạn');
  assert.equal(bucketOf('2026-11-11T07:00:00+07:00', NOW), 'Quá hạn');
  assert.equal(bucketOf('2026-11-11T20:00:00+07:00', NOW), 'Hôm nay');
  assert.equal(bucketOf('2026-11-12T20:00:00+07:00', NOW), 'Ngày mai');
  assert.equal(bucketOf('2026-11-17T20:00:00+07:00', NOW), 'Tuần này');
  assert.equal(bucketOf('2026-11-18T20:00:00+07:00', NOW), 'Sau đó');
});

test('moveToDay giữ nguyên giờ và múi giờ', () => {
  assert.equal(moveToDay('2026-11-13T23:59:00+07:00', '2026-11-20'), '2026-11-20T23:59:00+07:00');
});

test('planReminders: chỉ mốc tương lai, thêm mốc đúng hạn, sắp xếp, bỏ việc đã xong', () => {
  const tasks = [
    task(1, '2026-11-13T23:59:00+07:00', ['2026-11-10T23:59:00+07:00', '2026-11-12T23:59:00+07:00', '2026-11-13T21:59:00+07:00']),
    task(2, '2026-11-12T08:00:00+07:00', [], { status: 'done' }),
    task(3, null),
    task(4, '2026-11-11T10:00:00+07:00', ['2026-11-11T08:00:00+07:00']), // mốc nhắc = now → bỏ
  ];
  const plan = planReminders(tasks, NOW);
  assert.deepEqual(
    plan.map((r) => `${r.taskId}@${dayKey(r.date)}`),
    ['4@2026-11-11', '1@2026-11-12', '1@2026-11-13', '1@2026-11-13'],
  );
  assert.match(plan[0].title, /^⏰ Đến hạn/);
  assert.match(plan[1].body, /^còn 1 ngày · 23:59 T6 13\/11/);
  assert.match(plan[2].body, /^còn 2 giờ/);
});

test('planReminders giới hạn số thông báo (iOS tối đa 64) và chữ ký ổn định', () => {
  const many = [...Array(100)].map((_, i) => task(i + 1, new Date(NOW.getTime() + (i + 1) * 3600e3).toISOString()));
  const plan = planReminders(many, NOW);
  assert.equal(plan.length, MAX_SCHEDULED);
  assert.equal(plan[0].taskId, 1);
  assert.equal(signature(plan), signature(planReminders(many, NOW)));
});

test('normalizeUrl: thêm http:// cho địa chỉ LAN, giữ https, bỏ / cuối', async () => {
  const { normalizeUrl } = await import('../url');
  assert.equal(normalizeUrl(' 192.168.1.5:8000/ '), 'http://192.168.1.5:8000');
  assert.equal(normalizeUrl('https://abc.trycloudflare.com//'), 'https://abc.trycloudflare.com');
  assert.equal(normalizeUrl('HTTP://10.0.2.2:8000'), 'HTTP://10.0.2.2:8000');
  assert.equal(normalizeUrl('   '), '');
});

test('normalizeUrl: chỉ cho http với địa chỉ mạng nội bộ, còn lại luôn https', async () => {
  const { normalizeUrl, isPrivateHost } = await import('../url');
  assert.equal(normalizeUrl('http://192.168.1.5:8000'), 'http://192.168.1.5:8000');
  assert.equal(normalizeUrl('http://10.0.0.2'), 'http://10.0.0.2');
  assert.equal(normalizeUrl('http://localhost:8000'), 'http://localhost:8000');
  assert.equal(normalizeUrl('172.20.1.1:8000'), 'http://172.20.1.1:8000');
  assert.equal(normalizeUrl('http://example.com'), 'https://example.com');
  assert.equal(normalizeUrl('HTTP://mst.tail1234.ts.net/'), 'https://mst.tail1234.ts.net');
  assert.equal(normalizeUrl('mst.tail1234.ts.net'), 'https://mst.tail1234.ts.net');
  assert.equal(normalizeUrl('http://8.8.8.8:8000/api'), 'https://8.8.8.8:8000/api');
  assert.equal(normalizeUrl('http://172.32.0.1'), 'https://172.32.0.1');
  // host giả dạng địa chỉ nội bộ không được coi là nội bộ
  assert.equal(normalizeUrl('http://192.168.1.5.evil.com'), 'https://192.168.1.5.evil.com');
  assert.equal(normalizeUrl('http://localhost.evil.com'), 'https://localhost.evil.com');
  assert.equal(isPrivateHost('192.168.0.1'), true);
  assert.equal(isPrivateHost('192.169.0.1'), false);
});

test('normalizeUrl: phần user@ không được dùng để lách http (host thật nằm sau @)', async () => {
  const { normalizeUrl } = await import('../url');
  assert.equal(normalizeUrl('http://localhost:x@evil.com/api'), 'https://evil.com/api');
  assert.equal(normalizeUrl('http://10.0.0.1:1@203.0.113.9:8000'), 'https://203.0.113.9:8000');
  assert.equal(normalizeUrl('http://[::1]@evil.com'), 'https://evil.com');
  assert.equal(normalizeUrl('localhost:pw@evil.com'), 'https://evil.com');
  assert.equal(normalizeUrl('http://user@192.168.1.5:8000'), 'http://192.168.1.5:8000');
  // "\\" được trình duyệt/fetch coi như "/", nên host vẫn là localhost
  assert.equal(normalizeUrl('http://localhost\\@evil.com'), 'http://localhost\\@evil.com');
  for (const u of ['http://localhost:x@evil.com/api', 'localhost:pw@evil.com', 'http://[::1]@evil.com']) {
    const out = new URL(normalizeUrl(u));
    assert.equal(out.protocol, 'https:');
    assert.equal(out.username + out.password, '');
  }
});

test('gmailGrantErrorMessage: Google từ chối → câu báo thử nghiệm; lỗi khác giữ nguyên', async () => {
  const { gmailGrantErrorMessage, GMAIL_TESTING_MESSAGE } = await import('../errors');
  assert.equal(gmailGrantErrorMessage(new Error('access_denied: app is being tested')), GMAIL_TESTING_MESSAGE);
  assert.equal(gmailGrantErrorMessage({ code: 'x', message: 'Access blocked: app has not completed the Google verification process' }), GMAIL_TESTING_MESSAGE);
  // lỗi cấu hình của nhà phát triển phải giữ nguyên để còn sửa được
  assert.equal(gmailGrantErrorMessage({ code: '10', message: 'DEVELOPER_ERROR' }), 'DEVELOPER_ERROR');
  assert.equal(gmailGrantErrorMessage(new Error('Mất mạng')), 'Mất mạng');
  assert.equal(gmailGrantErrorMessage(null), 'Không cấp được quyền Gmail');
});
