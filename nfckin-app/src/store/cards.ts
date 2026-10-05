import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { api, NfcCard } from '../api/nfckin';

const K_CARDS = 'nfckin_cards_cache_v1';
const K_LAST_SYNC = 'nfckin_last_sync_v1';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'ok';

interface CardsState {
  cards: NfcCard[];
  total: number;
  lastSyncAt: number | null;
  status: SyncStatus;
  error: string | null;

  hydrate: () => Promise<void>;
  sync: (opts?: { reset?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  activate: (jhm: string, ncode: string, goTo: string) => Promise<NfcCard | null>;
  updateGoTo: (ncode: string, goTo: string) => Promise<void>;
  removeLocal: (ncode: string) => void;
}

const PAGE_LIMIT = 50;

async function persist(cards: NfcCard[], lastSyncAt: number | null) {
  try {
    await AsyncStorage.setItem(K_CARDS, JSON.stringify(cards));
    if (lastSyncAt) await AsyncStorage.setItem(K_LAST_SYNC, String(lastSyncAt));
  } catch {}
}

export const useCards = create<CardsState>((set, get) => ({
  cards: [],
  total: 0,
  lastSyncAt: null,
  status: 'idle',
  error: null,

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(K_CARDS);
      const ls = await AsyncStorage.getItem(K_LAST_SYNC);
      if (raw) {
        const cards = JSON.parse(raw) as NfcCard[];
        set({ cards, lastSyncAt: ls ? Number(ls) : null });
      }
    } catch {}
  },

  async sync({ reset = true } = {}) {
    set({ status: 'syncing', error: null });
    try {
      const all: NfcCard[] = [];
      let page = 1;
      let total = 0;
      while (true) {
        const res = await api.list(page, PAGE_LIMIT, '');
        total = res.total ?? res.data?.length ?? 0;
        const chunk = res.data || [];
        all.push(...chunk);
        if (chunk.length < PAGE_LIMIT || all.length >= total) break;
        page++;
        if (page > 40) break;
      }
      const now = Date.now();
      const merged = reset ? all : mergeCards(get().cards, all);
      set({ cards: merged, total, lastSyncAt: now, status: 'ok' });
      await persist(merged, now);
    } catch (e: any) {
      set({ status: 'error', error: e?.message || 'Erro ao sincronizar' });
      throw e;
    }
  },

  async loadMore() {
    const { cards, total } = get();
    if (cards.length >= total) return;
    set({ status: 'syncing' });
    try {
      const page = Math.floor(cards.length / PAGE_LIMIT) + 1;
      const res = await api.list(page, PAGE_LIMIT, '');
      const merged = mergeCards(cards, res.data || []);
      const now = Date.now();
      set({ cards: merged, total: res.total ?? total, lastSyncAt: now, status: 'ok' });
      await persist(merged, now);
    } catch (e: any) {
      set({ status: 'error', error: e?.message });
    }
  },

  async activate(jhm, ncode, goTo) {
    set({ status: 'syncing', error: null });
    try {
      const res = await api.activate(jhm.trim(), ncode.trim(), goTo.trim());
      const created: NfcCard = (res.data as NfcCard) || { ncode, jhm, goTo };
      const merged = mergeCards(get().cards, [created]);
      const now = Date.now();
      set({ cards: merged, total: Math.max(get().total, merged.length), lastSyncAt: now, status: 'ok' });
      await persist(merged, now);
      return created;
    } catch (e: any) {
      set({ status: 'error', error: e?.message });
      throw e;
    }
  },

  async updateGoTo(ncode, goTo) {
    await api.updateGoTo(ncode, goTo);
    const updated = get().cards.map((c) => (c.ncode === ncode ? { ...c, goTo } : c));
    set({ cards: updated });
    await persist(updated, get().lastSyncAt);
  },

  removeLocal(ncode) {
    const updated = get().cards.filter((c) => c.ncode !== ncode);
    set({ cards: updated, total: Math.max(0, get().total - 1) });
    persist(updated, get().lastSyncAt);
  },
}));

function mergeCards(local: NfcCard[], remote: NfcCard[]): NfcCard[] {
  const map = new Map<string, NfcCard>();
  for (const c of local) map.set(c.ncode, c);
  for (const c of remote) map.set(c.ncode, { ...map.get(c.ncode), ...c });
  return Array.from(map.values()).sort((a, b) => {
    const da = (a.createdAt || a.updatedAt || '') as string;
    const db = (b.createdAt || b.updatedAt || '') as string;
    return db.localeCompare(da);
  });
}
