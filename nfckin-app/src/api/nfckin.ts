const BASE_URL = 'http://nfckin.com/index.php';

const TOKEN_EXPIRED_CODES = new Set([1401, 11101]);

export interface UserInfo {
  email: string;
  nickname?: string;
  phone?: string;
  createdAt?: string;
}

export interface LoginResponse {
  status: number;
  code?: number;
  msg?: string;
  data: { token: string; userInfo: UserInfo };
}

export interface NfcCard {
  ncode: string;
  jhm?: string;
  goTo?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
}

export interface ListResponse {
  status: number;
  code?: number;
  msg?: string;
  data: NfcCard[];
  total?: number;
}

export interface CountResponse {
  status: number;
  msg?: string;
  data: number;
}

export interface GenericResponse<T = unknown> {
  status: number;
  code?: number;
  msg?: string;
  data?: T;
}

export class ApiError extends Error {
  code?: number;
  status?: number;
  tokenExpired: boolean;
  constructor(message: string, opts: { code?: number; status?: number; tokenExpired?: boolean } = {}) {
    super(message);
    this.code = opts.code;
    this.status = opts.status;
    this.tokenExpired = !!opts.tokenExpired;
  }
}

let tokenProvider: () => string | null = () => null;
let reloginHandler: () => Promise<string | null> = async () => null;

export function configureAuth(opts: {
  getToken: () => string | null;
  relogin: () => Promise<string | null>;
}) {
  tokenProvider = opts.getToken;
  reloginHandler = opts.relogin;
}

async function rawRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status} em ${path}`, { status: res.status });
  }
  return (await res.json()) as T;
}

async function request<T>(
  path: string,
  body: Record<string, unknown>,
  opts: { auth?: boolean; retried?: boolean } = {}
): Promise<T> {
  const needsAuth = opts.auth !== false;
  const payload: Record<string, unknown> = { ...body };
  if (needsAuth) {
    const t = tokenProvider();
    if (!t) {
      const fresh = await reloginHandler();
      if (!fresh) throw new ApiError('Sessão expirada. Faça login novamente.', { tokenExpired: true });
      payload.token = fresh;
    } else {
      payload.token = t;
    }
  }

  const json = await rawRequest<{ status: number; code?: number; msg?: string; data?: unknown; total?: number }>(
    path,
    payload
  );

  const code = json.code ?? 0;
  const expired = TOKEN_EXPIRED_CODES.has(code);

  if (needsAuth && expired) {
    if (opts.retried) {
      throw new ApiError(json.msg || 'Token inválido', { code, tokenExpired: true });
    }
    const fresh = await reloginHandler();
    if (!fresh) throw new ApiError('Não foi possível renovar a sessão.', { tokenExpired: true });
    return request<T>(path, body, { ...opts, retried: true });
  }

  // Convenção do nfckin: status !== 0 = sucesso; status === 0 = falha.
  if (json.status === 0) {
    throw new ApiError(json.msg || 'Falha na requisição', { code, status: json.status });
  }
  return json as unknown as T;
}

export const api = {
  login(email: string, password: string) {
    return rawRequest<LoginResponse>('/Login/login', { email, password });
  },
  register(email: string, password: string) {
    return rawRequest<LoginResponse>('/Login/registe', { email, password });
  },
  sendResetCode(email: string) {
    return rawRequest<GenericResponse>('/Login/sendResetCode', { email });
  },
  resetPassword(email: string, code: string, newPassword: string) {
    return rawRequest<GenericResponse>('/Login/resetPassword', { email, code, newPassword });
  },
  activate(jhm: string, ncode: string, goTo: string) {
    return request<GenericResponse<NfcCard>>('/Index/activate', { jhm, ncode, goTo });
  },
  list(page = 1, limit = 20, keyword = '') {
    return request<ListResponse>('/Index/activateList', { p: page, limit, keyword });
  },
  count() {
    return request<CountResponse>('/Index/activateCount', {});
  },
  getNcodeInfo(ncode: string) {
    return request<GenericResponse<NfcCard>>('/Index/getNcodeInfo', { ncode });
  },
  updateGoTo(ncode: string, goTo: string) {
    return request<GenericResponse>('/Index/updateFormContent', { ncode, goTo });
  },
  updateProfile(nickname: string, email: string) {
    return request<GenericResponse<UserInfo>>('/Index/updateProfile', { nickname, email });
  },
  changePassword(oldPassword: string, newPassword: string) {
    return request<GenericResponse>('/Index/changePassword', { old: oldPassword, new: newPassword });
  },
};
