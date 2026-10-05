import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let alive = true;
    if (!value) return;
    QRCode.toDataURL(value, { margin: 1, width: size, errorCorrectionLevel: 'M' })
      .then((url) => { if (alive) { setDataUrl(url); setError(''); } })
      .catch((e) => { if (alive) setError(e?.message || 'Erro ao gerar QR'); });
    return () => { alive = false; };
  }, [value, size]);

  if (error) return <div className="error-text">{error}</div>;
  if (!dataUrl) return <div className="spinner light" style={{ width: 24, height: 24 }} />;
  return (
    <img
      src={dataUrl}
      alt={`QR para ${value}`}
      style={{ width: size, height: size, borderRadius: 8, background: '#fff', padding: 6 }}
    />
  );
}
