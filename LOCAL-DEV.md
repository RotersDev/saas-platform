# 🏠 Guia de Desenvolvimento Local

Este guia explica como rodar o projeto localmente para desenvolvimento.

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Git

## 🚀 Setup Rápido

### 1. Iniciar PostgreSQL com Docker

```bash
# Na raiz do projeto
docker-compose up -d postgres
```

Isso vai iniciar o PostgreSQL na porta 5432 com:

- **Usuário:** `postgres`
- **Senha:** `postgres`
- **Database:** `saas_platform`

### 2. Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env  # Se existir
# Ou crie um arquivo .env manualmente
```

**Arquivo `.env` para desenvolvimento local:**

```env
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Banco de dados (Docker)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=saas_platform

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_para_dev
JWT_EXPIRES_IN=7d

# Outras configurações (opcionais)
BASE_DOMAIN=nerix.online
```

### 3. Instalar dependências

```bash
# Backend
cd backend
npm install

# Frontend (em outro terminal)
cd frontend
npm install
```

### 4. Rodar em desenvolvimento

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### 5. Acessar

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## 🛑 Parar serviços

```bash
# Parar PostgreSQL
docker-compose down

# Ou parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## 🔧 Troubleshooting

### PostgreSQL não conecta

```bash
# Verificar se o container está rodando
docker ps

# Ver logs do PostgreSQL
docker-compose logs postgres

# Reiniciar o container
docker-compose restart postgres
```

### Porta 5432 já está em uso

Se você já tem PostgreSQL rodando na porta 5432, você pode:

1. **Parar o PostgreSQL local:**

   ```bash
   # Windows
   net stop postgresql-x64-15

   # Linux/Mac
   sudo systemctl stop postgresql
   ```

2. **Ou mudar a porta no docker-compose.yml:**

   ```yaml
   ports:
     - "5433:5432" # Mude para 5433
   ```

   E atualize o `.env`:

   ```env
   DB_PORT=5433
   ```

### Erro de conexão com banco

Certifique-se de que:

- O Docker está rodando
- O container do PostgreSQL está ativo: `docker ps`
- As credenciais no `.env` estão corretas
- A porta não está bloqueada por firewall

## 📝 Notas

- O banco de dados é persistido em um volume Docker, então os dados não são perdidos ao parar o container
- Para resetar o banco completamente: `docker-compose down -v` (CUIDADO!)
- Em desenvolvimento, o backend recarrega automaticamente com `tsx watch`
- O frontend usa Vite HMR (Hot Module Replacement) para atualizações instantâneas
