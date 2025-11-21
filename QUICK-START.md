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

```bash
# Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# Configurar .env
cd backend
cp env.example .env
# Edite o .env

# Iniciar PostgreSQL (Docker)
docker-compose up -d postgres

# Rodar em dev
npm run dev  # Na raiz do projeto
```

Acesse: `http://localhost:5173`

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
