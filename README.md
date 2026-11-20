# Tutorial: Blog com React + Express (monorepo) no GitHub Codespace

Este tutorial monta, do zero, o app de blog da aula de testes unitários. Você vai criar as pastas, os arquivos e o código pelo terminal do Codespace, rodar o projeto e testá-lo.

**O que você vai ter no final**

- Back-end em Node + Express, com posts salvos em `server/src/data/posts.json`.
- Front-end em React + Vite, com lista de posts, busca, detalhe, criação, edição e exclusão.
- Arquitetura simples: `posts.service.js` (regras), `posts.repository.js` (JSON), `posts.routes.js` (HTTP), `app.js` e `server.js` (montagem).
- Vitest configurado nos dois lados (os testes entram na próxima etapa).

**Portas usadas**

| Parte | Porta | Observação |
|---|---|---|
| Server (Express) | 3001 | API em `/api/...` |
| Client (Vite) | 3000 | Abre no navegador; o Vite repassa `/api` para a porta 3001 |

---

## Parte 1: Configurações fora do editor (GitHub e Codespace)

### 1.1 Criar o repositório no GitHub

1. Entre em https://github.com e clique em **New** (ou no botão **+** > **New repository**).
2. Em **Repository name**, digite `blog-app-monorepo`.
3. Escolha **Public** ou **Private**.
4. Marque **Add a README file** (opcional) e clique em **Create repository**.

### 1.2 Abrir um Codespace

1. Na página do repositório, clique em **Code** > aba **Codespaces** > **Create codespace on main**.
2. Espere o editor (VS Code no navegador) carregar.
3. Abra o terminal: menu **Terminal** > **New Terminal** (ou `` Ctrl+` ``).

O terminal começa dentro da pasta do repositório, que costuma ser `/workspaces/blog-app-monorepo`. Confira com:

```bash
pwd
```

Se não aparecer `/workspaces/blog-app-monorepo`, rode `cd /workspaces/blog-app-monorepo`.

### 1.3 Confirmar as versões do Node e do npm

```bash
node -v
npm -v
```

Precisa ser Node 18.11 ou mais novo (o Codespace já vem com uma versão compatível). Se não for, veja a seção de solução de problemas.

### 1.4 Portas no Codespace

Depois de rodar o projeto, o Codespace mostra uma aba **PORTS** no painel inferior. A porta **3000** é a que você abre no navegador: clique no ícone de globo ao lado dela. A porta **3001** não precisa ser aberta no navegador, porque o front-end acessa ela pelo proxy do Vite. Se o Codespace perguntar, deixe as portas como **Private**.

---

## Parte 2: Criar a estrutura de pastas

Todos os comandos desta parte e das próximas são rodados na pasta raiz do projeto. Confirme com `pwd` antes de começar.

```bash
mkdir -p server/src/data
mkdir -p client/src/pages client/src/components client/src/services client/src/test
```

Estrutura que você vai obter:

```text
blog-app-monorepo/
├── package.json
├── .gitignore
├── server/
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── data/              (o posts.json é criado sozinho na primeira execução)
│       ├── posts.repository.js
│       ├── posts.routes.js
│       ├── posts.service.js
│       └── server.js
└── client/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── styles.css
        ├── components/
        │   ├── PostCard.jsx
        │   └── PostForm.jsx
        ├── pages/
        │   ├── EditPostPage.jsx
        │   ├── HomePage.jsx
        │   ├── NewPostPage.jsx
        │   └── PostPage.jsx
        ├── services/
        │   └── api.js
        └── test/
            └── setup.js
```

---

## Parte 3: Arquivos da raiz

Cada arquivo abaixo é criado com `cat > caminho << 'EOF'`. Copie o bloco inteiro, do `cat` até o `EOF` (inclusive), e cole no terminal. Se o terminal não aceitar colar o bloco todo, crie o arquivo com `touch caminho`, abra no editor e cole só o conteúdo que está entre as linhas `cat` e `EOF`.

**Arquivo:** `package.json`

```bash
cat > package.json << 'EOF'
{
  "name": "blog-app-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "dev:server": "npm run dev -w server",
    "dev:client": "npm run dev -w client",
    "test:server": "npm run test -w server",
    "test:client": "npm run test -w client",
    "test": "npm run test --workspaces --if-present"
  }
}
EOF
```


**Arquivo:** `.gitignore`

```bash
cat > .gitignore << 'EOF'
node_modules/
server/src/data/posts.json
*.log
EOF
```


---

## Parte 4: Back-end (server)

Ordem sugerida: `server/package.json`, depois a camada de dados, a de regras, a de rotas, o `app.js` e por fim o `server.js`.

**Arquivo:** `server/package.json`

```bash
cat > server/package.json << 'EOF'
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "vitest run --passWithNoTests"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "supertest": "^6.3.3",
    "vitest": "^1.6.0"
  }
}
EOF
```


### 4.1 Camada de dados

**Arquivo:** `server/src/posts.repository.js`

```bash
cat > server/src/posts.repository.js << 'EOF'
import { readFile, writeFile, rename, mkdir, access } from 'node:fs/promises'
import { dirname } from 'node:path'
import { constants } from 'node:fs'

export class DataError extends Error {
  constructor({ code, status, message }) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function createPostsRepository(filePath) {
  async function ensureFileExists() {
    try {
      await access(filePath, constants.F_OK)
    } catch {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, '[]', 'utf-8')
    }
  }

  async function readAll() {
    await ensureFileExists()
    const raw = await readFile(filePath, 'utf-8')
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new DataError({
        code: 'DATA_CORRUPTED',
        status: 500,
        message: 'Arquivo de dados corrompido: JSON inválido',
      })
    }
    if (!Array.isArray(parsed)) {
      throw new DataError({
        code: 'DATA_CORRUPTED',
        status: 500,
        message: 'Arquivo de dados corrompido: esperado um array',
      })
    }
    return parsed
  }

  async function writeAll(posts) {
    await mkdir(dirname(filePath), { recursive: true })
    const tmpPath = `${filePath}.tmp`
    await writeFile(tmpPath, JSON.stringify(posts, null, 2), 'utf-8')
    await rename(tmpPath, filePath)
  }

  return {
    filePath,
    async findAll() {
      return readAll()
    },
    async findById(id) {
      const posts = await readAll()
      return posts.find((p) => p.id === id) || null
    },
    async save(post) {
      const posts = await readAll()
      posts.push(post)
      await writeAll(posts)
      return post
    },
    async update(id, updated) {
      const posts = await readAll()
      const index = posts.findIndex((p) => p.id === id)
      if (index === -1) return null
      posts[index] = { ...posts[index], ...updated }
      await writeAll(posts)
      return posts[index]
    },
    async remove(id) {
      const posts = await readAll()
      const index = posts.findIndex((p) => p.id === id)
      if (index === -1) return false
      posts.splice(index, 1)
      await writeAll(posts)
      return true
    },
  }
}
EOF
```


### 4.2 Regras de negócio

**Arquivo:** `server/src/posts.service.js`

```bash
cat > server/src/posts.service.js << 'EOF'
import { randomUUID } from 'node:crypto'

export class AppError extends Error {
  constructor({ code, status, message }) {
    super(message)
    this.code = code
    this.status = status
  }
}

function validatePostData(data, { requireAll = true } = {}) {
  const errors = []

  if (requireAll && (data.author === undefined || data.author === null || String(data.author).trim() === '')) {
    errors.push('author é obrigatório')
  }

  const title = typeof data.title === 'string' ? data.title.trim() : ''
  if (title.length < 5) errors.push('title deve ter no mínimo 5 caracteres')
  if (title.length > 100) errors.push('title deve ter no máximo 100 caracteres')

  const content = typeof data.content === 'string' ? data.content : ''
  if (content.length < 20) errors.push('content deve ter no mínimo 20 caracteres')

  if (errors.length > 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      status: 400,
      message: errors.join('; '),
    })
  }

  return {
    title: title,
    content,
    author: requireAll ? String(data.author).trim() : data.author,
  }
}

export async function listPosts(repo) {
  const posts = await repo.findAll()
  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getPost(repo, id) {
  const post = await repo.findById(id)
  if (!post) {
    throw new AppError({ code: 'NOT_FOUND', status: 404, message: 'Post não encontrado' })
  }
  return post
}

export async function createPost(repo, data) {
  const safeData = data ?? {}
  const validated = validatePostData(safeData, { requireAll: true })
  const post = {
    id: randomUUID(),
    title: validated.title,
    content: validated.content,
    author: validated.author,
    createdAt: new Date().toISOString(),
  }
  return repo.save(post)
}

export async function updatePost(repo, id, data) {
  const existing = await repo.findById(id)
  if (!existing) {
    throw new AppError({ code: 'NOT_FOUND', status: 404, message: 'Post não encontrado' })
  }

  const safeData = data ?? {}
  const merged = {
    title: safeData.title !== undefined ? safeData.title : existing.title,
    content: safeData.content !== undefined ? safeData.content : existing.content,
    author: safeData.author !== undefined ? safeData.author : existing.author,
  }

  const validated = validatePostData(merged, { requireAll: false })

  const updated = await repo.update(id, {
    title: validated.title,
    content: validated.content,
    author: validated.author !== undefined ? validated.author : existing.author,
  })
  return updated
}

export async function deletePost(repo, id) {
  const removed = await repo.remove(id)
  if (!removed) {
    throw new AppError({ code: 'NOT_FOUND', status: 404, message: 'Post não encontrado' })
  }
}
EOF
```


### 4.3 Rotas HTTP

**Arquivo:** `server/src/posts.routes.js`

```bash
cat > server/src/posts.routes.js << 'EOF'
import { Router } from 'express'
import { listPosts, getPost, createPost, updatePost, deletePost } from './posts.service.js'

export function createPostRoutes(repo) {
  const router = Router()

  router.get('/api/posts', async (_req, res, next) => {
    try {
      const posts = await listPosts(repo)
      res.json(posts)
    } catch (err) {
      next(err)
    }
  })

  router.get('/api/posts/:id', async (req, res, next) => {
    try {
      const post = await getPost(repo, req.params.id)
      res.json(post)
    } catch (err) {
      next(err)
    }
  })

  router.post('/api/posts', async (req, res, next) => {
    try {
      const post = await createPost(repo, req.body)
      res.status(201).json(post)
    } catch (err) {
      next(err)
    }
  })

  router.put('/api/posts/:id', async (req, res, next) => {
    try {
      const post = await updatePost(repo, req.params.id, req.body)
      res.json(post)
    } catch (err) {
      next(err)
    }
  })

  router.delete('/api/posts/:id', async (req, res, next) => {
    try {
      await deletePost(repo, req.params.id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  })

  return router
}
EOF
```


### 4.4 Montagem do Express

**Arquivo:** `server/src/app.js`

```bash
cat > server/src/app.js << 'EOF'
import express from 'express'
import { createPostRoutes } from './posts.routes.js'
import { AppError } from './posts.service.js'

export function createApp(repo) {
  const app = express()

  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use(createPostRoutes(repo))

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada' },
    })
  })

  // Middleware de erro: precisa vir por último (depois do express.json e das rotas)
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'JSON malformado no corpo da requisição' },
      })
    }

    if (err instanceof AppError) {
      return res.status(err.status).json({
        error: { code: err.code, message: err.message },
      })
    }

    if (err.code === 'DATA_CORRUPTED') {
      return res.status(err.status || 500).json({
        error: { code: err.code, message: err.message },
      })
    }

    console.error('Erro não tratado:', err)
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    })
  })

  return app
}
EOF
```


### 4.5 Ponto de entrada

**Arquivo:** `server/src/server.js`

```bash
cat > server/src/server.js << 'EOF'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createPostsRepository } from './posts.repository.js'
import { createApp } from './app.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dataPath = join(__dirname, 'data', 'posts.json')

const repo = createPostsRepository(dataPath)
const app = createApp(repo)

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
  console.log(`Arquivo de dados: ${dataPath}`)
})
EOF
```


---

## Parte 5: Front-end (client)

**Arquivo:** `client/package.json`

```bash
cat > client/package.json << 'EOF'
{
  "name": "client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run --passWithNoTests"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@testing-library/dom": "^9.3.3",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^23.0.1",
    "vite": "^5.0.7",
    "vitest": "^1.6.0"
  }
}
EOF
```


**Arquivo:** `client/vite.config.js`

```bash
cat > client/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
EOF
```


**Arquivo:** `client/index.html`

```bash
cat > client/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Blog App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF
```


### 5.1 Bootstrap e rotas

**Arquivo:** `client/src/main.jsx`

```bash
cat > client/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF
```


**Arquivo:** `client/src/App.jsx`

```bash
cat > client/src/App.jsx << 'EOF'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import PostPage from './pages/PostPage.jsx'
import NewPostPage from './pages/NewPostPage.jsx'
import EditPostPage from './pages/EditPostPage.jsx'
import './styles.css'

export default function App() {
  return (
    <BrowserRouter>
      <header className="app-header">
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/posts/novo">
            Novo post
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/novo" element={<NewPostPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/posts/:id/editar" element={<EditPostPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
EOF
```


### 5.2 Configuração do Vitest (usada nos testes da próxima etapa)

**Arquivo:** `client/src/test/setup.js`

```bash
cat > client/src/test/setup.js << 'EOF'
import '@testing-library/jest-dom'
EOF
```


### 5.3 Chamadas à API

**Arquivo:** `client/src/services/api.js`

```bash
cat > client/src/services/api.js << 'EOF'
async function handleResponse(response) {
  if (!response.ok) {
    let message = 'Erro na requisição'
    try {
      const data = await response.json()
      message = data.error?.message || message
    } catch {
      // ignora erro de parsing
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

export async function listPosts() {
  const response = await fetch('/api/posts')
  return handleResponse(response)
}

export async function getPost(id) {
  const response = await fetch(`/api/posts/${id}`)
  return handleResponse(response)
}

export async function createPost(data) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export async function updatePost(id, data) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export async function deletePost(id) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
  })
  return handleResponse(response)
}
EOF
```


### 5.4 Componentes

**Arquivo:** `client/src/components/PostCard.jsx`

```bash
cat > client/src/components/PostCard.jsx << 'EOF'
import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  const summary =
    post.content.length > 150
      ? post.content.slice(0, 150) + '...'
      : post.content

  const formattedDate = new Date(post.createdAt).toLocaleDateString('pt-BR')

  return (
    <article className="post-card" data-testid="post-card">
      <h2>
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </h2>
      <p className="post-summary">{summary}</p>
      <p className="post-meta">
        Por {post.author} em {formattedDate}
      </p>
    </article>
  )
}
EOF
```


**Arquivo:** `client/src/components/PostForm.jsx`

```bash
cat > client/src/components/PostForm.jsx << 'EOF'
import { useState } from 'react'

export default function PostForm({ initialData = {}, onSubmit, submitLabel }) {
  const [title, setTitle] = useState(initialData.title || '')
  const [content, setContent] = useState(initialData.content || '')
  const [author, setAuthor] = useState(initialData.author || '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate() {
    const newErrors = {}

    if (title.trim().length < 5) {
      newErrors.title = 'Título deve ter no mínimo 5 caracteres'
    }
    if (title.trim().length > 100) {
      newErrors.title = 'Título deve ter no máximo 100 caracteres'
    }

    if (content.length < 20) {
      newErrors.content = 'Conteúdo deve ter no mínimo 20 caracteres'
    }

    if (!author.trim()) {
      newErrors.author = 'Autor é obrigatório'
    }

    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccess(false)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await onSubmit({ title: title.trim(), content, author: author.trim() })
      setSuccess(true)
      if (!initialData.id) {
        setTitle('')
        setContent('')
        setAuthor('')
      }
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="post-form" data-testid="post-form">
      {errors.form && (
        <p className="error-message" data-testid="form-error">
          {errors.form}
        </p>
      )}

      {success && (
        <p className="success-message" data-testid="form-success">
          Operação realizada com sucesso!
        </p>
      )}

      <div className="form-field">
        <label htmlFor="title">Título</label>
        <input
          id="title"
          data-testid="title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
        />
        {errors.title && (
          <span className="field-error" data-testid="title-error">
            {errors.title}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="content">Conteúdo</label>
        <textarea
          id="content"
          data-testid="content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="10"
          disabled={submitting}
        />
        {errors.content && (
          <span className="field-error" data-testid="content-error">
            {errors.content}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="author">Autor</label>
        <input
          id="author"
          data-testid="author-input"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={submitting}
        />
        {errors.author && (
          <span className="field-error" data-testid="author-error">
            {errors.author}
          </span>
        )}
      </div>

      <button
        type="submit"
        data-testid="submit-button"
        disabled={submitting}
        className="btn btn-primary"
      >
        {submitting ? 'Enviando...' : submitLabel}
      </button>
    </form>
  )
}
EOF
```


### 5.5 Páginas

**Arquivo:** `client/src/pages/HomePage.jsx`

```bash
cat > client/src/pages/HomePage.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { listPosts } from '../services/api.js'
import PostCard from '../components/PostCard.jsx'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        const data = await listPosts()
        setPosts(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const filteredPosts = posts.filter((post) => {
    const term = searchTerm.toLowerCase()
    return (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term)
    )
  })

  return (
    <div className="home-page">
      <h1>Blog</h1>

      <div className="search-box">
        <label htmlFor="search">Buscar:</label>
        <input
          id="search"
          data-testid="search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite uma palavra-chave..."
        />
      </div>

      {loading && <p data-testid="loading">Carregando...</p>}

      {error && (
        <p data-testid="error" className="error-message">
          Erro: {error}
        </p>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <p data-testid="empty-state">Nenhum post encontrado</p>
      )}

      {!loading && !error && filteredPosts.length > 0 && (
        <div className="posts-list" data-testid="posts-list">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
EOF
```


**Arquivo:** `client/src/pages/PostPage.jsx`

```bash
cat > client/src/pages/PostPage.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPost, deletePost } from '../services/api.js'

export default function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true)
        const data = await getPost(id)
        setPost(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja excluir este post?')) {
      return
    }
    try {
      await deletePost(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <p data-testid="loading">Carregando...</p>
  }

  if (error) {
    return <p data-testid="error" className="error-message">Erro: {error}</p>
  }

  if (!post) {
    return <p data-testid="not-found">Post não encontrado</p>
  }

  return (
    <article className="post-page" data-testid="post-detail">
      <h1>{post.title}</h1>
      <p className="post-meta">
        Por {post.author} em {new Date(post.createdAt).toLocaleDateString('pt-BR')}
      </p>
      <div className="post-content">{post.content}</div>
      <div className="post-actions">
        <Link to={`/posts/${id}/editar`} className="btn btn-edit">
          Editar
        </Link>
        <button onClick={handleDelete} className="btn btn-delete">
          Excluir
        </button>
      </div>
    </article>
  )
}
EOF
```


**Arquivo:** `client/src/pages/NewPostPage.jsx`

```bash
cat > client/src/pages/NewPostPage.jsx << 'EOF'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../services/api.js'
import PostForm from '../components/PostForm.jsx'

export default function NewPostPage() {
  const navigate = useNavigate()

  async function handleSubmit(data) {
    await createPost(data)
    navigate('/')
  }

  return (
    <div className="form-page">
      <h1>Novo Post</h1>
      <PostForm onSubmit={handleSubmit} submitLabel="Criar" />
    </div>
  )
}
EOF
```


**Arquivo:** `client/src/pages/EditPostPage.jsx`

```bash
cat > client/src/pages/EditPostPage.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPost, updatePost } from '../services/api.js'
import PostForm from '../components/PostForm.jsx'

export default function EditPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true)
        const data = await getPost(id)
        setPost(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  async function handleSubmit(data) {
    await updatePost(id, data)
    navigate(`/posts/${id}`)
  }

  if (loading) {
    return <p data-testid="loading">Carregando...</p>
  }

  if (error) {
    return <p data-testid="error" className="error-message">Erro: {error}</p>
  }

  if (!post) {
    return <p data-testid="not-found">Post não encontrado</p>
  }

  return (
    <div className="form-page">
      <h1>Editar Post</h1>
      <PostForm
        initialData={post}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />
    </div>
  )
}
EOF
```


### 5.6 Estilos

**Arquivo:** `client/src/styles.css`

```bash
cat > client/src/styles.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.app-header {
  background: #2c3e50;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header nav {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.app-header a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.app-header a:hover {
  opacity: 0.8;
}

.app-header a.active {
  border-bottom: 2px solid #3498db;
}

.app-main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.home-page h1 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.search-box {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box label {
  font-weight: 500;
}

.search-box input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.posts-list {
  display: grid;
  gap: 1.5rem;
}

.post-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.post-card h2 {
  margin-bottom: 0.5rem;
}

.post-card h2 a {
  color: #2c3e50;
  text-decoration: none;
}

.post-card h2 a:hover {
  color: #3498db;
}

.post-summary {
  color: #666;
  margin-bottom: 0.5rem;
}

.post-meta {
  font-size: 0.875rem;
  color: #999;
}

.post-page {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-page h1 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.post-content {
  margin: 2rem 0;
  white-space: pre-wrap;
  line-height: 1.8;
}

.post-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.form-page {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-page h1 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  color: #2c3e50;
}

.form-field input,
.form-field textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-field input:disabled,
.form-field textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.field-error {
  color: #e74c3c;
  font-size: 0.875rem;
}

.error-message {
  color: #e74c3c;
  padding: 1rem;
  background: #fdf0f0;
  border-radius: 4px;
  border-left: 4px solid #e74c3c;
}

.success-message {
  color: #27ae60;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 4px;
  border-left: 4px solid #27ae60;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-edit:hover {
  background: #e67e22;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background: #c0392b;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }

  .app-header nav {
    gap: 1rem;
  }

  .app-main {
    padding: 0 1rem;
  }

  .post-page,
  .form-page {
    padding: 1.5rem;
  }

  .post-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    text-align: center;
  }
}
EOF
```


---

## Parte 6: Instalar as dependências

Ainda na raiz do projeto:

```bash
npm install
```

Esse comando instala as dependências dos dois workspaces (`client` e `server`) de uma vez, por causa do campo `workspaces` no `package.json` da raiz. Ao final, confira:

```bash
ls node_modules | head
ls client/node_modules 2>/dev/null | head -3
```

Os pacotes ficam em `node_modules` na raiz. A pasta `client/node_modules`, se existir, só guarda pacotes específicos do client.

---

## Parte 7: Rodar o projeto

Você precisa de **dois terminais** rodando ao mesmo tempo.

**Terminal 1: back-end**

```bash
npm run dev:server
```

Saída esperada:

```text
Servidor rodando em http://localhost:3001
Arquivo de dados: /workspaces/blog-app-monorepo/server/src/data/posts.json
```

**Terminal 2: front-end.** Abra um novo terminal (botão **+** no painel do terminal) e, na raiz do projeto, rode:

```bash
npm run dev:client
```

Saída esperada: uma linha dizendo `Local: http://localhost:3000/`.

Para abrir o blog, vá na aba **PORTS**, localize a porta **3000** e clique no ícone de globo.

Para parar qualquer um dos dois, clique no terminal correspondente e pressione `Ctrl+C`.

---

## Parte 8: Testar

### 8.1 Testes pelo terminal (API)

Com o Terminal 1 rodando, abra um terceiro terminal e execute os comandos abaixo.

Verificar se o servidor está no ar:

```bash
curl http://localhost:3001/api/health
```

Resposta esperada: `{"status":"ok"}`

Listar posts (ainda vazio, deve retornar `[]`):

```bash
curl http://localhost:3001/api/posts
```

Criar um post (resposta com status 201, com `id` e `createdAt` gerados pelo servidor):

```bash
curl -i -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Meu primeiro post","content":"Este é o conteúdo do meu primeiro post de teste.","author":"Ana"}'
```

Testar validação (deve responder 400 com `VALIDATION_ERROR`):

```bash
curl -i -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"ab","content":"curto","author":""}'
```

Testar JSON malformado (deve responder 400 com `INVALID_JSON`):

```bash
curl -i -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":'
```

Testar post inexistente (deve responder 404 com `NOT_FOUND`):

```bash
curl -i http://localhost:3001/api/posts/id-que-nao-existe
```

Conferir o arquivo de persistência:

```bash
cat server/src/data/posts.json
```

Para pegar o `id` de um post e testar edição e exclusão, use o `id` que aparece na listagem. Substitua `SEU_ID` pelo valor real:

```bash
curl -i -X PUT http://localhost:3001/api/posts/SEU_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Título editado"}'

curl -i -X DELETE http://localhost:3001/api/posts/SEU_ID
```

### 8.2 Testes pelo navegador (interface)

Com os dois terminais rodando, abra a porta 3000 e confira:

1. **Home**: aparece a lista de posts (ou "Nenhum post encontrado" se estiver vazia). Digite uma palavra no campo **Buscar** e veja a lista filtrar.
2. **Novo post** (menu superior): preencha título (mínimo 5 caracteres), conteúdo (mínimo 20 caracteres) e autor. Teste enviar com campos vazios: os erros aparecem embaixo de cada campo. Ao salvar com dados válidos, você volta para a Home.
3. **Detalhe**: clique no título de um post. Confira título, autor, data e conteúdo.
4. **Editar**: na página do post, clique em **Editar**, altere algo e clique em **Salvar alterações**.
5. **Excluir**: na página do post, clique em **Excluir**, confirme o aviso e veja o post sair da lista.

### 8.3 Testes automatizados (ainda vazios)

```bash
npm test
```

Como ainda não há arquivos de teste, o resultado esperado é `No test files found` nos dois workspaces, e o comando termina sem erro. Esse é o sinal de que o Vitest está configurado. Os testes de verdade entram na próxima etapa.

---

## Parte 9: Enviar para o GitHub (opcional, mas recomendado)

Na raiz do projeto:

```bash
git add .
git status
git commit -m "Monta blog com React e Express (etapas 2 a 4)"
git push
```

A pasta `node_modules` e o `server/src/data/posts.json` não vão para o GitHub, por causa do `.gitignore`. Se o `git push` pedir usuário e senha, use o login que o Codespace já tem; se a primeira vez pedir para configurar o nome e e-mail, rode:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

---

## Parte 10: Solução de problemas

| Sintoma | Causa provável | Como resolver |
|---|---|---|
| `Missing script: "dev:server"` | Você rodou o comando fora da raiz do projeto | `cd /workspaces/blog-app-monorepo` e rode de novo |
| `EADDRINUSE: address already in use :::3001` | Outro servidor já está usando a porta | Feche o terminal antigo ou rode `kill $(lsof -t -i:3001)` |
| Tela branca no navegador (porta 3000) | Erro de import ou o servidor de front não subiu | Veja o terminal do `dev:client` e o console do navegador (F12) |
| Lista de posts mostra "Erro: Failed to fetch" | Servidor (porta 3001) não está rodando | Rode `npm run dev:server` em outro terminal |
| `No test files found` e `npm test` falha | Versão antiga do script de teste | Confira se os `package.json` estão iguais aos deste tutorial (veja a Parte 11) |
| `Arquivo de dados corrompido` na API | O `posts.json` foi editado à mão e ficou inválido | Apague `server/src/data/posts.json`; ele será recriado como `[]` |
| `npm install` falha por causa de versão de Node | Node antigo | Rode `node -v`; se for menor que 18.11, reinicie o Codespace ou escolha outra imagem |

---

## Parte 11: Ajustes feitos em relação à conversa com o Qwen

O código deste tutorial é o das etapas 2, 3 e 4 da conversa, com estas correções:

1. **`server/src/app.js`**: o middleware que trata JSON malformado estava *antes* do `express.json()`. Assim ele nunca era acionado e o erro caía no 500. Agora o tratamento fica no middleware de erro final, que é o lugar certo.
2. **Scripts de teste (`server/package.json` e `client/package.json`)**: o `vitest` sem `run` fica em modo watch e trava o `npm test`. Agora usamos `vitest run --passWithNoTests`, que sai sem erro quando não há testes.
3. **Script de teste na raiz**: a conversa mandava rodar `npm run test:run` na raiz, mas esse script não existia no `package.json` da raiz. Agora use `npm test`.
4. **`client/package.json`**: incluí `@testing-library/dom`, que o `@testing-library/react` usa como dependência de par.
5. **`.gitignore`**: adicionado para não subir `node_modules` nem os dados locais.
6. **`server/src/posts.repository.js`**: mantive a lógica da versão corrigida (erro `DATA_CORRUPTED` quando o JSON é inválido, escrita atômica com arquivo temporário e `rename`).

Não foram incluídos os testes unitários e de integração (etapas 5 e 6), porque não aparecem na conversa exportada.

---

## Anexo: arquivos e caminhos

- `.gitignore`
- `client/index.html`
- `client/package.json`
- `client/src/App.jsx`
- `client/src/components/PostCard.jsx`
- `client/src/components/PostForm.jsx`
- `client/src/main.jsx`
- `client/src/pages/EditPostPage.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/NewPostPage.jsx`
- `client/src/pages/PostPage.jsx`
- `client/src/services/api.js`
- `client/src/styles.css`
- `client/src/test/setup.js`
- `client/vite.config.js`
- `package.json`
- `server/package.json`
- `server/src/app.js`
- `server/src/posts.repository.js`
- `server/src/posts.routes.js`
- `server/src/posts.service.js`
- `server/src/server.js`