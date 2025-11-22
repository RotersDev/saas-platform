# 📝 Guia para Equipe - Onde Editar Componentes

Este documento explica onde a equipe pode editar os componentes visuais (cards de produtos, categorias, etc.) e como atualizar o template padrão.

## 🎨 Componentes Visuais (HTML/JSX)

### 1. **Card de Produto**

**Arquivo:** `frontend/src/shop/components/ProductCard.tsx`

Este é o componente que renderiza cada card de produto na loja. Aqui você pode editar:

- Layout do card
- Estilos (classes Tailwind)
- Estrutura HTML
- Botões e ações

**Exemplo de edição:**

```tsx
// Linha 40 - Estrutura do card
<Link className="group relative bg-gradient-to-br from-gray-900 to-gray-800...">
  {/* Conteúdo do card */}
</Link>
```

### 2. **Seção de Categoria**

**Arquivo:** `frontend/src/shop/components/CategorySection.tsx`

Este componente renderiza uma categoria com seus produtos. Aqui você pode editar:

- Layout da seção
- Grid de produtos
- Título da categoria
- Botão "Ver mais"

**Exemplo de edição:**

```tsx
// Linha 58 - Grid de produtos
<div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4 xl:grid-cols-5">
  {products.map((product: any) => (
    // Cards de produtos
  ))}
</div>
```

### 3. **Página Inicial da Loja**

**Arquivo:** `frontend/src/shop/pages/Home.tsx`

Página principal da loja onde as categorias são renderizadas.

### 4. **Página de Produto Individual**

**Arquivo:** `frontend/src/shop/pages/Product.tsx`

Página de detalhes de um produto específico.

### 5. **Header da Loja**

**Arquivo:** `frontend/src/shop/components/ShopHeader.tsx`

Cabeçalho da loja (logo, menu, carrinho).

### 6. **Footer da Loja**

**Arquivo:** `frontend/src/shop/components/Footer.tsx`

Rodapé da loja.

---

## 🎯 Como Atualizar o Template Padrão

Quando a equipe atualiza os componentes acima, os **novos templates** criados pelos lojistas já vão vir com essas atualizações automaticamente, porque:

1. **Novos templates copiam do padrão:** Quando um lojista cria um novo template, ele copia o CSS/JS do template padrão atual.

2. **Template padrão é sempre vazio:** O template padrão (`Nerix - Template Padrão`) sempre começa vazio (sem CSS/JS customizado), então os novos templates também começam vazios.

### ⚠️ IMPORTANTE

**Os componentes React (ProductCard.tsx, CategorySection.tsx, etc.) são o código fonte real.**

Quando você edita esses arquivos:

- ✅ As mudanças aparecem **imediatamente** em todas as lojas
- ✅ Não precisa atualizar templates
- ✅ Afeta todas as lojas que não têm CSS/JS customizado

**O CSS/JS dos templates é apenas para personalização adicional** que os lojistas podem adicionar por cima do código base.

---

## 🔧 Processo de Atualização

### Quando Editar Componentes React:

- Mudar estrutura HTML dos cards
- Adicionar novos elementos visuais
- Alterar layout geral
- Adicionar novas funcionalidades

**Arquivos para editar:**

- `frontend/src/shop/components/ProductCard.tsx`
- `frontend/src/shop/components/CategorySection.tsx`
- `frontend/src/shop/pages/Home.tsx`
- `frontend/src/shop/pages/Product.tsx`
- `frontend/src/shop/components/ShopHeader.tsx`
- `frontend/src/shop/components/Footer.tsx`

### Quando Usar CSS/JS nos Templates:

- Apenas para personalizações específicas de estilo
- Ajustes de cores, espaçamentos, etc.
- Não para mudar estrutura HTML

---

## 📋 Resumo dos Arquivos Principais

| Componente             | Arquivo                                            | O que editar                             |
| ---------------------- | -------------------------------------------------- | ---------------------------------------- |
| **Card de Produto**    | `frontend/src/shop/components/ProductCard.tsx`     | Estrutura do card, estilos, botões       |
| **Seção de Categoria** | `frontend/src/shop/components/CategorySection.tsx` | Grid de produtos, layout da seção        |
| **Página Inicial**     | `frontend/src/shop/pages/Home.tsx`                 | Layout geral, organização das categorias |
| **Página de Produto**  | `frontend/src/shop/pages/Product.tsx`              | Detalhes do produto, galeria, descrição  |
| **Header**             | `frontend/src/shop/components/ShopHeader.tsx`      | Menu, logo, carrinho                     |
| **Footer**             | `frontend/src/shop/components/Footer.tsx`          | Rodapé, links, informações               |

---

## 💡 Dica

**Para mudanças estruturais:** Edite os arquivos React diretamente.

**Para personalizações de estilo:** Use CSS/JS nos templates (mas isso é para os lojistas, não para a equipe atualizar o padrão).

O template padrão sempre começa vazio, então novos templates sempre começam limpos e os lojistas podem personalizar a partir daí.
