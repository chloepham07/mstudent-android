// Màn hình nhận nội dung chia sẻ từ Zalo/app khác (hoặc dán tay) → chạy pipeline agent → xem kết quả.

import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, Muted, TaskRow, Title } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { CATEGORY_LABEL, type IngestResult, type Source } from '@/lib/types';

const SOURCES: { key: Source; label: string }[] = [
  { key: 'zalo', label: 'Zalo' },
  { key: 'email', label: 'Email' },
  { key: 'lms', label: 'LMS' },
  { key: 'manual', label: 'Khác' },
];

export default function ShareScreen() {
  const c = usePalette();
  const { refresh, now } = useStore();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const shared = hasShareIntent ? [shareIntent.text, shareIntent.webUrl].filter(Boolean).join('\n') : '';
  const [text, setText] = useState(shared);
  const [source, setSource] = useState<Source>(hasShareIntent ? 'zalo' : 'manual');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastShared, setLastShared] = useState(shared);
  if (shared && shared !== lastShared) {
    // Nội dung chia sẻ mới đến khi màn hình đang mở → thay thế (pattern "derive state from props").
    setLastShared(shared);
    setText(shared);
    setSource('zalo');
    setResult(null);
  }

  function close() {
    resetShareIntent();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function analyze() {
    setBusy(true);
    setErr(null);
    try {
      setResult(await api.ingest(text.trim(), source));
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 12, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Title>{hasShareIntent ? 'Nội dung được chia sẻ' : 'Dán thông báo'}</Title>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            setResult(null);
          }}
          multiline
          placeholder="vd: Thứ 6 tuần này nộp bài tập tuần 9 nhé"
          placeholderTextColor={c.muted}
          style={[styles.input, { color: c.text, borderColor: c.line, backgroundColor: c.bg }]}
          accessibilityLabel="Nội dung thông báo"
        />
        <View style={styles.sources}>
          {SOURCES.map((s) => (
            <Chip key={s.key} label={s.label} active={source === s.key} onPress={() => setSource(s.key)} />
          ))}
        </View>
        <Button label="Phân tích bằng agent" busy={busy} disabled={!text.trim()} onPress={analyze} />
        {err && <Text style={{ color: c.bad, marginTop: 8 }}>⚠️ {err}</Text>}
      </Card>

      {result && (
        <Card>
          <Title>{result.duplicate ? '↺ Đã xử lý tin này rồi' : result.relevant ? `✓ ${CATEGORY_LABEL[result.category]}` : '✗ Không cần làm gì'}</Title>
          <Muted>
            {result.reason} · {result.mode === 'llm' ? 'AI trực tiếp' : result.mode === 'cache' ? 'không chạy lại agent' : 'bộ luật (AI chưa bật)'}
          </Muted>
          {result.created.map((t) => (
            <TaskRow key={`c${t.id}`} task={t} now={now} />
          ))}
          {result.updated.map((t) => (
            <TaskRow key={`u${t.id}`} task={t} now={now} />
          ))}
          {result.updated.length > 0 && <Muted>↻ Đã cập nhật việc có sẵn thay vì tạo trùng.</Muted>}
          <Text style={[styles.traceHead, { color: c.muted }]}>Các agent đã chạy</Text>
          {result.trace.map((s, i) => (
            <Text key={i} style={[styles.trace, { color: s.error ? c.bad : c.text }]}>
              {i + 1}. {s.agent} · {s.kind} · {s.ms} ms{s.error ? ` — ${s.error}` : ''}
            </Text>
          ))}
        </Card>
      )}

      <Button variant={result ? 'primary' : 'ghost'} label={result ? 'Xong' : 'Đóng'} onPress={close} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 120, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 15, textAlignVertical: 'top' },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 },
  traceHead: { marginTop: 12, marginBottom: 4, fontSize: 13, fontWeight: '600' },
  trace: { fontSize: 13, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
});
