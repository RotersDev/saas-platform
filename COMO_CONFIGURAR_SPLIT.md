# 🎯 Como Configurar Seu Account ID para Receber Split

## Onde Colocar Seu Account ID

Você precisa colocar seu **Account ID do Pushin Pay** na tabela `split_configs` do banco de dados, nos campos `split_X_pushin_pay_account`.

### Opção 1: Via Script (Recomendado)

Execute o script que criamos:

```bash
cd backend
npm run set-platform-account
```

Este script salva seu Account ID em uma tabela de configurações da plataforma.

### Opção 2: Diretamente no Banco de Dados

Para cada loja que você quer receber split, execute:

```sql
-- Exemplo: Receber 10% das vendas da loja ID 1
UPDATE split_configs
SET
  split_1_percentage = 10.00,
  split_1_pushin_pay_account = 'SEU_ACCOUNT_ID_AQUI'
WHERE store_id = 1;
```

**Onde encontrar seu Account ID:**

1. Acesse: https://app.pushinpay.com.br
2. Faça login
3. Vá em **Configurações** ou **Perfil**
4. Copie o **Account ID** (não é o token!)

### Estrutura Completa

Você pode configurar até 6 splits diferentes por loja:

```sql
UPDATE split_configs
SET
  -- Split 1: Você recebe 10%
  split_1_percentage = 10.00,
  split_1_pushin_pay_account = 'SEU_ACCOUNT_ID',

  -- Split 2: Outra conta recebe 5% (opcional)
  split_2_percentage = 5.00,
  split_2_pushin_pay_account = 'OUTRO_ACCOUNT_ID',

  -- ... até split_6

  is_active = true  -- Ativar o split
WHERE store_id = 1; -- ID da loja
```

### Regras Importantes

1. ✅ **Total máximo de splits: 50%** (limite do Pushin Pay)
2. ✅ **Você pode ter múltiplos splits** (até 6)
3. ✅ **Cada split precisa de um Account ID válido**
4. ✅ **A porcentagem é do valor total da venda**

### Exemplo Prático

**Cenário:** Você quer receber 10% de todas as vendas da loja ID 2

```sql
UPDATE split_configs
SET
  split_1_percentage = 10.00,
  split_1_pushin_pay_account = '9C3XXXXX3A043'  -- Seu Account ID
WHERE store_id = 2;
```

**Resultado:**

- Quando um cliente comprar R$ 100,00 na loja:
  - Você recebe: R$ 10,00 (10%)
  - Lojista recebe: R$ 90,00 (90%)

### Verificar Configuração

Para ver qual Account ID está configurado em uma loja:

```sql
SELECT
  store_id,
  split_1_percentage,
  split_1_pushin_pay_account,
  split_2_percentage,
  split_2_pushin_pay_account,
  is_active
FROM split_configs
WHERE store_id = 1; -- ID da loja
```

### Ativar/Desativar Split

```sql
-- Ativar split
UPDATE split_configs SET is_active = true WHERE store_id = 1;

-- Desativar split
UPDATE split_configs SET is_active = false WHERE store_id = 1;
```

---

**Dúvidas?** Consulte a documentação completa em `docs/SPLIT_CONFIG.md`
