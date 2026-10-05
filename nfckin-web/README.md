# NFCkin Manager — Web App (PWA)

Web app instalável para gerenciar seus cards NFCkin. Roda em qualquer navegador (iOS Safari, Android Chrome, desktop) e pode ser adicionado à tela inicial como se fosse um app nativo.

> ⚠️ **Aviso**: engenharia reversa da API privada do `nfckin.com`. Não é oficial. Pode quebrar se o site mudar. Troque sua senha antes de usar (ela foi exposta em texto claro nesta conversa).

## Arquitetura

```
┌──────────────────┐        ┌────────────────────┐        ┌──────────────────┐
│  Navegador (PWA) │◄──────►│  Proxy Node/Express│◄──────►│   nfckin.com     │
│  React + Vite    │  /api  │  porta 8787        │  HTTP  │   (API interna)  │
└──────────────────┘        └────────────────────┘        └──────────────────┘
```

**Por que o proxy?**
1. **CORS**: `nfckin.com` não envia headers `Access-Control-Allow-Origin` → o navegador bloquearia chamadas diretas.
2. **Mixed content**: se você hospedar em HTTPS, chamar HTTP é bloqueado.
3. **Sessão de ~1 min**: o proxy guarda o token + credenciais em memória e **re-autentica automaticamente** quando recebe os códigos `1401`/`11101`.
4. **Cookie httpOnly**: o token nunca chega ao JavaScript do navegador (menos superfície para XSS).

## Como rodar

```bash
cd nfckin-web
npm install
npm run dev
```

Isso sobe dois processos:
- **Proxy**: `http://localhost:8787`
- **Frontend (Vite)**: `http://localhost:5173` (com proxy `/api` → 8787)

Abra `http://localhost:5173` no navegador.

### Acessar do celular na mesma rede Wi-Fi

O Vite já escuta em `0.0.0.0`. Descubra o IP do seu PC:

```bash
# Windows
ipconfig | findstr IPv4
# macOS/Linux
ifconfig | grep inet
```

No celular, abra `http://SEU_IP:5173` (ex: `http://192.168.100.2:5173`).

**Importante para a câmera (QR scanner)**: navegadores móveis **só permitem `getUserMedia` em HTTPS ou `localhost`**. Para usar o scanner no celular, você tem 3 opções:

1. **Túnel HTTPS rápido** com ngrok:
   ```bash
   npx ngrok http 5173
   ```
   Use a URL `https://xxxx.ngrok.io` no celular.

2. **Chrome flags** (Android): habilite `chrome://flags/#unsafely-treat-insecure-origin-as-secure` e adicione `http://SEU_IP:5173`.

3. **Digitar o ncode manualmente** — o campo aceita texto, o scanner é conveniência.

### Build de produção

```bash
npm run build
npm start
```

O Express serve o `dist/` estático + as rotas `/api/*` na porta 8787. Você pode hospedar em qualquer VPS, Render, Railway, etc.

## Instalar como PWA

- **iOS (Safari)**: botão Compartilhar → **Adicionar à Tela de Início**. Abre em tela cheia, sem barra do navegador.
- **Android (Chrome)**: menu ⋮ → **Instalar app** ou **Adicionar à tela inicial**.

O `manifest.webmanifest` já está configurado com ícone, tema escuro e `display: standalone`.

## Estrutura

```
nfckin-web/
├── server/index.js            # Proxy Express (CORS + auto-relogin + sessão em memória)
├── src/
│   ├── main.tsx               # React root
│   ├── App.tsx                # Router + guards
│   ├── api.ts                 # Cliente HTTP → /api/*
│   ├── store.ts               # Zustand (session + cards com persist)
│   ├── toast.ts               # Sistema de notificações
│   ├── styles.css             # Tema dark mobile-first
│   ├── components/
│   │   ├── TabBar.tsx
│   │   ├── Toast.tsx
│   │   └── QrScanner.tsx      # html5-qrcode
│   └── screens/
│       ├── Login.tsx
│       ├── Home.tsx           # Lista de cards
│       ├── Activate.tsx       # Form + scanner QR
│       ├── Detail.tsx         # Editar goTo
│       └── Settings.tsx
├── public/
│   ├── manifest.webmanifest
│   └── icon.svg
├── index.html
├── vite.config.js
├── package.json
└── tsconfig.json
```

## Fluxo de ativação do seu card

Dados que você forneceu:
- **ncode (QR)**: `D6nWTviAyMdBlO3weE`
- **jhm (ativação)**: `CE60414`
- **goTo**: sua URL (`http://` ou `https://`)

1. Abra o app → **Login** com suas credenciais NFCkin.
2. Marque **"Manter sessão ativa"** (o proxy guarda a senha em memória para re-login automático).
3. Toque em **+ Ativar** → preencha ou use **📷 Escanear**.
4. O card aparece na Home e fica cacheado em `localStorage` para uso offline.

## Sync

- **Auto-sync** ao abrir a Home.
- **Pull manual** no botão `↻ Sync` no topo.
- **Cache offline** em `localStorage` (chave `nfckin-cards-cache-v1`).
- **Edição** de `goTo` propaga para o nfckin e atualiza o cache local.

## Segurança

- Senha **nunca** vai para o `localStorage` do navegador — fica só na memória do proxy Node.
- Cookie de sessão é `httpOnly` + `sameSite=lax` → JavaScript do site não consegue ler.
- Se você desmarcar "Manter sessão ativa", o proxy **não guarda a senha**: quando o token expirar em ~1 min, você precisa logar de novo manualmente.
- **Recomendado para produção**: servir o proxy atrás de HTTPS (Let's Encrypt / Cloudflare / ngrok) e adicionar rate-limit.

## Limitações conhecidas

- **HTTP puro no nfckin.com**: o tráfego proxy→nfckin não é criptografado. Em rede pública, use VPN.
- **Sessão em memória**: se o proxy reiniciar, todo mundo precisa logar de novo.
- **Sem multiusuário**: o proxy guarda uma sessão por cookie, mas não há UI para trocar de conta sem sair.
- **Fragilidade**: se o nfckin mudar endpoints ou o formato de resposta, atualize `server/index.js` e `src/api.ts`.

## Roadmap sugerido

- [ ] Deploy em Render/Railway/Qoder Sites com HTTPS
- [ ] Service worker para cache offline real (não só localStorage)
- [ ] Notificações push quando um card for escaneado
- [ ] Exportar cards em CSV/JSON
- [ ] Grupos/tags locais
- [ ] Analytics de cliques por card
