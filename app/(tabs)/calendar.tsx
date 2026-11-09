// Tab Lịch: dải 7 ngày, chọn ngày để xem việc; nhấn giữ một việc để dời hạn.

import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Muted, TaskRow } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { addDays, dayKey, fmtDayLong, fmtDayShort, fmtTime, moveToDay, startOfDay } from '@/lib/dates';
import { useStore } from '@/lib/store';
import type { Task } from '@/lib/types';

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function CalendarScreen() {
  const c = usePalette();
  const { tasks, now, markDone, moveTask } = useStore();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(() => dayKey(now));
  const [moving, setMoving] = useState<Task | null>(null);

  const start = useMemo(() => addDays(startOfDay(now), offset * 7), [now, offset]);
  const days = useMemo(() => [...Array(7)].map((_, i) => addDays(start, i)), [start]);
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) if (t.due_at) m.set(dayKey(t.due_at), [...(m.get(dayKey(t.due_at)) ?? []), t]);
    return m;
  }, [tasks]);
  const todayKey = dayKey(now);
  const dayTasks = byDay.get(selected) ?? [];

  function shiftWeek(n: number) {
    const next = offset + n;
    setOffset(next);
    setSelected(dayKey(addDays(startOfDay(now), next * 7)));
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.weekBar, { backgroundColor: c.panel, borderColor: c.line }]}>
        <View style={styles.weekNav}>
          <Button small variant="ghost" label="←" onPress={() => shiftWeek(-1)} />
          <Text style={{ color: c.text, fontWeight: '600' }}>
            {fmtDayShort(days[0])} – {fmtDayShort(days[6])}
          </Text>
          <Button small variant="ghost" label="→" onPress={() => shiftWeek(1)} />
        </View>
        <View style={styles.strip}>
          {days.map((d) => {
            const k = dayKey(d);
            const n = byDay.get(k)?.length ?? 0;
            const hasHigh = byDay.get(k)?.some((t) => t.priority === 'high');
            const sel = k === selected;
            return (
              <Pressable
                key={k}
                onPress={() => setSelected(k)}
                accessibilityRole="button"
                accessibilityLabel={`${fmtDayLong(d)}, ${n} việc`}
                style={[styles.day, sel && { backgroundColor: c.accent }, !sel && k === todayKey && { borderColor: c.accent, borderWidth: 1 }]}>
                <Text style={{ color: sel ? c.onAccent : c.muted, fontSize: 12 }}>{DOW[new Date(d.getTime() + 7 * 3600e3).getUTCDay()]}</Text>
                <Text style={{ color: sel ? c.onAccent : c.text, fontSize: 17, fontWeight: '600' }}>{k.slice(8)}</Text>
                <View style={[styles.badge, { backgroundColor: n ? (hasHigh ? c.high : sel ? c.onAccent : c.accent) : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>{fmtDayLong(selected + 'T12:00:00+07:00')}</Text>
        {dayTasks.length ? (
          <Card>
            {dayTasks.map((t) => (
              <TaskRow key={t.id} task={t} now={now} onDone={() => markDone(t.id)} onLongPress={() => setMoving(t)} />
            ))}
            <Muted style={{ marginTop: 8 }}>Nhấn giữ một việc để dời sang ngày khác.</Muted>
          </Card>
        ) : (
          <Muted>Không có việc nào trong ngày này.</Muted>
        )}
      </ScrollView>

      <MoveSheet
        task={moving}
        from={startOfDay(now)}
        onClose={() => setMoving(null)}
        onPick={async (k) => {
          const t = moving;
          setMoving(null);
          if (t?.due_at) {
            await moveTask(t.id, moveToDay(t.due_at, k));
            setSelected(k);
          }
        }}
      />
    </View>
  );
}

function MoveSheet({
  task,
  from,
  onClose,
  onPick,
}: {
  task: Task | null;
  from: Date;
  onClose: () => void;
  onPick: (dayKey: string) => void;
}) {
  const c = usePalette();
  const options = [...Array(14)].map((_, i) => addDays(from, i));
  return (
    <Modal visible={!!task} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.panel }]}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }} numberOfLines={2}>
          Dời “{task?.title}”
        </Text>
        <Muted style={{ marginBottom: 10 }}>Giữ nguyên giờ {task?.due_at ? fmtTime(task.due_at) : ''}</Muted>
        <View style={styles.grid}>
          {options.map((d) => {
            const k = dayKey(d);
            const current = task?.due_at && dayKey(task.due_at) === k;
            return (
              <Pressable
                key={k}
                onPress={() => onPick(k)}
                disabled={!!current}
                style={[styles.opt, { borderColor: c.line, backgroundColor: current ? c.soft : c.bg }]}>
                <Text style={{ color: current ? c.muted : c.text }}>{fmtDayShort(d)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Button variant="ghost" label="Huỷ" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  weekBar: { paddingHorizontal: 8, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  strip: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { flex: 1, marginHorizontal: 2, alignItems: 'center', paddingVertical: 6, borderRadius: 12, gap: 2 },
  badge: { width: 6, height: 6, borderRadius: 3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { padding: 16, paddingBottom: 32, borderTopLeftRadius: 18, borderTopRightRadius: 18, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  opt: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, minWidth: '22%', alignItems: 'center' },
});
