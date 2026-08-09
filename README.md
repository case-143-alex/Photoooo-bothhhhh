# 📸 Photobooth · Acampamento KKP — Festa Ágape

Aplicação de photobooth profissional para eventos.

---

## 🚀 Deploy Rápido

### Opção 1 — Railway / Render / Fly.io
```bash
npm install
npm run build
npm start
```

### Opção 2 — Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Variáveis de Ambiente
```env
PORT=3000
NODE_ENV=production
```

---

## 📱 Uso

### Booth (PC do evento)
Abre: `http://localhost:3000/booth`

### Telemóvel (participantes)
Lê o QR Code mostrado no ecrã do Booth.
Ou abre: `http://<IP-DO-PC>:3000/phone/<SESSION-ID>`

**⚠️ Para acesso em rede local:** o PC e os telemóveis precisam estar na mesma rede Wi-Fi.

---

## 📂 Personalizar Assets

Troca os ficheiros em `/public` sem alterar código:

```
public/
  audio/
    shutter.mp3 → Som da captura
    confirm.mp3 → Som de confirmação/seleção
    select.mp3  → Som de seleção
```

---

## 🛠️ Desenvolvimento

```bash
npm install
npm run dev   # Porta 3000
```

---

## ✨ Features

- 📸 4 fotos automáticas com countdown
- ⚡ Flash visual no momento da captura
- 📱 Interface mobile-first para telemóveis
- 🔴 Tempo real via Socket.IO
- ⬇️ Download individual de cada uma das 4 fotografias (no Booth e no telemóvel)
