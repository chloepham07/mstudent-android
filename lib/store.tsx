// Trạng thái dùng chung: cài đặt kết nối + danh sách việc + đồng bộ nhắc việc.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api, type Conn } from './api';
import { clearReminders, ensurePermission, syncReminders } from './notifications';
import type { Health, Task } from './types';

const KEY = 'mstudent.settings.v1';
export const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface Settings {
  baseUrl: string;
  token: string;
  remindersOn: boolean;
}

interface Store {
  ready: boolean;
  settings: Settings;
  conn: Conn;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  health: Health | null;
  now: Date; // giờ của server (để demo với MSTUDENT_NOW) hoặc giờ máy
  tasks: Task[];
  loading: boolean;
  error: string | null;
  scheduled: number;
  refresh: () => Promise<void>;
  markDone: (id: number) => Promise<void>;
  moveTask: (id: number, dueAt: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>({ baseUrl: DEFAULT_URL, token: '', remindersOn: true });
  const [health, setHealth] = useState<Health | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState(0);
  const conn = useMemo(() => ({ baseUrl: settings.baseUrl, token: settings.token }), [settings]);
  const nowOffset = useRef(0); // chênh lệch giữa giờ server và giờ máy

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setSettings((s) => ({ ...s, ...JSON.parse(raw) })))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const h = await api.health(conn);
      nowOffset.current = new Date(h.now).getTime() - Date.now();
      setHealth(h);
      setTasks(await api.tasks(conn));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [conn]);

  useEffect(() => {
    if (ready) refresh();
  }, [ready, refresh]);

  // Mỗi khi danh sách việc đổi → đặt lại thông báo trên máy.
  useEffect(() => {
    if (!ready) return;
    (async () => {
      if (!settings.remindersOn) {
        await clearReminders();
        setScheduled(0);
        return;
      }
      if (await ensurePermission()) setScheduled(await syncReminders(tasks, new Date()));
    })().catch(() => {});
  }, [ready, tasks, settings.remindersOn]);

  const markDone = useCallback(
    async (id: number) => {
      setTasks((ts) => ts.filter((t) => t.id !== id)); // cập nhật lạc quan
      try {
        await api.done(conn, id);
      } finally {
        refresh();
      }
    },
    [conn, refresh],
  );

  const moveTask = useCallback(
    async (id: number, dueAt: string) => {
      await api.patch(conn, id, { due_at: dueAt });
      await refresh();
    },
    [conn, refresh],
  );

  const value: Store = {
    ready,
    settings,
    conn,
    updateSettings,
    health,
    now: new Date(Date.now() + nowOffset.current),
    tasks,
    loading,
    error,
    scheduled,
    refresh,
    markDone,
    moveTask,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore phải nằm trong <StoreProvider>');
  return s;
}
