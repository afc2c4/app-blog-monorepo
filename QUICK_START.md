# 🚀 Quick Start: Rodando Todos os Testes (Unit → Integration → E2E)

## ✅ Status Atual

```
✓ 18 testes unitários de Frontend
✓ 77 testes unitários de Backend
✓ 19 testes de Integração
✓ 25 testes E2E
─────────────────────────────
✓ 139 testes total
```

---

## 🎯 Comandos Rápidos

### Rodar Todos os Testes (Recomendado)
```bash
npm run test:all
```

**Tempo esperado:** ~120 segundos

**O que faz:**
1. ✓ Roda 95 testes unitários (~2s)
2. ✓ Roda 19 testes de integração (~0.3s)
3. ✓ Roda 25 testes E2E (~60-90s)

### Teste Unitário Rápido
```bash
npm test
```

**Tempo:** ~3 segundos | **Testes:** 95

---

## 📊 Teste Específico

```bash
# Apenas frontend
npm run test:client

# Apenas backend
npm run test:server

# Apenas integração
npm run test:integration

# Apenas E2E
npm run test:e2e

# E2E com visual (vê o navegador)
npm run test:e2e:headed

# E2E em debug mode (passo a passo)
npm run test:e2e:debug

# Ver relatório visual de E2E
npm run test:e2e:report
```

---

## 🧭 Qual Teste Usar

| Situação | Comando | Tempo |
|----------|---------|-------|
| **Desenvolvendo** | `npm test` | 3s |
| **Antes de commit** | `npm run test && npm run test:integration` | 3.3s |
| **Antes de push** | `npm run test:all` | 120s |
| **Teste falhando** | `npm run test:e2e:debug` | Interactive |
| **Vendo mudanças** | `npm test -- --watch` | Continuous |

---

## 📚 Documentação

### Para Entender a Estratégia
→ Leia: **[PYRAMID_SUMMARY.md](./PYRAMID_SUMMARY.md)** (10 min)

Inclui:
- Visão completa da pirâmide de testes
- Como os 139 testes se relacionam
- Redução estratégica de mocks

### Para Aprender Conceitos
→ Leia: **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** (20 min)

Inclui:
- Arquitetura em 5 camadas
- Padrões de isolamento
- Exemplos práticos

### Para Entender Integração
→ Leia: **[INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md)** (10 min)

Inclui:
- 19 testes com arquivo real
- Sem mocks de repositório
- Fluxos CRUD completos

### Para Entender E2E
→ Leia: **[E2E_TESTS.md](./E2E_TESTS.md)** (10 min)

Inclui:
- 25 testes com Playwright
- Sem mocks, navegador real
- Fluxos de usuário reais

### Para Saber Como Debugar
→ Leia: **[RUNNING_TESTS_GUIDE.md](./RUNNING_TESTS_GUIDE.md)** (10 min)

Inclui:
- Debugar testes que falham
- Otimizar performance
- Troubleshooting

---

## 🏗️ Estrutura de Testes

```
Unit Tests (95)
├─ Frontend (18)
│  ├─ api.test.js (11)
│  └─ PostCard.test.jsx (7)
│
└─ Backend (77)
   ├─ posts.service.test.js (18)
   ├─ posts.routes.test.js (18)
   ├─ posts.repository.test.js (22)
   └─ posts.integration.test.js (19)

Integration Tests (19)
└─ posts.integration.test.js
   ├─ CREATE: POST /api/posts
   ├─ READ: GET /api/posts
   ├─ READ: GET /api/posts/:id
   ├─ UPDATE: PUT /api/posts/:id
   ├─ DELETE: DELETE /api/posts/:id
   └─ Fluxos críticos multi-passo

E2E Tests (25)
└─ tests/e2e/posts.spec.js
   ├─ HomePage (lista de posts)
   ├─ NewPostPage (criar post)
   ├─ PostPage (ver detalhes)
   ├─ EditPostPage (editar post)
   └─ Fluxos críticos do usuário
```

---

## 🔄 Mapeamento: Um Cenário em 3 Camadas

### Exemplo: "Criar post com validação"

**Unit Test:** ❌ Lógica rejeita título < 5
```javascript
it('createPost rejeita title < 5', () => {
  const repo = { create: vi.fn() }
  expect(() => createPost(repo, { title: 'ab' })).toThrow()
  expect(repo.create).not.toHaveBeenCalled()
})
```

**Integration Test:** ❌ POST retorna 400
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

**E2E Test:** ❌ Usuário vê erro no form
```javascript
test('form rejeita title < 5 e mostra erro', async ({ page }) => {
  await page.goto('/new')
  await page.locator('input[placeholder*="Título"]').fill('ab')
  await page.locator('button:has-text("Criar")').click()
  
  await expect(page).toHaveURL('/new')
  await expect(page.locator('text=title deve ter 5+')).toBeVisible()
})
```

---

## 💡 Dicas

### Performance

```bash
# Executar apenas um arquivo
npm test -- posts.service.test.js

# Executar apenas um teste
npm test -- -t "createPost rejeita"

# Watch mode (reexecuta ao salvar)
npm test -- --watch

# Com cobertura
npm test -- --coverage
```

### Debug E2E

```bash
# Ver navegador em tempo real
npm run test:e2e:headed

# Passo a passo (debugger interativo)
npm run test:e2e:debug

# Ver screenshots dos testes
npm run test:e2e:report
```

### Troubleshooting

```bash
# Se E2E falhar, veja o report
npm run test:e2e:report

# Se test sumir, reinstale
rm -rf node_modules && npm install

# Se ainda falhar, check
npm test -- --reporter=verbose
```

---

## 🎯 Próximos Passos

1. ✅ **Setup completo** (já feito!)
   - 139 testes implementados
   - Documentação completa
   - Scripts de teste configurados

2. ⏳ **Configurar CI/CD** (GitHub Actions)
   ```yaml
   # .github/workflows/test.yml
   - run: npm test
   - run: npm run test:integration
   - run: npm run test:e2e
   ```

3. ⏳ **Monitorar cobertura**
   ```bash
   npm test -- --coverage
   # Almejar: 80%+
   ```

4. ⏳ **Estender cobertura**
   - Novos features → adicionar testes
   - Bugs em produção → adicionar testes regressivos

---

## 📞 Precisa de Ajuda?

| Dúvida | Consulte |
|--------|----------|
| Qual teste usar? | [PYRAMID_SUMMARY.md](./PYRAMID_SUMMARY.md) |
| Como estruturar teste? | [TESTING_GUIDE.md](./TESTING_GUIDE.md) |
| Teste não funciona? | [RUNNING_TESTS_GUIDE.md](./RUNNING_TESTS_GUIDE.md) |
| Como mockar? | [MOCKS_GUIDE.md](./MOCKS_GUIDE.md) |
| Integração confusa? | [INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md) |
| E2E não funciona? | [E2E_TESTS.md](./E2E_TESTS.md) |

---

## 🎉 Pronto!

```bash
# Comece rodando
npm run test:all

# Se passar, vire documentação
# Se falhar, debug com:
npm run test:e2e:debug
```

---

**Versão:** 1.0.0 completo | **Data:** 2024-11-20 | **Status:** ✅ Pronto para usar
