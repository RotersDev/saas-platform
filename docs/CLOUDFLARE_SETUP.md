# Guia de Configuração do Cloudflare

Este guia explica como configurar seu domínio customizado usando o Cloudflare para que sua loja funcione com seu próprio domínio.

## Pré-requisitos

1. Uma conta no Cloudflare (gratuita)
2. Seu domínio gerenciado pelo Cloudflare
3. Token da API do Cloudflare

## Passo 1: Criar Token da API do Cloudflare

1. Acesse o [painel do Cloudflare](https://dash.cloudflare.com/)
2. Vá em **My Profile** → **API Tokens**
3. Clique em **Create Token**
4. Use o template **Edit zone DNS** ou crie um token customizado com as seguintes permissões:
   - **Zone** → **DNS** → **Edit**
   - **Zone** → **Zone** → **Read**
5. Selecione a zona (domínio) que deseja usar
6. Clique em **Continue to summary** e depois em **Create Token**
7. **Copie o token** (você só verá ele uma vez!)

## Passo 2: Obter Zone ID (Opcional)

Se você quiser fornecer o Zone ID manualmente:

1. No painel do Cloudflare, selecione seu domínio
2. Role até o final da página na seção **Overview**
3. Copie o **Zone ID** que aparece no lado direito

> **Nota:** Se você não fornecer o Zone ID, o sistema tentará detectá-lo automaticamente usando o nome do domínio.

## Passo 3: Configurar Domínio na Plataforma

1. Acesse **Configurações** → **Domínios** no painel da sua loja
2. Digite seu domínio (ex: `exemplo.com`)
3. Marque a opção **Configurar automaticamente via Cloudflare**
4. Cole o **Token da API** que você criou
5. (Opcional) Cole o **Zone ID** se você o copiou
6. Clique em **Adicionar**

## Passo 4: Configuração Manual (Alternativa)

Se preferir configurar manualmente ou não usar Cloudflare:

### Opção A: Usando Cloudflare (Recomendado)

1. No painel do Cloudflare, vá em **DNS** → **Records**
2. Clique em **Add record**
3. Configure:
   - **Type:** CNAME
   - **Name:** @ (ou subdomínio desejado)
   - **Target:** `seu-subdominio.nerix.site` (substitua pelo seu subdomínio)
   - **Proxy status:** Proxied (nuvem laranja)
   - **TTL:** Auto
4. Clique em **Save**

### Opção B: Usando outro provedor DNS

1. Acesse o painel do seu provedor DNS
2. Crie um registro CNAME:
   - **Nome:** @ (ou subdomínio)
   - **Valor:** `seu-subdominio.nerix.site`
   - **TTL:** 3600 (ou o padrão)

## Passo 5: Verificar Configuração

1. Após adicionar o domínio, clique em **Verificar**
2. O sistema verificará se o DNS está configurado corretamente
3. Se estiver correto, o domínio será marcado como verificado

## Passo 6: Definir como Domínio Primário

1. Após verificação bem-sucedida, clique em **Definir como primário**
2. Todos os links da sua loja passarão a usar este domínio

## Troubleshooting

### Domínio não verifica

- **Aguarde até 24 horas:** Mudanças de DNS podem levar tempo para propagar
- **Verifique o DNS:** Use ferramentas como `dig` ou [whatsmydns.net](https://www.whatsmydns.net/)
- **Verifique o CNAME:** Deve apontar para `seu-subdominio.nerix.site`

### Erro ao criar registro DNS automaticamente

- Verifique se o token tem as permissões corretas
- Verifique se o domínio está no Cloudflare
- Tente fornecer o Zone ID manualmente

### SSL não funciona

- Se usar Cloudflare com proxy (nuvem laranja), o SSL é automático
- Se usar DNS direto, você precisará configurar SSL manualmente

## Segurança

⚠️ **Importante:**

- Nunca compartilhe seu token da API do Cloudflare
- Use tokens com permissões mínimas necessárias
- Revogue tokens antigos que não estão mais em uso
- O token é armazenado de forma segura e usado apenas para configuração DNS

## Suporte

Se precisar de ajuda adicional, entre em contato com o suporte da plataforma.
