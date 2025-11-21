# 🚀 Deploy via Git - Guia Rápido

Como o código já está no Git, você pode fazer deploy diretamente na VPS usando Git!

## 📋 Setup Inicial (Uma vez)

### 1. Conectar na VPS

```bash
ssh root@72.61.56.208
```

### 2. Executar setup inicial

```bash
# Fazer upload do setup-vps.sh primeiro, ou executar manualmente:
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx git
npm install -g pm2

# Configurar PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE saas_platform;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'sua_senha_segura';"
```

### 3. Clonar repositório

```bash
cd /var/www
git clone https://github.com/RotersDev/saas-platform.git saas-platform
cd saas-platform
```

### 4. Configurar .env

```bash
cd backend
cp env.example .env
nano .env  # Configure as variáveis
```

**Variáveis importantes:**

```env
NODE_ENV=production
PORT=3000
APP_URL=http://72.61.56.208
FRONTEND_URL=http://72.61.56.208
DB_HOST=127.0.0.1
DB_PASSWORD=sua_senha_postgres
JWT_SECRET=um_secret_super_seguro_aqui
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

### 6. Primeiro deploy

```bash
cd /var/www/saas-platform
chmod +x deploy.sh
./deploy.sh
```

---

## 🔄 Deploy de Atualizações

Agora que está tudo configurado, para atualizar o código é super simples:

### Opção 1: Deploy automático (recomendado)

```bash
# Na VPS
cd /var/www/saas-platform
./deploy.sh
```

O script automaticamente:

- Faz `git pull` para atualizar o código
- Instala dependências
- Compila backend e frontend
- Reinicia com PM2

### Opção 2: Manual

```bash
# Na VPS
cd /var/www/saas-platform
git pull
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
cd .. && pm2 restart saas-platform-backend
```

---

## 📝 Fluxo de Trabalho

### 1. Desenvolvimento Local

```bash
# Fazer alterações no código
git add .
git commit -m "sua mensagem"
git push
```

### 2. Deploy na VPS

```bash
ssh root@72.61.56.208
cd /var/www/saas-platform
./deploy.sh
```

Pronto! 🎉

---

## 🔐 Configurar SSH Key (Opcional - Facilita muito)

Para não precisar digitar senha toda vez:

### No seu computador:

```bash
ssh-keygen -t rsa -b 4096
ssh-copy-id root@72.61.56.208
```

Agora você pode fazer `ssh root@72.61.56.208` sem senha!

---

## 🐛 Troubleshooting

### Erro: "Permission denied"

```bash
chmod +x deploy.sh
```

### Erro: "git pull failed"

```bash
# Verificar se há mudanças locais
git status

# Se houver conflitos, fazer backup e resetar
cd /var/www/saas-platform
git stash
git pull
```

### Erro: ".env não encontrado"

```bash
cd /var/www/saas-platform/backend
cp env.example .env
nano .env
```

---

## ✅ Checklist Rápido

- [ ] VPS configurada (Node.js, PostgreSQL, Nginx, PM2)
- [ ] Repositório clonado em `/var/www/saas-platform`
- [ ] `.env` configurado em `backend/.env`
- [ ] Nginx configurado e ativo
- [ ] Primeiro deploy executado com sucesso
- [ ] Aplicação acessível em `http://72.61.56.208`

---

## 🎯 Comandos Úteis

```bash
# Ver logs
pm2 logs saas-platform-backend

# Status
pm2 status

# Reiniciar
pm2 restart saas-platform-backend

# Ver últimas mudanças do Git
cd /var/www/saas-platform
git log --oneline -5
```
