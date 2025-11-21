#!/bin/bash

# Script de Setup Inicial da VPS
# Execute este script UMA VEZ na VPS para configurar o ambiente
# Uso: ./setup-vps.sh

set -e

echo "🔧 Configurando VPS para deploy..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Por favor, execute como root (sudo ./setup-vps.sh)${NC}"
    exit 1
fi

echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

echo "📦 Instalando Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "📦 Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib

echo "📦 Instalando Nginx..."
apt install -y nginx

echo "📦 Instalando PM2 globalmente..."
npm install -g pm2

echo "📦 Instalando Git..."
apt install -y git

echo "🔧 Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE saas_platform;" 2>/dev/null || echo "Banco já existe"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || echo "Usuário já existe"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE saas_platform TO postgres;" 2>/dev/null || true

echo "📁 Criando diretório do projeto..."
mkdir -p /var/www/saas-platform
mkdir -p /var/www/saas-platform/backend/logs
mkdir -p /var/www/saas-platform/frontend/dist

echo "🔧 Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "1. Clone o repositório Git:"
echo "   cd /var/www && git clone https://github.com/RotersDev/saas-platform.git saas-platform"
echo ""
echo "2. Configure o .env:"
echo "   cd /var/www/saas-platform/backend"
echo "   cp env.example .env"
echo "   nano .env  # Configure as variáveis"
echo ""
echo "3. Execute o deploy:"
echo "   cd /var/www/saas-platform && chmod +x deploy.sh && ./deploy.sh"
echo ""
echo "🌐 Para configurar Nginx, veja o arquivo nginx.conf.example"

