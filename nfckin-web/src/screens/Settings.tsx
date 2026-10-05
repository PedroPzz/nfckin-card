import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCards, useSession } from '../store';
import { toast } from '../toast';

export default function Settings() {
  const nav = useNavigate();
  const { user, logout } = useSession();
  const { cards, lastSyncAt, sync, status } = useCards();
  const [confirming, setConfirming] = useState(false);

  async function manualSync() {
    try {
      await sync();
      toast('Sincronizado ✓', 'success');
    } catch (e: any) {
      toast(e?.message || 'Erro', 'error');
    }
  }

  async function doLogout() {
    await logout();
    nav('/login', { replace: true });
  }

  return (
    <>
      <header className="topbar">
        <button className="back" onClick={() => nav('/')} type="button">‹</button>
        <h1>Configurações</h1>
      </header>

      <main className="content">
        <div className="card">
          <div className="section-title">Conta</div>
          <div className="kv"><span className="k">Email</span><span className="v">{user?.email || '—'}</span></div>
          <div className="kv"><span className="k">Apelido</span><span className="v">{user?.nickname || '—'}</span></div>
          <div className="kv"><span className="k">Telefone</span><span className="v">{user?.phone || '—'}</span></div>
          <div className="kv"><span className="k">Membro desde</span><span className="v">{user?.createdAt || '—'}</span></div>
        </div>

        <div className="card">
          <div className="section-title">Sincronização</div>
          <div className="kv"><span className="k">Cards em cache</span><span className="v">{cards.length}</span></div>
          <div className="kv">
            <span className="k">Última sync</span>
            <span className="v">{lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'nunca'}</span>
          </div>
          <button className="btn" onClick={manualSync} disabled={status === 'syncing'} style={{ marginTop: 12 }}>
            {status === 'syncing' ? <span className="spinner" /> : 'Sincronizar agora'}
          </button>
        </div>

        <div className="card">
          <div className="section-title">Instalar como app</div>
          <p className="meta" style={{ marginBottom: 8 }}>
            No iPhone/iPad: Safari → botão Compartilhar → <b>Adicionar à Tela de Início</b>.
            <br />
            No Android: Chrome → menu ⋮ → <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.
          </p>
        </div>

        <div className="card">
          <div className="section-title">Sobre</div>
          <p className="meta">
            Este web app gerencia seus cards NFCkin chamando a API interna do nfckin.com através de
            um proxy local. A sessão do site expira em ~1 minuto — o proxy re-autentica
            automaticamente usando as credenciais guardadas em memória no servidor.
          </p>
          <p className="meta" style={{ marginTop: 8 }}>
            Suporte oficial NFCkin: <a href="mailto:xushiqin66@163.com" style={{ color: 'var(--primary)' }}>xushiqin66@163.com</a>
          </p>
        </div>

        {confirming ? (
          <div className="card">
            <div className="section-title" style={{ color: 'var(--danger)' }}>Confirmar saída</div>
            <p className="meta">Isso apaga a sessão no proxy e o cache local deste navegador.</p>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={() => setConfirming(false)}>Cancelar</button>
              <button className="btn danger" onClick={doLogout}>Sair</button>
            </div>
          </div>
        ) : (
          <button className="btn danger" onClick={() => setConfirming(true)}>Sair da conta</button>
        )}
      </main>
    </>
  );
}
