import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCards } from '../store';
import { toast } from '../toast';
import QrCode from '../components/QrCode';
import { nfcSupported, readTag, writeUrl, TagReadResult } from '../nfc';

export default function Detail() {
  const { ncode = '' } = useParams();
  const nav = useNavigate();
  const { cards, updateGoTo, removeLocal, names, setName } = useCards();
  const card = cards.find((c) => c.ncode === ncode);

  const [goTo, setGoTo] = useState(card?.goTo || '');
  const [name, setNameLocal] = useState(names[ncode] || '');
  const [saving, setSaving] = useState(false);

  const [nfcBusy, setNfcBusy] = useState<'idle' | 'reading' | 'writing'>('idle');
  const [readResult, setReadResult] = useState<TagReadResult | null>(null);
  const [nfcError, setNfcError] = useState('');
  const supported = nfcSupported();

  useEffect(() => {
    setGoTo(card?.goTo || '');
  }, [card?.goTo]);
  useEffect(() => {
    setNameLocal(names[ncode] || '');
  }, [names, ncode]);

  const link = goTo.trim();

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!link) {
      toast('URL vazia', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateGoTo(ncode, link);
      setName(ncode, name);
      toast('Salvo ✓', 'success');
    } catch (e: any) {
      toast(e?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function onSaveNameOnly() {
    setName(ncode, name);
    toast('Nome salvo localmente ✓', 'success');
  }

  async function onRead() {
    setNfcError('');
    setReadResult(null);
    setNfcBusy('reading');
    try {
      const res = await readTag();
      setReadResult(res);
      toast('Tag lida ✓', 'success');
    } catch (e: any) {
      setNfcError(e?.message || 'Erro ao ler');
    } finally {
      setNfcBusy('idle');
    }
  }

  async function onWrite() {
    if (!link) {
      toast('Defina a Redirect URL antes de gravar', 'error');
      return;
    }
    setNfcError('');
    setNfcBusy('writing');
    try {
      await writeUrl(link);
      toast('Link gravado na tag ✓', 'success');
    } catch (e: any) {
      setNfcError(e?.message || 'Erro ao gravar');
    } finally {
      setNfcBusy('idle');
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copiado ✓', 'success');
    } catch {
      toast('Não foi possível copiar', 'error');
    }
  }

  function onRemove() {
    if (!confirm('Remover apenas do cache local? O card continua ativo no nfckin.com.')) return;
    removeLocal(ncode);
    nav('/', { replace: true });
  }

  if (!card) {
    return (
      <>
        <header className="topbar">
          <button className="back" onClick={() => nav(-1)} type="button">‹</button>
          <h1>Card</h1>
        </header>
        <main className="content">
          <div className="empty">
            <h3>Card não encontrado</h3>
            <p>Ele pode ter sido removido do cache. Volte e sincronize novamente.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="topbar">
        <button className="back" onClick={() => nav(-1)} type="button">‹</button>
        <h1>{names[ncode] || 'Card'}</h1>
      </header>

      <main className="content">
        {/* Identificação */}
        <div className="card">
          <div className="section-title">Identificação</div>
          <label className="label" htmlFor="cardName">Nome do card (salvo no seu app)</label>
          <div className="row">
            <input
              id="cardName"
              className="input"
              value={name}
              onChange={(e) => setNameLocal(e.target.value)}
              placeholder="Ex.: Mesa 12, Loja Centro…"
            />
            <button className="btn secondary small" type="button" onClick={onSaveNameOnly} style={{ whiteSpace: 'nowrap' }}>
              Salvar
            </button>
          </div>
          <div className="kv" style={{ marginTop: 8 }}>
            <span className="k">ncode (QR)</span>
            <span className="v" style={{ fontFamily: 'ui-monospace, monospace' }}>{card.ncode}</span>
          </div>
          {card.jhm && (
            <div className="kv">
              <span className="k">jhm (ativação)</span>
              <span className="v" style={{ fontFamily: 'ui-monospace, monospace' }}>{card.jhm}</span>
            </div>
          )}
          {card.createdAt && (
            <div className="kv">
              <span className="k">Criado em</span>
              <span className="v">{String(card.createdAt)}</span>
            </div>
          )}
        </div>

        {/* Redirect URL */}
        <form className="card" onSubmit={onSave}>
          <div className="section-title">Redirect URL</div>
          <input
            className="input"
            type="url"
            value={goTo}
            onChange={(e) => setGoTo(e.target.value)}
            placeholder="https://..."
          />
          <button className="btn" type="submit" disabled={saving} style={{ marginTop: 12 }}>
            {saving ? <span className="spinner" /> : 'Salvar alterações'}
          </button>
          <button className="btn ghost" type="button" onClick={onRemove} style={{ marginTop: 8 }}>
            Remover do cache local
          </button>
        </form>

        {/* NFC */}
        <div className="card">
          <div className="section-title">NFC — ler / gravar</div>

          {supported ? (
            <>
              <p className="meta" style={{ marginBottom: 12 }}>
                Web NFC disponível. Aproxime o card do leitor do celular.
              </p>
              <div className="row">
                <button className="btn secondary" type="button" onClick={onRead} disabled={nfcBusy !== 'idle'}>
                  {nfcBusy === 'reading' ? <span className="spinner light" /> : '📡 Ler NFC'}
                </button>
                <button className="btn" type="button" onClick={onWrite} disabled={nfcBusy !== 'idle'}>
                  {nfcBusy === 'writing' ? <span className="spinner" /> : '✍️ Gravar NFC'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginTop: 4 }}>
              <p className="meta" style={{ marginBottom: 8 }}>
                ⚠️ Este navegador não suporta Web NFC (o Safari/iOS bloqueia escrita NFC em páginas web).
                Use o QR abaixo no <b>NFC Tools</b> → <b>Escrever</b> → <b>URL / URI</b>, ou abra o app no
                <b> Chrome (Android)</b> via HTTPS para gravar direto.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <QrCode value={link || 'https://'} size={160} />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div className="meta" style={{ wordBreak: 'break-all', marginBottom: 8 }}>{link || '—'}</div>
                  <button className="btn secondary small" type="button" onClick={copyLink}>📋 Copiar link</button>
                </div>
              </div>
            </div>
          )}

          {nfcError && <div className="error-text" style={{ marginTop: 8 }}>⚠ {nfcError}</div>}

          {readResult && (
            <div style={{ marginTop: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
              <div className="section-title" style={{ marginBottom: 6 }}>Conteúdo da tag</div>
              {readResult.serial && (
                <div className="kv"><span className="k">Serial</span><span className="v" style={{ fontFamily: 'monospace' }}>{readResult.serial}</span></div>
              )}
              {readResult.records.length === 0 && <div className="meta">Tag vazia (sem registros NDEF).</div>}
              {readResult.records.map((r, i) => (
                <div className="kv" key={i}>
                  <span className="k">{r.recordType}</span>
                  <span className="v" style={{ wordBreak: 'break-all' }}>{r.text || r.hex}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
