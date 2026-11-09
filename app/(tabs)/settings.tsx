// Tab Cài đặt: địa chỉ server, token, nhắc việc trên máy, dữ liệu demo.

import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Muted, Title } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { scheduledCount, sendTest, supported as notifSupported } from '@/lib/notifications';
import { DEFAULT_URL, useStore } from '@/lib/store';

export default function SettingsScreen() {
  const c = usePalette();
  const { settings, updateSettings, health, error, refresh, conn, scheduled, loading } = useStore();
  const [url, setUrl] = useState(settings.baseUrl);
  const [token, setToken] = useState(settings.token);
  const [seeding, setSeeding] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    scheduledCount().then(setPending).catch(() => setPending(null));
  }, [scheduled]);

  const inputStyle = [styles.input, { color: c.text, borderColor: c.line, backgroundColor: c.bg }];

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 12, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Title>Kết nối server</Title>
        <Text style={[styles.label, { color: c.muted }]}>Địa chỉ backend</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder={DEFAULT_URL}
          placeholderTextColor={c.muted}
          style={inputStyle}
        />
        <Text style={[styles.label, { color: c.muted }]}>Token (nếu server đặt MSTUDENT_API_TOKEN)</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="để trống nếu không có"
          placeholderTextColor={c.muted}
          style={inputStyle}
        />
        <View style={{ marginTop: 12 }}>
          <Button
            label="Lưu & kiểm tra kết nối"
            busy={loading}
            onPress={async () => {
              const same = url.trim() === settings.baseUrl && token.trim() === settings.token;
              await updateSettings({ baseUrl: url.trim(), token: token.trim() });
              if (same) refresh(); // đổi địa chỉ thì store tự kết nối lại
            }}
          />
        </View>
        <View style={{ marginTop: 10 }}>
          {health ? (
            <Text style={{ color: c.ok }}>
              ✓ Đã kết nối · {health.mode === 'llm' ? `LLM ${health.model}` : 'chế độ offline (luật)'}
            </Text>
          ) : (
            <Text style={{ color: c.bad }}>{error ? `✗ ${error}` : 'Chưa kết nối'}</Text>
          )}
          <Muted style={{ marginTop: 6 }}>
            Simulator iOS: http://localhost:8000 · Android emulator: http://10.0.2.2:8000 · Điện thoại thật: dùng link HTTPS
            (deploy hoặc `cloudflared tunnel --url http://localhost:8000`).
          </Muted>
        </View>
      </Card>

      <Card>
        <Title>Nhắc việc trên máy</Title>
        {notifSupported ? (
          <>
            <View style={styles.switchRow}>
              <Text style={{ color: c.text, flex: 1 }}>Bật thông báo nhắc trước hạn (3 ngày, 1 ngày, 2 giờ, đúng giờ)</Text>
              <Switch value={settings.remindersOn} onValueChange={(v) => updateSettings({ remindersOn: v })} />
            </View>
            <Muted>Đang hẹn {pending ?? scheduled} thông báo. Không cần mạng khi đến giờ nhắc.</Muted>
            <View style={{ marginTop: 10 }}>
              <Button
                variant="ghost"
                label="Gửi thông báo thử sau 5 giây"
                onPress={async () => {
                  const ok = await sendTest(5);
                  if (!ok) Alert.alert('Chưa có quyền', 'Hãy cho phép MStudent gửi thông báo trong Cài đặt của máy.');
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
        <Muted style={{ marginBottom: 10 }}>Xoá dữ liệu trên server và nạp 9 thông báo mẫu (email, LMS, Zalo, có cả spam).</Muted>
        <Button
          variant="ghost"
          label="Nạp dữ liệu demo"
          busy={seeding}
          onPress={async () => {
            setSeeding(true);
            try {
              const rs = await api.seed(conn);
              const made = rs.reduce((a, r) => a + r.created.length, 0);
              const skip = rs.filter((r) => !r.relevant).length;
              await refresh();
              Alert.alert('Đã nạp', `${rs.length} thông báo → ${made} việc, bỏ qua ${skip} tin không liên quan.`);
            } catch (e) {
              Alert.alert('Lỗi', (e as Error).message);
            } finally {
              setSeeding(false);
            }
          }}
        />
      </Card>

      <Muted style={{ textAlign: 'center' }}>MStudent · {Platform.OS}</Muted>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
});
