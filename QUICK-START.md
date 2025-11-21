# ⚡ Guia Rápido de Deploy

## 🚀 Deploy Rápido na VPS

### 1. Conectar na VPS

```bash
ssh root@72.61.56.208
```

### 2. Setup Inicial (APENAS UMA VEZ)

```bash
# Instalar dependências
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx git
npm install -g pm2

# Configurar PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE saas_platform;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'sua_senha_segura';"
```

### 3. Clonar Repositório Git

```bash
cd /var/www
git clone https://github.com/RotersDev/saas-platform.git saas-platform
cd saas-platform
```

### 4. Configurar Ambiente

```bash
cd /var/www/saas-platform/backend
cp env.example .env
nano .env  # Configure as variáveis
```

**Variáveis importantes para VPS:**

```env
NODE_ENV=production
PORT=3000
APP_URL=http://72.61.56.208
FRONTEND_URL=http://72.61.56.208
DB_HOST=127.0.0.1
DB_PASSWORD=sua_senha_postgres
JWT_SECRET=seu_secret_super_seguro
```

### 5. Configurar Nginx

```bash
cd /var/www/saas-platform
cp nerix-wildcard.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/nerix-wildcard.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**Nota:** O arquivo `nerix-wildcard.conf` já está configurado para wildcard (`*.nerix.online`). Se ainda não tiver SSL configurado, você precisará ajustar temporariamente ou configurar SSL com Certbot.

### 6. Deploy

```bash
cd /var/www/saas-platform
chmod +x deploy.sh
./deploy.sh
```

### 7. Verificar

```bash
pm2 status
pm2 logs saas-platform-backend
```

Acesse: `http://72.61.56.208`

---

## 🏠 Desenvolvimento Local

### 1. Iniciar PostgreSQL com Docker

```bash
# Na raiz do projeto
docker-compose up -d postgres
```

Isso inicia o PostgreSQL na porta 5432 com:

- **Usuário:** `postgres`
- **Senha:** `postgres`
- **Database:** `saas_platform`

### 2. Configurar variáveis de ambiente

```bash
cd backend
# Crie um arquivo .env (se não existir)
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

# Outras configurações
BASE_DOMAIN=nerix.online
```

### 3. Instalar dependências

```bash
# Backend
cd backend
npm install

# Frontend (em outro terminal ou depois)
cd frontend
npm install
```

### 4. Rodar em desenvolvimento

**Opção 1: Rodar tudo junto (raiz do projeto)**

```bash
# Na raiz do projeto
npm run dev
```

**Opção 2: Rodar separadamente**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Acessar

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### 6. Parar serviços

```bash
# Parar PostgreSQL
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### 🔧 Troubleshooting Local

**PostgreSQL não conecta:**

```bash
# Verificar se o container está rodando
docker ps

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

**Porta 5432 já está em uso:**

- Pare o PostgreSQL local ou mude a porta no `docker-compose.yml`

---

## 🔄 Atualizar Código na VPS

**Super simples agora!**

### 1. No seu computador local:

```bash
git add .
git commit -m "sua mensagem"
git push
```

### 2. Na VPS:

```bash
ssh root@72.61.56.208
cd /var/www/saas-platform
./deploy.sh
```

O script `deploy.sh` automaticamente:

- Faz `git pull` para atualizar o código
- Instala dependências
- Compila backend e frontend
- Reinicia com PM2

Pronto! 🎉

---

## 📝 Comandos Úteis

```bash
# Ver logs
pm2 logs saas-platform-backend

# Reiniciar
pm2 restart saas-platform-backend

# Status
pm2 status
```
