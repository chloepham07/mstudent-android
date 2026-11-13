// Màn hình Nguồn tự động (002, FR-070/071/078): kết nối một lần, sau đó máy chủ tự đồng bộ.

import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, Muted, Title } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { SOURCE_KIND_LABEL, statusOf, statusText } from '@/lib/sources';
import { useStore } from '@/lib/store';
import type { SourceConnection } from '@/lib/types';

type AddKind = 'sheet' | 'ics';

const ADD_HELP: Record<AddKind, string> = {
  sheet:
    'Dán link Google Sheets tổng hợp deadline của lớp. Bảng phải chia sẻ "Bất kỳ ai có đường liên kết" → Người xem. ' +
    'MStudent tự hiểu cột (môn, nội dung, hạn) và kiểm tra lại mỗi 30 phút.',
  ics: 'Dán link xuất lịch từ LMS (Moodle: Lịch → Xuất lịch → Lấy URL). MStudent tải lại mỗi giờ.',
};

export default function SourcesScreen() {
  const c = usePalette();
  const { refresh } = useStore();
  const [items, setItems] = useState<SourceConnection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<AddKind | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const pollUntil = useRef(0);

  // Chỉ đặt state sau khi có kết quả (không setState đồng bộ trong effect).
  const load = useCallback(async () => {
    try {
      const list = await api.sources();
      setItems(list);
      setNow(new Date());
    } catch (e) {
      setNotice((e as Error).message);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  useEffect(() => {
    api
      .sources()
      .then((list) => {
        setItems(list);
        setNow(new Date());
      })
      .catch((e: Error) => setNotice(e.message));
  }, []);

  // Sau khi thêm / bấm đồng bộ: hỏi lại mỗi 5 giây trong 1 phút để hiện kết quả lượt đầu (FR-071).
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() < pollUntil.current) load().then(refresh);
    }, 5000);
    return () => clearInterval(t);
  }, [load, refresh]);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Không thực hiện được', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const add = () =>
    run('add', async () => {
      if (!adding || !url.trim()) return;
      const s = await api.addSource(adding, url.trim());
      setUrl('');
      setAdding(null);
      setNotice(`Đã thêm "${s.label}". Đang đồng bộ lần đầu…`);
      pollUntil.current = Date.now() + 60000;
      await load();
    });

  const syncNow = (s: SourceConnection) =>
    run(`sync${s.id}`, async () => {
      await api.syncSourceNow(s.id);
      setNotice(`Đang đồng bộ "${s.label}"…`);
      pollUntil.current = Date.now() + 60000;
    });

  const toggle = (s: SourceConnection, v: boolean) =>
    run(`tog${s.id}`, async () => {
      await api.setSourceEnabled(s.id, v);
      await load();
    });

  const remove = (s: SourceConnection) =>
    Alert.alert('Xoá nguồn?', `Ngừng theo dõi "${s.label}". Các việc đã tạo vẫn giữ nguyên.`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () =>
          run(`del${s.id}`, async () => {
            await api.deleteSource(s.id);
            await load();
          }),
      },
    ]);

  const google = (items ?? []).filter((s) => s.kind === 'gmail' || s.kind === 'classroom');
  const links = (items ?? []).filter((s) => s.kind === 'sheet' || s.kind === 'ics');

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 14 }}
      style={{ backgroundColor: c.bg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
      <Muted>
        Kết nối một lần — MStudent tự đọc nguồn và tạo việc kể cả khi bạn không mở app. Chỉ đọc, không gửi hay sửa gì ở
        nguồn.
      </Muted>
      {notice ? (
        <Card>
          <Text style={{ color: c.text }}>{notice}</Text>
        </Card>
      ) : null}

      <Card>
        <Title>Tài khoản Google</Title>
        {google.length ? (
          google.map((s) => <SourceRow key={s.id} s={s} now={now} busy={busy} onSync={syncNow} onToggle={toggle} />)
        ) : (
          <Muted>Chưa kết nối. Vào Cài đặt → Gmail để kết nối; email mới sẽ tự thành việc sau 1–3 phút.</Muted>
        )}
        <View style={{ marginTop: 8 }}>
          <Button label="Mở Cài đặt Gmail" variant="ghost" small onPress={() => router.back()} />
        </View>
      </Card>

      <Card>
        <Title>Bảng lớp và lịch LMS</Title>
        {links.length === 0 && <Muted>Chưa có nguồn nào.</Muted>}
        {links.map((s) => (
          <SourceRow
            key={s.id}
            s={s}
            now={now}
            busy={busy}
            onSync={syncNow}
            onToggle={toggle}
            onRemove={remove}
          />
        ))}
        <View style={[styles.row, { marginTop: 10 }]}>
          <Chip label="+ Bảng lớp" active={adding === 'sheet'} onPress={() => setAdding(adding === 'sheet' ? null : 'sheet')} />
          <Chip label="+ Lịch LMS" active={adding === 'ics'} onPress={() => setAdding(adding === 'ics' ? null : 'ics')} />
        </View>
        {adding && (
          <View style={{ gap: 8, marginTop: 10 }}>
            <Muted>{ADD_HELP[adding]}</Muted>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder={adding === 'sheet' ? 'https://docs.google.com/spreadsheets/d/…' : 'https://…/calendar/export….ics'}
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[styles.input, { color: c.text, borderColor: c.line, backgroundColor: c.panel }]}
            />
            <Button label="Thêm và đồng bộ ngay" onPress={add} busy={busy === 'add'} disabled={!url.trim()} />
          </View>
        )}
      </Card>

      <Card>
        <Title>Email trường, Teams, Udemy</Title>
        <Muted>
          Đặt quy tắc tự chuyển tiếp email từ hộp thư trường (Outlook) sang Gmail đã kết nối: Outlook web → Cài đặt → Thư →
          Chuyển tiếp → bật và nhập địa chỉ Gmail. Thông báo của Teams và Udemy cũng đến bằng email nên sẽ được xử lý tự
          động.
        </Muted>
        <View style={{ marginTop: 8 }}>
          <Button
            label="Mở cài đặt chuyển tiếp Outlook"
            variant="ghost"
            small
            onPress={() => Linking.openURL('https://outlook.office.com/mail/options/mail/forwarding')}
          />
        </View>
      </Card>

      {Platform.OS === 'ios' && (
        <Muted>
          iPhone: việc mới do máy chủ tạo sẽ có ngay khi bạn mở app; khi app đóng, iOS tự quyết định lúc cho MStudent
          cập nhật nền nên có thể chậm.
        </Muted>
      )}
    </ScrollView>
  );
}

function SourceRow({
  s,
  now,
  busy,
  onSync,
  onToggle,
  onRemove,
}: {
  s: SourceConnection;
  now: Date;
  busy: string | null;
  onSync: (s: SourceConnection) => void;
  onToggle: (s: SourceConnection, v: boolean) => void;
  onRemove?: (s: SourceConnection) => void;
}) {
  const c = usePalette();
  const st = statusOf(s);
  const color = st === 'error' ? c.bad : st === 'ok' ? c.ok : c.muted;
  return (
    <View style={[styles.item, { borderColor: c.line }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
            {s.label || SOURCE_KIND_LABEL[s.kind]}
          </Text>
          <Text style={{ color: c.muted, fontSize: 12 }}>{SOURCE_KIND_LABEL[s.kind]}</Text>
        </View>
        <Switch value={s.enabled} onValueChange={(v) => onToggle(s, v)} disabled={busy === `tog${s.id}`} />
      </View>
      <Text style={{ color, fontSize: 13 }}>{statusText(s, now)}</Text>
      <View style={styles.row}>
        <Button label="Đồng bộ ngay" small variant="ghost" onPress={() => onSync(s)} busy={busy === `sync${s.id}`} disabled={!s.enabled} />
        {onRemove && <Button label="Xoá" small variant="ghost" onPress={() => onRemove(s)} busy={busy === `del${s.id}`} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  item: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10, gap: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
});
