import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCards, useSession } from '../store';
import { toast } from '../toast';

function fmt(ts: number | null) {
  if (!ts) return 'nunca';
  return new Date(ts).toLocaleString();
}

export default function Home() {
  const nav = useNavigate();
  const { user } = useSession();
  const { cards, total, lastSyncAt, status, error, sync, names } = useCards();

  useEffect(() => {
    sync().catch((e) => toast(e?.message || 'Erro na sync', 'error'));
  }, [sync]);

  async function manualSync() {
    try {
      await sync();
      toast('Sincronizado ✓', 'success');
    } catch (e: any) {
      toast(e?.message || 'Erro', 'error');
    }
  }

  return (
    <>
      <header className="topbar">
        <h1>Meus cards</h1>
        <button className="btn ghost small" onClick={manualSync} disabled={status === 'syncing'}>
          {status === 'syncing' ? <span className="spinner light" /> : '↻ Sync'}
        </button>
      </header>

      <main className="content">
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>
                Olá, {user?.nickname || user?.email || 'usuário'}
              </div>
              <div className="meta">
                {cards.length} / {total} cards · sync: {fmt(lastSyncAt)}
              </div>
            </div>
            {status === 'syncing' && <span className="spinner light" />}
          </div>
          {status === 'error' && error && <div className="error-text">⚠ {error}</div>}
        </div>

        {cards.length === 0 && status !== 'syncing' ? (
          <div className="empty">
            <h3>Nenhum card ainda</h3>
            <p>
              Ative um produto usando o QR code + código de ativação que vieram no seu card físico.
            </p>
            <Link to="/activate" className="btn" style={{ marginTop: 12, display: 'inline-flex', width: 'auto', padding: '12px 24px' }}>
              + Ativar primeiro card
            </Link>
          </div>
        ) : (
          cards.map((c) => (
            <Link key={c.ncode} to={`/card/${encodeURIComponent(c.ncode)}`} className="card-item">
              <div className="body">
                {names[c.ncode] ? <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{names[c.ncode]}</div> : null}
                <div className="ncode">{c.ncode}</div>
                <div className="goTo">{c.goTo || '— sem redirect —'}</div>
                {c.jhm && <div className="jhm">jhm: {c.jhm}</div>}
              </div>
              <div className="chevron">›</div>
            </Link>
          ))
        )}
      </main>
    </>
  );
}
