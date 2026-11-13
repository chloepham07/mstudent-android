// Tab Cài đặt: tài khoản, kiểm tra AI, Gmail, thống kê, nhắc việc, dữ liệu demo.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Muted, Title } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { api, authApi } from '@/lib/api';
import { fmtDue } from '@/lib/dates';
import { gmailGrantErrorMessage } from '@/lib/errors';
import { googleAvailable, googleGrantGmail } from '@/lib/google';
import { scheduledCount, sendTest, supported as notifSupported } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import type { AiCheck, GmailStatus, PublicConfig, Stats } from '@/lib/types';

export default function SettingsScreen() {
  const c = usePalette();
  const { user, settings, updateSettings, health, error, refresh, scheduled, signOut, reloadUser, tasks } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [ai, setAi] = useState<AiCheck | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [gmailMsg, setGmailMsg] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
    api.gmailStatus().then(setGmail).catch(() => {});
    api.publicConfig().then(setCfg).catch(() => {});
  }, []);

  useEffect(load, [load, tasks.length]);
  useEffect(() => {
    scheduledCount().then(setPending).catch(() => setPending(null));
  }, [scheduled]);

  /** Chạy một việc có trạng thái bận + báo lỗi thống nhất. */
  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const connectGmail = () =>
    run('gmail', async () => {
      if (!cfg) throw new Error('Chưa tải được cấu hình server');
      let g;
      try {
        g = await googleGrantGmail(cfg.google);
      } catch (e) {
        // Google từ chối người chưa nằm trong danh sách test user → báo rõ thay vì mã lỗi khó hiểu.
        throw new Error(gmailGrantErrorMessage(e));
      }
      if (!g) return;
      if (!g.serverAuthCode) throw new Error('Google không trả mã uỷ quyền — kiểm tra webClientId và quyền Gmail');
      setGmail(await api.gmailConnect(g.serverAuthCode));
      await reloadUser();
      setGmailMsg('Đã kết nối. Bấm “Quét Gmail” để AI đọc thư mới.');
    });

  const syncGmail = () =>
    run('sync', async () => {
      const r = await api.gmailSync(7);
      setGmailMsg(
        `Đã quét ${r.scanned} thư, ${r.new} thư mới → tạo ${r.tasks_created} việc, cập nhật ${r.tasks_updated}, lọc ${r.noise_filtered} thư không liên quan.`,
      );
      await refresh();
      load();
    });

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 12, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Title>Tài khoản</Title>
        <Text style={{ color: c.text, fontSize: 16 }}>{user?.name || user?.email}</Text>
        <Muted>
          {user?.email}
          {user?.is_admin ? ' · quản trị viên' : ''}
          {user?.google_linked ? ' · Google' : ''}
        </Muted>
        <View style={{ marginTop: 10 }}>
          <Button variant="ghost" label="Đăng xuất" busy={busy === 'out'} onPress={() => run('out', signOut)} />
        </View>
      </Card>

      <Card>
        <Title>AI</Title>
        {health ? (
          <Text style={{ color: health.mode === 'llm' ? c.ok : c.medium }}>
            {health.mode === 'llm' ? `🟢 AI chạy trực tiếp · ${health.model}` : '🟡 Server đang dùng bộ luật — chưa bật AI'}
          </Text>
        ) : (
          <Text style={{ color: c.bad }}>✗ {error ?? 'Chưa kết nối server'}</Text>
        )}
        <Muted style={{ marginTop: 4 }}>Server: {settings.baseUrl}</Muted>
        <View style={{ marginTop: 10 }}>
          <Button variant="ghost" label="Kiểm tra AI ngay (gọi thật 1 lượt)" busy={busy === 'ai'} onPress={() => run('ai', async () => setAi(await api.aiCheck()))} />
        </View>
        {ai && (
          <Text style={{ color: ai.ok ? c.ok : c.bad, marginTop: 8 }}>
            {ai.ok ? `✓ AI trả lời sau ${ai.latency_ms} ms (${ai.model})` : `✗ ${ai.error ?? 'AI trả kết quả không đúng'}`}
          </Text>
        )}
      </Card>

      <Card>
        <Title>Nguồn tự động</Title>
        <Muted>Bảng deadline của lớp, lịch LMS, Gmail, Classroom: kết nối một lần, MStudent tự tạo việc kể cả khi bạn không mở app.</Muted>
        <View style={{ marginTop: 8 }}>
          <Button label="Quản lý nguồn tự động" onPress={() => router.push('/sources')} />
        </View>
      </Card>
      <Card>
        <Title>Gmail</Title>
        {gmail?.connected ? (
          <>
            <Text style={{ color: c.ok }}>✓ {gmail.email}</Text>
            <Muted>Chỉ đọc. Lần quét gần nhất: {gmail.last_sync_at ? fmtDue(gmail.last_sync_at) : 'chưa quét'}</Muted>
            <View style={styles.rowButtons}>
              <View style={{ flex: 1 }}>
                <Button label="Quét Gmail" busy={busy === 'sync'} onPress={syncGmail} />
              </View>
              <Button variant="ghost" label="Ngắt" busy={busy === 'gdis'} onPress={() => run('gdis', async () => { setGmail(await api.gmailDisconnect()); setGmailMsg(null); await reloadUser(); })} />
            </View>
          </>
        ) : !cfg?.google.gmail ? (
          <Muted>Server chưa cấu hình Google Cloud (GOOGLE_WEB_CLIENT_ID, GOOGLE_CLIENT_SECRET).</Muted>
        ) : !googleAvailable ? (
          <Muted>Bản app này chưa có Google Sign-In (Expo Go/web). Hãy dùng development build.</Muted>
        ) : (
          <>
            <Muted style={{ marginBottom: 10 }}>
              Cho MStudent quyền CHỈ ĐỌC hộp thư để AI tự tìm hạn nộp, lịch thi trong email của trường. Mã truy cập được mã hoá và chỉ lưu trên server.
            </Muted>
            <Button label="Kết nối Gmail" busy={busy === 'gmail'} onPress={connectGmail} />
          </>
        )}
        {gmailMsg && <Text style={{ color: c.text, marginTop: 8 }}>{gmailMsg}</Text>}
      </Card>

      {stats && (
        <Card>
          <Title>MStudent đã giúp bạn</Title>
          <View style={styles.statGrid}>
            <Stat value={stats.messages_read} label="thông báo đã đọc" />
            <Stat value={stats.noise_filtered} label="tin nhiễu đã lọc" />
            <Stat value={stats.tasks_created} label="việc tìm được" />
            <Stat value={stats.changes_caught} label="lần đổi hạn bắt kịp" />
            <Stat value={stats.tasks_done} label="việc đã xong" />
            <Stat value={stats.ai_runs} label="lượt AI chạy" />
          </View>
        </Card>
      )}

      <Card>
        <Title>Nhắc việc trên máy</Title>
        {notifSupported ? (
          <>
            <View style={styles.switchRow}>
              <Text style={{ color: c.text, flex: 1 }}>Nhắc trước hạn (3 ngày, 1 ngày, 2 giờ, đúng giờ)</Text>
              <Switch value={settings.remindersOn} onValueChange={(v) => updateSettings({ remindersOn: v })} />
            </View>
            <Muted>Đang hẹn {pending ?? scheduled} thông báo. Không cần mạng khi đến giờ nhắc.</Muted>
            <View style={{ marginTop: 10 }}>
              <Button
                variant="ghost"
                label="Gửi thông báo thử sau 5 giây"
                onPress={async () => {
                  if (!(await sendTest(5))) Alert.alert('Chưa có quyền', 'Hãy cho phép MStudent gửi thông báo trong Cài đặt của máy.');
                }}
              />
            </View>
          </>
        ) : (
          <Muted>Bản web không hỗ trợ nhắc việc. Hãy dùng app trên iOS/Android.</Muted>
        )}
      </Card>

      <Card>
        <Title>Dữ liệu demo</Title>
        <Muted style={{ marginBottom: 10 }}>Xoá dữ liệu CỦA BẠN trên server và nạp 9 thông báo mẫu (email, LMS, Zalo, có cả spam).</Muted>
        <Button
          variant="ghost"
          label="Nạp dữ liệu demo"
          busy={busy === 'seed'}
          onPress={() =>
            run('seed', async () => {
              const rs = await api.seed();
              const made = rs.reduce((a, r) => a + r.created.length, 0);
              const skip = rs.filter((r) => !r.relevant).length;
              await refresh();
              Alert.alert('Đã nạp', `${rs.length} thông báo → ${made} việc, bỏ qua ${skip} tin không liên quan.`);
            })
          }
        />
      </Card>

      <Card>
        <Title>Xoá tài khoản</Title>
        {showDelete ? (
          <>
            <Muted style={{ marginBottom: 8 }}>Xoá vĩnh viễn tài khoản, mọi việc, thông báo và quyền Gmail. Nhập email của bạn để xác nhận.</Muted>
            <TextInput
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={user?.email}
              placeholderTextColor={c.muted}
              style={[styles.input, { color: c.text, borderColor: c.line, backgroundColor: c.bg }]}
            />
            <View style={styles.rowButtons}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Xoá vĩnh viễn"
                  busy={busy === 'del'}
                  disabled={confirmEmail.trim().toLowerCase() !== user?.email}
                  onPress={() => run('del', async () => { await authApi.deleteAccount(confirmEmail.trim()); await signOut(); })}
                />
              </View>
              <Button variant="ghost" label="Huỷ" onPress={() => { setShowDelete(false); setConfirmEmail(''); }} />
            </View>
          </>
        ) : (
          <Button variant="ghost" label="Xoá tài khoản và dữ liệu…" onPress={() => setShowDelete(true)} />
        )}
      </Card>

      <Muted style={{ textAlign: 'center' }}>MStudent · {Platform.OS}</Muted>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const c = usePalette();
  return (
    <View style={[styles.stat, { backgroundColor: c.soft }]}>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  rowButtons: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexBasis: '31%', flexGrow: 1, borderRadius: 10, padding: 10 },
});
