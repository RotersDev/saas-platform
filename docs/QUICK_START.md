# Guia de Início Rápido

## Instalação Rápida

### 1. Clone e Instale

```bash
# Instalar dependências raiz
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 2. Configure o Banco de Dados

```bash
# Criar banco de dados PostgreSQL
createdb saas_platform

# Ou usando psql
psql -U postgres
CREATE DATABASE saas_platform;
```

### 3. Configure as Variáveis de Ambiente

```bash
# Backend
cd backend
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Frontend
cd ../frontend
# Configure VITE_API_URL se necessário
```

### 4. Execute as Migrações

```bash
cd backend
npm run migrate:up
```

### 5. Crie Dados Iniciais

```bash
cd backend
npx tsx src/seeders/initialData.ts
```

### 6. Inicie o Servidor

```bash
# Na raiz do projeto
npm run dev
```

Ou separadamente:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Acessar a Plataforma

### Admin Master

- URL: http://localhost:5173/admin
- Email: `admin@platform.com`
- Senha: `admin123`

### Painel do Lojista

- URL: http://localhost:5173/store
- Faça login com uma conta de lojista

### Loja Pública

- URL: http://localhost:5173
- Acesse a loja pública

## Próximos Passos

1. **Criar uma Loja**

   - Acesse o painel admin
   - Crie uma nova loja
   - Configure o plano

2. **Configurar Mercado Pago**

   - Adicione suas credenciais no `.env`
   - Configure o split de pagamento

3. **Personalizar Tema**

   - Acesse o painel do lojista
   - Vá em "Tema"
   - Personalize cores, logo, etc.

4. **Adicionar Produtos**
   - Crie produtos digitais
   - Adicione chaves de estoque
   - Configure preços

## Troubleshooting

### Erro de conexão com banco

- Verifique se o PostgreSQL está rodando
- Verifique as credenciais no `.env`

### Erro de porta em uso

- Altere a porta no `.env` ou `vite.config.ts`

### Erro de módulo não encontrado

- Execute `npm install` novamente
- Limpe o cache: `rm -rf node_modules package-lock.json && npm install`

## Suporte

Consulte a documentação completa em:

- [API.md](./API.md) - Documentação da API
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema
- [DATABASE.md](./DATABASE.md) - Schema do banco de dados
- [DEPLOY.md](./DEPLOY.md) - Guia de deploy
