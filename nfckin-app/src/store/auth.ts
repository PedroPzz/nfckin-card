import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { api, configureAuth, UserInfo } from '../api/nfckin';

const K_EMAIL = 'nfckin_email';
const K_PASSWORD = 'nfckin_password';
const K_TOKEN = 'nfckin_token';
const K_USER = 'nfckin_user';

interface AuthState {
  email: string | null;
  password: string | null;
  token: string | null;
  userInfo: UserInfo | null;
  hydrated: boolean;
  loggingIn: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  relogin: () => Promise<string | null>;
  setUserInfo: (u: UserInfo) => Promise<void>;
}

async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}
async function safeSet(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {}
}
async function safeDel(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

let authRef: AuthState | null = null;

export const useAuth = create<AuthState>((set, get) => {
  const state: AuthState = {
    email: null,
    password: null,
    token: null,
    userInfo: null,
    hydrated: false,
    loggingIn: false,
    error: null,

    async hydrate() {
      const [email, password, token, userRaw] = await Promise.all([
        safeGet(K_EMAIL),
        safeGet(K_PASSWORD),
        safeGet(K_TOKEN),
        safeGet(K_USER),
      ]);
      let userInfo: UserInfo | null = null;
      if (userRaw) {
        try {
          userInfo = JSON.parse(userRaw);
        } catch {}
      }
      set({ email, password, token, userInfo, hydrated: true });
    },

    async login(email, password, remember) {
      set({ loggingIn: true, error: null });
      try {
        const res = await api.login(email, password);
        // Convenção nfckin: status !== 0 = sucesso. Também exigimos token presente.
        if (res.status === 0 || !res.data?.token) {
          throw new Error(res.msg || 'Credenciais inválidas');
        }
        const { token, userInfo } = res.data;
        set({ email, password, token, userInfo, loggingIn: false });
        await safeSet(K_TOKEN, token);
        await safeSet(K_USER, JSON.stringify(userInfo));
        if (remember) {
          await safeSet(K_EMAIL, email);
          await safeSet(K_PASSWORD, password);
        } else {
          await safeDel(K_EMAIL);
          await safeDel(K_PASSWORD);
        }
      } catch (e: any) {
        set({ loggingIn: false, error: e?.message || 'Erro no login' });
        throw e;
      }
    },

    async logout() {
      set({ token: null, userInfo: null, email: null, password: null, error: null });
      await Promise.all([safeDel(K_TOKEN), safeDel(K_USER), safeDel(K_EMAIL), safeDel(K_PASSWORD)]);
    },

    async relogin() {
      const { email, password } = get();
      if (!email || !password) return null;
      try {
        const res = await api.login(email, password);
        if (res.status === 0 || !res.data?.token) return null;
        const token = res.data.token;
        set({ token, userInfo: res.data.userInfo });
        await safeSet(K_TOKEN, token);
        await safeSet(K_USER, JSON.stringify(res.data.userInfo));
        return token;
      } catch {
        return null;
      }
    },

    async setUserInfo(u) {
      set({ userInfo: u });
      await safeSet(K_USER, JSON.stringify(u));
    },
  };
  authRef = state;
  return state;
});

configureAuth({
  getToken: () => useAuth.getState().token,
  relogin: () => useAuth.getState().relogin(),
});

export function getAuthSnapshot(): AuthState | null {
  return authRef;
}
