# Guia de Deploy

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Conta Mercado Pago
- Conta Cloudflare (opcional, para SSL)
- Servidor (Google Cloud, AWS, etc.)

## Configuração do Ambiente

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` e configure:

```bash
cp backend/.env.example backend/.env
```

Configure todas as variáveis necessárias.

### 2. Banco de Dados

```bash
# Criar banco
createdb saas_platform

# Executar migrações
cd backend
npm run migrate:up
```

### 3. Dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Deploy com Docker

### 1. Build

```bash
docker-compose build
```

### 2. Iniciar

```bash
docker-compose up -d
```

### 3. Logs

```bash
docker-compose logs -f
```

## Deploy Manual

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Servir arquivos estáticos com nginx ou similar
```

## Deploy em Produção

### Google Cloud Platform

1. **Criar instância Cloud SQL (PostgreSQL)**
2. **Criar instância Compute Engine**
3. **Configurar Cloud Load Balancer**
4. **Configurar Cloud CDN**

### AWS

1. **Criar RDS (PostgreSQL)**
2. **Criar EC2 ou usar ECS**
3. **Configurar Application Load Balancer**
4. **Configurar CloudFront**

### Cloudflare

1. **Adicionar domínio**
2. **Configurar DNS**
3. **Ativar SSL automático**
4. **Configurar regras de cache**

## Configuração de SSL

### Cloudflare (Recomendado)

1. Adicionar domínio no Cloudflare
2. Configurar DNS apontando para servidor
3. SSL automático será ativado

### Let's Encrypt (Alternativa)

```bash
certbot --nginx -d seu-dominio.com
```

## Monitoramento

### Logs

- Logs do backend: `backend/logs/`
- Logs do sistema: usar serviço de logging (CloudWatch, Stackdriver)

### Health Check

Endpoint: `GET /health`

## Backup

### Banco de Dados

```bash
# Backup diário
pg_dump saas_platform > backup_$(date +%Y%m%d).sql

# Restore
psql saas_platform < backup_20240101.sql
```

### Automatizar Backup

Criar cron job:

```bash
0 2 * * * pg_dump saas_platform > /backups/backup_$(date +\%Y\%m\%d).sql
```

## Escalabilidade

### Horizontal Scaling

1. Múltiplas instâncias do backend
2. Load balancer na frente
3. Banco de dados compartilhado
4. Cache compartilhado (Redis)

### Vertical Scaling

1. Aumentar recursos da instância
2. Otimizar queries do banco
3. Adicionar índices

## Segurança

1. **HTTPS obrigatório**
2. **Rate limiting ativo**
3. **Firewall configurado**
4. **Backups automáticos**
5. **Monitoramento de erros**
6. **Logs de auditoria**

## Troubleshooting

### Erro de conexão com banco

- Verificar variáveis de ambiente
- Verificar firewall
- Verificar credenciais

### Erro 500

- Verificar logs do backend
- Verificar logs do banco
- Verificar recursos do servidor

### Performance lenta

- Verificar índices do banco
- Verificar queries N+1
- Adicionar cache
- Escalar recursos

