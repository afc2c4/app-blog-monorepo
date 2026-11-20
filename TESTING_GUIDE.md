# 📚 Guia Completo de Testes Unitários - Frontend e Backend

Este projeto implementa uma arquitetura robusta de testes unitários com **isolamento completo de unidades** em ambos os lados (client e server). Este guia explica como funciona e como estender os testes.

---

## 🎯 Arquitetura de Testes

### Stack de Bibliotecas Padronizado

| Camada | Ferramentas | Finalidade |
|--------|-------------|-----------|
| **Core (Ambas)** | **Vitest** | Test runner, asserções (`expect`), mocks (`vi.fn`) |
| **Front-end** | **Testing Library** + **jsdom** | Renderização de componentes em memória, simulação de eventos |
| **Back-end** | **Supertest** (opcional) | Testes de rotas HTTP em memória, sem iniciar servidor real |

### Sintaxe Unificada

Todos os testes usam a **mesma sintaxe** em todo o projeto:

```javascript
describe('Feature', () => {
  it('deve fazer algo', async () => {
    // Arrange
    const data = { /* setup */ }
    
    // Act
    const result = await myFunction(data)
    
    // Assert
    expect(result).toEqual(expected)
  })
})
```

---

## 🏗️ Estrutura de Arquivos

```
projeto/
├── client/
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.js            # API service (fetch wrapper)
│   │   │   └── api.test.js        # ✓ Testes isolados com mocks
│   │   ├── components/
│   │   │   ├── PostCard.jsx       # Componente React
│   │   │   └── PostCard.test.jsx  # ✓ Testes com Testing Library
│   │   └── test/
│   │       └── setup.js            # ✓ Setup global (jsdom, cleanup)
│   └── vite.config.js             # Configuração Vitest
│
└── server/
    ├── src/
    │   ├── posts.service.js           # Lógica de negócio
    │   ├── posts.service.test.js      # ✓ Testes isolados com mocks
    │   ├── posts.routes.js            # Endpoints Express
    │   ├── posts.routes.test.js       # ✓ Testes com Supertest
    │   ├── posts.repository.js        # Persistência (file system)
    │   └── posts.repository.test.js   # ✓ Testes reais com filesystem
    └── vitest.config.js               # (usa package.json `test`)
```

---

## 🧪 Padrões de Testes por Camada

### 1️⃣ Frontend - Serviço API (Isolamento Completo)

**Arquivo:** [`client/src/services/api.test.js`](../client/src/services/api.test.js)

**O que testa:** Funções que fazem requisições HTTP (fetch wrapper)

**Padrão de isolamento:** Mock global do `fetch` para simular respostas do servidor

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { listPosts } from '../services/api.js'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar lista quando fetch retorna 200', async () => {
    // Arrange: Mock o fetch para retornar dados específicos
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: '1', title: 'Post 1' },
        { id: '2', title: 'Post 2' },
      ],
    })

    // Act: Chama a função
    const result = await listPosts()

    // Assert: Verifica resultado e chamadas
    expect(result).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledWith('/api/posts')
    expect(global.fetch).toHaveBeenCalledOnce()
  })

  it('deve lançar erro quando resposta é 500', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Erro interno' } }),
    })

    await expect(listPosts()).rejects.toThrow('Erro interno')
  })
})
```

**Conceitos-chave:**
- ✅ **Mock de fetch:** Simula qualquer resposta HTTP sem rede real
- ✅ **Sem dependência de servidor:** Rápido e determinístico
- ✅ **Cobertura de erros:** Testa casos de sucesso e falha

---

### 2️⃣ Frontend - Componente React

**Arquivo:** [`client/src/components/PostCard.test.jsx`](../client/src/components/PostCard.test.jsx)

**O que testa:** Renderização e interação de componentes React

**Padrão de isolamento:** Testing Library renderiza o componente em jsdom (navegador simulado)

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PostCard from '../components/PostCard.jsx'

describe('PostCard', () => {
  it('deve renderizar título como link', () => {
    // Arrange: Setup dados e wrapper
    const mockPost = {
      id: '123',
      title: 'Meu Post',
      content: 'Conteúdo completo',
      author: 'João',
      createdAt: '2024-01-15',
    }

    // Act: Renderiza com Testing Library (em jsdom)
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    )

    // Assert: Busca elementos no DOM
    const titleLink = screen.getByRole('link', { name: /Meu Post/i })
    expect(titleLink).toBeInTheDocument()
    expect(titleLink).toHaveAttribute('href', '/posts/123')
  })

  it('deve truncar conteúdo maior que 150 caracteres', () => {
    const longContent = 'A'.repeat(200)
    const mockPost = {
      id: '1',
      title: 'Post',
      content: longContent,
      author: 'João',
      createdAt: '2024-01-15',
    }

    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    )

    const summary = screen.getByText(/^A+\.\.\.$/)
    expect(summary.textContent).toHaveLength(153) // 150 + "..."
  })
})
```

**Conceitos-chave:**
- ✅ **jsdom:** Simula DOM real sem abrir navegador
- ✅ **Testing Library queries:** `getByRole`, `getByText`, `getByTestId`
- ✅ **Sem mocks de dependências:** O componente roda com dependências reais (Router)

---

### 3️⃣ Backend - Serviço (Lógica de Negócio Isolada)

**Arquivo:** [`server/src/posts.service.test.js`](../server/src/posts.service.test.js)

**O que testa:** Funções de lógica de negócio (validação, transformação de dados)

**Padrão de isolamento:** Mock completo do repositório (I/O layer)

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPost, AppError } from '../posts.service.js'

describe('Posts Service', () => {
  let mockRepository

  beforeEach(() => {
    // Mock do repositório para isolar a lógica de negócio
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }
  })

  describe('createPost', () => {
    it('deve criar post com validação completa', async () => {
      // Arrange
      const postData = {
        title: 'Novo Post',
        content: 'Conteúdo com 20+ caracteres ok',
        author: 'João Silva',
      }

      mockRepository.save.mockImplementationOnce((post) => Promise.resolve(post))

      // Act
      const result = await createPost(mockRepository, postData)

      // Assert
      expect(result).toMatchObject({
        title: 'Novo Post',
        content: postData.content,
        author: 'João Silva',
      })
      expect(result.id).toBeDefined() // UUID gerado
      expect(result.createdAt).toBeDefined()
      expect(mockRepository.save).toHaveBeenCalledOnce()
    })

    it('deve rejeitar título < 5 caracteres', async () => {
      const invalidData = {
        title: 'ab', // Muito curto
        content: 'Conteúdo válido com 20+ caracteres',
        author: 'João',
      }

      try {
        await createPost(mockRepository, invalidData)
        expect.fail('Deveria lançar AppError')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.status).toBe(400)
        expect(error.message).toContain('title deve ter no mínimo 5 caracteres')
      }

      // Verificação importante: repositório não foi chamado
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('deve validar múltiplos erros simultaneamente', async () => {
      const invalidData = {
        title: 'ab',      // muito curto
        content: 'Curto', // muito curto
        author: '',       // vazio
      }

      try {
        await createPost(mockRepository, invalidData)
        expect.fail('Deveria lançar erro')
      } catch (error) {
        // Verifica que TODOS os erros estão reportados
        expect(error.message).toContain('author é obrigatório')
        expect(error.message).toContain('title deve ter no mínimo 5 caracteres')
        expect(error.message).toContain('content deve ter no mínimo 20 caracteres')
      }
    })
  })
})
```

**Conceitos-chave:**
- ✅ **Mock de repositório:** Isola a lógica da persistência
- ✅ **Sem chamadas a I/O:** Sem arquivo, sem banco de dados
- ✅ **Validação testada:** Regras de negócio verificadas completamente

---

### 4️⃣ Backend - Rotas (Integração em Memória)

**Arquivo:** [`server/src/posts.routes.test.js`](../server/src/posts.routes.test.js)

**O que testa:** Endpoints Express (rotas HTTP)

**Padrão de isolamento:** Supertest + Express em memória, repositório mockado

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { createPostRoutes } from '../posts.routes.js'

describe('Posts Routes', () => {
  let app
  let mockRepository

  beforeEach(() => {
    // Cria app Express nova para cada teste
    app = express()
    app.use(express.json())

    // Mock do repositório
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }

    // Monta as rotas
    app.use(createPostRoutes(mockRepository))

    // Middleware simples de erro
    app.use((err, _req, res, _next) => {
      const status = err.status || 500
      res.status(status).json({ error: { message: err.message } })
    })
  })

  describe('GET /api/posts', () => {
    it('deve retornar lista com status 200', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', content: 'Conteúdo 1', author: 'João', createdAt: '2024-01-01' },
        { id: '2', title: 'Post 2', content: 'Conteúdo 2', author: 'Maria', createdAt: '2024-01-02' },
      ]

      mockRepository.findAll.mockResolvedValueOnce(mockPosts)

      // Supertest simula requisição HTTP sem rede
      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockPosts)
      expect(mockRepository.findAll).toHaveBeenCalledOnce()
    })

    it('deve retornar erro 500 quando repositório falha', async () => {
      mockRepository.findAll.mockRejectedValueOnce(
        new Error('Erro ao ler arquivo')
      )

      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(500)
      expect(response.body.error.message).toContain('Erro ao ler arquivo')
    })
  })

  describe('POST /api/posts', () => {
    it('deve criar post com status 201', async () => {
      const postData = {
        title: 'Novo Post',
        content: 'Conteúdo novo com 20+ caracteres ok',
        author: 'João',
      }

      mockRepository.save.mockResolvedValueOnce({
        id: 'uuid-123',
        ...postData,
        createdAt: '2024-01-15T10:30:00Z',
      })

      const response = await request(app)
        .post('/api/posts')
        .send(postData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(mockRepository.save).toHaveBeenCalledOnce()
    })

    it('deve validar dados inválidos', async () => {
      const invalidData = {
        title: 'ab', // < 5 caracteres
        content: 'Conteúdo ok',
        author: 'João',
      }

      const response = await request(app)
        .post('/api/posts')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('title deve ter no mínimo 5 caracteres')
      expect(mockRepository.save).not.toHaveBeenCalled()
    })
  })
})
```

**Conceitos-chave:**
- ✅ **Supertest:** Faz requisições HTTP reais contra a app Express
- ✅ **Em memória:** Sem iniciar servidor real
- ✅ **Mock de repositório:** Isola persistência

---

### 5️⃣ Backend - Repository (Integração Real)

**Arquivo:** [`server/src/posts.repository.test.js`](../server/src/posts.repository.test.js)

**O que testa:** Persistência (file system neste projeto)

**Padrão:** Testes reais com arquivo temporário (NÃO mockado)

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { createPostsRepository } from '../posts.repository.js'

describe('Posts Repository', () => {
  let testFilePath
  let repository

  beforeEach(async () => {
    // Arquivo temporário único
    testFilePath = join(tmpdir(), `posts-${randomBytes(8).toString('hex')}.json`)
    repository = createPostsRepository(testFilePath)
  })

  afterEach(async () => {
    // Limpa arquivo temporário
    try {
      await unlink(testFilePath)
    } catch {
      // arquivo pode não existir
    }
  })

  describe('save', () => {
    it('deve persistir post e ler de volta', async () => {
      // Arrange
      const post = {
        id: '123',
        title: 'Test Post',
        content: 'Test Content',
        author: 'Test Author',
      }

      // Act
      const saved = await repository.save(post)
      const found = await repository.findById('123')

      // Assert
      expect(found).toEqual(post)
    })

    it('deve persistir múltiplos posts', async () => {
      const posts = [
        { id: '1', title: 'Post 1', content: 'Content 1', author: 'Author 1' },
        { id: '2', title: 'Post 2', content: 'Content 2', author: 'Author 2' },
        { id: '3', title: 'Post 3', content: 'Content 3', author: 'Author 3' },
      ]

      for (const post of posts) {
        await repository.save(post)
      }

      const all = await repository.findAll()

      expect(all).toHaveLength(3)
      posts.forEach((post) => {
        expect(all).toContainEqual(post)
      })
    })
  })

  describe('update', () => {
    it('deve fazer merge de propriedades', async () => {
      const original = { id: '1', title: 'Original', content: 'Original', author: 'Author' }
      await repository.save(original)

      const updated = await repository.update('1', { title: 'Updated' })

      expect(updated.title).toBe('Updated')
      expect(updated.content).toBe('Original') // mantém
    })
  })

  describe('remove', () => {
    it('deve remover e não afetar outros', async () => {
      const post1 = { id: '1', title: 'Post 1', content: 'Content 1', author: 'Author 1' }
      const post2 = { id: '2', title: 'Post 2', content: 'Content 2', author: 'Author 2' }

      await repository.save(post1)
      await repository.save(post2)

      await repository.remove('1')

      const remaining = await repository.findAll()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe('2')
    })

    it('deve realmente persistir a remoção', async () => {
      const post = { id: '1', title: 'Post', content: 'Content', author: 'Author' }
      await repository.save(post)
      await repository.remove('1')

      // Cria novo repositório (simula nova execução)
      const newRepo = createPostsRepository(testFilePath)
      const all = await newRepo.findAll()

      expect(all).toHaveLength(0)
    })
  })
})
```

**Conceitos-chave:**
- ✅ **Arquivo real temporário:** Testa persistência de verdade
- ✅ **Sem mocks:** Verifica comportamento real do I/O
- ✅ **Cleanup:** Remove arquivos após cada teste

---

## 🚀 Como Executar os Testes

```bash
# Rodar todos os testes (client + server)
npm test

# Rodar apenas client
npm run test:client

# Rodar apenas server
npm run test:server

# Watch mode (reexecuta ao salvar)
npm run test -- --watch
```

---

## 🎓 Padrões de Isolamento Explicados

### ✅ Isolamento Completo (Service) - Frontend

```javascript
// ❌ Sem isolamento (testa implementação, não comportamento)
test('deve chamar fetch com URL correta', () => {
  const spy = vi.spyOn(global, 'fetch')
  listPosts()
  expect(spy).toHaveBeenCalledWith('/api/posts')
})

// ✅ Com isolamento (testa comportamento observável)
test('deve retornar array de posts', () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: '1', title: 'Post 1' }],
  })

  const result = await listPosts()
  expect(result).toEqual([{ id: '1', title: 'Post 1' }])
})
```

### ✅ Isolamento Completo (Service) - Backend

```javascript
// ❌ Sem isolamento (testa implementação, acessa I/O)
test('deve listar posts', async () => {
  const repo = new RealRepository('./posts.json')
  const result = await listPosts(repo)
  expect(result).toHaveLength(2)
})

// ✅ Com isolamento (testa lógica pura)
test('deve retornar posts ordenados', async () => {
  const mockRepo = {
    findAll: vi.fn().mockResolvedValue([
      { id: '2', createdAt: '2024-01-03' },
      { id: '1', createdAt: '2024-01-01' },
    ]),
  }

  const result = await listPosts(mockRepo)
  expect(result[0].id).toBe('2') // Mais recente primeiro
})
```

### ✅ Isolamento Parcial (Rotas) - Backend

```javascript
// Mock apenas do repositório, resto é real
test('deve retornar 201 ao criar post', async () => {
  const mockRepo = {
    save: vi.fn().mockResolvedValue({ id: '123', ...data }),
  }

  const response = await request(app)
    .post('/api/posts')
    .send({ title: 'Post', content: 'Conteúdo ok', author: 'João' })

  expect(response.status).toBe(201)
})
```

---

## 📊 Cobertura de Teste Esperada

Após seguir esta arquitetura, sua cobertura deve ser:

```
Statements   : 85-95%
Branches     : 80-90%
Functions    : 85-95%
Lines        : 85-95%
```

---

## 🔍 Verificação de Qualidade

### Teste de Comportamento (Não Implementação)

**❌ Ruim:** Testa implementação interna

```javascript
test('deve chamar vi.fn() 2 vezes', () => {
  const mockFn = vi.fn()
  myFunction()
  expect(mockFn).toHaveBeenCalledTimes(2) // ← implementação
})
```

**✅ Bom:** Testa comportamento observável

```javascript
test('deve retornar resultado esperado', () => {
  const result = myFunction()
  expect(result).toEqual({ id: '123', name: 'Item' })
})
```

### Teste Independente

**❌ Ruim:** Teste depende de outro

```javascript
test('1º: criar post', () => { /* ... */ })
test('2º: listar posts', () => { /* depende do anterior */ })
```

**✅ Bom:** Cada teste é independente

```javascript
beforeEach(() => {
  mockRepository.findAll.mockResolvedValue([mockPost])
})

test('deve listar posts', () => { /* ... */ })
```

---

## 🛠️ Estendendo os Testes

### Adicionar Novo Serviço Frontend

1. Crie `src/services/novo.js`
2. Crie `src/services/novo.test.js` com mesmo padrão
3. Use mocks de `fetch`

### Adicionar Novo Componente

1. Crie `src/components/NovoComponente.jsx`
2. Crie `src/components/NovoComponente.test.jsx`
3. Use `render()` + `screen` queries

### Adicionar Nova Rota Backend

1. Crie função em `src/novo.service.js`
2. Crie `src/novo.service.test.js` com mocks
3. Crie testes de rota em arquivo separado

---

## 📝 Resumo: Checklist de Isolamento

| Camada | O que Mockar | O que é Real |
|--------|-------------|-------------|
| **API Service (FE)** | `fetch` | Lógica de erro |
| **Componente (FE)** | Nada (ou props) | Renderização, eventos |
| **Service (BE)** | Repositório | Validação, transformação |
| **Rotas (BE)** | Repositório | Express middleware |
| **Repository (BE)** | Nada | Filesystem real |

---

✨ **Pronto! Seus testes estão isolados, rápidos e determinísticos!**
