# Testes de Integração: Redução Estratégica de Mocks

## 📊 O que são Testes de Integração?

**Nível 2 da Pirâmide de Testes** — sem mocks de banco/repositório, dados persistem em arquivo real.

```
Teste Unitário (Level 1)
↓ Reduz mocks: arquivo real
Teste de Integração (Level 2)  ← Você está aqui
↓ Reduz mocks: browser real
Teste E2E (Level 3)
```

## 🎯 Diferenças: Unit vs Integration

| Aspecto | Unitário | Integração |
|---------|----------|------------|
| **Mocks de Repositório** | ✓ Sim (vi.fn) | ✗ Não — repositório real |
| **Arquivo de Dados** | ✓ Mock | ✓ Arquivo temp real |
| **Persistência** | Simulada | **De verdade** |
| **Escopo** | Função isolada | Fluxo completo (rota → service → repo → arquivo) |
| **Tempo** | Rápido (~1-5ms) | Mais lento (~50-200ms) |
| **Valor** | Pega bugs lógicos | Pega integração ruim |

## 🏗️ Exemplo: Transformação Unit → Integration

### Teste Unitário (Service)
```javascript
// posts.service.test.js
it('deve criar post com título válido', async () => {
  const repo = { create: vi.fn().mockResolvedValue({ id: '123', title: 'Post' }) }
  const result = await createPost(repo, { title: 'Meu Post', ... })
  expect(repo.create).toHaveBeenCalled()
})
```

**O que testa:** Service chama repositório corretamente (mock)

### Teste de Integração (Rota + Service + Repository REAL)
```javascript
// posts.integration.test.js
it('deve criar post e persistir no arquivo', async () => {
  // Sem mocks! Repositório real lê/escreve arquivo temp real
  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'Meu Post', ... })
  
  expect(response.status).toBe(201)
  
  // ✓ Verificação crítica: dado persiste no arquivo
  const persisted = await repository.findById(response.body.id)
  expect(persisted.title).toBe('Meu Post')
})
```

**O que testa:** Fluxo completo funciona (HTTP → service → repo → arquivo)

---

## 🧪 Testes de Integração Implementados

### Setup Global
```javascript
beforeEach(async () => {
  // Cria arquivo temporário REAL para cada teste
  testFilePath = join(tmpdir(), `posts-${randomBytes(8).toString('hex')}.json`)
  
  // Repository REAL (sem mock)
  repository = createPostsRepository(testFilePath)
  
  // Rota Express REAL
  app.use(createPostRoutes(repository))
})

afterEach(async () => {
  // Cleanup: deleta arquivo temp
  await unlink(testFilePath)
})
```

### Casos de Teste

#### 1️⃣ CREATE: POST /api/posts
```javascript
it('deve criar post válido e persistir no arquivo', async () => {
  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'Primeiro Post', content: '...20+ chars...', author: 'João' })
  
  expect(response.status).toBe(201)
  
  // ✓ Crítico: verifica que persiste no arquivo
  const persisted = await repository.findById(response.body.id)
  expect(persisted).toEqual(response.body)
})
```

**Cenários cobertos:**
- ✓ Post válido persiste
- ✓ Dados inválidos retornam 400
- ✓ Múltiplos erros simultaneamente
- ✓ 3+ posts persistem em ordem

#### 2️⃣ READ: GET /api/posts (lista)
```javascript
it('deve retornar posts ordenados por createdAt DESC', async () => {
  // Cria 3 posts
  for (const post of [...]) {
    await request(app).post('/api/posts').send(post)
  }
  
  const response = await request(app).get('/api/posts')
  
  // ✓ Mais recente primeiro
  expect(response.body[0].title).toBe('Post 3')
  expect(response.body[1].title).toBe('Post 2')
  expect(response.body[2].title).toBe('Post 1')
})
```

**Cenários cobertos:**
- ✓ Lista vazia retorna []
- ✓ Ordem DESC por createdAt
- ✓ Todos os campos presentes

#### 3️⃣ READ: GET /api/posts/:id
```javascript
it('deve retornar post por ID', async () => {
  const created = await request(app).post('/api/posts').send({ ... })
  const response = await request(app).get(`/api/posts/${created.body.id}`)
  
  expect(response.status).toBe(200)
  expect(response.body.id).toBe(created.body.id)
})
```

**Cenários cobertos:**
- ✓ Retorna post correto por ID
- ✓ 404 quando não existe
- ✓ Retorna correto quando há múltiplos

#### 4️⃣ UPDATE: PUT /api/posts/:id
```javascript
it('deve atualizar post e persistir mudança', async () => {
  const created = await request(app).post('/api/posts').send({ ... })
  
  const response = await request(app)
    .put(`/api/posts/${created.body.id}`)
    .send({ title: 'Atualizado' })
  
  expect(response.status).toBe(200)
  
  // ✓ Verifica persistência
  const updated = await repository.findById(created.body.id)
  expect(updated.title).toBe('Atualizado')
})
```

**Cenários cobertos:**
- ✓ Atualiza e persiste
- ✓ Valida dados atualizados
- ✓ 404 para post inexistente
- ✓ Merge de campos (atualiza só o informado)

#### 5️⃣ DELETE: DELETE /api/posts/:id
```javascript
it('deve deletar post e remover do arquivo', async () => {
  const created = await request(app).post('/api/posts').send({ ... })
  
  const response = await request(app).delete(`/api/posts/${created.body.id}`)
  
  expect(response.status).toBe(204)
  
  // ✓ Verifica que foi removido
  const all = await repository.findAll()
  expect(all).toHaveLength(0)
})
```

**Cenários cobertos:**
- ✓ Deleta e remove do arquivo
- ✓ 404 para post inexistente
- ✓ Deleta apenas o específico

#### 6️⃣ Fluxos Críticos (Multi-passo)
```javascript
it('deve criar, listar, atualizar e deletar', async () => {
  // 1. Cria
  const created = await request(app).post('/api/posts').send({ ... })
  
  // 2. Lista e verifica
  let list = await request(app).get('/api/posts')
  expect(list.body).toHaveLength(1)
  
  // 3. Atualiza
  await request(app)
    .put(`/api/posts/${created.body.id}`)
    .send({ title: 'Atualizado' })
  
  // 4. Verifica atualização
  list = await request(app).get('/api/posts')
  expect(list.body[0].title).toBe('Atualizado')
  
  // 5. Deleta
  await request(app).delete(`/api/posts/${created.body.id}`)
  
  // 6. Verifica vazio
  list = await request(app).get('/api/posts')
  expect(list.body).toHaveLength(0)
})
```

---

## 🚀 Rodando Testes de Integração

```bash
# Roda apenas integração
npm run test:server

# Roda com output verbose
npm run test:server -- --reporter=verbose

# Roda apenas um arquivo
npm run test:server -- posts.integration.test.js

# Watch mode
npm run test:server -- --watch
```

## 📈 Métricas dos Testes de Integração

```
Test Files  1 passed (1)
     Tests  19 passed (19)
   Duration  240ms
```

**Cobertura:**
- 5 endpoints (GET lista, GET by ID, POST, PUT, DELETE) ✓
- 15+ casos de borda (validação, 404, múltiplos dados, fluxos) ✓
- Persistência em arquivo real ✓

---

## 🔄 Mapeamento: Unit → Integration → E2E

| Teste Unitário | Teste Integração | Teste E2E |
|---|---|---|
| `createPost rejeita title < 5` | `POST /api/posts com title < 5 retorna 400` | Usuário vê erro "title deve ter 5+" no form |
| `updatePost faz merge de campos` | `PUT /api/posts/:id atualiza só o informado` | Usuário edita título e vê outros campos intactos |
| `deletePost valida ID existente` | `DELETE /api/posts/:id remove do arquivo` | Usuário clica delete e post desaparece da lista |
| `listPosts ordena por createdAt DESC` | `GET /api/posts retorna DESC` | Usuário vê posts mais recentes no topo |

---

## ✅ Checklist: Quando usar testes de integração

- [ ] Testar fluxo completo (rota → service → repo)
- [ ] Validar que dados persistem
- [ ] Testar cenários multi-passo
- [ ] Pegar bugs que unitário não vê (integração ruim)
- [ ] NÃO substituir unitário (unitário + integração = melhor)

## ⚡ Performance

```
Teste Unitário:  ~5-10ms (mocks, sem I/O)
Teste Integração: ~50-200ms (I/O de arquivo real)
Teste E2E: ~1-5s (browser real, navegação)
```

**Total dos 19 testes de integração: ~240ms** ✓ Rápido!

---

## 🔗 Próximos Passos

1. **Instalar Playwright**: `npm install --save-dev @playwright/test`
2. **Configurar Playwright**: criar `playwright.config.js`
3. **Criar E2E_TESTS.md**: mapeamento para testes E2E
4. **Implementar testes E2E**: criar `tests/e2e/`

Veja [E2E_TESTS.md](./E2E_TESTS.md) para a próxima camada.
