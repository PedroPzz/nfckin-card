import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCards } from '../store';
import { toast } from '../toast';
import QrScanner from '../components/QrScanner';

export default function Activate() {
  const nav = useNavigate();
  const { activate, status } = useCards();
  const [jhm, setJhm] = useState('');
  const [ncode, setNcode] = useState('');
  const [goTo, setGoTo] = useState('https://');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!jhm.trim() || !ncode.trim() || !goTo.trim()) {
      toast('Preencha os 3 campos', 'error');
      return;
    }
    if (!/^https?:\/\//i.test(goTo.trim())) {
      toast('Redirect URL deve começar com http:// ou https://', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await activate(jhm, ncode, goTo);
      toast('Card ativado ✓', 'success');
      nav('/', { replace: true });
    } catch (e: any) {
      toast(e?.message || 'Erro ao ativar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <button className="back" onClick={() => nav(-1)} type="button">‹</button>
        <h1>Ativar produto</h1>
      </header>

      <main className="content">
        <p className="meta" style={{ marginBottom: 16 }}>
          Preencha os 3 dados que vieram no seu card físico NFCkin.
        </p>

        <form className="card" onSubmit={onSubmit}>
          <label className="label" htmlFor="ncode">Código do produto (QR Code) — ncode</label>
          <div className="row">
            <input
              id="ncode"
              className="input mono"
              value={ncode}
              onChange={(e) => setNcode(e.target.value)}
              placeholder="D6nWTviAyMdBlO3weE"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
            <button type="button" className="btn secondary small" onClick={() => setScanning(true)}>
              📷 Escanear
            </button>
          </div>

          <label className="label" htmlFor="jhm">Código de ativação (abaixo do QR) — jhm</label>
          <input
            id="jhm"
            className="input mono"
            value={jhm}
            onChange={(e) => setJhm(e.target.value.toUpperCase())}
            placeholder="CE60414"
            autoCapitalize="characters"
            autoCorrect="off"
            required
          />

          <label className="label" htmlFor="goTo">Redirect URL — goTo</label>
          <input
            id="goTo"
            className="input"
            type="url"
            inputMode="url"
            value={goTo}
            onChange={(e) => setGoTo(e.target.value)}
            placeholder="https://exemplo.com/pagina"
            autoCapitalize="none"
            required
          />

          <button className="btn" type="submit" disabled={submitting || status === 'syncing'} style={{ marginTop: 20 }}>
            {submitting ? <span className="spinner" /> : 'Ativar card'}
          </button>
        </form>
      </main>

      {scanning && (
        <QrScanner
          onScan={(data) => {
            setNcode(data);
            setScanning(false);
            toast('QR lido ✓', 'success');
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}
