# Schema do Banco de Dados

## Tabelas Principais

### stores

Armazena informações das lojas (tenants).

```sql
- id (PK)
- name
- subdomain (UNIQUE)
- domain (UNIQUE, nullable)
- email
- phone
- status (active, suspended, blocked, trial)
- plan_id (FK -> plans)
- trial_ends_at
- is_white_label
- logo_url
- favicon_url
- settings (JSONB)
- created_at
- updated_at
```

### users

Usuários do sistema (master admin e lojistas).

```sql
- id (PK)
- store_id (FK -> stores, nullable para master_admin)
- name
- email (UNIQUE)
- password (hashed)
- role (master_admin, store_admin, store_user)
- is_active
- last_login
- created_at
- updated_at
```

### plans

Planos de assinatura.

```sql
- id (PK)
- name
- slug (UNIQUE)
- price
- billing_cycle (monthly, yearly)
- max_products
- max_coupons
- max_visits
- max_affiliates
- max_banners
- features (JSONB)
- is_active
- created_at
- updated_at
```

### products

Produtos digitais das lojas.

```sql
- id (PK)
- store_id (FK -> stores)
- name
- slug
- description
- short_description
- price
- promotional_price
- stock_limit
- is_active
- is_digital
- delivery_type (instant, scheduled)
- delivery_date
- category
- tags (ARRAY)
- images (ARRAY)
- benefits (ARRAY)
- featured
- views
- sales_count
- created_at
- updated_at
```

### product_keys

Chaves/estoque dos produtos.

```sql
- id (PK)
- product_id (FK -> products)
- key (TEXT)
- is_used
- used_at
- order_id (FK -> orders)
- created_at
- updated_at
```

### orders

Pedidos dos clientes.

```sql
- id (PK)
- store_id (FK -> stores)
- customer_id (FK -> customers)
- order_number (UNIQUE)
- status (pending, paid, delivered, cancelled, refunded)
- total
- subtotal
- discount
- coupon_id (FK -> coupons)
- affiliate_code
- customer_email
- customer_name
- customer_phone
- payment_method (pix)
- payment_status (pending, paid, failed, refunded)
- payment_id
- delivered_at
- cancelled_at
- notes
- created_at
- updated_at
```

### order_items

Itens dos pedidos.

```sql
- id (PK)
- order_id (FK -> orders)
- product_id (FK -> products)
- product_name
- quantity
- price
- total
- product_key (TEXT)
- created_at
- updated_at
```

### customers

Clientes das lojas.

```sql
- id (PK)
- store_id (FK -> stores)
- email
- name
- phone
- is_blocked
- total_orders
- total_spent
- last_order_at
- created_at
- updated_at
```

### coupons

Cupons de desconto.

```sql
- id (PK)
- store_id (FK -> stores)
- code
- type (percentage, fixed)
- value
- min_purchase
- max_discount
- usage_limit
- usage_count
- is_active
- is_secret
- customer_id (FK -> customers, nullable)
- valid_from
- valid_until
- created_at
- updated_at
```

### affiliates

Afiliados das lojas.

```sql
- id (PK)
- store_id (FK -> stores)
- code (UNIQUE por store)
- name
- email
- commission_rate
- clicks
- leads
- sales
- total_commission
- paid_commission
- is_active
- created_at
- updated_at
```

### reviews

Avaliações dos produtos.

```sql
- id (PK)
- product_id (FK -> products)
- customer_id (FK -> customers)
- rating (1-5)
- title
- comment
- images (ARRAY)
- video_url
- status (pending, approved, rejected)
- approved_at
- rejected_at
- created_at
- updated_at
```

### themes

Temas personalizados das lojas.

```sql
- id (PK)
- store_id (FK -> stores, UNIQUE)
- primary_color
- secondary_color
- accent_color
- font_family
- logo_url
- favicon_url
- banner_images (ARRAY)
- carousel_images (ARRAY)
- homepage_components (JSONB)
- custom_css
- created_at
- updated_at
```

### domains

Domínios customizados das lojas.

```sql
- id (PK)
- store_id (FK -> stores)
- domain (UNIQUE)
- is_primary
- ssl_enabled
- ssl_certificate
- ssl_key
- verified
- verified_at
- created_at
- updated_at
```

### invoices

Faturas mensais das lojas.

```sql
- id (PK)
- store_id (FK -> stores)
- plan_id (FK -> plans)
- amount
- status (pending, paid, failed, cancelled)
- due_date
- paid_at
- payment_id
- billing_cycle (monthly, yearly)
- created_at
- updated_at
```

### payments

Pagamentos dos pedidos.

```sql
- id (PK)
- order_id (FK -> orders, UNIQUE)
- mercado_pago_id
- status (pending, approved, rejected, cancelled, refunded)
- amount
- payment_method (pix)
- pix_qr_code
- pix_qr_code_base64
- pix_expiration_date
- split_data (JSONB)
- metadata (JSONB)
- created_at
- updated_at
```

### split_configs

Configuração de split de pagamento.

```sql
- id (PK)
- store_id (FK -> stores, UNIQUE)
- split_1_percentage
- split_1_mercado_pago_account
- split_2_percentage
- split_2_mercado_pago_account
- split_3_percentage
- split_3_mercado_pago_account
- split_4_percentage
- split_4_mercado_pago_account
- split_5_percentage
- split_5_mercado_pago_account
- split_6_percentage
- split_6_mercado_pago_account
- is_active
- created_at
- updated_at
```

### webhooks

Webhooks configurados pelas lojas.

```sql
- id (PK)
- store_id (FK -> stores)
- url
- events (ARRAY)
- secret
- is_active
- last_triggered_at
- created_at
- updated_at
```

### activity_logs

Logs de atividades dos usuários.

```sql
- id (PK)
- store_id (FK -> stores, nullable)
- user_id (FK -> users, nullable)
- action
- entity_type
- entity_id
- details (JSONB)
- ip_address
- user_agent
- created_at
```

### error_logs

Logs de erros do sistema.

```sql
- id (PK)
- store_id (FK -> stores, nullable)
- error_type
- message
- stack
- context (JSONB)
- resolved
- resolved_at
- created_at
```

## Índices

### Principais Índices

- `stores.subdomain` (UNIQUE)
- `stores.domain` (UNIQUE)
- `users.email` (UNIQUE)
- `products.store_id`
- `products.slug`
- `orders.store_id`
- `orders.order_number` (UNIQUE)
- `orders.status`
- `customers.store_id, email` (UNIQUE)
- `coupons.store_id, code` (UNIQUE)
- `affiliates.store_id, code` (UNIQUE)

## Relacionamentos

### One-to-Many

- Store -> Users
- Store -> Products
- Store -> Orders
- Store -> Customers
- Store -> Coupons
- Store -> Affiliates
- Store -> Invoices
- Product -> ProductKeys
- Product -> Reviews
- Order -> OrderItems
- Customer -> Orders
- Customer -> Reviews

### One-to-One

- Store -> Theme
- Store -> SplitConfig
- Order -> Payment

### Many-to-Many

- (via tabelas intermediárias)

## Migrações

As migrações devem ser criadas usando `node-pg-migrate`:

```bash
npm run migrate:create nome_da_migracao
```

## Seeds

Criar seeds para dados iniciais:

1. Plano básico
2. Plano premium
3. Usuário master admin

