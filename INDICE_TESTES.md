# 📑 Índice Completo - Testes Unitários

## 🎯 Comece Aqui!

Se você é novo no projeto, leia nesta ordem:

1. **📄 [TESTES_README.md](./TESTES_README.md)** ← **COMECE AQUI** (5 min)
   - Visão geral rápida
   - Status: 76 testes passando
   - Quick start

2. **📖 [TESTING_GUIDE.md](./TESTING_GUIDE.md)** (20 min)
   - Arquitetura completa (5 camadas)
   - Padrões de isolamento
   - Exemplos de código

3. **🎯 [MOCKS_GUIDE.md](./MOCKS_GUIDE.md)** (15 min)
   - Como usar mocks
   - Padrões práticos
   - Armadilhas comuns

4. **🚀 [RUNNING_TESTS_GUIDE.md](./RUNNING_TESTS_GUIDE.md)** (10 min)
   - Como rodar testes
   - Debugar falhas
   - Otimizar performance

5. **📋 [TESTES_CRIADOS.md](./TESTES_CRIADOS.md)** (5 min)
   - Resumo do que foi criado
   - Estatísticas finais

---

## 🗂️ Árvore Completa de Arquivos

```
app-blog-monorepo/
├── 📚 Documentação de Testes (Leia!)
│   ├── INDICE_TESTES.md                  ← Você está aqui
│   ├── TESTES_README.md                  ← Comece aqui (sumário)
│   ├── TESTING_GUIDE.md                  ← Arquitetura completa
│   ├── MOCKS_GUIDE.md                    ← Como usar mocks
│   ├── RUNNING_TESTS_GUIDE.md            ← Como rodar/debugar
│   └── TESTES_CRIADOS.md                 ← Resumo criado
│
├── 🎨 Frontend (Client)
│   └── src/
│       ├── services/
│       │   ├── api.js                    (service real)
│       │   └── 🧪 api.test.js            (11 testes - VEJA!)
│       ├── components/
│       │   ├── PostCard.jsx              (componente real)
│       │   └── 🧪 PostCard.test.jsx      (7 testes - VEJA!)
│       └── test/
│           └── 🧪 setup.js               (configuração global)
│
└── 🔧 Backend (Server)
    └── src/
        ├── posts.service.js              (lógica real)
        ├── 🧪 posts.service.test.js      (18 testes - VEJA!)
        ├── posts.routes.js               (rotas reais)
        ├── 🧪 posts.routes.test.js       (18 testes - VEJA!)
        ├── posts.repository.js           (persistência real)
        └── 🧪 posts.repository.test.js   (22 testes - VEJA!)
```

---

## 🎪 Explorar Testes por Camada

### 1️⃣ Frontend - Serviço API (11 testes)

**Arquivo:** [`client/src/services/api.test.js`](./client/src/services/api.test.js)

**O que testa:** Funções que fazem requisições HTTP (fetch wrapper)

**Padrão:** Mock 100% de `fetch`

**Começar:**
```bash
# Ver testes
cat client/src/services/api.test.js

# Rodar apenas estes testes
npm run test:client -- -t "API Service"
```

**Leia também:** [TESTING_GUIDE.md - Camada 1](./TESTING_GUIDE.md#1️⃣-frontend---serviço-api-isolamento-completo)

---

### 2️⃣ Frontend - Componente React (7 testes)

**Arquivo:** [`client/src/components/PostCard.test.jsx`](./client/src/components/PostCard.test.jsx)

**O que testa:** Renderização e comportamento de componentes

**Padrão:** Testing Library + jsdom

**Começar:**
```bash
# Ver testes
cat client/src/components/PostCard.test.jsx

# Rodar apenas estes testes
npm run test:client -- -t "PostCard"
```

**Leia também:** [TESTING_GUIDE.md - Camada 2](./TESTING_GUIDE.md#2️⃣-frontend---componente-react)

---

### 3️⃣ Backend - Service (18 testes)

**Arquivo:** [`server/src/posts.service.test.js`](./server/src/posts.service.test.js)

**O que testa:** Lógica de negócio (validação, transformação)

**Padrão:** Mock 100% do repositório

**Começar:**
```bash
# Ver testes
cat server/src/posts.service.test.js

# Rodar apenas estes testes
npm run test:server -- -t "Posts Service"
```

**Leia também:** [TESTING_GUIDE.md - Camada 3](./TESTING_GUIDE.md#3️⃣-backend---serviço-lógica-de-negócio-isolada)

---

### 4️⃣ Backend - Rotas HTTP (18 testes)

**Arquivo:** [`server/src/posts.routes.test.js`](./server/src/posts.routes.test.js)

**O que testa:** Endpoints Express (GET, POST, PUT, DELETE)

**Padrão:** Supertest + Express em memória

**Começar:**
```bash
# Ver testes
cat server/src/posts.routes.test.js

# Rodar apenas estes testes
npm run test:server -- -t "Posts Routes"
```

**Leia também:** [TESTING_GUIDE.md - Camada 4](./TESTING_GUIDE.md#4️⃣-backend---rotas-integração-em-memória)

---

### 5️⃣ Backend - Repository (22 testes)

**Arquivo:** [`server/src/posts.repository.test.js`](./server/src/posts.repository.test.js)

**O que testa:** Persistência (file system neste caso)

**Padrão:** Integração REAL (arquivo temporário)

**Começar:**
```bash
# Ver testes
cat server/src/posts.repository.test.js

# Rodar apenas estes testes
npm run test:server -- -t "Posts Repository"
```

**Leia também:** [TESTING_GUIDE.md - Camada 5](./TESTING_GUIDE.md#5️⃣-backend---repository-integração-real)

---

## 📊 Resumo de Testes

| Camada | Arquivo | Testes | Padrão | Mock? |
|--------|---------|--------|--------|-------|
| **FE Service** | `api.test.js` | 11 | Isolado | ✓ fetch |
| **FE Component** | `PostCard.test.jsx` | 7 | Renderizado | Mínimo |
| **BE Service** | `posts.service.test.js` | 18 | Isolado | ✓ repo |
| **BE Routes** | `posts.routes.test.js` | 18 | Integrado | ✓ repo |
| **BE Repository** | `posts.repository.test.js` | 22 | Real | ✗ Nenhum |
| **TOTAL** | - | **76** | Misto | - |

---

## 🚀 Comandos Rápidos

```bash
# Rodar todos os testes (3-4s)
npm test

# Frontend only
npm run test:client

# Backend only
npm run test:server

# Watch mode (reexecuta ao salvar)
npm test -- --watch

# Teste específico
npm test -- -t "listPosts"

# Com cobertura
npm test -- --coverage

# Debugar
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

---

## 📚 Guias por Necessidade

### "Quero aprender conceitos"
→ Leia: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

### "Quero saber como mockar"
→ Leia: [MOCKS_GUIDE.md](./MOCKS_GUIDE.md)

### "Quero rodar testes / debugar"
→ Leia: [RUNNING_TESTS_GUIDE.md](./RUNNING_TESTS_GUIDE.md)

### "Quero um resumo rápido"
→ Leia: [TESTES_README.md](./TESTES_README.md)

### "Quero saber o que foi criado"
→ Leia: [TESTES_CRIADOS.md](./TESTES_CRIADOS.md)

### "Quero navegador entre testes"
→ Você está aqui! [INDICE_TESTES.md](./INDICE_TESTES.md)

---

## ✅ Checklist: Setup Completo

Verifique se tudo está pronto:

- [ ] ✓ Todos os 76 testes passando: `npm test`
- [ ] ✓ Documentação lida: [TESTES_README.md](./TESTES_README.md)
- [ ] ✓ Conceitos entendidos: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [ ] ✓ Mocks conhecidos: [MOCKS_GUIDE.md](./MOCKS_GUIDE.md)
- [ ] ✓ Sabe como debugar: [RUNNING_TESTS_GUIDE.md](./RUNNING_TESTS_GUIDE.md)
- [ ] ✓ Explorou pelo menos um arquivo `.test.js`
- [ ] ✓ Rodou: `npm test -- -t "listPosts"`

---

## 🎯 Próximas Ações

1. **Aprender** (20 min)
   - Ler [TESTING_GUIDE.md](./TESTING_GUIDE.md)
   - Explorar um arquivo `.test.js`

2. **Experimentar** (10 min)
   ```bash
   npm test -- --watch
   # Modifique um arquivo .test.js e veja testes reexecutar
   ```

3. **Praticar** (30 min)
   - Adicione um novo teste em `api.test.js`
   - Rodá-lo com `npm run test:client`

4. **Escalar** (Próximos passos)
   - Adicionar testes para novos features
   - Integrar com CI/CD
   - Aumentar cobertura

---

## 🆘 Precisa de Ajuda?

| Dúvida | Consulte |
|--------|----------|
| **Como estruturar um teste?** | [TESTING_GUIDE.md - Padrão AAA](./TESTING_GUIDE.md#️⃣-padrão-aaa) |
| **Como mockar algo?** | [MOCKS_GUIDE.md - Padrões Práticos](./MOCKS_GUIDE.md#🔧-padrões-práticos) |
| **Teste não funciona** | [RUNNING_TESTS_GUIDE.md - Troubleshooting](./RUNNING_TESTS_GUIDE.md#🚨-troubleshooting) |
| **Teste é lento** | [RUNNING_TESTS_GUIDE.md - Otimização](./RUNNING_TESTS_GUIDE.md#🎯-otimizando-performance-de-testes) |
| **Qual camada testar?** | [TESTING_GUIDE.md - Padrões por Camada](./TESTING_GUIDE.md#🏗️-padrões-de-testes-por-camada) |

---

## 📞 Arquivos Rápidos

**Rápido referência de arquivos:**

```bash
# Ver um arquivo de teste específico
cat client/src/services/api.test.js              # 11 testes FE
cat client/src/components/PostCard.test.jsx      # 7 testes FE
cat server/src/posts.service.test.js             # 18 testes BE
cat server/src/posts.routes.test.js              # 18 testes BE
cat server/src/posts.repository.test.js          # 22 testes BE
```

---

## 🎉 Status

✅ **Pronto para usar!**

- 76 testes passando
- 5 exemplos práticos implementados
- Documentação completa (60+ KB)
- Stack: Vitest + Testing Library + Supertest
- Isolamento completo implementado

---

**Próximo passo:** Leia [TESTES_README.md](./TESTES_README.md) (5 minutos) e explore os testes!

---

Versão: 1.0.0 | Data: 2024-11-20 | Status: ✅ Completo
