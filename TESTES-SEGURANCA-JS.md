# ⚠️ TESTES DE SEGURANÇA - JavaScript Malicioso

**ATENÇÃO: ESTES CÓDIGOS SÃO APENAS PARA TESTES DE SEGURANÇA!**

Use apenas em ambiente de teste para verificar se o isolamento está funcionando corretamente.

---

## 🎯 Objetivo dos Testes

Verificar se o código JavaScript customizado:

- ✅ Afeta apenas a loja específica
- ✅ NÃO afeta outras lojas
- ✅ NÃO afeta o dashboard/admin (`/store`, `/admin`)
- ✅ NÃO afeta a landing page (`/`)
- ✅ NÃO derruba o servidor
- ✅ NÃO consome recursos de outras lojas

---

## 🔴 TESTE 1: Loop Infinito (CPU 100%)

**Objetivo:** Testar se um loop infinito trava apenas a aba da loja ou afeta outras lojas.

```javascript
// Loop infinito que consome 100% da CPU
while (true) {
  console.log("Loop infinito ativo");
  // Isso deve travar apenas a aba da loja atual
}
```

**Resultado esperado:** Apenas a aba da loja deve travar. Outras abas, dashboard e landing page devem funcionar normalmente.

---

## 🔴 TESTE 2: Consumo Excessivo de Memória

**Objetivo:** Testar se o consumo de memória afeta outras lojas.

```javascript
// Criar arrays gigantes para consumir memória
const memoryKiller = [];
for (let i = 0; i < 10000000; i++) {
  memoryKiller.push(new Array(1000).fill("X"));
  if (i % 100000 === 0) {
    console.log("Consumindo memória...", i);
  }
}
```

**Resultado esperado:** Apenas a aba da loja deve ficar lenta. Outras abas devem funcionar normalmente.

---

## 🔴 TESTE 3: Manipulação do DOM Global

**Objetivo:** Testar se o código consegue modificar elementos de outras lojas ou do dashboard.

```javascript
// Tentar modificar TODOS os elementos do DOM
const allElements = document.querySelectorAll("*");
allElements.forEach((el, index) => {
  el.style.backgroundColor = "red";
  el.style.color = "white";
  if (index % 100 === 0) {
    console.log("Modificando elemento", index);
  }
});

// Tentar remover elementos críticos
const criticalElements = document.querySelectorAll("header, footer, nav, main");
criticalElements.forEach((el) => {
  el.remove();
  console.log("Elemento removido:", el.tagName);
});
```

**Resultado esperado:** Apenas os elementos da loja atual devem ser afetados. Dashboard e outras lojas não devem ser afetados.

---

## 🔴 TESTE 4: Sobrecarga de Requisições

**Objetivo:** Testar se requisições infinitas derrubam o servidor ou afetam outras lojas.

```javascript
// Fazer requisições infinitas
let requestCount = 0;
function spamRequests() {
  fetch("/api/public/store")
    .then(() => {
      requestCount++;
      console.log("Requisição", requestCount);
      spamRequests(); // Recursão infinita
    })
    .catch(() => {
      spamRequests(); // Continuar mesmo com erro
    });
}

// Iniciar spam
spamRequests();

// Também tentar fazer requisições para outros endpoints
setInterval(() => {
  fetch("/api/stores").catch(() => {});
  fetch("/api/admin/stores").catch(() => {});
  fetch("/").catch(() => {});
}, 10); // A cada 10ms
```

**Resultado esperado:** O servidor pode ficar lento, mas não deve derrubar. Outras lojas podem ser afetadas se o servidor ficar sobrecarregado (isso é esperado e mostra que o isolamento não pode proteger contra sobrecarga de servidor).

---

## 🔴 TESTE 5: Modificação de localStorage/sessionStorage

**Objetivo:** Testar se o código consegue acessar dados de outras lojas.

```javascript
// Tentar acessar e modificar storage global
try {
  // Limpar todo o localStorage
  localStorage.clear();
  console.log("localStorage limpo!");

  // Limpar sessionStorage
  sessionStorage.clear();
  console.log("sessionStorage limpo!");

  // Tentar sobrescrever dados críticos
  localStorage.setItem("auth_token", "HACKED");
  localStorage.setItem("user", JSON.stringify({ hacked: true }));
  sessionStorage.setItem("cart", "[]");

  console.log("Storage modificado!");
} catch (e) {
  console.error("Erro ao modificar storage:", e);
}
```

**Resultado esperado:** O localStorage/sessionStorage é compartilhado entre abas do mesmo domínio, então isso pode afetar outras abas. Isso é um comportamento normal do navegador, não um bug do isolamento.

---

## 🔴 TESTE 6: Interceptação de Eventos Globais

**Objetivo:** Testar se o código consegue interceptar eventos de outras lojas.

```javascript
// Interceptar TODOS os eventos
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener, options) {
  console.log("Evento interceptado:", type);
  // Chamar o listener original
  return originalAddEventListener.call(this, type, listener, options);
};

// Interceptar clicks globais
document.addEventListener(
  "click",
  function (e) {
    console.log("Click interceptado em:", e.target);
    e.preventDefault(); // Bloquear todos os clicks
    e.stopPropagation();
  },
  true
); // Captura fase

// Interceptar form submissions
document.addEventListener(
  "submit",
  function (e) {
    console.log("Form interceptado!");
    e.preventDefault();
    e.stopPropagation();
  },
  true
);
```

**Resultado esperado:** Apenas os eventos da loja atual devem ser interceptados. Dashboard e outras lojas não devem ser afetados (se o isolamento estiver funcionando).

---

## 🔴 TESTE 7: Modificação de window/document Global

**Objetivo:** Testar se o código consegue modificar objetos globais que afetam outras lojas.

```javascript
// Tentar sobrescrever funções globais
window.alert = function () {
  console.log("Alert interceptado!");
};

window.confirm = function () {
  console.log("Confirm interceptado!");
  return true;
};

window.fetch = function () {
  console.log("Fetch interceptado!");
  return Promise.reject("Fetch bloqueado");
};

// Tentar modificar document
document.write = function () {
  console.log("document.write interceptado!");
};

// Tentar modificar console
console.log = function () {
  // Silenciar todos os logs
};

// Tentar sobrescrever XMLHttpRequest
const OriginalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
  console.log("XMLHttpRequest interceptado!");
  return new OriginalXHR();
};
```

**Resultado esperado:** Como o código está em uma IIFE isolada, essas modificações devem afetar apenas o escopo da loja. Dashboard e outras lojas não devem ser afetados.

---

## 🔴 TESTE 8: Criação Massiva de Elementos DOM

**Objetivo:** Testar se criar muitos elementos DOM afeta outras lojas.

```javascript
// Criar milhares de elementos
for (let i = 0; i < 100000; i++) {
  const div = document.createElement("div");
  div.innerHTML = "Elemento " + i;
  div.style.position = "absolute";
  div.style.left = (i % 1000) + "px";
  div.style.top = Math.floor(i / 1000) + "px";
  document.body.appendChild(div);

  if (i % 1000 === 0) {
    console.log("Criados", i, "elementos");
  }
}
```

**Resultado esperado:** Apenas a página da loja deve ficar lenta. Dashboard e outras lojas não devem ser afetados.

---

## 🔴 TESTE 9: Tentativa de Acessar Outros Domínios/Subdomínios

**Objetivo:** Testar se o código consegue fazer requisições para outros domínios.

```javascript
// Tentar fazer requisições para outros subdomínios
const domains = [
  "https://outraloja.nerix.online",
  "https://nerix.com.br",
  "https://nerix.com.br/store",
  "https://nerix.com.br/admin",
  "http://localhost:3000/api/stores",
  "http://localhost:3000/api/admin/stores",
];

domains.forEach((domain) => {
  fetch(domain)
    .then((res) => {
      console.log("Conseguiu acessar:", domain);
      return res.text();
    })
    .then((data) => {
      console.log("Dados recebidos de", domain, ":", data.substring(0, 100));
    })
    .catch((err) => {
      console.log("Erro ao acessar", domain, ":", err.message);
    });
});
```

**Resultado esperado:** Requisições para outros domínios devem falhar por CORS. Requisições para o mesmo domínio podem funcionar, mas o backend deve validar permissões.

---

## 🔴 TESTE 10: Loop com setTimeout (CPU Gradual)

**Objetivo:** Testar se loops com setTimeout afetam outras lojas.

```javascript
// Loop infinito com setTimeout (mais sutil)
let count = 0;
function recursiveLoop() {
  count++;
  console.log("Loop", count);

  // Criar elementos
  const div = document.createElement("div");
  div.textContent = "Loop " + count;
  document.body.appendChild(div);

  // Continuar o loop
  setTimeout(recursiveLoop, 0);
}

// Iniciar
recursiveLoop();
```

**Resultado esperado:** Apenas a aba da loja deve ficar lenta. Dashboard e outras lojas não devem ser afetados.

---

## 🔴 TESTE 11: Tentativa de Modificar React/Estado Global

**Objetivo:** Testar se o código consegue acessar o estado do React ou outras lojas.

```javascript
// Tentar acessar React DevTools
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log("React DevTools encontrado!");
  // Tentar acessar componentes
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log("Hook:", hook);
}

// Tentar acessar variáveis globais do React
if (window.React) {
  console.log("React encontrado!", window.React);
}

// Tentar acessar stores do Zustand
if (window.__ZUSTAND_STORES__) {
  console.log("Zustand stores encontrados!");
}

// Tentar modificar window global
window.hacked = true;
window.storeHacked = true;
```

**Resultado esperado:** O código pode acessar objetos globais do navegador, mas não deve conseguir acessar o estado interno do React de outras lojas devido ao isolamento de escopo.

---

## 🔴 TESTE 12: Web Workers Maliciosos

**Objetivo:** Testar se Web Workers podem ser usados para consumir recursos.

```javascript
// Criar Web Worker que consome CPU
const workerCode = `
  while(true) {
    // Loop infinito no worker
    postMessage('Worker ativo');
  }
`;

const blob = new Blob([workerCode], { type: "application/javascript" });
const workerUrl = URL.createObjectURL(blob);

// Criar múltiplos workers
for (let i = 0; i < 10; i++) {
  const worker = new Worker(workerUrl);
  worker.onmessage = (e) => {
    console.log("Worker", i, ":", e.data);
  };
}
```

**Resultado esperado:** Workers devem consumir CPU, mas apenas na aba da loja. Dashboard e outras lojas não devem ser afetados.

---

## 📊 Como Testar

1. **Criar uma loja de teste** no dashboard
2. **Ir em Configurações > Templates > Editar** um template
3. **Colar um dos códigos acima** no campo JavaScript
4. **Salvar e ativar** o template
5. **Abrir a loja** em uma aba
6. **Abrir o dashboard** em outra aba
7. **Abrir outra loja** em outra aba
8. **Abrir a landing page** em outra aba
9. **Verificar** se apenas a loja com o código malicioso foi afetada

---

## ✅ Checklist de Segurança

Após executar os testes, verifique:

- [ ] A loja com código malicioso foi afetada
- [ ] O dashboard (`/store`) continua funcionando normalmente
- [ ] O admin (`/admin`) continua funcionando normalmente
- [ ] A landing page (`/`) continua funcionando normalmente
- [ ] Outras lojas continuam funcionando normalmente
- [ ] O servidor não foi derrubado (pode ficar lento, mas não deve cair)
- [ ] Logs de erro aparecem no console apenas da loja afetada

---

## ⚠️ Limitações Conhecidas

1. **Sobrecarga de Servidor:** Se o código fizer muitas requisições, o servidor pode ficar lento e afetar todas as lojas. Isso é esperado e não é um bug do isolamento.

2. **localStorage/sessionStorage:** São compartilhados entre abas do mesmo domínio. Isso é comportamento normal do navegador.

3. **Recursos do Navegador:** Se o código consumir muita CPU/memória, pode afetar outras abas no mesmo navegador, mas não outras lojas em outros navegadores/servidores.

---

## 🛡️ Proteções Implementadas

1. **IIFE (Isolated Function):** O código é envolvido em uma função isolada
2. **Verificação de Rota:** O código não executa em `/store`, `/admin` ou `/`
3. **Try/Catch:** Erros são capturados e não quebram a aplicação
4. **Escopo Isolado:** Variáveis não poluem o escopo global
5. **Remoção Automática:** Scripts são removidos quando a loja muda

---

## 📝 Notas Finais

- Estes testes são para verificar o **isolamento de escopo JavaScript**
- Eles **NÃO protegem** contra sobrecarga de servidor (isso requer rate limiting no backend)
- Eles **NÃO protegem** contra ataques de DDoS (isso requer proteção de infraestrutura)
- O objetivo é garantir que código malicioso de uma loja **não afete outras lojas** no frontend

---

**Última atualização:** 2025-01-22
