# Arquitetura da Plataforma

## Visão Geral

Plataforma SaaS multi-tenant para produtos digitais com arquitetura escalável e isolamento total entre lojas.

## Stack Tecnológico

### Backend

- **Node.js** com TypeScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **Sequelize** - ORM
- **Mercado Pago SDK** - Pagamentos
- **JWT** - Autenticação
- **Winston** - Logging

### Frontend

- **React** com TypeScript
- **Vite** - Build tool
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado
- **React Query** - Cache e sincronização de dados
- **Tailwind CSS** - Estilização
- **Axios** - Cliente HTTP

## Arquitetura Multi-Tenant

### Isolamento por Tenant

Cada loja (tenant) é completamente isolada através de:

1. **Isolamento de Dados**: Todas as tabelas possuem `store_id` como chave estrangeira
2. **Middleware de Tenant**: Resolve automaticamente a loja baseado em:
   - Subdomínio (ex: `loja1.plataforma.com`)
   - Domínio customizado (ex: `loja.com.br`)
   - Query parameter (para admin master)
3. **Segurança**: Middleware garante que usuários só acessem dados da própria loja

### Estrutura de Dados

```
Store (Loja)
├── Users (Usuários da loja)
├── Products (Produtos)
│   └── ProductKeys (Chaves de estoque)
├── Orders (Pedidos)
│   └── OrderItems (Itens do pedido)
├── Customers (Clientes)
├── Coupons (Cupons)
├── Affiliates (Afiliados)
├── Reviews (Avaliações)
├── Theme (Tema)
├── Domains (Domínios)
├── Notifications (Notificações)
├── Invoices (Faturas)
├── SplitConfig (Configuração de Split)
└── Webhooks (Webhooks)
```

## Fluxo de Pagamento

### Mercado Pago com Split de 6 Divisões

1. **Criação do Pedido**

   - Cliente adiciona produtos ao carrinho
   - Sistema calcula totais e aplica cupons
   - Pedido é criado com status `pending`

2. **Processamento do Pagamento**

   - Sistema busca configuração de split da loja
   - Cria pagamento PIX no Mercado Pago com 6 splits configurados
   - Retorna QR Code para o cliente

3. **Confirmação do Pagamento**

   - Webhook do Mercado Pago notifica o sistema
   - Sistema atualiza status do pedido para `paid`
   - Produtos são entregues automaticamente (se entrega instantânea)

4. **Distribuição do Split**
   - Mercado Pago distribui automaticamente para as 6 contas configuradas
   - Cada porcentagem é enviada para a respectiva conta

## Sistema de Faturamento

### Faturamento Automático Mensal

1. **Geração de Faturas**

   - Cron job executa diariamente
   - Gera faturas para lojas ativas sem fatura pendente
   - Data de vencimento: 30 dias a partir da geração

2. **Verificação de Vencimento**

   - Cron job verifica faturas vencidas
   - Loja é suspensa após 7 dias de atraso
   - Notificações são enviadas

3. **Pagamento de Fatura**
   - Lojista paga fatura via PIX
   - Sistema processa pagamento via webhook
   - Loja é reativada automaticamente

## Segurança

### Autenticação e Autorização

- **JWT Tokens**: Tokens com expiração configurável
- **Roles**:
  - `master_admin`: Acesso total ao sistema
  - `store_admin`: Administrador da loja
  - `store_user`: Usuário da loja (futuro)

### Middleware de Segurança

- **Helmet**: Headers de segurança HTTP
- **CORS**: Configurado para domínios específicos
- **Rate Limiting**: Limite de requisições por IP
- **Validação**: Express Validator para validação de dados

## Escalabilidade

### Banco de Dados

- **Índices**: Criados em campos frequentemente consultados
- **Particionamento**: Preparado para particionamento por `store_id` quando necessário
- **Connection Pooling**: Configurado no Sequelize

### Cache

- Preparado para integração com Redis (opcional)
- Cache de queries frequentes

### Infraestrutura

- **Docker**: Containerização completa
- **Cloudflare**: CDN e SSL automático
- **Load Balancer**: Preparado para múltiplas instâncias

## Logs e Monitoramento

### Logs

- **Winston**: Logging estruturado
- **Activity Logs**: Registro de todas as ações dos usuários
- **Error Logs**: Registro de erros com contexto

### Webhooks

- Sistema de webhooks para integrações externas
- Assinatura HMAC para segurança
- Retry automático em caso de falha

## API Interna

API dedicada para integrações internas (bots, sistemas próprios):

- Autenticação via JWT
- Endpoints simplificados
- Rate limiting específico
- Documentação separada

## Deploy

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

## Próximos Passos

1. Implementar cache com Redis
2. Adicionar testes automatizados
3. Implementar CI/CD
4. Adicionar monitoramento (Sentry, DataDog)
5. Implementar backup automático do banco
6. Adicionar suporte a múltiplos idiomas

