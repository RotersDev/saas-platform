# Documentação da API

## Autenticação

Todas as rotas protegidas requerem um token JWT no header:

```
Authorization: Bearer <token>
```

## Endpoints

### Autenticação

#### POST /api/auth/login

Login de usuário

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "store_admin",
    "store_id": 1
  }
}
```

#### GET /api/auth/me

Obter informações do usuário autenticado

---

### Produtos

#### GET /api/products

Listar produtos da loja

**Query params:**

- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `search` (opcional): Busca por nome/descrição
- `category` (opcional): Filtrar por categoria
- `featured` (opcional): Filtrar produtos em destaque

#### POST /api/products

Criar produto

**Body:**

```json
{
  "name": "Produto Exemplo",
  "slug": "produto-exemplo",
  "description": "Descrição do produto",
  "price": 99.9,
  "promotional_price": 79.9,
  "is_active": true,
  "delivery_type": "instant"
}
```

#### GET /api/products/:id

Obter produto por ID

#### PUT /api/products/:id

Atualizar produto

#### DELETE /api/products/:id

Excluir produto

#### POST /api/products/:id/keys

Upload de chaves do produto

**Body:**

```json
{
  "keys": ["chave1", "chave2", "chave3"]
}
```

---

### Pedidos

#### GET /api/orders

Listar pedidos

**Query params:**

- `status` (opcional): Filtrar por status
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

#### POST /api/orders

Criar pedido

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ],
  "customer_email": "customer@example.com",
  "customer_name": "Customer Name",
  "customer_phone": "11999999999",
  "coupon_code": "DESCONTO10",
  "affiliate_code": "AFFILIATE123"
}
```

**Response:**

```json
{
  "order": { ... },
  "payment": {
    "qr_code": "00020126...",
    "qr_code_base64": "data:image/png;base64,...",
    "expiration_date": "2024-01-01T12:00:00Z"
  }
}
```

#### GET /api/orders/:id

Obter pedido por ID

#### POST /api/orders/:id/deliver

Entregar pedido

#### POST /api/orders/:id/cancel

Cancelar pedido

#### POST /api/orders/webhook

Webhook do Mercado Pago (público)

---

### Cupons

#### GET /api/coupons

Listar cupons

#### POST /api/coupons

Criar cupom

**Body:**

```json
{
  "code": "DESCONTO10",
  "type": "percentage",
  "value": 10,
  "min_purchase": 100,
  "max_discount": 50,
  "usage_limit": 100,
  "valid_from": "2024-01-01",
  "valid_until": "2024-12-31"
}
```

#### POST /api/coupons/validate

Validar cupom

**Body:**

```json
{
  "code": "DESCONTO10",
  "amount": 150
}
```

---

### Afiliados

#### GET /api/affiliates

Listar afiliados

#### POST /api/affiliates

Criar afiliado

**Body:**

```json
{
  "name": "Afiliado Name",
  "email": "affiliate@example.com",
  "commission_rate": 10
}
```

#### GET /api/affiliates/:id/dashboard

Dashboard do afiliado

#### POST /api/affiliates/:id/pay

Pagar comissão

**Body:**

```json
{
  "amount": 100.5
}
```

---

### Admin Master

#### GET /api/admin/stores

Listar todas as lojas

#### POST /api/admin/stores

Criar loja

#### GET /api/admin/stats

Estatísticas gerais

#### GET /api/admin/plans

Listar planos

---

### API Interna

#### GET /api/api/products

Listar produtos (API interna)

#### GET /api/api/orders

Listar pedidos (API interna)

#### GET /api/api/stock/:productId

Consultar estoque

