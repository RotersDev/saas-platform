# 🚀 Guia de Deploy para VPS

Este guia explica como fazer o deploy da aplicação na VPS e manter funcionando localmente.

## 📋 Pré-requisitos

### Na VPS:
- Ubuntu 20.04+ ou Debian 11+
- Acesso root ou sudo
- Conexão SSH configurada

### Localmente:
- Node.js 18+
- Git
- PostgreSQL (para desenvolvimento local)

---

## 🔧 Setup Inicial da VPS (Execute UMA VEZ)

### 1. Conectar na VPS
```bash
ssh root@72.61.56.208
```

### 2. Executar script de setup
```bash
# Fazer upload do setup-vps.sh para a VPS primeiro
chmod +x setup-vps.sh
./setup-vps.sh
```

Este script irá instalar:
- Node.js 20.x
- PostgreSQL
- Nginx
- PM2
- Git

### 3. Configurar PostgreSQL
O script já cria o banco, mas você pode ajustar:
```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'sua_senha_segura';
\q
```

---

## 📤 Fazendo Deploy

### Opção 1: Upload via Git (Recomendado)

#### Na VPS:
```bash
cd /var/www
git clone seu-repositorio.git saas-platform
cd saas-platform
```

#### Ou via SCP (do seu computador local):
```bash
# Compactar o projeto (excluindo node_modules e dist)
tar --exclude='node_modules' --exclude='dist' --exclude='.git' -czf projeto.tar.gz .

# Enviar para VPS
scp projeto.tar.gz root@72.61.56.208:/var/www/
scp deploy.sh root@72.61.56.208:/var/www/saas-platform/
scp ecosystem.config.js root@72.61.56.208:/var/www/saas-platform/
scp nginx.conf.example root@72.61.56.208:/var/www/saas-platform/

# Na VPS
cd /var/www
tar -xzf projeto.tar.gz -C saas-platform
```

### Opção 2: Upload Manual via SCP

```bash
# Do seu computador local
scp -r backend root@72.61.56.208:/var/www/saas-platform/
scp -r frontend root@72.61.56.208:/var/www/saas-platform/
scp package.json root@72.61.56.208:/var/www/saas-platform/
scp deploy.sh root@72.61.56.208:/var/www/saas-platform/
scp ecosystem.config.js root@72.61.56.208:/var/www/saas-platform/
```

---

## ⚙️ Configuração

### 1. Configurar variáveis de ambiente

Na VPS:
```bash
cd /var/www/saas-platform/backend
cp .env.example .env
nano .env  # ou use vim/vi
```

**Configure as seguintes variáveis importantes:**

```env
NODE_ENV=production
PORT=3000
APP_URL=http://72.61.56.208  # ou seu domínio
FRONTEND_URL=http://72.61.56.208  # ou seu domínio

# Banco de dados
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
DB_NAME=saas_platform

# JWT (GERE UM SECRET SEGURO!)
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# Outras configurações...
```

### 2. Configurar Nginx

```bash
# Copiar configuração
cp /var/www/saas-platform/nginx.conf.example /etc/nginx/sites-available/saas-platform

# Editar com seu domínio
nano /etc/nginx/sites-available/saas-platform

# Criar symlink
ln -s /etc/nginx/sites-available/saas-platform /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

**Se não tiver domínio ainda**, você pode usar o IP diretamente:
- Altere `server_name` para `_` (aceita qualquer domínio)
- Ou use `server_name 72.61.56.208;`

### 3. Executar deploy

```bash
cd /var/www/saas-platform
chmod +x deploy.sh
./deploy.sh
```

---

## 🔄 Comandos Úteis

### PM2 (Gerenciador de Processos)
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs saas-platform-backend

# Reiniciar
pm2 restart saas-platform-backend

# Parar
pm2 stop saas-platform-backend

# Iniciar
pm2 start saas-platform-backend

# Monitorar
pm2 monit
```

### Nginx
```bash
# Testar configuração
nginx -t

# Recarregar
systemctl reload nginx

# Reiniciar
systemctl restart nginx

# Ver status
systemctl status nginx

# Ver logs
tail -f /var/log/nginx/saas-platform-error.log
```

### PostgreSQL
```bash
# Conectar
sudo -u postgres psql

# Conectar ao banco específico
sudo -u postgres psql -d saas_platform

# Backup
sudo -u postgres pg_dump saas_platform > backup.sql

# Restaurar
sudo -u postgres psql saas_platform < backup.sql
```

---

## 🏠 Desenvolvimento Local

Para manter funcionando localmente:

### 1. Instalar dependências
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configurar .env local
```bash
cd backend
cp .env.example .env
# Edite o .env com suas configurações locais
```

### 3. Iniciar PostgreSQL local (Docker)
```bash
docker-compose up -d postgres
```

### 4. Rodar em desenvolvimento
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse: `http://localhost:5173`

---

## 🔐 SSL/HTTPS (Opcional)

Para adicionar SSL com Let's Encrypt:

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
certbot renew --dry-run
```

Depois, descomente as linhas SSL no `nginx.conf`.

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Ver logs
pm2 logs saas-platform-backend

# Verificar se porta está em uso
netstat -tulpn | grep 3000

# Verificar .env
cat backend/.env
```

### Nginx retorna 502
- Verifique se o backend está rodando: `pm2 status`
- Verifique os logs do Nginx: `tail -f /var/log/nginx/error.log`
- Verifique se a porta 3000 está acessível: `curl http://127.0.0.1:3000/api/health`

### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
sudo -u postgres psql -d saas_platform

# Verificar configurações no .env
```

### Frontend não carrega
- Verifique se o build foi feito: `ls -la frontend/dist`
- Verifique os logs do Nginx
- Verifique se o caminho está correto no nginx.conf

---

## 📝 Checklist de Deploy

- [ ] VPS configurada com setup-vps.sh
- [ ] Código enviado para /var/www/saas-platform
- [ ] .env configurado em backend/.env
- [ ] Nginx configurado e ativo
- [ ] deploy.sh executado com sucesso
- [ ] PM2 rodando a aplicação
- [ ] Testar acesso via IP/domínio
- [ ] Verificar logs: `pm2 logs`

---

## 🔄 Atualizações Futuras

Para atualizar o código na VPS:

```bash
# Opção 1: Via Git
cd /var/www/saas-platform
git pull
./deploy.sh

# Opção 2: Upload manual + deploy
# Faça upload dos arquivos alterados
cd /var/www/saas-platform
./deploy.sh
```

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs saas-platform-backend`
2. Verifique o status: `pm2 status`
3. Verifique Nginx: `systemctl status nginx`
4. Verifique PostgreSQL: `systemctl status postgresql`

