# NFCkin Manager

App **React Native (Expo)** independente para gerenciar seus cards NFCkin: ativar produtos, listar, editar redirect URLs e sincronizar — sem depender do site toda vez.

> ⚠️ **Aviso importante**: este app faz engenharia reversa da API privada do `nfckin.com`. Não é uma integração oficial. Pode quebrar a qualquer momento se o site mudar, e provavelmente viola os Termos de Serviço deles. Use por sua conta e risco. O caminho "sério" seria pedir uma API oficial em `xushiqin66@163.com`.

---

## Como funciona

Todos os requests vão direto do celular para `http://nfckin.com/index.php`, com `POST` JSON. Os endpoints mapeados por análise estática do bundle do site:

| Endpoint | Payload | Descrição |
|---|---|---|
| `/Login/login` | `{email, password}` | Retorna `{token, userInfo}` |
| `/Index/activate` | `{jhm, ncode, goTo, token}` | Ativa produto |
| `/Index/activateList` | `{p, limit, keyword, token}` | Lista paginada |
| `/Index/activateCount` | `{token}` | Total |
| `/Index/getNcodeInfo` | `{ncode, token}` | Detalhe |
| `/Index/updateFormContent` | `{ncode, goTo, token}` | Editar redirect URL |
| `/Index/updateProfile` | `{nickname, email, token}` | Perfil |
| `/Index/changePassword` | `{old, new, token}` | Trocar senha |

**Respostas** têm formato `{status, code, msg, data}`. `status === 0` = sucesso. **Códigos `1401` e `11101` = token expirado** — o famoso timeout de ~1 minuto do NFCkin. O cliente detecta e chama `/Login/login` de novo automaticamente com as credenciais guardadas no Keychain/Keystore.

## Sessão de ~1 minuto

O token do NFCkin expira muito rápido. O app resolve isso assim:

1. **Credenciais salvas no SecureStore** (Keychain no iOS, Keystore no Android) quando você marca "Manter sessão ativa".
2. **Todo request** intercepta os códigos `1401/11101`.
3. **Auto re-login** transparente: o `apiClient` pega um token novo e repete a chamada uma única vez.
4. Se o re-login falhar (senha trocada, conta bloqueada), o app joga você de volta pra tela de Login.

## Setup

Pré-requisitos: Node 18+, npm ou yarn, e o app **Expo Go** instalado no celular (ou um emulador Android/iOS).

```bash
cd nfckin-app
npm install
npx expo start
```

Escaneie o QR code que aparecer no terminal com o Expo Go (Android) ou a câmera (iOS).

### Rodar em device físico sem Expo Go (recomendado para produção)

```bash
npx expo prebuild
npx expo run:android    # ou run:ios
```

Isso cria projetos nativos e permite usar a câmera para escanear os QR codes dos cards.

## Estrutura

```
nfckin-app/
├── App.tsx                          # Root + navegação
├── src/
│   ├── api/nfckin.ts                # Cliente HTTP + auto-relogin
│   ├── store/
│   │   ├── auth.ts                  # Zustand + SecureStore
│   │   └── cards.ts                 # Cache local + sync
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx           # Lista de cards
│   │   ├── ActivateScreen.tsx       # Form + scanner QR
│   │   ├── CardDetailScreen.tsx     # Editar goTo
│   │   └── SettingsScreen.tsx
│   └── theme/colors.ts
└── app.json
```

## Fluxo de ativação do seu card

Com os dados que você informou:

- **ncode (QR code)**: `D6nWTviAyMdBlO3weE`
- **jhm (código de ativação)**: `CE60414`
- **goTo (redirect URL)**: sua URL começando com `http://` ou `https://`

Abra o app → **Login** → **+ Ativar** → preencha (ou use o 📷 para escanear o QR) → **Ativar card**. O card aparece na Home e fica cacheado offline.

## Sync bidirecional

- **Pull-to-refresh** na Home → chama `/Index/activateList` paginado, mescla com o cache por `ncode`.
- **Ativação** já insere o card novo no cache imediatamente, sem esperar a próxima sync.
- **Edição** de `goTo` chama `/Index/updateFormContent` e atualiza o cache local.
- **Cache offline** em AsyncStorage — o app abre mostrando os últimos dados mesmo sem internet.

## Segurança

- Senha **nunca** vai para AsyncStorage — só para o SecureStore (com hardware-backed encryption).
- Se você desmarcar "Manter sessão ativa", a senha é apagada do dispositivo ao sair.
- Nenhum dado é enviado para servidores meus — só para o `nfckin.com`.

## Limitações conhecidas

- **HTTP puro** (não HTTPS): o `nfckin.com` só serve em HTTP, então o token e a senha trafegam em texto claro na rede. Em Wi-Fi público, use uma VPN.
- **Sem refresh token**: a API não expõe renovação — só re-login completo.
- **Fragilidade**: se o site mudar de stack ou endpoints, o app quebra até você atualizar `src/api/nfckin.ts`.

## Próximos passos sugeridos

- [ ] Notificações push quando um card for escaneado (depende de o NFCkin expor isso)
- [ ] Grupos/tags locais para organizar cards
- [ ] Exportar cache em CSV/JSON
- [ ] Modo "quiosque" — mostrar analytics de cliques por card
- [ ] Testes E2E com Detox

## Troque sua senha

Sua senha foi compartilhada em texto claro nesta conversa. **Recomendo trocar agora** em `nfckin.com` → Perfil → Change Password, e só então logar no app com a senha nova.
