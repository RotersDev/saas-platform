# Script PowerShell para fazer upload do projeto para VPS
# Uso: .\upload-to-vps.ps1

$VPS_IP = "72.61.56.208"
$VPS_USER = "root"
$VPS_PATH = "/var/www/saas-platform"

Write-Host "🚀 Preparando upload para VPS..." -ForegroundColor Green

# Verificar se está na raiz do projeto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Criando arquivo compactado..." -ForegroundColor Yellow

# Criar arquivo temporário com lista de exclusões
$excludeFile = "exclude-list.txt"
@"
node_modules
dist
backend/dist
frontend/dist
.git
*.log
logs
uploads
.env
"@ | Out-File -FilePath $excludeFile -Encoding UTF8

# Compactar projeto
$tarFile = "projeto.tar.gz"
if (Test-Path $tarFile) {
    Remove-Item $tarFile
}

Write-Host "⏳ Compactando arquivos (isso pode demorar)..." -ForegroundColor Yellow

# Usar tar do Windows 10+ ou Git Bash
$tarCommand = "tar"
if (Get-Command $tarCommand -ErrorAction SilentlyContinue) {
    & $tarCommand -czf $tarFile --exclude-from=$excludeFile backend frontend package.json package-lock.json ecosystem.config.js deploy.sh setup-vps.sh nginx.conf.example env.example README-DEPLOY.md QUICK-START.md docker-compose.yml 2>$null
}
else {
    Write-Host "❌ Comando 'tar' não encontrado!" -ForegroundColor Red
    Write-Host "💡 Instale Git Bash ou use WSL" -ForegroundColor Yellow
    Remove-Item $excludeFile
    exit 1
}

Remove-Item $excludeFile

if (-not (Test-Path $tarFile)) {
    Write-Host "❌ Erro ao criar arquivo compactado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo criado: $tarFile" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Enviando arquivos para VPS..." -ForegroundColor Yellow
Write-Host "   Você precisará informar a senha da VPS" -ForegroundColor Yellow
Write-Host ""

# Criar diretório na VPS
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p $VPS_PATH"

# Enviar arquivo compactado
scp $tarFile "${VPS_USER}@${VPS_IP}:$VPS_PATH/"

# Enviar scripts e configs
scp deploy.sh "${VPS_USER}@${VPS_IP}:$VPS_PATH/"
scp setup-vps.sh "${VPS_USER}@${VPS_IP}:$VPS_PATH/"
scp ecosystem.config.js "${VPS_USER}@${VPS_IP}:$VPS_PATH/"
scp nginx.conf.example "${VPS_USER}@${VPS_IP}:$VPS_PATH/"
scp env.example "${VPS_USER}@${VPS_IP}:$VPS_PATH/backend/"

Write-Host ""
Write-Host "✅ Upload concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos na VPS:" -ForegroundColor Yellow
Write-Host "   1. ssh ${VPS_USER}@${VPS_IP}"
Write-Host "   2. cd $VPS_PATH"
Write-Host "   3. tar -xzf projeto.tar.gz"
Write-Host "   4. cd backend && cp env.example .env && nano .env"
Write-Host "   5. cd .. && chmod +x deploy.sh && ./deploy.sh"
Write-Host ""

# Limpar arquivo local
$cleanup = Read-Host "Deseja remover o arquivo $tarFile localmente? (s/n)"
if ($cleanup -eq "s" -or $cleanup -eq "S") {
    Remove-Item $tarFile
    Write-Host "🗑️  Arquivo removido" -ForegroundColor Green
}

