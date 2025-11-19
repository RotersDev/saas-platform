# Plataforma SaaS Multi-tenant para Produtos Digitais

Plataforma completa e profissional para criação e gerenciamento de lojas virtuais de produtos digitais com arquitetura multi-tenant.

## 🚀 Características Principais

- ✅ Arquitetura Multi-tenant com isolamento total entre lojas
- ✅ Sistema de planos com limitações configuráveis
- ✅ Integração Mercado Pago com Split de 6 divisões (PIX)
- ✅ Painel Administrativo Master completo
- ✅ Painel do Lojista com dashboard avançado
- ✅ Sistema de Afiliados
- ✅ Sistema de Cupons
- ✅ Sistema de Avaliações
- ✅ Editor de Temas
- ✅ Gerenciamento de Domínios
- ✅ Faturamento Automático
- ✅ API Interna completa
- ✅ Webhooks
- ✅ Logs e Auditoria

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker e Docker Compose (opcional)
- Conta Mercado Pago com credenciais

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd saas-digital-products-platform
```

### 2. Instale as dependências

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure as variáveis de ambiente

Copie os arquivos `.env.example` e configure:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 4. Configure o banco de dados

```bash
# Criar banco de dados
createdb saas_platform

# Executar migrações
npm run migrate:up
```

### 5. Inicie o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
├── backend/              # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── config/      # Configurações
│   │   ├── controllers/ # Controladores
│   │   ├── models/      # Modelos do banco
│   │   ├── routes/      # Rotas da API
│   │   ├── middleware/  # Middlewares
│   │   ├── services/    # Serviços de negócio
│   │   ├── utils/       # Utilitários
│   │   └── migrations/  # Migrações do banco
│   └── tests/           # Testes
├── frontend/            # Frontend React/TypeScript
│   ├── src/
│   │   ├── admin/       # Painel Admin Master
│   │   ├── store/       # Painel Lojista
│   │   ├── shop/        # Frontend da Loja
│   │   └── shared/      # Componentes compartilhados
│   └── public/
└── docs/                # Documentação técnica
```

## 🔐 Variáveis de Ambiente

### Backend (.env)

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_platform
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Cloudflare (opcional)
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id
```

## 📚 Documentação

- [Guia de Início Rápido](./docs/QUICK_START.md) - Comece aqui!
- [Documentação da API](./docs/API.md) - Endpoints e exemplos
- [Arquitetura](./docs/ARCHITECTURE.md) - Visão geral do sistema
- [Banco de Dados](./docs/DATABASE.md) - Schema e relacionamentos
- [Deploy](./docs/DEPLOY.md) - Guia de deploy em produção

## 🧪 Testes

```bash
cd backend
npm test
```

## 🐳 Docker

```bash
docker-compose up -d
```

## 📝 Licença

MIT
