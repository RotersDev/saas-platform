# 🔒 Checklist de Segurança - Lançamento Mundial

## ✅ Correções Implementadas

### 1. Proteção de Pedidos Públicos

- ✅ **Removido acesso por ID numérico sequencial** - Agora só aceita `order_number` (UUID)
- ✅ **Chaves/licenças não expostas** - Só retornam se pedido estiver `delivered`
- ✅ **Validação de email opcional** - Pode validar email para acessar pedidos

### 2. IDs Não Sequenciais

- ✅ **Order numbers já usam UUID** - Formato: `ORD-{timestamp}-{uuid8chars}`
- ✅ **Não permite busca por ID numérico** - Apenas `order_number` em rotas públicas

---

## 🚨 Checklist Crítico ANTES do Lançamento

### 🔐 Variáveis de Ambiente (CRÍTICO)

- [ ] **JWT_SECRET** - Deve ser uma string aleatória de pelo menos 32 caracteres

  ```bash
  # Gerar secret seguro:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **DB_PASSWORD** - Senha forte do PostgreSQL (mínimo 16 caracteres)
- [ ] **PUSHIN_PAY_TOKEN** - Token do gateway de pagamento configurado
- [ ] **CLOUDFLARE_API_TOKEN** - Se usar domínios customizados
- [ ] **R2_SECRET_ACCESS_KEY** - Se usar upload de arquivos
- [ ] **EMAIL_PASS** - Senha do email (se usar envio de emails)

### 🛡️ Configurações de Produção

- [ ] **NODE_ENV=production** - Definido no `.env`
- [ ] **Rate Limiting** - Configurado (100 req/15min por IP)
- [ ] **CORS** - Apenas domínios permitidos configurados
- [ ] **Helmet** - Middleware de segurança ativo
- [ ] **Trust Proxy** - Configurado corretamente (apenas 1 proxy)

### 🔒 Segurança de Banco de Dados

- [ ] **PostgreSQL não exposto** - Porta 5432 não acessível externamente
- [ ] **Senha forte** - Banco com senha segura
- [ ] **Backup automático** - Sistema de backup configurado
- [ ] **Conexões limitadas** - Pool configurado (max: 20)

### 🌐 Segurança de Rede

- [ ] **HTTPS/SSL** - Certificado SSL configurado (Let's Encrypt)
- [ ] **Firewall** - Apenas portas necessárias abertas (80, 443, 22)
- [ ] **Nginx** - Configurado como reverse proxy
- [ ] **Rate Limiting no Nginx** - Configurado adicionalmente

### 🔑 Autenticação e Autorização

- [ ] **JWT expiração** - Configurado (7 dias padrão)
- [ ] **Sessões ativas** - Sistema de sessões funcionando
- [ ] **Roles verificadas** - `master_admin`, `store_admin` protegidos
- [ ] **Isolamento de dados** - Cada loja só acessa seus dados

### 💳 Pagamentos

- [ ] **Webhooks verificados** - Webhooks do gateway validados
- [ ] **Status de pagamento** - Sempre verificado no gateway (não confiar no frontend)
- [ ] **Entrega só após pagamento** - `deliverOrder` verifica `status === 'paid'`
- [ ] **Estoque protegido** - Só remove estoque após entrega confirmada

### 📦 Dados Sensíveis

- [ ] **Chaves/licenças** - Só expostas em pedidos entregues
- [ ] **Senhas** - Nunca retornadas (apenas hash bcrypt)
- [ ] **Tokens** - Nunca expostos em logs ou respostas
- [ ] **Emails** - Não expostos publicamente

### 🚫 Rotas Públicas

- [ ] **GET /api/public/orders/:id** - Protegido (só order_number, validação de email)
- [ ] **POST /api/public/orders** - Validado (preços recalculados no backend)
- [ ] **GET /api/public/products** - Apenas dados públicos
- [ ] **POST /api/public/customers/register** - Rate limited

### 📊 Logs e Monitoramento

- [ ] **Logs não expõem senhas** - Senhas nunca logadas
- [ ] **Erros genéricos em produção** - Detalhes só em desenvolvimento
- [ ] **Monitoramento ativo** - Sistema de monitoramento configurado
- [ ] **Alertas** - Alertas para atividades suspeitas

### 🔄 Atualizações e Manutenção

- [ ] **Dependências atualizadas** - `npm audit` sem vulnerabilidades críticas
- [ ] **Node.js atualizado** - Versão LTS mais recente
- [ ] **PostgreSQL atualizado** - Versão suportada
- [ ] **PM2 configurado** - Auto-restart em caso de crash

### 🧪 Testes de Segurança

- [ ] **Teste de rate limiting** - Verificar bloqueio após 100 requests
- [ ] **Teste de autenticação** - Tentar acessar rotas protegidas sem token
- [ ] **Teste de isolamento** - Verificar que loja A não acessa dados da loja B
- [ ] **Teste de enumeração** - Tentar acessar pedidos com IDs sequenciais (deve falhar)

---

## ⚠️ Vulnerabilidades Conhecidas e Mitigadas

### 1. Enumeração de Pedidos

**Status:** ✅ **CORRIGIDO**

- **Antes:** Podia buscar pedidos por ID numérico (1, 2, 3...)
- **Agora:** Apenas `order_number` (UUID) aceito
- **Mitigação:** IDs não sequenciais + validação de email opcional

### 2. Exposição de Chaves/Licenças

**Status:** ✅ **CORRIGIDO**

- **Antes:** Chaves expostas em qualquer pedido
- **Agora:** Chaves só retornadas se `status === 'delivered'`
- **Mitigação:** Remoção de `product_key` em pedidos não entregues

### 3. Burlar Pagamento

**Status:** ✅ **PROTEGIDO**

- **Validação:** Status sempre verificado no gateway
- **Entrega:** Só acontece se `order.status === 'paid'`
- **Mitigação:** Backend sempre valida, frontend não pode burlar

---

## 📝 Comandos Úteis para Verificação

### Verificar variáveis de ambiente

```bash
cd backend
cat .env | grep -E "SECRET|PASSWORD|TOKEN" | sed 's/=.*/=***/'
```

### Verificar vulnerabilidades nas dependências

```bash
cd backend
npm audit
npm audit fix
```

### Testar rate limiting

```bash
# Deve bloquear após 100 requests
for i in {1..110}; do curl http://localhost:3000/api/public/products; done
```

### Verificar logs por erros

```bash
pm2 logs saas-platform-backend | grep -i "error\|warn"
```

### Verificar conexões do banco

```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🎯 Prioridades para Lançamento

### 🔴 CRÍTICO (Fazer AGORA)

1. ✅ Proteger rota pública de pedidos
2. ✅ Remover IDs sequenciais
3. ⚠️ Verificar todas as variáveis de ambiente
4. ⚠️ Configurar HTTPS/SSL
5. ⚠️ Testar rate limiting

### 🟡 IMPORTANTE (Fazer antes de lançar)

1. ⚠️ Configurar backup automático
2. ⚠️ Configurar monitoramento
3. ⚠️ Atualizar dependências
4. ⚠️ Testar isolamento de dados
5. ⚠️ Verificar logs não expõem dados sensíveis

### 🟢 DESEJÁVEL (Fazer depois)

1. ⚠️ Implementar 2FA para admins
2. ⚠️ Adicionar CAPTCHA em registros
3. ⚠️ Implementar WAF (Web Application Firewall)
4. ⚠️ Adicionar honeypots

---

## 📞 Suporte e Contato

Em caso de vulnerabilidade encontrada:

1. **NÃO** divulgue publicamente
2. Reporte imediatamente
3. Aguarde correção antes de explorar

---

**Última atualização:** $(date)
**Versão:** 1.0.0
