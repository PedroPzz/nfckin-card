import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: Props) {
  const ref = useRef<Html5Qrcode | null>(null);
  const regionId = 'qr-region';

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const scanner = new Html5Qrcode(regionId, { verbose: false });
        ref.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            if (!cancelled) {
              onScan(decoded);
              stop();
            }
          },
          () => {}
        );
      } catch (e: any) {
        if (!cancelled) {
          alert('Não foi possível iniciar a câmera: ' + (e?.message || e));
          onClose();
        }
      }
    }
    async function stop() {
      try {
        const s = ref.current;
        if (s) {
          if (s.isScanning) await s.stop();
          s.clear();
        }
      } catch {}
      ref.current = null;
    }
    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [onScan, onClose]);

  return (
    <div className="scanner">
      <button className="close" onClick={onClose} type="button">✕ Fechar</button>
      <div id={regionId} />
      <div className="hint">Aponte a câmera para o QR code do card NFCkin</div>
    </div>
  );
}
