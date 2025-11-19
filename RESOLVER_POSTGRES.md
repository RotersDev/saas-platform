# 🔧 Resolver Problema do PostgreSQL

## Problema Atual

O backend não consegue conectar ao PostgreSQL porque ele não está rodando.

## Solução Rápida - 3 Opções

### ✅ Opção 1: Usar Docker (RECOMENDADO)

1. **Instalar Docker Desktop**

   - Baixe: https://www.docker.com/products/docker-desktop
   - Instale e inicie o Docker Desktop
   - Aguarde ele iniciar completamente (ícone na bandeja do sistema)

2. **Iniciar PostgreSQL**

   ```powershell
   docker run --name saas_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=saas_platform -p 5432:5432 -d postgres:14-alpine
   ```

3. **Aguardar 5 segundos** e verificar:

   ```powershell
   docker ps
   ```

   Deve mostrar o container `saas_postgres` rodando.

4. **Criar tabelas**:

   ```powershell
   cd backend
   npm run db:sync
   npm run db:seed
   ```

5. **Reiniciar o servidor**:
   - Pare o `npm run dev` (Ctrl+C)
   - Execute novamente: `npm run dev`

---

### ✅ Opção 2: Instalar PostgreSQL Localmente

1. **Baixar PostgreSQL**

   - https://www.postgresql.org/download/windows/
   - Instale com a senha: `postgres`

2. **Criar banco de dados**

   - Abra o **pgAdmin** (vem com a instalação)
   - Ou use o **SQL Shell (psql)**
   - Execute:
     ```sql
     CREATE DATABASE saas_platform;
     ```

3. **Verificar arquivo `.env`**

   - Certifique-se que `backend/.env` tem:
     ```env
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=saas_platform
     DB_USER=postgres
     DB_PASSWORD=postgres  # ou a senha que você definiu
     ```

4. **Criar tabelas**:

   ```powershell
   cd backend
   npm run db:sync
   npm run db:seed
   ```

5. **Reiniciar o servidor**

---

### ✅ Opção 3: Usar PostgreSQL Online (Temporário)

Para testes rápidos, você pode usar um serviço gratuito:

1. **Criar conta no ElephantSQL** (grátis)

   - https://www.elephantsql.com/
   - Crie uma instância gratuita

2. **Atualizar `.env`** com as credenciais fornecidas:

   ```env
   DB_HOST=seu-host.elephantsql.com
   DB_PORT=5432
   DB_NAME=seu-database
   DB_USER=seu-usuario
   DB_PASSWORD=sua-senha
   ```

3. **Criar tabelas**:
   ```powershell
   cd backend
   npm run db:sync
   npm run db:seed
   ```

---

## ⚡ Solução Mais Rápida Agora

Se você quer testar AGORA sem instalar nada:

1. **Instale Docker Desktop** (é rápido, ~5 minutos)
2. **Execute o comando Docker** acima
3. **Pronto!**

---

## 🔍 Verificar se está funcionando

Após configurar, teste a conexão:

```powershell
cd backend
npm run db:sync
```

Se aparecer:

```
✅ Conexão estabelecida!
✅ Tabelas sincronizadas com sucesso!
```

Está funcionando! 🎉

---

## ❓ Ainda com problemas?

1. Verifique se a porta 5432 está livre:

   ```powershell
   netstat -an | findstr 5432
   ```

2. Verifique o arquivo `.env`:

   - Está em `backend/.env`?
   - As credenciais estão corretas?

3. Teste a conexão manualmente (se tiver psql):
   ```bash
   psql -h localhost -U postgres -d saas_platform
   ```

