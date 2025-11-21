#!/bin/bash

echo "🚀 Iniciando DEPLOY da plataforma..."

# ================================
# CONFIG
# ================================
BACKEND_DIR="/var/www/saas-platform/backend"
FRONTEND_DIR="/var/www/saas-platform/frontend"
PROJECT_DIR="/var/www/saas-platform"

echo "🔄 Atualizando repositório..."
cd $PROJECT_DIR
git pull origin main || git pull

echo "📦 Instalando dependências do backend..."
cd $BACKEND_DIR
npm install

echo "🛠️ Buildando backend..."
npm run build

echo "🔁 Reiniciando PM2 com novas variáveis..."
pm2 delete saas-platform-backend 2>/dev/null
pm2 start dist/server.js --name saas-platform-backend
pm2 save

echo "📦 Instalando dependências do frontend..."
cd $FRONTEND_DIR
npm install

echo "🛠️ Buildando frontend..."
npm run build

echo "📁 Copiando build para diretório público do Nginx..."
rm -rf /var/www/saas-platform/frontend/dist
mkdir -p /var/www/saas-platform/frontend/dist
cp -r dist/* /var/www/saas-platform/frontend/dist/

echo "🔄 Reiniciando Nginx..."
systemctl restart nginx

echo "🎉 DEPLOY FINALIZADO COM SUCESSO!"
