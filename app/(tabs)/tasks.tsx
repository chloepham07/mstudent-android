// Tab Việc: danh sách việc nhóm theo thời hạn + bản tin của Digest agent.

import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { Card, ErrorBanner, Muted, TaskRow } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { BUCKET_ORDER, bucketOf } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function TasksScreen() {
  const c = usePalette();
  const { tasks, now, loading, error, refresh, markDone, health } = useStore();
  const [digest, setDigest] = useState<string | null>(null);
  const [showDigest, setShowDigest] = useState(true);

  const loadDigest = useCallback(() => {
    api
      .digest()
      .then((d) => setDigest(d.text))
      .catch(() => setDigest(null));
  }, []);

  useEffect(() => {
    if (health) loadDigest();
  }, [health, tasks.length, loadDigest]);

  const sections = useMemo(() => {
    const groups = new Map<string, typeof tasks>();
    for (const t of tasks) {
      const b = bucketOf(t.due_at, now);
      groups.set(b, [...(groups.get(b) ?? []), t]);
    }
    return BUCKET_ORDER.filter((b) => groups.has(b)).map((b) => ({ title: b, data: groups.get(b)! }));
  }, [tasks, now]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/share')} hitSlop={10} style={{ marginRight: 16 }}>
              <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>＋ Thêm</Text>
            </Pressable>
          ),
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(t) => String(t.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { refresh(); loadDigest(); }} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 6 }}>
            {error && <ErrorBanner message={error} onRetry={refresh} />}
            {digest && (
              <Card>
                <Pressable onPress={() => setShowDigest((v) => !v)} style={styles.digestHead}>
                  <Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>☀️ Bản tin</Text>
                  <Muted>{showDigest ? 'Thu gọn' : 'Mở'}</Muted>
                </Pressable>
                {showDigest && <Text style={{ color: c.text, marginTop: 6, lineHeight: 21 }}>{digest}</Text>}
              </Card>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.section, { color: section.title === 'Quá hạn' ? c.bad : c.muted }]}>
            {section.title} · {section.data.length}
          </Text>
        )}
        renderItem={({ item }) => <TaskRow task={item} now={now} onDone={() => markDone(item.id)} />}
        ListEmptyComponent={
          !loading && !error ? (
            <Card style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 28 }}>🎉</Text>
              <Text style={{ color: c.text }}>Chưa có việc nào.</Text>
              <Muted style={{ textAlign: 'center' }}>Chia sẻ một thông báo từ Zalo sang MStudent, bấm “＋ Thêm”, hoặc vào Cài đặt → Nạp dữ liệu demo.</Muted>
            </Card>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  digestHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
