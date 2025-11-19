# Configuração de Split de Pagamento

## Como Receber Sua Porcentagem das Vendas

Para receber automaticamente a porcentagem das vendas dos lojistas via split, você precisa configurar seu **Account ID do Pushin Pay**.

### Passo 1: Obter seu Account ID

1. Acesse o painel do Pushin Pay: https://app.pushinpay.com.br
2. Faça login na sua conta
3. Vá em **Configurações** ou **Perfil**
4. Copie seu **Account ID** (não é o token, é o ID da conta)

### Passo 2: Configurar no Sistema

Execute o script de configuração:

```bash
cd backend
npm run set-platform-account
```

O script irá:

- Pedir seu Account ID do Pushin Pay
- Salvar no banco de dados
- Configurar automaticamente para receber splits

### Passo 3: Configurar Split por Loja

Para cada loja, você precisa configurar a porcentagem que você receberá. Isso é feito diretamente no banco de dados na tabela `split_configs`.

**Exemplo: Se você quer receber 10% de todas as vendas de uma loja:**

```sql
UPDATE split_configs
SET
  split_1_percentage = 10.00,
  split_1_pushin_pay_account = 'SEU_ACCOUNT_ID_AQUI'
WHERE store_id = 1; -- ID da loja
```

**Importante:**

- O total de splits não pode exceder 50% (limite do Pushin Pay)
- Você pode configurar até 6 splits diferentes por loja
- Use os campos `split_X_pushin_pay_account` para Pushin Pay
- Use os campos `split_X_mercado_pago_account` para Mercado Pago

### Estrutura da Tabela split_configs

```sql
split_1_percentage          -- Porcentagem do primeiro split (ex: 10.00)
split_1_pushin_pay_account  -- Seu Account ID para receber esse split
split_2_percentage          -- Porcentagem do segundo split (se houver)
split_2_pushin_pay_account  -- Account ID do segundo split
-- ... até split_6
```

### Como Funciona

1. **Lojista cria um PIX** usando o token dele
2. **Sistema calcula automaticamente** os splits baseado na configuração
3. **Pushin Pay divide o pagamento** automaticamente:
   - X% vai para você (conta da plataforma)
   - Restante vai para o lojista
4. **Você recebe automaticamente** na sua conta Pushin Pay

### Verificar Configuração Atual

Para ver qual Account ID está configurado:

```sql
SELECT value FROM platform_settings WHERE key = 'pushin_pay_account_id';
```

### Troubleshooting

**Não estou recebendo os splits:**

1. Verifique se o Account ID está correto
2. Verifique se o split está ativo (`is_active = true`)
3. Verifique se a porcentagem está configurada corretamente
4. Verifique os logs do sistema para erros

**Erro ao criar PIX:**

- Verifique se o token do lojista está válido
- Verifique se a soma dos splits não excede 50%
- Verifique se os Account IDs estão corretos
