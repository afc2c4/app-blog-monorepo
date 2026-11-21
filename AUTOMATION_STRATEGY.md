# 🚀 Testes Automatizados: Do Unitário ao E2E

Este guia mostra como **transformar testes unitários em testes automatizados completos** usando mapeamento de cenários, redução gradual de mocks e cobertura inteligente.

---

## 📊 Arquitetura de Cobertura de Testes

```
                    ┌─────────────────────────────────────┐
                    │  E2E Tests (Cypress/Playwright)     │
                    │  • Usuário real + navegador real     │
                    │  • Sem mocks                         │
                    │  • Fluxos completos (login → criar) │
                    │  • Críticos & poucos (5-10%)         │
                    └─────────────────────────────────────┘
                                  ↑
                    ┌─────────────────────────────────────┐
                    │  Integration Tests (Vitest Real DB)  │
                    │  • API real + BD temporário          │
                    │  • Reduz mocks gradualmente          │
                    │  • Validação de fluxo (criação)      │
                    │  • Muitos (30-40%)                   │
                    └─────────────────────────────────────┘
                                  ↑
                    ┌─────────────────────────────────────┐
                    │  Unit Tests (Vitest + Mocks)        │
                    │  • Isolamento total                   │
                    │  • Mocks de tudo                     │
                    │  • Edge cases & validações          │
                    │  • Base sólida (60-80%)              │
                    └─────────────────────────────────────┘

RESULTADO: Cobertura Piramidal
  E2E:          5-10%  (poucos, críticos, lentos)
  Integration: 30-40%  (muitos, estratégicos, médios)
  Unit:        60-80%  (muitos, rápidos, isolados)
```

---

## 🔄 Fluxo: Unitário → Integração → E2E

### Conceito: Mapeamento de Cenários

```javascript
// 1️⃣ TESTE UNITÁRIO: Comportamento isolado
describe('createPost', () => {
  it('deve rejeitar title < 5 caracteres', async () => {
    const mockRepo = { save: vi.fn() }
    
    await expect(
      createPost(mockRepo, { title: 'ab' })
    ).rejects.toThrow('title deve ter no mínimo 5 caracteres')
  })
})

   ↓ TRANSFORMA EM ↓

// 2️⃣ TESTE DE INTEGRAÇÃO: Cenário real com API
describe('createPost Integration', () => {
  it('deve rejeitar POST com title < 5 caracteres', async () => {
    // Sem mocks! Repositório real (arquivo temp)
    const response = await request(app)
      .post('/api/posts')
      .send({ title: 'ab', content: '...' })
    
    expect(response.status).toBe(400)
    expect(response.body.error.message).toContain('title')
  })
})

   ↓ TRANSFORMA EM ↓

// 3️⃣ TESTE E2E: Usuário real interagindo
describe('Post Creation Flow E2E', () => {
  it('usuário vê erro ao tentar criar post com título curto', async () => {
    // Navegador real!
    page.goto('/posts/create')
    page.fill('[name="title"]', 'ab') // < 5 caracteres
    page.fill('[name="content"]', 'conteúdo ok...')
    page.click('button:has-text("Criar")')
    
    // Espera feedback visual do erro
    expect(page.locator('.error-message')).toContainText('title')
  })
})
```

---

## 🗂️ Estrutura de Testes Automatizados

```
projeto/
├── 🧪 Unit Tests (Já criados)
│   ├── client/src/services/api.test.js
│   ├── client/src/components/PostCard.test.jsx
│   └── server/src/**/*.test.js
│
├── 🔗 Integration Tests (Novo)
│   ├── tests/integration/api/
│   │   ├── posts.create.test.js
│   │   ├── posts.list.test.js
│   │   ├── posts.update.test.js
│   │   └── posts.delete.test.js
│   └── tests/integration/setup.js
│
└── 🌐 E2E Tests (Novo)
    ├── tests/e2e/
    │   ├── posts.create.spec.js
    │   ├── posts.edit.spec.js
    │   ├── posts.list.spec.js
    │   └── posts.delete.spec.js
    └── playwright.config.js
```

---

## 📋 Mapa: Unitário → Integração → E2E

### Cenário 1: Criar Post

#### Unit Test (Isolado)
```javascript
// ✓ Title < 5 caracteres
// ✓ Content < 20 caracteres
// ✓ Author obrigatório
// ✓ UUID gerado
// ✓ createdAt preenchido
```

#### Integration Test (API Real + DB Temp)
```javascript
// POST /api/posts
// ✓ Rejeita título < 5
// ✓ Rejeita conteúdo < 20
// ✓ Rejeita author vazio
// ✓ 201 com post válido
// ✓ Post persistido no arquivo
```

#### E2E Test (Navegador Real)
```javascript
// 1. Usuário vai para /posts/create
// 2. Preenche form com dados inválidos
// 3. Vê erro de validação
// 4. Corrige dados
// 5. Envia form
// 6. Vê redirect para /posts/:id (sucesso)
// 7. Vê post criado na lista
```

---

### Cenário 2: Listar Posts

#### Unit Test
```javascript
// ✓ Ordena por createdAt DESC
// ✓ Retorna array vazio quando não há posts
// ✓ Mock de findAll funciona
```

#### Integration Test
```javascript
// GET /api/posts
// ✓ Retorna posts com status 200
// ✓ Posts estão ordenados (mais recente primeiro)
// ✓ Cada post tem id, title, content, author, createdAt
```

#### E2E Test
```javascript
// 1. Usuário vai para /posts
// 2. Vê lista de posts (pré-criados)
// 3. Posts aparecem em ordem (recente → antigo)
// 4. Clica em um post → vai para /posts/:id
// 5. Vê detalhes do post
```

---

### Cenário 3: Validação Multi-erro

#### Unit Test
```javascript
it('deve validar múltiplos erros simultaneamente', async () => {
  // title < 5, content < 20, author vazio
  // ✓ Todos os 3 erros no message
})
```

#### Integration Test
```javascript
it('POST /api/posts retorna 400 com todos erros', async () => {
  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'ab', content: 'x', author: '' })
  
  expect(response.status).toBe(400)
  // ✓ Contém os 3 erros na mensagem
})
```

#### E2E Test
```javascript
it('Form mostra validações em tempo real', async () => {
  // 1. User digita título curto
  // 2. Vê "Mínimo 5 caracteres" embaixo do input
  // 3. User digita content muito curto
  // 4. Vê "Mínimo 20 caracteres"
  // 5. Botão "Criar" desabilitado até tudo ficar válido
  // 6. Corrige tudo → botão habilita
  // 7. Submit funciona
})
```

---

## 🎯 Redução Estratégica de Mocks

### Level 1: Isolamento Total (Unit Tests) - Já Feito ✅

```javascript
// Mock TUDO
global.fetch = vi.fn()
mockRepository = { findAll: vi.fn(), save: vi.fn() }

✓ Rápido (< 10ms)
✓ Determinístico
✗ Não valida integração
```

### Level 2: Integração com API + Repo Real (Integration Tests) - Novo

```javascript
// Mock NADA (ou mínimo: arquivo temp)
const app = express()
app.use(createPostRoutes(createPostsRepository(tempFile)))

✓ Valida integração API-Repo
✓ Detecta bugs de integração
✗ Mais lento (50-100ms)
```

### Level 3: E2E com Usuário Real (E2E Tests) - Novo

```javascript
// Mock NADA - navegador real, servidor real
const browser = await playwright.chromium.launch()
const page = await browser.newPage()
await page.goto('http://localhost:3000')

✓ Valida fluxo completo
✓ Pega bugs de UI/UX
✗ Lento (1-5s), frágil
```

---

## 📝 Exemplo Prático: Teste Unitário → E2E

### 1️⃣ Teste Unitário Existente

```javascript
// client/src/services/api.test.js
it('deve retornar lista quando fetch retorna 200', async () => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: '1', title: 'Post 1', ... },
      { id: '2', title: 'Post 2', ... },
    ],
  })

  const result = await listPosts()
  expect(result).toHaveLength(2)
})
```

**Cenários encontrados:**
- ✓ Resposta 200
- ✓ Parsing de JSON
- ✓ Retorna array com posts

---

### 2️⃣ Teste de Integração (Novo)

```javascript
// tests/integration/api/posts.list.test.js
describe('GET /api/posts - Integration', () => {
  let app
  let repository

  beforeEach(async () => {
    // Setup com arquivo temporário REAL
    const tempFile = `/tmp/posts-${randomBytes(4).toString('hex')}.json`
    app = express()
    app.use(express.json())
    
    repository = createPostsRepository(tempFile)
    app.use(createPostRoutes(repository))
    
    // Pré-cria 2 posts
    await repository.save({
      id: '1',
      title: 'Post 1',
      content: 'Conteúdo 1 com 20+ caracteres ok',
      author: 'João',
      createdAt: new Date().toISOString(),
    })
    await repository.save({
      id: '2',
      title: 'Post 2',
      content: 'Conteúdo 2 com 20+ caracteres ok',
      author: 'Maria',
      createdAt: new Date().toISOString(),
    })
  })

  it('deve retornar lista de posts ordenada por recente', async () => {
    // ✓ Sem mocks! API + Repo REAIS
    const response = await request(app).get('/api/posts')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(2)
    expect(response.body[0].title).toBe('Post 2') // Mais recente primeiro
    expect(response.body[1].title).toBe('Post 1')
  })

  it('deve retornar array vazio quando não há posts', async () => {
    // ✓ Sem pré-setup
    const tempFile = `/tmp/posts-${randomBytes(4).toString('hex')}.json`
    const emptyApp = express()
    emptyApp.use(createPostRoutes(createPostsRepository(tempFile)))

    const response = await request(emptyApp).get('/api/posts')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })
})
```

**Diferenças:**
- ✗ Sem `vi.fn()` para fetch
- ✓ Arquivo temporário real
- ✓ Dados pré-criados real
- ✓ Validação de persistência

---

### 3️⃣ Teste E2E (Novo)

```javascript
// tests/e2e/posts.list.spec.js
import { test, expect } from '@playwright/test'

test.describe('Posts List - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // ✓ Servidor rodando em localhost:3000
    // ✓ Posts pré-criados pelo backend
    
    // Setup: Cria 2 posts via API
    await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Post 1',
        content: 'Conteúdo 1 com 20+ caracteres ok',
        author: 'João',
      }),
    })

    await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Post 2',
        content: 'Conteúdo 2 com 20+ caracteres ok',
        author: 'Maria',
      }),
    })
  })

  test('usuário vê lista de posts ordenada', async ({ page }) => {
    // 1. Navega para /posts
    await page.goto('http://localhost:3000/posts')

    // 2. Espera pela lista carregar
    await page.waitForSelector('[data-testid="post-card"]')

    // 3. Verifica posts aparecem em ordem
    const posts = await page.locator('[data-testid="post-card"]').all()
    expect(posts).toHaveLength(2)

    // 4. Post mais recente está primeiro
    const firstTitle = await posts[0].locator('h2 a').textContent()
    expect(firstTitle).toBe('Post 2')

    const secondTitle = await posts[1].locator('h2 a').textContent()
    expect(secondTitle).toBe('Post 1')
  })

  test('usuário clica em post e vê detalhes', async ({ page }) => {
    // 1. Vai para /posts
    await page.goto('http://localhost:3000/posts')

    // 2. Clica no primeiro post
    await page.click('[data-testid="post-card"] h2 a')

    // 3. URL muda
    expect(page.url()).toContain('/posts/')

    // 4. Vê conteúdo completo
    const title = await page.locator('h1').textContent()
    expect(title).toBe('Post 2')

    const content = await page.locator('.post-content').textContent()
    expect(content).toContain('Conteúdo 2 com 20+ caracteres ok')
  })
})
```

**Diferenças do Unit:**
- ✓ Navegador real (Playwright)
- ✓ Servidor rodando de verdade
- ✓ Fluxo completo: navegar → clicar → ver resultado
- ✓ Validação de UI (elementos visíveis, URLs, etc)
- ✗ Lento (1-5 segundos por teste)

---

## 🛠️ Stack Recomendada

| Tipo | Ferramenta | Quando Usar | Velocidade |
|------|-----------|-------------|-----------|
| **Unit** | Vitest + Mocks | Lógica isolada | ⚡ < 10ms |
| **Integration** | Vitest + Real DB | Fluxos API | 🚀 50-100ms |
| **E2E** | Playwright | Fluxos usuário | 🐢 1-5s |

---

## 📊 Cobertura Recomendada

```
Unit Tests: 60-80%
├─ Validação de entrada (100%)
├─ Transformação de dados (100%)
├─ Edge cases (100%)
└─ Lógica de erro (100%)

Integration Tests: 30-40%
├─ Fluxos CRUD (create, read, update, delete)
├─ Erros HTTP (400, 404, 500)
├─ Validação ponta-a-ponta
└─ Persistência de dados

E2E Tests: 5-10%
├─ Fluxos críticos (criar post, listar)
├─ Fluxos de erro (validação visual)
└─ Interação UI importante
```

---

## ✅ Próximas Seções

1. **[INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md)** - Implementação completa
2. **[E2E_TESTS.md](./E2E_TESTS.md)** - Configuração Playwright
3. **[AUTOMATION_STRATEGY.md](./AUTOMATION_STRATEGY.md)** - Mapa detalhado

---

Versão: 1.0.0 | Data: 2024-11-20
