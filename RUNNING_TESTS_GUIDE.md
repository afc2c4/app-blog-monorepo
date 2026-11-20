# 🚀 Guia Prático: Executando e Debugando Testes

Este guia oferece exemplos práticos de como rodar testes, debugar falhas e otimizar sua suite de testes.

---

## 📋 Comandos Essenciais

### Rodar Todos os Testes

```bash
# Rodar todos os testes uma vez
npm test

# Rodar apenas client
npm run test:client

# Rodar apenas server
npm run test:server

# Rodar em watch mode (reexecuta ao salvar arquivo)
npm test -- --watch

# Rodar com modo UI (visual)
npm test -- --ui
```

---

### Rodar Testes Específicos

```bash
# Rodar apenas um arquivo
npm test -- api.test.js

# Rodar testes que contêm "listPosts"
npm test -- --grep "listPosts"

# Rodar testes de um diretório
npm test -- src/services/

# Rodar apenas um describe block
npm test -- -t "API Service"

# Rodar apenas um test case
npm test -- -t "deve retornar lista de posts"
```

---

### Cobertura de Testes

```bash
# Gerar relatório de cobertura
npm test -- --coverage

# Cobertura com HTML visual
npm test -- --coverage --reporter=html

# Ver cobertura por arquivo
npm test -- --coverage.include="src/services/**"
```

---

## 🐛 Debugando Testes

### 1. Logs (console.log)

```javascript
// Adicionar logs para debug
it('deve fazer algo', () => {
  const result = myFunction()
  
  console.log('Resultado:', result) // ← Aparece no terminal
  console.log('Type:', typeof result)
  console.log('Keys:', Object.keys(result))
  
  expect(result).toEqual(expected)
})
```

Rodando com logs visíveis:

```bash
npm test -- --reporter=verbose
```

---

### 2. Debugador Node.js

```bash
# Rodar com debugador (abre DevTools)
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Depois abra chrome://inspect no navegador
```

---

### 3. Skip Temporário (.skip)

```javascript
describe('User Service', () => {
  it.skip('teste que faz falhar (temporariamente desabilitado)', () => {
    // Este teste não roda
  })

  it('este teste continua rodando', () => {
    expect(1 + 1).toBe(2)
  })
})
```

---

### 4. Only (Rodar Apenas Um)

```javascript
describe('User Service', () => {
  it.only('apenas este teste roda', () => {
    expect(1 + 1).toBe(2)
  })

  it('este teste é ignorado', () => {
    // Não roda quando há .only em outro teste
  })
})
```

---

### 5. Timeout Estendido

```javascript
// Para testes lentos
it('deve processar arquivo grande', async () => {
  // 10 segundos de timeout
}, 10000)

// Ou globalmente
export const config = {
  testTimeout: 10000,
}
```

---

## 🔧 Técnicas de Debug Avançado

### Inspecionar Mocks

```javascript
it('deve verificar como mock foi chamado', async () => {
  const mockFn = vi.fn()
  mockFn('arg1', 'arg2')
  mockFn('arg3')

  // Ver todas as chamadas
  console.log(mockFn.mock.calls)
  // Output: [['arg1', 'arg2'], ['arg3']]

  // Ver resultados retornados
  console.log(mockFn.mock.results)
  // Output: [{ type: 'return', value: undefined }, ...]

  // Ver instâncias (para construtores)
  console.log(mockFn.mock.instances)
})
```

---

### Testar Estados Intermediários

```javascript
it('deve verificar estado em etapas', async () => {
  const mockFn = vi.fn()

  // Primeira chamada
  await myFunction1(mockFn)
  expect(mockFn).toHaveBeenCalledTimes(1)
  
  // Segunda chamada
  await myFunction2(mockFn)
  expect(mockFn).toHaveBeenCalledTimes(2)
  
  // Verifica ordem de chamadas
  expect(mockFn.mock.calls[0][0]).toBe('primeiro')
  expect(mockFn.mock.calls[1][0]).toBe('segundo')
})
```

---

### Testar Exceções com Detalhes

```javascript
it('deve capturar erro completo', async () => {
  try {
    await myFunction()
    expect.fail('Deveria lançar erro')
  } catch (error) {
    // Log completo do erro
    console.log('Error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    })

    expect(error).toBeInstanceOf(CustomError)
    expect(error.message).toContain('expected text')
    expect(error.code).toBe('SPECIFIC_ERROR_CODE')
  }
})
```

---

### Testar Ordem de Chamadas (Mock Call Order)

```javascript
it('deve chamar mocks em ordem específica', () => {
  const mock1 = vi.fn()
  const mock2 = vi.fn()
  const mock3 = vi.fn()

  // Simula uso
  mock1()
  mock3()
  mock2()
  mock1()

  // Verifica ordem de primeira chamada
  expect(mock1).toHaveBeenNthCalledWith(1) // 1ª chamada é mock1
  
  // Verifica chamadas específicas
  const allCalls = [
    ...mock1.mock.calls,
    ...mock2.mock.calls,
    ...mock3.mock.calls,
  ]
  
  console.log('Ordem:', allCalls)
})
```

---

## 📊 Padrões de Teste Prático

### Padrão AAA (Arrange-Act-Assert)

```javascript
it('exemplo com AAA', async () => {
  // ARRANGE: Setup dados e mocks
  const user = { id: '1', name: 'João' }
  const mockService = {
    getUser: vi.fn().mockResolvedValue(user),
  }

  // ACT: Executar função
  const result = await mockService.getUser('1')

  // ASSERT: Verificar resultado
  expect(result).toEqual(user)
  expect(mockService.getUser).toHaveBeenCalledWith('1')
})
```

---

### Teste de Comportamento vs Implementação

```javascript
// ❌ Testando implementação (frágil)
it('não faça assim', () => {
  const spy = vi.spyOn(console, 'log')
  myFunction()
  expect(spy).toHaveBeenCalledWith('Debug message') // ← Acoplado à implementação
})

// ✅ Testando comportamento (robusto)
it('faça assim', () => {
  const result = myFunction()
  expect(result).toEqual(expectedValue) // ← Comportamento observável
})
```

---

### Teste de Happy Path + Edge Cases

```javascript
describe('createUser', () => {
  // Happy path
  it('deve criar usuário com dados válidos', async () => {
    const data = { name: 'João', email: 'joao@example.com' }
    const result = await createUser(data)
    expect(result.id).toBeDefined()
  })

  // Edge cases
  it('deve rejeitar email vazio', async () => {
    const data = { name: 'João', email: '' }
    await expect(createUser(data)).rejects.toThrow('Email obrigatório')
  })

  it('deve rejeitar email inválido', async () => {
    const data = { name: 'João', email: 'nao-e-email' }
    await expect(createUser(data)).rejects.toThrow('Email inválido')
  })

  it('deve rejeitar nome com caracteres especiais', async () => {
    const data = { name: '<script>', email: 'joao@example.com' }
    await expect(createUser(data)).rejects.toThrow('Caracter inválido')
  })

  it('deve rejeitar email duplicado', async () => {
    const data = { name: 'João', email: 'existe@example.com' }
    await expect(createUser(data)).rejects.toThrow('Email já existe')
  })

  it('deve aceitar nome com 1 caracter', async () => {
    const data = { name: 'A', email: 'a@example.com' }
    const result = await createUser(data)
    expect(result.name).toBe('A')
  })
})
```

---

## 🎯 Otimizando Performance de Testes

### Parallelizar Testes

```bash
# Rodar testes em paralelo (padrão)
npm test

# Rodar sequencial (mais lento, útil se houver conflitos)
npm test -- --no-isolate

# Limitar workers paralelos
npm test -- --worker=2
```

---

### Testar Apenas Arquivos Modificados

```bash
# Watch mode: reexecuta apenas testes de arquivos mudados
npm test -- --watch

# Checar testes na branch atual vs main
npm test -- --changed main
```

---

### Profile de Execução

```bash
# Ver tempo de cada teste
npm test -- --reporter=verbose

# Ver testes mais lentos
npm test -- --reporter=default | head -20
```

---

## 📝 Exemplos Reais do Projeto

### Frontend - Teste Completo de API Service

```javascript
// client/src/services/api.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { listPosts, createPost } from './api.js'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listPosts', () => {
    it('deve retornar lista quando ok', async () => {
      // Arrange
      const mockPosts = [
        { id: '1', title: 'Post 1', content: 'Conteúdo 1', author: 'João', createdAt: '2024-01-01' },
        { id: '2', title: 'Post 2', content: 'Conteúdo 2', author: 'Maria', createdAt: '2024-01-02' },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPosts,
      })

      // Act
      const result = await listPosts()

      // Assert
      expect(result).toEqual(mockPosts)
      expect(global.fetch).toHaveBeenCalledWith('/api/posts')
      expect(global.fetch).toHaveBeenCalledOnce()
    })

    // Ver arquivo completo: client/src/services/api.test.js
  })
})
```

**Executar:**

```bash
npm run test:client -- -t "listPosts"
```

---

### Backend - Teste Completo de Service

```javascript
// server/src/posts.service.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPost, AppError } from './posts.service.js'

describe('Posts Service', () => {
  let mockRepository

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }
  })

  describe('createPost', () => {
    it('deve criar post válido', async () => {
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
      expect(result.title).toBe('Novo Post')
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(mockRepository.save).toHaveBeenCalledOnce()
    })

    // Ver arquivo completo: server/src/posts.service.test.js
  })
})
```

**Executar:**

```bash
npm run test:server -- -t "createPost"
```

---

## 🎓 Checklist: Teste Bem Escrito

Antes de fazer commit, verifique:

- [ ] ✅ Teste tem nome descritivo
- [ ] ✅ Segue padrão AAA (Arrange-Act-Assert)
- [ ] ✅ Testa um comportamento único
- [ ] ✅ É independente de outros testes
- [ ] ✅ Não testa implementação interna
- [ ] ✅ Mock é o mínimo necessário
- [ ] ✅ Verifica resultado final, não passos intermediários
- [ ] ✅ Roda em < 100ms (geralmente)
- [ ] ✅ Determinístico (mesmo resultado sempre)
- [ ] ✅ Não usa `setTimeout` ou timeouts aleatórios

---

## 🚨 Troubleshooting

### Teste Falha Aleatoriamente

**Causa:** Teste dependente de ordem ou timing

**Solução:**
```javascript
// ❌ Ruim
test('pode deixar estado global', () => {
  globalState.user = { id: '1' } // Afeta próximos testes
})

// ✅ Bom
test('não deixa estado global', () => {
  const mockState = { user: { id: '1' } }
  // Usa mockState, não global
})
```

---

### Teste Lento

**Causa:** Mock não é await, timeout grande, ou I/O real

**Solução:**
```bash
# Identificar testes lentos
npm test -- --reporter=verbose

# Usar vi.useFakeTimers() para timers
# Mockar todas as chamadas I/O
# Reduzir volume de dados de teste
```

---

### "Cannot find module" em Teste

**Causa:** Caminho relativo errado em teste

**Solução:**
```javascript
// ❌ Errado (relativos)
import { myFunc } from '../services/api'

// ✅ Correto (relativo correto)
import { myFunc } from './api'

// ou use caminhos absolutos com vite.config.js
import { myFunc } from '@/services/api'
```

---

### Mock Não Funciona

**Causa:** Ordem de import, falta de await, ou mock não foi setado

**Solução:**
```javascript
// ❌ Ruim
test('mock não funciona', () => {
  const result = myAsyncFunction() // Falta await!
  global.fetch = vi.fn() // Muito tarde
})

// ✅ Bom
test('mock funciona', async () => {
  global.fetch = vi.fn().mockResolvedValue(...)
  const result = await myAsyncFunction()
  expect(result).toEqual(...)
})
```

---

## 📚 Recursos Adicionais

- [Vitest Docs](https://vitest.dev)
- [Testing Library React](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)

---

✨ **Pronto para testar com confiança!**
