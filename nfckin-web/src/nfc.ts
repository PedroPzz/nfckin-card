// Web NFC (W3C) — padrão aberto, nativo do Chrome/Android. Sem dependências externas.
// iOS Safari NÃO suporta escrita NFC em páginas web (bloqueio da Apple).

export function nfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

export interface NdefRecordView {
  recordType: string;
  text?: string;
  url?: string;
  hex?: string;
}

export interface TagReadResult {
  serial?: string;
  records: NdefRecordView[];
}

function dataViewToHex(dv: DataView): string {
  const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function decodeBytes(dv: DataView): string {
  try {
    return new TextDecoder().decode(dv);
  } catch {
    return '';
  }
}

export function decodeMessage(event: any): TagReadResult {
  const serial: string | undefined = event?.serialNumber || undefined;
  const records: NdefRecordView[] = (event?.message?.records || []).map((r: any) => {
    const view: NdefRecordView = { recordType: r?.recordType || 'unknown' };
    const raw = decodeBytes(r?.data);
    if (r?.recordType === 'url' || r?.recordType === 'uri') {
      view.url = raw;
      view.text = raw;
    } else if (r?.recordType === 'text') {
      view.text = raw;
    } else {
      view.text = raw;
    }
    view.hex = dataViewToHex(r?.data);
    return view;
  });
  return { serial, records };
}

export async function readTag(timeoutMs = 20000): Promise<TagReadResult> {
  if (!nfcSupported()) {
    throw new Error('Este navegador não suporta Web NFC. Use Chrome no Android, ou o fallback de QR.');
  }
  if (!isSecureContext()) {
    throw new Error('Web NFC exige HTTPS (ou localhost). Abra via túnel HTTPS (ex.: ngrok).');
  }
  const NDEFReader = (window as any).NDEFReader;
  const reader = new NDEFReader();
  return new Promise<TagReadResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      try { reader.stop?.(); } catch {}
      reject(new Error('Tempo esgotado. Aproxime o card do leitor NFC.'));
    }, timeoutMs);
    reader.onreading = (e: any) => {
      clearTimeout(timer);
      try { reader.stop?.(); } catch {}
      resolve(decodeMessage(e));
    };
    reader.onreadingerror = () => {
      clearTimeout(timer);
      try { reader.stop?.(); } catch {}
      reject(new Error('Falha ao ler a tag. Aproxime novamente e mantenha parado.'));
    };
    reader.scan().catch((err: any) => {
      clearTimeout(timer);
      reject(new Error(err?.message || 'Não foi possível iniciar a leitura NFC.'));
    });
  });
}

export async function writeUrl(url: string): Promise<void> {
  if (!nfcSupported()) {
    throw new Error('Este navegador não suporta Web NFC. Use Chrome no Android, ou o fallback de QR.');
  }
  if (!isSecureContext()) {
    throw new Error('Web NFC exige HTTPS (ou localhost). Abra via túnel HTTPS (ex.: ngrok).');
  }
  const NDEFReader = (window as any).NDEFReader;
  const writer = new NDEFReader();
  await writer.write({ records: [{ recordType: 'url', data: url }] });
}

export async function writeText(text: string): Promise<void> {
  if (!nfcSupported()) {
    throw new Error('Este navegador não suporta Web NFC.');
  }
  if (!isSecureContext()) {
    throw new Error('Web NFC exige HTTPS (ou localhost).');
  }
  const NDEFReader = (window as any).NDEFReader;
  const writer = new NDEFReader();
  await writer.write({ records: [{ recordType: 'text', data: text }] });
}
