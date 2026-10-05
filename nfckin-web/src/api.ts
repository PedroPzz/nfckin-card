export interface UserInfo {
  email: string;
  nickname?: string;
  phone?: string;
  createdAt?: string;
}

export interface NfcCard {
  ncode: string;
  jhm?: string;
  goTo?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
}

export interface NfckinResponse<T = unknown> {
  status: number;
  code?: number;
  msg?: string;
  data?: T;
  total?: number;
}

export class ApiError extends Error {
  tokenExpired: boolean;
  reloginImpossible: boolean;
  code?: number;
  constructor(
    msg: string,
    opts: { tokenExpired?: boolean; reloginImpossible?: boolean; code?: number } = {}
  ) {
    super(msg);
    this.tokenExpired = !!opts.tokenExpired;
    this.reloginImpossible = !!opts.reloginImpossible;
    this.code = opts.code;
  }
}

async function http<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new ApiError(json?.error || json?.msg || `HTTP ${res.status}`, {
      tokenExpired: !!json?.tokenExpired,
      reloginImpossible: !!json?.reloginImpossible,
      code: json?.code,
    });
  }
  return json as T;
}

function unwrap<T>(r: NfckinResponse<T>): T {
  if (!r || r.status === 0) {
    throw new ApiError(r?.msg || 'Falha na requisição', { code: r?.code });
  }
  return (r.data as T);
}

export const api = {
  async login(email: string, password: string, remember = true) {
    const r = await http<{ ok: boolean; userInfo: UserInfo }>('/api/login', { email, password, remember });
    return r.userInfo;
  },
  async logout() {
    return http<{ ok: boolean }>('/api/logout', {});
  },
  async session() {
    return http<{ authenticated: boolean; userInfo?: UserInfo; email?: string }>('/api/session', {});
  },
  async list(page = 1, limit = 50, keyword = '') {
    const r = await http<NfckinResponse<NfcCard[]>>('/api/list', { p: page, limit, keyword });
    return { data: unwrap(r) || [], total: r.total ?? 0 };
  },
  async count() {
    const r = await http<NfckinResponse<number>>('/api/count', {});
    return unwrap(r) ?? 0;
  },
  async info(ncode: string) {
    const r = await http<NfckinResponse<NfcCard>>('/api/info', { ncode });
    return unwrap(r);
  },
  async activate(jhm: string, ncode: string, goTo: string) {
    const r = await http<NfckinResponse<NfcCard>>('/api/activate', { jhm, ncode, goTo });
    return unwrap(r);
  },
  async updateGoTo(ncode: string, goTo: string) {
    const r = await http<NfckinResponse<unknown>>('/api/update', { ncode, goTo });
    return unwrap(r);
  },
  async updateProfile(nickname: string, email: string) {
    const r = await http<NfckinResponse<UserInfo>>('/api/profile', { nickname, email });
    return unwrap(r);
  },
  async changePassword(oldPassword: string, newPassword: string) {
    const r = await http<NfckinResponse<unknown>>('/api/password', { old: oldPassword, new: newPassword });
    return unwrap(r);
  },
};
