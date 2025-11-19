# Script de Configuração Local - Windows PowerShell

Write-Host "🚀 Configurando ambiente local..." -ForegroundColor Green

# Verificar se Docker está instalado
Write-Host "`n📦 Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar se Docker está rodando
Write-Host "`n🔄 Verificando se Docker está rodando..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está rodando!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "Por favor, inicie o Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar se o container já existe
Write-Host "`n🗄️  Verificando PostgreSQL..." -ForegroundColor Yellow
$containerExists = docker ps -a --filter "name=saas_postgres" --format "{{.Names}}"

if ($containerExists -eq "saas_postgres") {
    Write-Host "Container já existe. Verificando se está rodando..." -ForegroundColor Yellow
    $isRunning = docker ps --filter "name=saas_postgres" --format "{{.Names}}"
    if ($isRunning -ne "saas_postgres") {
        Write-Host "Iniciando container..." -ForegroundColor Yellow
        docker start saas_postgres
        Start-Sleep -Seconds 3
    }
    Write-Host "✅ PostgreSQL está rodando!" -ForegroundColor Green
}
else {
    Write-Host "Criando container PostgreSQL..." -ForegroundColor Yellow
    docker run --name saas_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=saas_platform -p 5432:5432 -d postgres:14-alpine
    Write-Host "Aguardando PostgreSQL iniciar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host "✅ PostgreSQL criado e rodando!" -ForegroundColor Green
}

# Instalar dependências do backend
Write-Host "`n📦 Instalando dependências do backend..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "node_modules") {
    Write-Host "Dependências já instaladas, pulando..." -ForegroundColor Gray
}
else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}
Set-Location ..

# Instalar dependências do frontend
Write-Host "`n📦 Instalando dependências do frontend..." -ForegroundColor Yellow
Set-Location frontend
if (Test-Path "node_modules") {
    Write-Host "Dependências já instaladas, pulando..." -ForegroundColor Gray
}
else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}
Set-Location ..

# Verificar se .env existe
Write-Host "`n⚙️  Verificando arquivo .env..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    @"
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_platform
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=seu_secret_super_seguro_123456
JWT_EXPIRES_IN=7d

MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
BASE_DOMAIN=localhost
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green
}
else {
    Write-Host "✅ Arquivo .env já existe!" -ForegroundColor Green
}

# Criar tabelas
Write-Host "`n🗄️  Criando tabelas do banco de dados..." -ForegroundColor Yellow
Set-Location backend
npm run db:sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar tabelas" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Criar dados iniciais
Write-Host "`n🌱 Criando dados iniciais..." -ForegroundColor Yellow
Set-Location backend
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar dados iniciais" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "`n✅ Configuração concluída!" -ForegroundColor Green
Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: npm run dev" -ForegroundColor White
Write-Host "2. Acesse: http://localhost:5173/admin" -ForegroundColor White
Write-Host "3. Login: admin@platform.com / admin123" -ForegroundColor White
Write-Host "`n🚀 Tudo pronto para começar!" -ForegroundColor Green


