# 🎯 Guia de Mocks e Espias com Vitest

Este guia explica como usar `vi.fn()`, `vi.mock()`, `vi.spyOn()` para criar testes isolados e confiáveis.

---

## 📋 Resumo de Funções de Mock

| Função | Uso | Exemplo |
|--------|-----|---------|
| `vi.fn()` | Mock simples de função | `vi.fn().mockReturnValue(5)` |
| `vi.mock()` | Mock de módulo inteiro | `vi.mock('./file.js')` |
| `vi.spyOn()` | Espiar + mockar método | `vi.spyOn(obj, 'method')` |
| `.mockResolvedValue()` | Mock de Promise resolvida | `.mockResolvedValue(data)` |
| `.mockRejectedValue()` | Mock de Promise rejeitada | `.mockRejectedValue(error)` |
| `.mockImplementation()` | Função customizada | `.mockImplementation((x) => x * 2)` |
| `.toHaveBeenCalled()` | Verificar se foi chamado | `expect(fn).toHaveBeenCalled()` |
| `.toHaveBeenCalledWith()` | Verificar argumentos | `expect(fn).toHaveBeenCalledWith(arg)` |

---

## 🔧 Padrões Práticos

### 1. Mock de Função Simples

```javascript
import { describe, it, expect, vi } from 'vitest'

describe('Mock de Função', () => {
  it('deve retornar valor mockado', () => {
    // Arrange
    const mockFn = vi.fn().mockReturnValue(42)

    // Act
    const result = mockFn()

    // Assert
    expect(result).toBe(42)
    expect(mockFn).toHaveBeenCalledOnce()
  })

  it('deve mockar diferentes retornos', () => {
    const mockFn = vi.fn()
      .mockReturnValueOnce('primeiro')
      .mockReturnValueOnce('segundo')
      .mockReturnValueOnce('terceiro')

    expect(mockFn()).toBe('primeiro')
    expect(mockFn()).toBe('segundo')
    expect(mockFn()).toBe('terceiro')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('deve verificar argumentos passados', () => {
    const mockFn = vi.fn()

    mockFn('arg1', 'arg2')
    mockFn('arg3')

    // Verifica primeira chamada
    expect(mockFn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2')
    // Verifica segunda chamada
    expect(mockFn).toHaveBeenNthCalledWith(2, 'arg3')
  })
})
```

---

### 2. Mock de Função Assíncrona (Promise)

```javascript
import { describe, it, expect, vi } from 'vitest'

describe('Mock de Promise', () => {
  it('deve mockar Promise resolvida', async () => {
    const mockFn = vi.fn().mockResolvedValue({ id: '1', name: 'Item' })

    const result = await mockFn()

    expect(result).toEqual({ id: '1', name: 'Item' })
    expect(mockFn).toHaveBeenCalledOnce()
  })

  it('deve mockar Promise rejeitada', async () => {
    const error = new Error('Erro customizado')
    const mockFn = vi.fn().mockRejectedValue(error)

    await expect(mockFn()).rejects.toThrow('Erro customizado')
    expect(mockFn).toHaveBeenCalledOnce()
  })

  it('deve mockar diferentes resoluções', async () => {
    const mockFn = vi.fn()
      .mockResolvedValueOnce({ id: '1' })
      .mockResolvedValueOnce({ id: '2' })
      .mockRejectedValueOnce(new Error('Erro'))

    expect(await mockFn()).toEqual({ id: '1' })
    expect(await mockFn()).toEqual({ id: '2' })
    await expect(mockFn()).rejects.toThrow('Erro')
  })

  it('deve mockar com implementação customizada', async () => {
    const mockFn = vi.fn().mockImplementation(async (id) => {
      return { id, name: `Item ${id}` }
    })

    const result = await mockFn('123')

    expect(result).toEqual({ id: '123', name: 'Item 123' })
  })
})
```

---

### 3. Mock de Objeto e Métodos

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Mock de Objeto', () => {
  let mockRepository

  beforeEach(() => {
    // Cria objeto mock com métodos
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }
  })

  it('deve mockar múltiplos métodos', async () => {
    // Setup diferentes retornos para cada método
    mockRepository.findAll.mockResolvedValue([
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ])

    mockRepository.findById.mockResolvedValue({ id: '1', name: 'Item 1' })

    // Act & Assert
    const all = await mockRepository.findAll()
    expect(all).toHaveLength(2)

    const one = await mockRepository.findById('1')
    expect(one.id).toBe('1')
  })

  it('deve limpar chamadas entre testes', () => {
    // Sem vi.clearAllMocks(), chamadas do teste anterior interferem
    expect(mockRepository.findAll.mock.calls.length).toBe(0)
  })
})
```

---

### 4. Mock de Módulo Inteiro

```javascript
// math.js
export function add(a, b) {
  return a + b
}

export function multiply(a, b) {
  return a * b
}
```

```javascript
// math.test.js
import { describe, it, expect, vi } from 'vitest'
import * as math from './math'

vi.mock('./math') // Mock o módulo inteiro

describe('Mock de Módulo', () => {
  it('deve mockar módulo', () => {
    // Todos os exports são automaticamente mockados
    math.add.mockReturnValue(10)
    math.multiply.mockReturnValue(20)

    expect(math.add(5, 5)).toBe(10)
    expect(math.multiply(5, 5)).toBe(20)
  })

  it('pode mockar seletivamente com vi.importActual()', async () => {
    // Restaura implementação real de um método
    const actual = await vi.importActual('./math')
    math.add.mockImplementation(actual.add)

    expect(math.add(2, 3)).toBe(5) // Real
    expect(math.multiply(2, 3)).toBe(undefined) // Mock
  })
})
```

---

### 5. Espiar um Método Real (spyOn)

```javascript
import { describe, it, expect, vi } from 'vitest'

class Calculator {
  add(a, b) {
    return a + b
  }

  multiply(a, b) {
    return a * b
  }
}

describe('spyOn - Espiar sem mockar', () => {
  it('deve espiar método e ainda chamar implementação real', () => {
    // Arrange
    const calc = new Calculator()
    const spy = vi.spyOn(calc, 'add')

    // Act
    const result = calc.add(2, 3)

    // Assert
    expect(result).toBe(5) // Mantém comportamento real
    expect(spy).toHaveBeenCalledWith(2, 3)
    expect(spy).toHaveBeenCalledOnce()

    spy.mockRestore() // Restaura implementação real
  })

  it('deve espiar e mockar', () => {
    const calc = new Calculator()
    const spy = vi.spyOn(calc, 'multiply').mockReturnValue(999)

    const result = calc.multiply(2, 3)

    expect(result).toBe(999) // Mockado
    expect(spy).toHaveBeenCalledWith(2, 3)

    spy.mockRestore()
  })
})
```

---

### 6. Mock de Fetch (Global API)

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Mock de Fetch Global', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve mockar sucesso de fetch', async () => {
    const mockData = { id: '1', name: 'Item' }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    // Chama função que usa fetch
    const response = await fetch('/api/items')
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data).toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledWith('/api/items')
  })

  it('deve mockar erro de fetch', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    })

    const response = await fetch('/api/items/999')
    expect(response.status).toBe(404)
  })

  it('deve mockar falha de rede', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(
      new Error('Failed to fetch')
    )

    await expect(fetch('/api/items')).rejects.toThrow('Failed to fetch')
  })
})
```

---

### 7. Mock de localStorage / sessionStorage

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Mock de Storage', () => {
  let store = {}

  beforeEach(() => {
    store = {}

    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString()
      }),
      removeItem: vi.fn((key) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })

  it('deve mockar localStorage.setItem', () => {
    localStorage.setItem('token', 'abc123')

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'abc123')
    expect(store['token']).toBe('abc123')
  })

  it('deve mockar localStorage.getItem', () => {
    store['user'] = 'João'

    const user = localStorage.getItem('user')

    expect(user).toBe('João')
    expect(localStorage.getItem).toHaveBeenCalledWith('user')
  })
})
```

---

### 8. Mock de Timer

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Mock de Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve avancar tempo com vi.advanceTimersByTime()', async () => {
    const callback = vi.fn()

    setTimeout(callback, 1000)

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('deve mockar setInterval', () => {
    const callback = vi.fn()

    setInterval(callback, 1000)

    vi.advanceTimersByTime(3000)

    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('deve mockar Date.now()', () => {
    vi.setSystemTime(new Date('2024-01-15').getTime())

    expect(Date.now()).toBe(new Date('2024-01-15').getTime())
  })
})
```

---

### 9. Verificações Avançadas (Snapshots)

```javascript
import { describe, it, expect, vi } from 'vitest'

describe('Snapshots', () => {
  it('deve comparar objeto com snapshot', () => {
    const mockUser = {
      id: '1',
      name: 'João',
      email: 'joao@example.com',
      createdAt: '2024-01-15T10:30:00Z',
    }

    // Primeira execução: cria arquivo .snap
    expect(mockUser).toMatchSnapshot()

    // Próximas execuções: compara com arquivo .snap
    // Se mudar, mostra diff e pede confirmação
  })

  it('deve comparar inline snapshot', () => {
    const result = { status: 'ok', message: 'Success' }

    expect(result).toMatchInlineSnapshot(`
      {
        "message": "Success",
        "status": "ok",
      }
    `)
  })
})
```

---

## 🎯 Checklist de Uso Correto

### ✅ Boas Práticas

- [ ] **Limpar mocks entre testes:** Usar `beforeEach(() => vi.clearAllMocks())`
- [ ] **Restaurar após usar spyOn:** Usar `spy.mockRestore()` ou `vi.restoreAllMocks()`
- [ ] **Usar vi.fn() para mocks novos:** Não confundir com vi.spyOn()
- [ ] **Mockar dependências externas:** fetch, localStorage, timers
- [ ] **NÃO mockar implementação interna:** Mockar apenas I/O e dependências
- [ ] **Verificar chamadas:** Usar `.toHaveBeenCalledWith()` para verificar argumentos
- [ ] **Mock com objetivo claro:** Cada mock tem um propósito específico

### ❌ Armadilhas Comuns

```javascript
// ❌ Não limpar mocks entre testes
test('primeiro', () => {
  const fn = vi.fn()
  fn()
})
test('segundo', () => {
  const fn = vi.fn() // ← Pode interferir com anterior
  expect(fn).not.toHaveBeenCalled() // Pode falhar
})

// ✅ Usar beforeEach para limpar
beforeEach(() => {
  vi.clearAllMocks()
})

// ❌ Espiar sem restaurar
test('espia global', () => {
  vi.spyOn(global, 'fetch')
  // ← fetch fica mockado em todos os testes seguintes!
})

// ✅ Sempre restaurar
afterEach(() => {
  vi.restoreAllMocks()
})

// ❌ Mockar implementação real
test('testa interno', () => {
  const obj = { method: vi.fn() }
  expect(obj.method).toHaveBeenCalled() // ← Testa mock, não comportamento
})

// ✅ Verificar comportamento observável
test('testa comportamento', () => {
  const result = myFunction()
  expect(result).toEqual(expectedValue) // ← Comportamento real
})
```

---

## 📊 Exemplo Completo: Função com Mock

```javascript
// user.service.js
export async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) {
    throw new Error('Usuário não encontrado')
  }
  return response.json()
}

export async function saveUser(user) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    throw new Error('Erro ao salvar usuário')
  }
  return response.json()
}
```

```javascript
// user.service.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchUser, saveUser } from './user.service'

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchUser', () => {
    it('deve retornar usuário quando encontrado', async () => {
      // Arrange
      const mockUser = { id: '1', name: 'João', email: 'joao@example.com' }
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })

      // Act
      const result = await fetchUser('1')

      // Assert
      expect(result).toEqual(mockUser)
      expect(global.fetch).toHaveBeenCalledWith('/api/users/1')
    })

    it('deve lançar erro quando usuário não existe', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(fetchUser('999')).rejects.toThrow('Usuário não encontrado')
    })
  })

  describe('saveUser', () => {
    it('deve salvar novo usuário', async () => {
      const userData = { name: 'Maria', email: 'maria@example.com' }
      const mockResponse = { id: '2', ...userData }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await saveUser(userData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
    })

    it('deve lançar erro em caso de falha', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
      })

      await expect(saveUser({ name: 'Test' })).rejects.toThrow('Erro ao salvar usuário')
    })
  })
})
```

---

✨ **Com este guia você domina todos os tipos de mocks com Vitest!**
