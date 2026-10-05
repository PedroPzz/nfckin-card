import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../store';
import { toast } from '../toast';

const SAVED_KEY = 'nfckin_last_email';

export default function Login() {
  const nav = useNavigate();
  const { login, loading } = useSession();
  const [email, setEmail] = useState(() => localStorage.getItem(SAVED_KEY) || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast('Informe email e senha', 'error');
      return;
    }
    try {
      await login(email.trim(), password, remember);
      if (remember) localStorage.setItem(SAVED_KEY, email.trim());
      else localStorage.removeItem(SAVED_KEY);
      toast('Login realizado ✓', 'success');
      nav('/', { replace: true });
    } catch (err: any) {
      toast(err?.message || 'Falha no login', 'error');
    }
  }

  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="hero">
        <h1 className="logo">NFCkin</h1>
        <p className="subtitle">Gerenciador independente dos seus cards</p>
      </div>

      <form className="card" onSubmit={onSubmit}>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          required
        />

        <label className="label" htmlFor="password">Senha</label>
        <div className="row">
          <input
            id="password"
            className="input"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            className="btn secondary small"
            onClick={() => setShowPass((v) => !v)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {showPass ? 'Ocultar' : 'Ver'}
          </button>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Manter sessão ativa (renova automaticamente quando o NFCkin expirar em ~1 min)</span>
        </label>

        <button className="btn" type="submit" disabled={loading} style={{ marginTop: 20 }}>
          {loading ? <span className="spinner" /> : 'Entrar'}
        </button>

        <p className="disclaimer">
          ⚠️ Este app usa engenharia reversa da API do nfckin.com. Sua senha fica apenas no
          servidor proxy local (memória) e nunca é enviada a terceiros. O serviço pode quebrar
          sem aviso se o site mudar.
        </p>
      </form>
    </div>
  );
}
