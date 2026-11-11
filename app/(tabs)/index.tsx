// Tab Trợ lý: chat với agent, agent tự gọi tool (xem việc, thêm thông báo, đánh dấu xong, bản tin).

import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Chip, ErrorBanner } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import type { ChatTurn, ToolCall } from '@/lib/types';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  calls?: ToolCall[];
  mode?: string;
}

const SUGGESTIONS = ['Tuần này có gì?', 'Hôm nay cần làm gì?', 'Lịch thi sắp tới', 'Bản tin', 'Thêm: thứ 6 tuần sau nộp đồ án OOP'];
const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  text: 'Chào bạn! Mình là trợ lý MStudent. Hỏi mình về việc sắp tới, dán một thông báo để mình ghi lại, hoặc nói “xong 3” khi làm xong việc #3.',
};

export default function ChatScreen() {
  const c = usePalette();
  const { refresh, error, health } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

  async function send(text = input) {
    const message = text.trim();
    if (!message || busy) return;
    const history: ChatTurn[] = msgs
      .filter((m) => m.id !== 'welcome')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.text }));
    setInput('');
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: message }]);
    setBusy(true);
    try {
      const r = await api.chat(message, history);
      setMsgs((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', text: r.reply, calls: r.tool_calls, mode: r.mode }]);
      if (r.tool_calls.some((t) => t.tool !== 'list_tasks')) refresh();
    } catch (e) {
      setMsgs((m) => [...m, { id: `e${Date.now()}`, role: 'assistant', text: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {error && (
        <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
          <ErrorBanner message={error} onRetry={refresh} />
        </View>
      )}
      {!error && health?.mode === 'offline' && (
        <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
          <ErrorBanner message="Server đang chạy bằng bộ luật — AI chưa bật. Xem Cài đặt → AI" />
        </View>
      )}
      <FlatList
        ref={list}
        data={busy ? [...msgs, { id: 'typing', role: 'assistant', text: 'Đang suy nghĩ…' } as Msg] : msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <Bubble msg={item} typing={item.id === 'typing'} />}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled">
        {SUGGESTIONS.map((s) => (
          <Chip key={s} label={s} onPress={() => send(s)} />
        ))}
      </ScrollView>
      <View style={[styles.inputRow, { borderColor: c.line, backgroundColor: c.panel }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Hỏi hoặc dán thông báo…"
          placeholderTextColor={c.muted}
          multiline
          style={[styles.input, { color: c.text, backgroundColor: c.bg, borderColor: c.line }]}
          accessibilityLabel="Tin nhắn cho trợ lý"
        />
        <Pressable
          onPress={() => send()}
          disabled={busy || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Gửi"
          style={[styles.send, { backgroundColor: c.accent, opacity: busy || !input.trim() ? 0.5 : 1 }]}>
          <Text style={{ color: c.onAccent, fontWeight: '700' }}>Gửi</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg, typing }: { msg: Msg; typing?: boolean }) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const mine = msg.role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        mine
          ? { alignSelf: 'flex-end', backgroundColor: c.accent, borderBottomRightRadius: 4 }
          : { alignSelf: 'flex-start', backgroundColor: c.soft, borderBottomLeftRadius: 4 },
      ]}>
      <Text style={{ color: mine ? c.onAccent : c.text, fontSize: 15, fontStyle: typing ? 'italic' : 'normal' }}>
        {msg.text}
      </Text>
      {!!msg.calls?.length && (
        <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button">
          <Text style={{ color: c.muted, fontSize: 13, marginTop: 6 }}>
            {open ? '▾' : '▸'} 🔧 {msg.calls.length} lần gọi tool · {msg.mode}
          </Text>
        </Pressable>
      )}
      {open &&
        msg.calls?.map((t, i) => (
          <Text key={i} style={[styles.code, { backgroundColor: c.panel, color: c.text }]}>
            {`${t.tool}(${JSON.stringify(t.args)})\n→ ${t.result}`}
          </Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '88%', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14 },
  code: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  inputRow: { flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'flex-end' },
  input: { flex: 1, minHeight: 42, maxHeight: 120, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15 },
  send: { height: 42, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
