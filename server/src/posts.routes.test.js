import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { createPostRoutes } from './posts.routes.js'

describe('Posts Routes - Integração em Memória', () => {
  let app
  let mockRepository

  beforeEach(() => {
    // Cria uma nova app Express para cada teste
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
      const message = err.message || 'Erro interno'
      res.status(status).json({ error: { message } })
    })
  })

  describe('GET /api/posts', () => {
    it('deve retornar lista de posts com status 200', async () => {
      // Arrange
      const mockPosts = [
        { id: '1', title: 'Post 1', content: 'Conteúdo 1', author: 'João', createdAt: '2024-01-01' },
        { id: '2', title: 'Post 2', content: 'Conteúdo 2', author: 'Maria', createdAt: '2024-01-02' },
      ]

      mockRepository.findAll.mockResolvedValueOnce(mockPosts)

      // Act & Assert
      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockPosts)
      expect(mockRepository.findAll).toHaveBeenCalledOnce()
    })

    it('deve retornar erro 500 quando repositório falha', async () => {
      mockRepository.findAll.mockRejectedValueOnce(
        new Error('Erro ao ler arquivo de dados')
      )

      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(500)
      expect(response.body.error.message).toBe('Erro ao ler arquivo de dados')
    })

    it('deve retornar array vazio quando não há posts', async () => {
      mockRepository.findAll.mockResolvedValueOnce([])

      const response = await request(app).get('/api/posts')

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })
  })

  describe('GET /api/posts/:id', () => {
    it('deve retornar um post com status 200', async () => {
      const mockPost = {
        id: '123',
        title: 'Post Teste',
        content: 'Conteúdo teste',
        author: 'João',
        createdAt: '2024-01-01',
      }

      mockRepository.findById.mockResolvedValueOnce(mockPost)

      const response = await request(app).get('/api/posts/123')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockPost)
      expect(mockRepository.findById).toHaveBeenCalledWith('123')
    })

    it('deve retornar 404 quando post não existe', async () => {
      mockRepository.findById.mockResolvedValueOnce(null)

      const response = await request(app).get('/api/posts/inexistente')

      expect(response.status).toBe(404)
      expect(response.body.error.message).toBe('Post não encontrado')
    })

    it('deve passar ID como string para o repositório', async () => {
      mockRepository.findById.mockResolvedValueOnce(null)

      await request(app).get('/api/posts/abc-123-def')

      expect(mockRepository.findById).toHaveBeenCalledWith('abc-123-def')
    })
  })

  describe('POST /api/posts', () => {
    it('deve criar post com status 201', async () => {
      const postData = {
        title: 'Novo Post',
        content: 'Conteúdo novo com 20+ caracteres ok',
        author: 'João',
      }

      const mockCreatedPost = {
        id: 'uuid-123',
        ...postData,
        createdAt: '2024-01-15T10:30:00Z',
      }

      mockRepository.save.mockResolvedValueOnce(mockCreatedPost)

      const response = await request(app).post('/api/posts').send(postData)

      expect(response.status).toBe(201)
      expect(response.body).toEqual(mockCreatedPost)
      expect(mockRepository.save).toHaveBeenCalledOnce()
    })

    it('deve retornar erro 400 com validação falha', async () => {
      const invalidData = {
        title: 'ab', // < 5 caracteres
        content: 'Conteúdo novo com 20+ caracteres ok',
        author: 'João',
      }

      const response = await request(app).post('/api/posts').send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('title deve ter no mínimo 5 caracteres')
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('deve retornar erros múltiplos de validação', async () => {
      const invalidData = {
        title: 'ab',
        content: 'Curto',
        author: '',
      }

      const response = await request(app).post('/api/posts').send(invalidData)

      expect(response.status).toBe(400)
      const message = response.body.error.message
      expect(message).toContain('author é obrigatório')
      expect(message).toContain('title deve ter no mínimo 5 caracteres')
      expect(message).toContain('content deve ter no mínimo 20 caracteres')
    })

    it('deve retornar erro quando payload é vazio', async () => {
      const response = await request(app).post('/api/posts').send({})

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('author é obrigatório')
    })

    it('deve rejeitar Content-Type inválido', async () => {
      const postData = {
        title: 'Novo Post',
        content: 'Conteúdo novo com 20+ caracteres ok',
        author: 'João',
      }

      const response = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'text/plain')
        .send('invalid')

      expect([400, 415]).toContain(response.status)
    })
  })

  describe('PUT /api/posts/:id', () => {
    it('deve atualizar post e retornar com status 200', async () => {
      const updateData = { title: 'Título Atualizado' }

      const mockUpdated = {
        id: '123',
        title: 'Título Atualizado',
        content: 'Conteúdo original com 20+ caracteres',
        author: 'João',
      }

      mockRepository.findById.mockResolvedValueOnce({
        id: '123',
        title: 'Título Original',
        content: 'Conteúdo original com 20+ caracteres',
        author: 'João',
      })

      mockRepository.update.mockResolvedValueOnce(mockUpdated)

      const response = await request(app).put('/api/posts/123').send(updateData)

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockUpdated)
      expect(mockRepository.update).toHaveBeenCalledOnce()
    })

    it('deve retornar 404 quando post não existe', async () => {
      mockRepository.findById.mockResolvedValueOnce(null)

      const response = await request(app)
        .put('/api/posts/inexistente')
        .send({ title: 'Novo' })

      expect(response.status).toBe(404)
      expect(response.body.error.message).toBe('Post não encontrado')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('deve validar dados atualizados', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        id: '123',
        title: 'Original',
        content: 'Conteúdo original com 20+ caracteres',
        author: 'João',
      })

      const response = await request(app).put('/api/posts/123').send({ title: 'ab' })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('title deve ter no mínimo 5 caracteres')
    })
  })

  describe('DELETE /api/posts/:id', () => {
    it('deve deletar post e retornar status 204', async () => {
      mockRepository.remove.mockResolvedValueOnce(true)

      const response = await request(app).delete('/api/posts/123')

      expect(response.status).toBe(204)
      expect(response.body).toEqual({})
      expect(mockRepository.remove).toHaveBeenCalledWith('123')
    })

    it('deve retornar 404 quando post não existe', async () => {
      mockRepository.remove.mockResolvedValueOnce(false)

      const response = await request(app).delete('/api/posts/inexistente')

      expect(response.status).toBe(404)
      expect(response.body.error.message).toBe('Post não encontrado')
    })

    it('deve lidar com erro do repositório', async () => {
      mockRepository.remove.mockRejectedValueOnce(new Error('Erro ao remover'))

      const response = await request(app).delete('/api/posts/123')

      expect(response.status).toBe(500)
      expect(response.body.error.message).toBe('Erro ao remover')
    })
  })

  describe('Error Handling Integrado', () => {
    it('deve passar erro do serviço para middleware', async () => {
      mockRepository.findById.mockResolvedValueOnce(null)

      const response = await request(app).get('/api/posts/123')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })
})
