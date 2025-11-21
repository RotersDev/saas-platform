#!/bin/bash

# Script de Deploy para VPS
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está na VPS
if [ ! -f "/root/.ssh/authorized_keys" ] && [ "$USER" != "root" ]; then
    echo -e "${YELLOW}⚠️  Este script deve ser executado na VPS como root${NC}"
    exit 1
fi

# Diretório do projeto
PROJECT_DIR="/var/www/saas-platform"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Criar diretórios se não existirem
mkdir -p "$PROJECT_DIR"
mkdir -p "$BACKEND_DIR/logs"
mkdir -p "$FRONTEND_DIR/dist"

# Verificar se .env existe
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado em $BACKEND_DIR${NC}"
    echo -e "${YELLOW}📝 Copie o arquivo .env.example para .env e configure as variáveis${NC}"
    exit 1
fi

echo "📦 Instalando dependências do backend..."
cd "$BACKEND_DIR"
npm install --production=false

echo "🔨 Compilando backend..."
npm run build

echo "📦 Instalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm install

echo "🔨 Compilando frontend..."
npm run build

echo "🔄 Reiniciando aplicação com PM2..."
cd "$PROJECT_DIR"
pm2 delete saas-platform-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "📊 Status da aplicação:"
pm2 status

echo ""
echo "📝 Para ver os logs:"
echo "   pm2 logs saas-platform-backend"
echo ""
echo "🔄 Para reiniciar:"
echo "   pm2 restart saas-platform-backend"

