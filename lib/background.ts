// Làm mới nền (002 US4, FR-041): iPhone ký bằng Apple ID miễn phí không nhận được thông báo đẩy, nên app nhờ
// iOS/Android chạy nền định kỳ (hệ điều hành quyết định lúc nào, ≥ 15 phút): tải việc, đặt lại nhắc việc,
// và hiện MỘT thông báo gộp nếu có việc mới / đổi hạn (giống thông báo đẩy của máy chủ).

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { api, authApi, setBaseUrl } from './api';
import { fmtDue } from './dates';
import { inviteNotice, newInvites } from './events';
import { INVITE_CATEGORY, syncReminders } from './notifications';
import { diffTasks, snapshotOf, summaryOf, type TaskSnapshot } from './sync';
import type { Task } from './types';

export const BG_TASK = 'mstudent-background-refresh';
export const SETTINGS_KEY = 'mstudent.settings.v2';
const SNAPSHOT_KEY = 'mstudent.bg.snapshot.v1';
const INVITES_KEY = 'mstudent.bg.invites.v1';
const MAX_INVITE_NOTICES = 3;

/** Ghi ảnh chụp danh sách việc đang thấy (gọi mỗi khi app tải việc) để lần chạy nền chỉ báo cái MỚI. */
export async function saveSnapshot(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshotOf(tasks))).catch(() => {});
}

/** Ghi các lời mời đã thấy trong app để lần chạy nền chỉ báo lời mời MỚI. */
export async function saveSeenInvites(ids: number[]): Promise<void> {
  await AsyncStorage.setItem(INVITES_KEY, JSON.stringify(ids.slice(0, 200))).catch(() => {});
}

async function runOnce(): Promise<void> {
  const settings = JSON.parse((await AsyncStorage.getItem(SETTINGS_KEY)) ?? '{}') as { baseUrl?: string; remindersOn?: boolean };
  if (!settings.baseUrl || settings.remindersOn === false) return;
  setBaseUrl(settings.baseUrl);
  const session = await authApi.restore();
  if (session.state !== 'ok') return;
  const tasks = await api.tasks();
  const prev = JSON.parse((await AsyncStorage.getItem(SNAPSHOT_KEY)) ?? 'null') as TaskSnapshot | null;
  const { added, moved } = diffTasks(prev, tasks);
  await saveSnapshot(tasks);
  await syncReminders(tasks, new Date());
  const summary = summaryOf(added, moved, (due) => (due ? `hạn ${fmtDue(due)}` : 'không có hạn'));
  if (summary) {
    await Notifications.scheduleNotificationAsync({ content: { ...summary, data: { type: 'tasks' } }, trigger: null });
  }
  // 003: lời mời sự kiện mới → thông báo có nút Tham gia / Không.
  const invites = await api.events('pending').catch(() => null);
  if (!invites) return;
  const seen = JSON.parse((await AsyncStorage.getItem(INVITES_KEY)) ?? 'null') as number[] | null;
  await saveSeenInvites(invites.map((t) => t.id));
  for (const t of newInvites(seen, invites).slice(0, MAX_INVITE_NOTICES)) {
    await Notifications.scheduleNotificationAsync({
      content: { ...inviteNotice(t, t.due_at ? fmtDue(t.due_at) : ''), categoryIdentifier: INVITE_CATEGORY, data: { type: 'invite', task_id: t.id } },
      trigger: null,
    });
  }
}

// defineTask phải chạy ở phạm vi module (được import từ app/_layout) để hệ điều hành gọi được khi app đang đóng.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(BG_TASK, async () => {
    try {
      await runOnce();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerBackgroundRefresh(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (!(await TaskManager.isTaskRegisteredAsync(BG_TASK))) {
      await BackgroundTask.registerTaskAsync(BG_TASK, { minimumInterval: 15 });
    }
  } catch {
    // máy không cho chạy nền (Low Power Mode, tắt Làm mới ứng dụng nền…) → vẫn có nhắc việc khi mở app
  }
}
