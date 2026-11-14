// Thông báo đẩy (002 US4): đăng ký Expo push token với máy chủ để nhận "MStudent: việc mới" khi app đóng.
// Cần EAS projectId + quyền thông báo đẩy (Android có FCM qua EAS; iPhone cần tài khoản Apple Developer).
// Thiếu điều kiện nào (vd. iPhone ký bằng Apple ID miễn phí) → bỏ qua êm, app vẫn có làm mới nền.

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

let registered: string | null = null;

function projectId(): string | undefined {
  return (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Đăng ký (hoặc cập nhật cờ nhận thông báo) cho thiết bị này. Trả token đã đăng ký hoặc null. */
export async function registerPush(notify: boolean): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const pid = projectId();
  if (!pid) return null;
  try {
    if (!(await Notifications.getPermissionsAsync()).granted) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: pid });
    await api.pushRegister(data, Platform.OS === 'ios' ? 'ios' : 'android', notify);
    registered = data;
    return data;
  } catch {
    return null; // không có APNs/FCM (bản ký miễn phí, giả lập…) → không sao
  }
}

/** Gọi trước khi đăng xuất: máy chủ ngừng gửi thông báo của tài khoản này tới thiết bị. */
export async function unregisterPush(): Promise<void> {
  if (!registered) return;
  try {
    await api.pushUnregister(registered, Platform.OS === 'ios' ? 'ios' : 'android');
  } catch {
    // không sao: token sẽ bị xoá khi Expo báo thiết bị không còn đăng ký
  }
  registered = null;
}
