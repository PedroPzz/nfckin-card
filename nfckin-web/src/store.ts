import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ApiError, NfcCard, UserInfo } from './api';

interface SessionSlice {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

export const useSession = create<SessionSlice>()((set) => ({
  user: null,
  loading: false,
  error: null,
  async hydrate() {
    try {
      const s = await api.session();
      set({ user: s.authenticated ? s.userInfo ?? { email: s.email || '' } : null });
    } catch {
      set({ user: null });
    }
  },
  async login(email, password, remember) {
    set({ loading: true, error: null });
    try {
      const userInfo = await api.login(email, password, remember);
      set({ user: userInfo, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message || 'Falha no login' });
      throw e;
    }
  },
  async logout() {
    try { await api.logout(); } catch {}
    set({ user: null });
  },
}));

type SyncStatus = 'idle' | 'syncing' | 'error' | 'ok';

interface CardsSlice {
  cards: NfcCard[];
  total: number;
  lastSyncAt: number | null;
  status: SyncStatus;
  error: string | null;
  names: Record<string, string>;
  sync: () => Promise<void>;
  activate: (jhm: string, ncode: string, goTo: string) => Promise<NfcCard | null>;
  updateGoTo: (ncode: string, goTo: string) => Promise<void>;
  removeLocal: (ncode: string) => void;
  setName: (ncode: string, name: string) => void;
}

function merge(local: NfcCard[], remote: NfcCard[]): NfcCard[] {
  const map = new Map<string, NfcCard>();
  for (const c of local) map.set(c.ncode, c);
  for (const c of remote) map.set(c.ncode, { ...map.get(c.ncode), ...c });
  return Array.from(map.values()).sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
}

export const useCards = create<CardsSlice>()(
  persist(
    (set, get) => ({
      cards: [],
      total: 0,
      lastSyncAt: null,
      status: 'idle',
      error: null,
      names: {},
      async sync() {
        set({ status: 'syncing', error: null });
        try {
          const all: NfcCard[] = [];
          let page = 1;
          let total = 0;
          while (true) {
            const res = await api.list(page, 50, '');
            total = res.total || res.data.length;
            all.push(...res.data);
            if (res.data.length < 50 || all.length >= total) break;
            page++;
            if (page > 40) break;
          }
          const merged = merge(get().cards, all);
          set({ cards: merged, total, lastSyncAt: Date.now(), status: 'ok' });
        } catch (e: any) {
          set({ status: 'error', error: e?.message || 'Erro ao sincronizar' });
          throw e;
        }
      },
      async activate(jhm, ncode, goTo) {
        set({ status: 'syncing', error: null });
        try {
          const created = (await api.activate(jhm.trim(), ncode.trim(), goTo.trim())) || {
            ncode, jhm, goTo,
          };
          const merged = merge(get().cards, [created as NfcCard]);
          set({
            cards: merged,
            total: Math.max(get().total, merged.length),
            lastSyncAt: Date.now(),
            status: 'ok',
          });
          return created as NfcCard;
        } catch (e: any) {
          set({ status: 'error', error: e?.message });
          throw e;
        }
      },
      async updateGoTo(ncode, goTo) {
        await api.updateGoTo(ncode, goTo);
        const updated = get().cards.map((c) => (c.ncode === ncode ? { ...c, goTo } : c));
        set({ cards: updated });
      },
      removeLocal(ncode) {
        const updated = get().cards.filter((c) => c.ncode !== ncode);
        set({ cards: updated, total: Math.max(0, get().total - 1) });
      },
      setName(ncode, name) {
        const names = { ...get().names };
        if (name.trim()) names[ncode] = name.trim();
        else delete names[ncode];
        set({ names });
      },
    }),
    {
      name: 'nfckin-cards-cache-v1',
      partialize: (s) => ({ cards: s.cards, total: s.total, lastSyncAt: s.lastSyncAt, names: s.names }),
    }
  )
);

export { ApiError };
