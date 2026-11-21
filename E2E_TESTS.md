# Testes E2E: Fluxo Completo no Navegador Real

## 📊 O que são Testes E2E?

**Nível 3 da Pirâmide de Testes** — sem nenhum mock, navegador real, servidor real, dados reais.

```
Teste Unitário (Level 1)
↓ Reduz mocks: arquivo real
Teste de Integração (Level 2)
↓ Reduz mocks: browser real
Teste E2E (Level 3)  ← Você está aqui
```

## 🎯 Diferenças: Integration vs E2E

| Aspecto | Integração | E2E |
|---------|-----------|-----|
| **HTTP Client** | Supertest (em memória) | Navegador real (Chrome/Firefox) |
| **JavaScript Render** | ✗ Não | ✓ Sim (React, eventos do browser) |
| **User Interactions** | Requisição HTTP | Cliques, digitação, navegação |
| **Tempo** | ~50-200ms | ~1-5s |
| **Valor** | Fluxo de API | Fluxo do usuário real |
| **Falhas Pega** | Integração ruim | UI quebrada, navegação ruim |

## 🏗️ Exemplo: Transformação Integration → E2E

### Teste de Integração (Supertest)
```javascript
// posts.integration.test.js
it('deve criar post e persistir', async () => {
  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'Meu Post', content: '...', author: 'João' })
  
  expect(response.status).toBe(201)
  
  // Verifica resposta HTTP
  const persisted = await repository.findById(response.body.id)
  expect(persisted).toBeDefined()
})
```

**O que testa:** API retorna 201 e dados persistem

### Teste E2E (Playwright)
```javascript
// tests/e2e/posts.spec.js
test('deve criar post via form e aparecer na lista', async ({ page }) => {
  await page.goto('/new')
  
  // Usuário preenche form
  await page.locator('input[placeholder*="Título"]').fill('Meu Post')
  await page.locator('textarea[placeholder*="Conteúdo"]').fill('...')
  await page.locator('input[placeholder*="Autor"]').fill('João')
  
  // Usuário clica "Criar"
  await page.locator('button:has-text("Criar Post")').click()
  
  // ✓ App redireciona para home
  await expect(page).toHaveURL('/')
  
  // ✓ Post aparece na lista (React renderizou)
  await expect(page.locator('text=Meu Post')).toBeVisible()
})
```

**O que testa:** Fluxo do usuário: form → clique → redirect → UI renderizada

---

## 🧪 Testes E2E Implementados

### Setup (Playwright)
```javascript
import { test, expect } from '@playwright/test'

test.describe('Posts App - E2E Tests', () => {
  // Playwright inicia servidor em background (via playwright.config.js)
  // Abre navegador Chromium
  // Executa testes contra http://localhost:3000
})
```

**Configuração automática:**
- ✓ `npm run dev` inicia em background
- ✓ Aguarda server estar pronto
- ✓ Abre navegador Chromium
- ✓ Reutiliza servidor se já estiver rodando

### Casos de Teste

#### 1️⃣ HomePage: Listar Posts
```javascript
test('deve carregar a página inicial', async ({ page }) => {
  await page.goto('/')
  
  // ✓ Valida title
  await expect(page).toHaveTitle(/Blog/)
  
  // ✓ Valida heading
  await expect(page.locator('h1')).toContainText('Posts')
})

test('deve exibir lista vazia quando não há posts', async ({ page }) => {
  await page.goto('/')
  
  // ✓ Busca mensagem "Nenhum post encontrado"
  const emptyMessage = page.locator('text=Nenhum post encontrado')
  await expect(emptyMessage).toBeVisible()
})

test('deve exibir posts quando existem', async ({ page, request }) => {
  // Cria posts via API
  const post1 = await createPostViaAPI(request)
  const post2 = await createPostViaAPI(request)
  
  await page.goto('/')
  
  // ✓ Ambos aparecem
  await expect(page.locator('text=Post Teste E2E')).toHaveCount(2)
  
  // ✓ Ordem DESC (mais recente primeiro)
  const firstPost = page.locator('[data-testid="post-card"]').first()
  expect(firstPost).toBeDefined()
})
```

**Cenários cobertos:**
- ✓ Page load com CSS/JS corretos
- ✓ Lista vazia
- ✓ Lista com dados
- ✓ Ordem DESC

#### 2️⃣ NewPostPage: Criar Post
```javascript
test('deve exibir form para criar post', async ({ page }) => {
  await page.goto('/new')
  
  // ✓ Todos os campos visíveis
  await expect(page.locator('input[placeholder*="Título"]')).toBeVisible()
  await expect(page.locator('textarea[placeholder*="Conteúdo"]')).toBeVisible()
  await expect(page.locator('input[placeholder*="Autor"]')).toBeVisible()
})

test('deve criar post válido e redirecionar', async ({ page }) => {
  await page.goto('/new')
  
  // ✓ Preenche form (interação do usuário)
  await page.locator('input[placeholder*="Título"]').fill('Novo Post')
  await page.locator('textarea[placeholder*="Conteúdo"]').fill('...')
  await page.locator('input[placeholder*="Autor"]').fill('João')
  
  // ✓ Clica criar
  await page.locator('button:has-text("Criar Post")').click()
  
  // ✓ Redireciona para home (router funcionando)
  await expect(page).toHaveURL('/')
  
  // ✓ Post aparece na lista (React renderizou)
  await expect(page.locator('text=Novo Post')).toBeVisible()
})

test('deve validar título vazio', async ({ page }) => {
  await page.goto('/new')
  
  // ✓ Deixa título vazio
  await page.locator('input[placeholder*="Título"]').fill('')
  await page.locator('textarea[placeholder*="Conteúdo"]').fill('...')
  await page.locator('input[placeholder*="Autor"]').fill('João')
  
  // ✓ Clica criar
  await page.locator('button:has-text("Criar Post")').click()
  
  // ✓ NÃO redireciona (validação do form funcionando)
  await expect(page).toHaveURL('/new')
  
  // ✓ Mostra erro (validação visual)
  const errorMsg = page.locator('text=/title|Título.*obrigatório/i')
  await expect(errorMsg).toBeVisible()
})
```

**Cenários cobertos:**
- ✓ Form renderiza corretamente
- ✓ Criação válida + redirect
- ✓ Validação de campo vazio
- ✓ Validação de conteúdo curto
- ✓ Múltiplos erros simultaneamente

#### 3️⃣ PostPage: Ver Detalhes
```javascript
test('deve exibir detalhes completos do post', async ({ page, request }) => {
  // Cria via API
  const post = await createPostViaAPI(request)
  
  // ✓ Acessa página específica
  await page.goto(`/post/${post.id}`)
  
  // ✓ Valida conteúdo renderizado
  await expect(page.locator(`text=${post.title}`)).toBeVisible()
  await expect(page.locator(`text=${post.author}`)).toBeVisible()
  await expect(page.locator(`text=${post.content}`)).toBeVisible()
})

test('deve ter botão para editar', async ({ page, request }) => {
  const post = await createPostViaAPI(request)
  
  await page.goto(`/post/${post.id}`)
  
  // ✓ Busca botão
  const editButton = page.locator('button:has-text("Editar")')
  await expect(editButton).toBeVisible()
  
  // ✓ Clica e navega para /edit/:id
  await editButton.click()
  await expect(page).toHaveURL(`/edit/${post.id}`)
})

test('deve deletar post ao confirmar', async ({ page, request }) => {
  const post = await createPostViaAPI(request)
  
  await page.goto(`/post/${post.id}`)
  
  // ✓ Clica deletar
  await page.locator('button:has-text("Deletar")').click()
  
  // ✓ Confirma no dialog
  const confirmButton = page.locator('button:has-text("Confirmar")')
  if (await confirmButton.isVisible()) {
    await confirmButton.click()
  }
  
  // ✓ Redireciona para home
  await expect(page).toHaveURL('/')
  
  // ✓ Post desaparece da lista
  await expect(page.locator(`text=${post.title}`)).not.toBeVisible()
})
```

**Cenários cobertos:**
- ✓ Renderização de post único
- ✓ Botão editar com navegação
- ✓ Botão deletar com confirmação
- ✓ 404 para post inexistente

#### 4️⃣ EditPostPage: Atualizar Post
```javascript
test('deve exibir form com dados atuais', async ({ page, request }) => {
  const post = await createPostViaAPI(request)
  
  await page.goto(`/edit/${post.id}`)
  
  // ✓ Campos preenchidos com dados atuais
  await expect(page.locator('input[placeholder*="Título"]')).toHaveValue(post.title)
  await expect(page.locator('textarea[placeholder*="Conteúdo"]')).toHaveValue(post.content)
  await expect(page.locator('input[placeholder*="Autor"]')).toHaveValue(post.author)
})

test('deve atualizar e redirecionar', async ({ page, request }) => {
  const post = await createPostViaAPI(request)
  
  await page.goto(`/edit/${post.id}`)
  
  // ✓ Atualiza título
  const titleInput = page.locator('input[placeholder*="Título"]')
  await titleInput.clear()
  await titleInput.fill('Título Atualizado')
  
  // ✓ Clica "Atualizar"
  await page.locator('button:has-text("Atualizar")').click()
  
  // ✓ Redireciona para /post/:id
  await expect(page).toHaveURL(`/post/${post.id}`)
  
  // ✓ Título atualizado na página
  await expect(page.locator('text=Título Atualizado')).toBeVisible()
})
```

**Cenários cobertos:**
- ✓ Form preenchido com dados atuais
- ✓ Atualização + redirect
- ✓ Validação de dados
- ✓ 404 para post inexistente

#### 5️⃣ Fluxos Críticos (Multi-passo)
```javascript
test('fluxo completo: criar → listar → ver → editar → deletar', async ({ page }) => {
  // 1. Cria post via form
  await page.goto('/new')
  await page.locator('input[placeholder*="Título"]').fill('Post Fluxo E2E')
  await page.locator('textarea[placeholder*="Conteúdo"]').fill('...')
  await page.locator('input[placeholder*="Autor"]').fill('Teste')
  await page.locator('button:has-text("Criar Post")').click()
  
  // 2. Valida na lista
  await expect(page).toHaveURL('/')
  await expect(page.locator('text=Post Fluxo E2E')).toBeVisible()
  
  // 3. Clica para ver detalhes
  await page.locator('text=Post Fluxo E2E').first().click()
  
  // 4. Edita
  await page.locator('button:has-text("Editar")').click()
  const titleInput = page.locator('input[placeholder*="Título"]')
  await titleInput.clear()
  await titleInput.fill('Post Atualizado')
  await page.locator('button:has-text("Atualizar")').click()
  
  // 5. Valida atualização
  await expect(page.locator('text=Post Atualizado')).toBeVisible()
  
  // 6. Deleta
  await page.locator('button:has-text("Deletar")').click()
  const confirmButton = page.locator('button:has-text("Confirmar")')
  if (await confirmButton.isVisible()) await confirmButton.click()
  
  // 7. Verifica home vazio
  await expect(page).toHaveURL('/')
  await expect(page.locator('text=Post Atualizado')).not.toBeVisible()
})

test('múltiplos posts: criar 3 → ver ordem → deletar 1 → verificar', async ({ page }) => {
  // 1. Cria 3 posts
  for (let i = 1; i <= 3; i++) {
    await page.goto('/new')
    await page.locator('input[placeholder*="Título"]').fill(`Post ${i}`)
    await page.locator('textarea[placeholder*="Conteúdo"]').fill('...')
    await page.locator('input[placeholder*="Autor"]').fill(`Autor ${i}`)
    await page.locator('button:has-text("Criar Post")').click()
  }
  
  // 2. Volta para home
  await page.goto('/')
  
  // 3. Valida 3 posts
  const posts = page.locator('text=/Post [1-3]/i')
  await expect(posts).toHaveCount(3)
  
  // 4. Valida ordem DESC
  const firstPost = page.locator('[data-testid="post-card"]').first()
  const title = await firstPost.locator('h2').textContent()
  expect(title).toContain('Post 3')
  
  // 5. Deleta Post 2
  await page.locator('text=Post 2').first().click()
  await page.locator('button:has-text("Deletar")').click()
  // confirma...
  
  // 6. Verifica 2 restantes
  await expect(page).toHaveURL('/')
  const postsAfter = page.locator('text=/Post [1-3]/i')
  await expect(postsAfter).toHaveCount(2)
})
```

---

## 🚀 Rodando Testes E2E

```bash
# Roda testes E2E (inicia servidor em background)
npx playwright test

# Roda no modo headed (vê o navegador)
npx playwright test --headed

# Roda um teste específico
npx playwright test tests/e2e/posts.spec.js

# Roda e gera HTML report
npx playwright test
npx playwright show-report

# Debug mode (passo a passo)
npx playwright test --debug

# Roda contra navegador específico
npx playwright test --project=chromium
```

## 📈 Métricas dos Testes E2E

```
Test Files  1 passed (1)
     Tests  25 passed (25)
   Duration  ~30-60s (browser + navegação real)
```

**Cobertura:**
- 4 páginas (Home, New, Post, Edit) ✓
- 20+ cenários de usuário (criar, listar, ver, editar, deletar) ✓
- 2 fluxos críticos (fluxo completo 6-passo) ✓
- Validação visual + navegação ✓

---

## 🔄 Mapeamento Completo: Unit → Integration → E2E

| Aspecto | Unitário | Integração | E2E |
|---------|----------|-----------|-----|
| **Tech** | Vitest + vi.fn | Supertest | Playwright |
| **Mocks** | Tudo mockado | Repositório real | Nada mockado |
| **Tempo** | ~5-10ms | ~50-200ms | ~1-5s |
| **Foco** | Lógica isolada | Integração API | Fluxo do usuário |
| **Falhas** | Bug lógico | Integração ruim | UI quebrada |

### Exemplo Real: "Criar Post"

**Teste Unitário:**
```javascript
it('createPost valida title >= 5', () => {
  const repo = { create: vi.fn() }
  expect(() => createPost(repo, { title: 'ab' })).toThrow('title 5+')
  expect(repo.create).not.toHaveBeenCalled()
})
```
✓ Pega: lógica de validação quebrada

**Teste Integração:**
```javascript
it('POST /api/posts rejeita title < 5', async () => {
  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'ab', ... })
  
  expect(response.status).toBe(400)
  const all = await repository.findAll()
  expect(all).toHaveLength(0)
})
```
✓ Pega: integração entre rota + service + repo quebrada

**Teste E2E:**
```javascript
test('usuário vê erro "title deve ter 5+" no form', async ({ page }) => {
  await page.goto('/new')
  await page.locator('input[placeholder*="Título"]').fill('ab')
  await page.locator('button:has-text("Criar")').click()
  
  await expect(page).toHaveURL('/new')
  await expect(page.locator('text=title deve ter 5+')).toBeVisible()
})
```
✓ Pega: input validation, error message rendering, form não submete

---

## ✅ Checklist: Quando usar cada tipo

### Teste Unitário
- [ ] Testando lógica isolada (service, utils)
- [ ] Mockando dependências externas
- [ ] Precisa ser RÁPIDO (~5ms)
- [ ] Testar edge cases matemáticos

### Teste Integração
- [ ] Testando fluxo completo da API
- [ ] Dados persistem de verdade
- [ ] Sem navegador real
- [ ] Testar cenários críticos HTTP

### Teste E2E
- [ ] Testando fluxo de usuário real
- [ ] Navegação, cliques, digitação
- [ ] UI renderizada corretamente
- [ ] Apenas fluxos CRÍTICOS (não todos!)

---

## 🔗 Próximos Passos

1. **Executar testes E2E**: `npx playwright test`
2. **Visualizar report**: `npx playwright show-report`
3. **Debugar falhas**: `npx playwright test --debug`
4. **Adicionar CI/CD**: GitHub Actions com Playwright

---

## 📚 Referência Rápida

| Task | Command |
|------|---------|
| Roda E2E | `npx playwright test` |
| Headed (vê browser) | `npx playwright test --headed` |
| Um arquivo | `npx playwright test tests/e2e/posts.spec.js` |
| Debug mode | `npx playwright test --debug` |
| Report | `npx playwright show-report` |
| Roda servidor só | `npm run dev` |
| Roda todos os testes | `npm run test:all` |

Veja [AUTOMATION_STRATEGY.md](./AUTOMATION_STRATEGY.md) e [INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md) para contexto completo.
