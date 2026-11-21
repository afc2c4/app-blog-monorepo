# 🏔️ Pirâmide de Testes: Resumo Executivo

## Visão Geral

Implementamos uma **estratégia piramidal de testes** que reduz mocks gradualmente:

```
        🏔️ E2E (5-10%)
       Navegador Real
       1-5s cada teste
           25 testes
              |
        Integration (30-40%)
       Dados Reais
       50-200ms cada
           19 testes
              |
           Unit (60-80%)
         Tudo Mockado
         5-10ms cada
           77 testes
           ═════════════
          TOTAL: 121 TESTES
```

---

## 📊 Estatísticas

| Camada | Tests | Tech | Tempo | Mocks |
|--------|-------|------|-------|-------|
| **Unit** | 77 | Vitest + vi.fn | ~5-10ms | ✓ Completo |
| **Integration** | 19 | Supertest + Vitest | ~50-200ms | ✗ Nenhum |
| **E2E** | 25 | Playwright | ~1-5s | ✗ Nenhum |
| **TOTAL** | **121** | | ~120s | |

---

## 🎯 O que cada camada testa

### 🧪 Unit Tests (77 testes)
**Foco:** Lógica isolada

```javascript
// server/src/posts.service.test.js (18)
// server/src/posts.repository.test.js (22)
// server/src/posts.routes.test.js (18)
// client/src/services/api.test.js (11)
// client/src/components/PostCard.test.jsx (7)

✓ Validações de negócio
✓ Edge cases matemáticos
✓ Mapeamento de dados
✓ Erros esperados
```

**Exemplo:**
```javascript
it('createPost rejeita title < 5 chars', () => {
  const result = validate({ title: 'ab' })
  expect(result.errors).toContain('title >= 5')
})
```

### 🔗 Integration Tests (19 testes)
**Foco:** Fluxo completo da API

```javascript
// server/src/posts.integration.test.js (19)

✓ POST /api/posts → dados persistem em arquivo real
✓ GET /api/posts → retorna ordem DESC
✓ GET /api/posts/:id → retorna post específico
✓ PUT /api/posts/:id → atualiza e persiste
✓ DELETE /api/posts/:id → remove e persiste
✓ Fluxos multi-passo (criar → listar → atualizar → deletar)
✓ Validação integrada (rota + service + repo)
```

**Exemplo:**
```javascript
it('POST /api/posts cria e persiste no arquivo', async () => {
  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'Post', content: '...', author: 'João' })
  
  expect(response.status).toBe(201)
  
  // ✓ Verifica que persistiu NO ARQUIVO REAL
  const persisted = await repository.findById(response.body.id)
  expect(persisted.title).toBe('Post')
})
```

### 🌍 E2E Tests (25 testes)
**Foco:** Fluxo do usuário real no navegador

```javascript
// tests/e2e/posts.spec.js (25)

✓ HomePage: listar, vazio, ordenação
✓ NewPostPage: form, criar, validação visual
✓ PostPage: ver detalhes, editar, deletar
✓ EditPostPage: carregar dados, atualizar, validação
✓ Fluxos críticos: 6 passos (criar → listar → ver → editar → deletar)
✓ Múltiplos posts: ordem, deleção parcial
```

**Exemplo:**
```javascript
test('usuário cria post via form e vê na lista', async ({ page }) => {
  await page.goto('/new')
  
  // ✓ Preenche form (interação real)
  await page.locator('input[placeholder*="Título"]').fill('Novo Post')
  await page.locator('textarea[placeholder*="Conteúdo"]').fill('...')
  await page.locator('input[placeholder*="Autor"]').fill('João')
  
  // ✓ Clica criar
  await page.locator('button:has-text("Criar")').click()
  
  // ✓ Redireciona (router funcionando)
  await expect(page).toHaveURL('/')
  
  // ✓ Post aparece (React renderizou)
  await expect(page.locator('text=Novo Post')).toBeVisible()
})
```

---

## 🔄 Como os testes se relacionam

```
Unit Test (Lógica)
     ↓
Integration Test (Integração HTTP)
     ↓
E2E Test (Fluxo do Usuário)
```

### Exemplo Real: "Validar Title < 5"

**Unit:** Service rejeita?
```javascript
it('createPost rejeita title < 5', () => {
  const repo = { create: vi.fn() }
  expect(() => createPost(repo, { title: 'ab' })).toThrow()
  expect(repo.create).not.toHaveBeenCalled()
})
```
✓ Pega: lógica de validação quebrada

**Integration:** API retorna 400?
```javascript
it('POST /api/posts rejeita title < 5', async () => {
  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'ab', ... })
  
  expect(response.status).toBe(400)
  const all = await repository.findAll()
  expect(all).toHaveLength(0) // ✓ nada foi criado
})
```
✓ Pega: integração rota+service+repo quebrada

**E2E:** Usuário vê erro?
```javascript
test('form rejeita title < 5 e mostra erro', async ({ page }) => {
  await page.goto('/new')
  await page.locator('input[placeholder*="Título"]').fill('ab')
  await page.locator('button:has-text("Criar")').click()
  
  await expect(page).toHaveURL('/new') // form não submete
  await expect(page.locator('text=title deve ter 5+')).toBeVisible()
})
```
✓ Pega: validação visual, error message, form state

---

## 🚀 Como Rodar

```bash
# Rodar TODOS os testes (unit + integration + E2E)
npm run test:all

# Apenas unit + integration
npm run test

# Apenas integration
npm run test:integration

# Apenas E2E
npm run test:e2e

# E2E com visual (vê o navegador aberto)
npm run test:e2e:headed

# E2E em debug mode (passo a passo)
npm run test:e2e:debug

# Ver relatório HTML de E2E
npm run test:e2e:report
```

---

## 📈 Resultados

```bash
$ npm run test:all

✓ Unit Tests (77)
  - posts.service.test.js: 18 ✓
  - posts.repository.test.js: 22 ✓
  - posts.routes.test.js: 18 ✓
  - api.test.js: 11 ✓
  - PostCard.test.jsx: 7 ✓
  Duration: ~200ms

✓ Integration Tests (19)
  - posts.integration.test.js: 19 ✓
  Duration: ~240ms

✓ E2E Tests (25)
  - posts.spec.js: 25 ✓
  Duration: ~30-60s

═══════════════════════════════════════
TOTAL: 121 testes passando ✓
Tempo total: ~120s (testes rodam em paralelo)
```

---

## 🎓 Conceitos-chave

### Redução Estratégica de Mocks

```
Level 1: Unit Test
├─ Mock: Repository ✓
├─ Mock: Arquivo ✓
├─ Mock: HTTP Client ✓
├─ Tempo: 5ms
└─ Valor: Lógica isolada

Level 2: Integration Test
├─ Mock: Repository ✗ (arquivo real!)
├─ Mock: Arquivo ✗ (temp file real!)
├─ Mock: HTTP Client ✗ (Supertest real!)
├─ Tempo: 100ms
└─ Valor: Integração de camadas

Level 3: E2E Test
├─ Mock: Repository ✗
├─ Mock: Arquivo ✗
├─ Mock: Browser ✗ (Chromium real!)
├─ Tempo: 2s
└─ Valor: Fluxo do usuário
```

### Por que não mockamos TUDO?

```javascript
// ✗ Ruim: Tudo mockado
const repo = { create: vi.fn() }
const server = { post: vi.fn() }
const browser = { click: vi.fn() }
// Teste passa mas app quebra em produção!

// ✓ Bom: Redução gradual
Unit: Mock repository
  → Pega bugs lógicos rápido

Integration: Arquivo real
  → Pega integração ruim

E2E: Navegador real
  → Pega UI quebrada
```

---

## ✅ Cobertura de Cenários

| Cenário | Unit | Integration | E2E |
|---------|------|-------------|-----|
| **Validação de dados** | ✓ | ✓ | ✓ |
| **Persistência** | ✗ | ✓ | ✓ |
| **Integração HTTP** | ✗ | ✓ | ✓ |
| **Renderização UI** | ~ | ✗ | ✓ |
| **Navegação** | ✗ | ✗ | ✓ |
| **Interação do usuário** | ✗ | ✗ | ✓ |
| **Performance** | ✓ | ✗ | ✗ |

---

## 📚 Documentação Completa

Veja os guias detalhados:

1. **[AUTOMATION_STRATEGY.md](./AUTOMATION_STRATEGY.md)**
   - Estratégia completa
   - Mapeamento de cenários
   - Redução de mocks (3 níveis)
   - Exemplos práticos

2. **[INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md)**
   - Como são os testes de integração
   - Setup com arquivo real
   - 19 casos de teste cobertos
   - Como rodar

3. **[E2E_TESTS.md](./E2E_TESTS.md)**
   - Como são os testes E2E
   - Setup com Playwright
   - 25 casos de teste cobertos
   - Debug e troubleshooting

---

## 🔗 Próximos Passos

1. ✅ Implementar 77 testes unitários (já feito!)
2. ✅ Implementar 19 testes de integração (já feito!)
3. ✅ Implementar 25 testes E2E (já feito!)
4. ⏳ Configurar CI/CD no GitHub Actions
   - Rodar testes em pull requests
   - Bloquear merge se testes falharem
   - Publicar relatório de cobertura

5. ⏳ Monitorar performance de testes
   - Alertas se testes lentos
   - Otimizar testes mais lentos

6. ⏳ Estender cobertura conforme necessário
   - Novos features → novos testes
   - Bugs em produção → adicionar test

---

## 💡 Dicas de Uso

### Para Desenvolvedores
```bash
# Enquanto desenvolvendo
npm run test:client  # unit tests rápido

# Antes de fazer commit
npm run test         # unit + integration

# Antes de push
npm run test:all     # tudo (demora mais)
```

### Para Code Review
```bash
# Verificar que testes passam
npm run test:all

# Se E2E falhar, debug:
npm run test:e2e:debug  # passo a passo
npm run test:e2e:headed # vê o navegador
npm run test:e2e:report # vê screenshots
```

### Para CI/CD
```bash
# GitHub Actions vai rodar:
npm run test:all --reporter=github

# Se falhar, revisor pode:
npm run test:e2e:report  # ver o que quebrou
```

---

## 📞 Suporte

Se um teste falhar:

1. **Unit test falha?** → Bug na lógica
   - Veja `server/src/*.test.js` ou `client/src/**/*.test.js`
   - Debugar com `npm run test:server -- --reporter=verbose`

2. **Integration test falha?** → Bug na integração
   - Veja `server/src/posts.integration.test.js`
   - Pode ser arquivo temp ou ordem de execução

3. **E2E test falha?** → Bug na UI/navegação
   - Rodar com `npm run test:e2e:headed` para ver
   - Ou `npm run test:e2e:report` para ver screenshots
   - Pode ser timing (page.waitForNavigation etc)

---

**Feito! 🎉 Estratégia completa implementada com 121 testes.**
