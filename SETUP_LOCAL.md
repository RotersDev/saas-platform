# Configuração Local - Guia Rápido

## Opção 1: Usar Docker (RECOMENDADO - Mais Fácil)

### 1. Instalar Docker Desktop

- Baixe e instale: https://www.docker.com/products/docker-desktop
- Inicie o Docker Desktop

### 2. Iniciar apenas o PostgreSQL via Docker

```bash
docker run --name saas_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=saas_platform -p 5432:5432 -d postgres:14-alpine
```

### 3. Aguardar o banco iniciar (alguns segundos)

### 4. Instalar dependências (se ainda não instalou)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Configurar variáveis de ambiente

Crie o arquivo `backend/.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados (usando Docker)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_platform
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui_mude_em_producao
JWT_EXPIRES_IN=7d

# Mercado Pago (configure depois)
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
BASE_DOMAIN=localhost
```

### 6. Criar as tabelas do banco

```bash
cd backend
# Primeiro, vamos criar as tabelas manualmente via Sequelize sync
npx tsx -e "import sequelize from './src/config/database'; import './src/models'; sequelize.sync({ alter: true }).then(() => { console.log('✅ Tabelas criadas!'); process.exit(0); });"
```

### 7. Criar dados iniciais

```bash
cd backend
npx tsx src/seeders/initialData.ts
```

### 8. Iniciar o servidor

```bash
# Na raiz do projeto
npm run dev
```

---

## Opção 2: Instalar PostgreSQL Manualmente

### 1. Instalar PostgreSQL

**Windows:**

- Baixe: https://www.postgresql.org/download/windows/
- Durante a instalação, defina senha do usuário `postgres`
- Anote a senha!

### 2. Criar banco de dados

Abra o **pgAdmin** ou **psql** e execute:

```sql
CREATE DATABASE saas_platform;
```

Ou via linha de comando:

```bash
# Se o PostgreSQL estiver no PATH
createdb -U postgres saas_platform
```

### 3. Configurar .env

Use as mesmas configurações da Opção 1, mas ajuste a senha:

```env
DB_PASSWORD=sua_senha_do_postgres
```

### 4. Continuar a partir do passo 6 da Opção 1

---

## Verificar se está funcionando

### Backend

- Acesse: http://localhost:3000/health
- Deve retornar: `{"status":"ok","timestamp":"..."}`

### Frontend

- Acesse: http://localhost:5173
- Deve abrir a página inicial

### Login Admin

- Acesse: http://localhost:5173/admin
- Email: `admin@platform.com`
- Senha: `admin123`

---

## Problemas Comuns

### Erro: "vite não é reconhecido"

```bash
cd frontend
npm install
```

### Erro: "Cannot connect to database"

1. Verifique se o PostgreSQL está rodando
2. Verifique as credenciais no `.env`
3. Teste a conexão:

   ```bash
   # Com Docker
   docker ps

   # Ver logs do container
   docker logs saas_postgres
   ```

### Erro: "Port 3000 already in use"

- Altere a porta no `backend/.env`: `PORT=3001`
- Ou pare o processo que está usando a porta

### Erro: "Port 5173 already in use"

- Altere no `frontend/vite.config.ts`
- Ou pare o processo que está usando a porta

---

## Comandos Úteis

### Parar o PostgreSQL (Docker)

```bash
docker stop saas_postgres
```

### Iniciar o PostgreSQL (Docker)

```bash
docker start saas_postgres
```

### Ver logs do PostgreSQL

```bash
docker logs saas_postgres
```

### Remover o container (se precisar recriar)

```bash
docker stop saas_postgres
docker rm saas_postgres
```

---

## Próximos Passos

1. ✅ Banco de dados rodando
2. ✅ Tabelas criadas
3. ✅ Dados iniciais inseridos
4. ✅ Servidor rodando
5. 🔄 Configure o Mercado Pago no `.env`
6. 🔄 Crie sua primeira loja pelo painel admin

