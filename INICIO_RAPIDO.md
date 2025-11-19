# 🚀 Início Rápido - Teste Local

## Passo a Passo Simplificado

### 1️⃣ Instalar Docker Desktop (se não tiver)

- Download: https://www.docker.com/products/docker-desktop
- Instale e inicie o Docker Desktop

### 2️⃣ Iniciar PostgreSQL via Docker

Abra um terminal e execute:

```bash
docker run --name saas_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=saas_platform -p 5432:5432 -d postgres:14-alpine
```

Aguarde alguns segundos para o banco iniciar.

### 3️⃣ Instalar Dependências

```bash
# Backend
cd backend
npm install

# Frontend (volte para a raiz primeiro)
cd ..
cd frontend
npm install
```

### 4️⃣ Criar arquivo .env do Backend

Crie o arquivo `backend/.env` com este conteúdo:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_platform
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=seu_secret_super_seguro_123456
JWT_EXPIRES_IN=7d

MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
BASE_DOMAIN=localhost
```

### 5️⃣ Criar Tabelas do Banco

```bash
cd backend
npm run db:sync
```

### 6️⃣ Criar Dados Iniciais

```bash
npm run db:seed
```

Você verá:

```
✅ Dados iniciais criados com sucesso!
📧 Master Admin: admin@platform.com
🔑 Senha: admin123
```

### 7️⃣ Iniciar o Servidor

Na raiz do projeto:

```bash
npm run dev
```

### 8️⃣ Acessar a Plataforma

- **Admin Master**: http://localhost:5173/admin

  - Email: `admin@platform.com`
  - Senha: `admin123`

- **Frontend**: http://localhost:5173

---

## ✅ Verificar se está funcionando

### Teste o Backend

Abra no navegador: http://localhost:3000/health

Deve aparecer:

```json
{ "status": "ok", "timestamp": "2024-..." }
```

### Teste o Frontend

Abra: http://localhost:5173

Deve carregar a página inicial.

---

## 🐛 Problemas?

### Erro: "Cannot connect to database"

```bash
# Verificar se o Docker está rodando
docker ps

# Ver logs do PostgreSQL
docker logs saas_postgres

# Se não estiver rodando, inicie:
docker start saas_postgres
```

### Erro: "vite não é reconhecido"

```bash
cd frontend
npm install
```

### Erro: "Port already in use"

- Porta 3000: Altere `PORT=3001` no `backend/.env`
- Porta 5173: Pare outros processos ou altere no `vite.config.ts`

---

## 📝 Próximos Passos

1. ✅ Banco rodando
2. ✅ Tabelas criadas
3. ✅ Servidor iniciado
4. 🔄 Faça login no admin
5. 🔄 Crie sua primeira loja
6. 🔄 Configure o Mercado Pago (opcional por enquanto)
