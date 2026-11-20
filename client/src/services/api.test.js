import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../services/api.js'

describe('API Service - Isolamento Completo', () => {
  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('listPosts', () => {
    it('deve retornar lista de posts quando resposta é 200', async () => {
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

    it('deve lançar erro quando resposta é 500', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Erro interno do servidor' } }),
      })

      // Act & Assert
      await expect(listPosts()).rejects.toThrow('Erro interno do servidor')
      expect(global.fetch).toHaveBeenCalledOnce()
    })

    it('deve usar mensagem padrão quando erro não tem mensagem', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      })

      await expect(listPosts()).rejects.toThrow('Erro na requisição')
    })

    it('deve usar mensagem padrão quando resposta não é JSON', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(listPosts()).rejects.toThrow('Erro na requisição')
    })
  })

  describe('getPost', () => {
    it('deve retornar um post quando encontrado', async () => {
      const mockPost = {
        id: '123',
        title: 'Post Teste',
        content: 'Conteúdo teste completo',
        author: 'João',
        createdAt: '2024-01-01',
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPost,
      })

      const result = await getPost('123')

      expect(result).toEqual(mockPost)
      expect(global.fetch).toHaveBeenCalledWith('/api/posts/123')
    })

    it('deve lançar erro quando post não existe (404)', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Post não encontrado' } }),
      })

      await expect(getPost('inexistente')).rejects.toThrow('Post não encontrado')
    })
  })

  describe('createPost', () => {
    it('deve criar um novo post e retorná-lo', async () => {
      const postData = { title: 'Novo Post', content: 'Conteúdo novo', author: 'João' }
      const mockResponse = { id: '123', ...postData, createdAt: '2024-01-01' }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      })

      const result = await createPost(postData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })
    })

    it('deve validar dados inválidos', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'title é obrigatório' },
        }),
      })

      await expect(createPost({ content: 'Sem título' })).rejects.toThrow('title é obrigatório')
    })
  })

  describe('updatePost', () => {
    it('deve atualizar um post existente', async () => {
      const updateData = { title: 'Título Atualizado' }
      const mockResponse = {
        id: '123',
        title: 'Título Atualizado',
        content: 'Conteúdo original',
        author: 'João',
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await updatePost('123', updateData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/posts/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    })
  })

  describe('deletePost', () => {
    it('deve deletar um post e retornar null para 204', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      })

      const result = await deletePost('123')

      expect(result).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith('/api/posts/123', {
        method: 'DELETE',
      })
    })

    it('deve lançar erro quando post não existe', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Post não encontrado' } }),
      })

      await expect(deletePost('inexistente')).rejects.toThrow('Post não encontrado')
    })
  })
})
