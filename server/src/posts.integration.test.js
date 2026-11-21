import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { randomBytes } from 'node:crypto'
import { unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createPostRoutes } from './posts.routes.js'
import { createPostsRepository } from './posts.repository.js'

/**
 * TESTES DE INTEGRAÇÃO: Redução gradual de mocks
 * 
 * Diferença do unitário:
 * ✗ Sem mocks de repositório
 * ✗ Sem mocks de arquivo
 * ✓ Arquivo temporário REAL
 * ✓ Dados persistem de verdade
 * ✓ Valida fluxo completo (rota → service → repository → arquivo)
 * 
 * Quando usar:
 * - Testar fluxos CRUD reais
 * - Validar integração entre camadas
 * - Pegar bugs que o unitário não vê
 */

describe('Posts API - Integration Tests (Sem Mocks)', () => {
  let app
  let repository
  let testFilePath

  beforeEach(async () => {
    // Cria arquivo temporário REAL para cada teste
    testFilePath = join(tmpdir(), `posts-${randomBytes(8).toString('hex')}.json`)

    // Setup Express + Router + Repository REAL
    app = express()
    app.use(express.json())

    // Repository usando arquivo de verdade
    repository = createPostsRepository(testFilePath)
    app.use(createPostRoutes(repository))

    // Middleware de erro
    app.use((err, _req, res, _next) => {
      const status = err.status || 500
      res.status(status).json({ error: { message: err.message } })
    })
  })

  afterEach(async () => {
    try {
      await unlink(testFilePath)
    } catch {
      // arquivo pode não existir
    }
  })

  describe('CREATE: POST /api/posts', () => {
    it('deve criar post válido e persistir no arquivo', async () => {
      // Arrange
      const postData = {
        title: 'Primeiro Post',
        content: 'Conteúdo do primeiro post com 20+ caracteres ok',
        author: 'João Silva',
      }

      // Act: Faz requisição POST
      const response = await request(app)
        .post('/api/posts')
        .send(postData)

      // Assert: Verifica resposta
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe('Primeiro Post')
      expect(response.body.author).toBe('João Silva')
      expect(response.body.createdAt).toBeDefined()

      // ✓ Verificação crítica: dado persiste no arquivo
      const persisted = await repository.findById(response.body.id)
      expect(persisted).toEqual(response.body)
      expect(persisted.title).toBe('Primeiro Post')
    })

    it('deve rejeitar dados inválidos com 400', async () => {
      const invalidData = {
        title: 'ab', // < 5 caracteres
        content: 'Conteúdo ok',
        author: 'João',
      }

      const response = await request(app)
        .post('/api/posts')
        .send(invalidData)

      // ✓ Verifica erro HTTP
      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('title deve ter no mínimo 5')

      // ✓ Verificação crítica: nada foi persistido
      const all = await repository.findAll()
      expect(all).toHaveLength(0)
    })

    it('deve validar múltiplos erros simultaneamente', async () => {
      const invalidData = {
        title: 'ab', // muito curto
        content: 'x', // muito curto
        author: '', // vazio
      }

      const response = await request(app)
        .post('/api/posts')
        .send(invalidData)

      expect(response.status).toBe(400)
      const message = response.body.error.message
      expect(message).toContain('author é obrigatório')
      expect(message).toContain('title deve ter no mínimo 5')
      expect(message).toContain('content deve ter no mínimo 20')

      // ✓ Nada persistido
      const all = await repository.findAll()
      expect(all).toHaveLength(0)
    })

    it('deve persistir múltiplos posts em ordem', async () => {
      // Cria 3 posts
      const posts = [
        { title: 'Post A', content: 'Conteúdo A com 20+ caracteres ok', author: 'João' },
        { title: 'Post B', content: 'Conteúdo B com 20+ caracteres ok', author: 'Maria' },
        { title: 'Post C', content: 'Conteúdo C com 20+ caracteres ok', author: 'Pedro' },
      ]

      const ids = []
      for (const post of posts) {
        const response = await request(app)
          .post('/api/posts')
          .send(post)

        expect(response.status).toBe(201)
        ids.push(response.body.id)
      }

      // ✓ Verifica que todos foram persistidos
      const all = await repository.findAll()
      expect(all).toHaveLength(3)

      // ✓ Verifica ordem de criação
      expect(all[0].title).toBe('Post A')
      expect(all[1].title).toBe('Post B')
      expect(all[2].title).toBe('Post C')
    })
  })

  describe('READ: GET /api/posts', () => {
    it('deve retornar array vazio quando não há posts', async () => {
      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    it('deve retornar posts ordenados por createdAt DESC', async () => {
      // Cria 3 posts
      const posts = [
        { title: 'Post 1', content: 'Conteúdo 1 com 20+ caracteres ok', author: 'João' },
        { title: 'Post 2', content: 'Conteúdo 2 com 20+ caracteres ok', author: 'Maria' },
        { title: 'Post 3', content: 'Conteúdo 3 com 20+ caracteres ok', author: 'Pedro' },
      ]

      for (const post of posts) {
        await request(app).post('/api/posts').send(post)
      }

      // GET com ordenação
      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(3)

      // ✓ Mais recente primeiro
      expect(response.body[0].title).toBe('Post 3')
      expect(response.body[1].title).toBe('Post 2')
      expect(response.body[2].title).toBe('Post 1')
    })

    it('deve retornar todos os campos do post', async () => {
      // Cria um post
      const postData = {
        title: 'Post com Todos os Campos',
        content: 'Conteúdo com 20+ caracteres ok',
        author: 'João Silva',
      }

      const createResponse = await request(app)
        .post('/api/posts')
        .send(postData)

      // GET lista completa
      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(200)
      const post = response.body[0]

      expect(post).toHaveProperty('id')
      expect(post).toHaveProperty('title')
      expect(post).toHaveProperty('content')
      expect(post).toHaveProperty('author')
      expect(post).toHaveProperty('createdAt')
    })
  })

  describe('READ: GET /api/posts/:id', () => {
    it('deve retornar post por ID', async () => {
      // Cria um post
      const postData = {
        title: 'Post Específico',
        content: 'Conteúdo com 20+ caracteres ok',
        author: 'João',
      }

      const createResponse = await request(app)
        .post('/api/posts')
        .send(postData)

      const postId = createResponse.body.id

      // GET por ID
      const response = await request(app).get(`/api/posts/${postId}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(postId)
      expect(response.body.title).toBe('Post Específico')
    })

    it('deve retornar 404 quando post não existe', async () => {
      const response = await request(app).get('/api/posts/inexistente')

      expect(response.status).toBe(404)
      expect(response.body.error.message).toContain('Post não encontrado')
    })

    it('deve retornar post correto quando há múltiplos', async () => {
      // Cria 3 posts
      const posts = []
      for (let i = 1; i <= 3; i++) {
        const response = await request(app)
          .post('/api/posts')
          .send({
            title: `Post ${i}`,
            content: `Conteúdo ${i} com 20+ caracteres ok`,
            author: `Author ${i}`,
          })
        posts.push(response.body)
      }

      // GET o post do meio
      const response = await request(app).get(`/api/posts/${posts[1].id}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(posts[1].id)
      expect(response.body.title).toBe('Post 2')
    })
  })

  describe('UPDATE: PUT /api/posts/:id', () => {
    it('deve atualizar post e persistir mudança', async () => {
      // Cria post
      const createResponse = await request(app)
        .post('/api/posts')
        .send({
          title: 'Post Original',
          content: 'Conteúdo original com 20+ caracteres ok',
          author: 'João',
        })

      const postId = createResponse.body.id

      // Atualiza
      const updateData = {
        title: 'Post Atualizado',
      }

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.title).toBe('Post Atualizado')
      expect(response.body.content).toBe('Conteúdo original com 20+ caracteres ok') // mantém

      // ✓ Verifica persistência
      const updated = await repository.findById(postId)
      expect(updated.title).toBe('Post Atualizado')
    })

    it('deve validar dados atualizados', async () => {
      // Cria post
      const createResponse = await request(app)
        .post('/api/posts')
        .send({
          title: 'Post Original',
          content: 'Conteúdo original com 20+ caracteres ok',
          author: 'João',
        })

      const postId = createResponse.body.id

      // Tenta atualizar com título inválido
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ title: 'ab' }) // muito curto

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('title deve ter no mínimo 5')

      // ✓ Verifica que não foi alterado
      const unchanged = await repository.findById(postId)
      expect(unchanged.title).toBe('Post Original')
    })

    it('deve retornar 404 para post inexistente', async () => {
      const response = await request(app)
        .put('/api/posts/inexistente')
        .send({ title: 'Novo Título' })

      expect(response.status).toBe(404)
      expect(response.body.error.message).toContain('Post não encontrado')
    })

    it('deve fazer merge de campos (atualiza apenas o informado)', async () => {
      // Cria post
      const createResponse = await request(app)
        .post('/api/posts')
        .send({
          title: 'Título Original',
          content: 'Conteúdo original com 20+ caracteres ok',
          author: 'João Silva',
        })

      const postId = createResponse.body.id

      // Atualiza apenas título
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ title: 'Novo Título' })

      expect(response.status).toBe(200)
      expect(response.body.title).toBe('Novo Título')
      expect(response.body.content).toBe('Conteúdo original com 20+ caracteres ok') // mantém
      expect(response.body.author).toBe('João Silva') // mantém

      // ✓ Verifica que apenas título mudou
      const updated = await repository.findById(postId)
      expect(updated.title).toBe('Novo Título')
      expect(updated.content).toBe('Conteúdo original com 20+ caracteres ok')
      expect(updated.author).toBe('João Silva')
    })
  })

  describe('DELETE: DELETE /api/posts/:id', () => {
    it('deve deletar post e remover do arquivo', async () => {
      // Cria post
      const createResponse = await request(app)
        .post('/api/posts')
        .send({
          title: 'Post a Deletar',
          content: 'Conteúdo com 20+ caracteres ok',
          author: 'João',
        })

      const postId = createResponse.body.id

      // Verifica que existe
      let all = await repository.findAll()
      expect(all).toHaveLength(1)

      // Deleta
      const response = await request(app).delete(`/api/posts/${postId}`)

      expect(response.status).toBe(204)
      expect(response.body).toEqual({})

      // ✓ Verifica que foi removido do arquivo
      all = await repository.findAll()
      expect(all).toHaveLength(0)

      // ✓ GET retorna 404
      const getResponse = await request(app).get(`/api/posts/${postId}`)
      expect(getResponse.status).toBe(404)
    })

    it('deve retornar 404 quando post não existe', async () => {
      const response = await request(app).delete('/api/posts/inexistente')

      expect(response.status).toBe(404)
      expect(response.body.error.message).toContain('Post não encontrado')
    })

    it('deve deletar apenas o post específico', async () => {
      // Cria 3 posts
      const ids = []
      for (let i = 1; i <= 3; i++) {
        const response = await request(app)
          .post('/api/posts')
          .send({
            title: `Post ${i}`,
            content: `Conteúdo ${i} com 20+ caracteres ok`,
            author: `Author ${i}`,
          })
        ids.push(response.body.id)
      }

      // Deleta o do meio
      const response = await request(app).delete(`/api/posts/${ids[1]}`)

      expect(response.status).toBe(204)

      // ✓ Verifica que apenas 2 restam
      const all = await repository.findAll()
      expect(all).toHaveLength(2)
      expect(all[0].title).toBe('Post 1')
      expect(all[1].title).toBe('Post 3')
    })
  })

  describe('Fluxos Críticos (Integration)', () => {
    it('deve criar, listar, atualizar e deletar', async () => {
      // 1. Cria post
      const createResponse = await request(app)
        .post('/api/posts')
        .send({
          title: 'Post Teste Fluxo',
          content: 'Conteúdo teste com 20+ caracteres ok',
          author: 'João',
        })

      const postId = createResponse.body.id
      expect(createResponse.status).toBe(201)

      // 2. Lista e verifica que aparece
      let listResponse = await request(app).get('/api/posts')
      expect(listResponse.body).toHaveLength(1)
      expect(listResponse.body[0].title).toBe('Post Teste Fluxo')

      // 3. Atualiza
      const updateResponse = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ title: 'Post Teste Fluxo - Atualizado' })

      expect(updateResponse.status).toBe(200)

      // 4. Verifica atualização na lista
      listResponse = await request(app).get('/api/posts')
      expect(listResponse.body[0].title).toBe('Post Teste Fluxo - Atualizado')

      // 5. Deleta
      const deleteResponse = await request(app).delete(`/api/posts/${postId}`)
      expect(deleteResponse.status).toBe(204)

      // 6. Verifica que lista fica vazia
      listResponse = await request(app).get('/api/posts')
      expect(listResponse.body).toHaveLength(0)
    })

    it('deve rejeitar fluxo inválido (criar → atualizar inválido → deletar)', async () => {
      // 1. Cria post válido
      const createResponse = await request(app)
        .post('/api/posts')
        .send({
          title: 'Post Teste',
          content: 'Conteúdo teste com 20+ caracteres ok',
          author: 'João',
        })

      const postId = createResponse.body.id

      // 2. Tenta atualizar com dados inválidos
      const updateResponse = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ title: 'ab' })

      expect(updateResponse.status).toBe(400)

      // 3. Verifica que post original se mantém
      const getResponse = await request(app).get(`/api/posts/${postId}`)
      expect(getResponse.body.title).toBe('Post Teste')

      // 4. Deleta corretamente
      const deleteResponse = await request(app).delete(`/api/posts/${postId}`)
      expect(deleteResponse.status).toBe(204)
    })
  })
})
