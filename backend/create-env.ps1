# Script para criar arquivo .env para desenvolvimento local

$envContent = @"
# ============================================
# CONFIGURAÇÃO PARA DESENVOLVIMENTO LOCAL
# ============================================

# Ambiente
NODE_ENV=development
PORT=3000

# URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# ============================================
# BANCO DE DADOS (Docker PostgreSQL)
# ============================================
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=saas_platform

# ============================================
# JWT (Autenticação)
# ============================================
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_para_desenvolvimento_local_altere_em_producao
JWT_EXPIRES_IN=7d

# ============================================
# DOMÍNIO BASE
# ============================================
BASE_DOMAIN=nerix.online

# ============================================
# GOOGLE OAUTH (Opcional - para login com Google)
# ============================================
GOOGLE_CLIENT_ID=

# ============================================
# EMAIL (Opcional - para envio de emails)
# ============================================
EMAIL_USER=
EMAIL_PASS=

# ============================================
# CLOUDFLARE R2 (Opcional - para upload de arquivos)
# ============================================
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# ============================================
# PAGAMENTOS (Opcional)
# ============================================
# Pushin Pay
PUSHIN_PAY_TOKEN=
PUSHIN_PAY_SANDBOX=true
PUSHIN_PAY_ACCOUNT_ID=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=

# PIX da Plataforma
PLATFORM_PIX_KEY=

# ============================================
# CLOUDFLARE DNS (Opcional - para domínios customizados)
# ============================================
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green

