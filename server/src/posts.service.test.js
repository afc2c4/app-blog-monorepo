import { describe, it, expect, beforeEach, vi } from 'vitest'
import { listPosts, getPost, createPost, updatePost, deletePost, AppError } from './posts.service.js'

describe('Posts Service - Lógica de Negócio Isolada', () => {
  let mockRepository

  beforeEach(() => {
    // Mock completo do repositório - isolando a service de I/O
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }
  })

  describe('listPosts', () => {
    it('deve retornar posts ordenados por data decrescente', async () => {
      // Arrange
      const mockPosts = [
        { id: '1', title: 'Post 1', createdAt: '2024-01-01' },
        { id: '2', title: 'Post 2', createdAt: '2024-01-03' },
        { id: '3', title: 'Post 3', createdAt: '2024-01-02' },
      ]

      mockRepository.findAll.mockResolvedValueOnce(mockPosts)

      // Act
      const result = await listPosts(mockRepository)

      // Assert
      expect(result).toEqual([
        { id: '2', title: 'Post 2', createdAt: '2024-01-03' },
        { id: '3', title: 'Post 3', createdAt: '2024-01-02' },
        { id: '1', title: 'Post 1', createdAt: '2024-01-01' },
      ])
      expect(mockRepository.findAll).toHaveBeenCalledOnce()
    })

    it('deve retornar array vazio quando não há posts', async () => {
      mockRepository.findAll.mockResolvedValueOnce([])

      const result = await listPosts(mockRepository)

      expect(result).toEqual([])
      expect(mockRepository.findAll).toHaveBeenCalledOnce()
    })
  })

  describe('getPost', () => {
    it('deve retornar um post quando encontrado', async () => {
      const mockPost = { id: '123', title: 'Post Teste' }
      mockRepository.findById.mockResolvedValueOnce(mockPost)

      const result = await getPost(mockRepository, '123')

      expect(result).toEqual(mockPost)
      expect(mockRepository.findById).toHaveBeenCalledWith('123')
    })

    it('deve lançar AppError com status 404 quando post não existe', async () => {
      mockRepository.findById.mockResolvedValueOnce(null)

      try {
        await getPost(mockRepository, 'inexistente')
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.status).toBe(404)
        expect(error.code).toBe('NOT_FOUND')
        expect(error.message).toBe('Post não encontrado')
      }
    })
  })

  describe('createPost', () => {
    it('deve criar post válido com todos os campos obrigatórios', async () => {
      // Arrange
      const postData = {
        title: 'Novo Post Teste',
        content: 'Conteúdo completo com mais de 20 caracteres',
        author: 'João Silva',
      }

      mockRepository.save.mockImplementationOnce((post) => Promise.resolve(post))

      // Act
      const result = await createPost(mockRepository, postData)

      // Assert
      expect(result).toMatchObject({
        title: 'Novo Post Teste',
        content: postData.content,
        author: 'João Silva',
      })
      expect(result.id).toBeDefined() // UUID gerado
      expect(result.createdAt).toBeDefined()
      expect(mockRepository.save).toHaveBeenCalledOnce()
    })

    it('deve validar comprimento mínimo do título (5 caracteres)', async () => {
      const invalidData = {
        title: 'ab', // < 5
        content: 'Conteúdo válido com 20+ caracteres',
        author: 'João',
      }

      try {
        await createPost(mockRepository, invalidData)
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.status).toBe(400)
        expect(error.message).toContain('title deve ter no mínimo 5 caracteres')
      }

      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('deve validar comprimento máximo do título (100 caracteres)', async () => {
      const invalidData = {
        title: 'a'.repeat(101),
        content: 'Conteúdo válido com 20+ caracteres',
        author: 'João',
      }

      try {
        await createPost(mockRepository, invalidData)
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.message).toContain('title deve ter no máximo 100 caracteres')
      }
    })

    it('deve validar conteúdo mínimo (20 caracteres)', async () => {
      const invalidData = {
        title: 'Título Válido',
        content: 'Curto', // < 20
        author: 'João',
      }

      try {
        await createPost(mockRepository, invalidData)
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.message).toContain('content deve ter no mínimo 20 caracteres')
      }
    })

    it('deve validar author obrigatório', async () => {
      const invalidData = {
        title: 'Título Válido',
        content: 'Conteúdo válido com mais de 20 caracteres',
        author: '', // vazio
      }

      try {
        await createPost(mockRepository, invalidData)
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.message).toContain('author é obrigatório')
      }
    })

    it('deve rejeitar dados undefined/null', async () => {
      try {
        await createPost(mockRepository, null)
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.status).toBe(400)
      }
    })

    it('deve trim() whitespace do título', async () => {
      const postData = {
        title: '  Título com Espaços  ',
        content: 'Conteúdo válido com 20+ caracteres',
        author: 'João',
      }

      mockRepository.save.mockImplementationOnce((post) => Promise.resolve(post))

      const result = await createPost(mockRepository, postData)

      expect(result.title).toBe('Título com Espaços')
    })

    it('deve múltiplos erros de validação simultâneos', async () => {
      const invalidData = {
        title: 'ab', // muito curto
        content: 'Curto', // muito curto
        author: '', // vazio
      }

      try {
        await createPost(mockRepository, invalidData)
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error.message).toContain('author é obrigatório')
        expect(error.message).toContain('title deve ter no mínimo 5 caracteres')
        expect(error.message).toContain('content deve ter no mínimo 20 caracteres')
        expect(error.message).toContain(';') // separador de erros múltiplos
      }
    })
  })

  describe('updatePost', () => {
    it('deve atualizar post existente parcialmente', async () => {
      const existing = {
        id: '123',
        title: 'Título Original',
        content: 'Conteúdo original com 20+ caracteres',
        author: 'João',
      }

      const updateData = {
        title: 'Novo Título',
      }

      const expected = {
        id: '123',
        title: 'Novo Título',
        content: 'Conteúdo original com 20+ caracteres', // mantém
        author: 'João', // mantém
      }

      mockRepository.findById.mockResolvedValueOnce(existing)
      mockRepository.update.mockResolvedValueOnce(expected)

      const result = await updatePost(mockRepository, '123', updateData)

      expect(result).toEqual(expected)
      expect(mockRepository.update).toHaveBeenCalledWith('123', {
        title: 'Novo Título',
        content: 'Conteúdo original com 20+ caracteres',
        author: 'João',
      })
    })

    it('deve validar dados atualizados sem requireAll', async () => {
      const existing = {
        id: '123',
        title: 'Título Original',
        content: 'Conteúdo com mais de 20 caracteres ok',
        author: 'João',
      }

      mockRepository.findById.mockResolvedValueOnce(existing)

      // author pode estar undefined em update
      const updateData = {
        title: 'Novo Título',
        content: 'Novo conteúdo com mais de 20 caracteres ok',
      }

      mockRepository.update.mockResolvedValueOnce({
        ...existing,
        ...updateData,
      })

      const result = await updatePost(mockRepository, '123', updateData)

      expect(result.title).toBe('Novo Título')
      expect(result.content).toBe('Novo conteúdo com mais de 20 caracteres ok')
    })

    it('deve lançar 404 se post não existe', async () => {
      mockRepository.findById.mockResolvedValueOnce(null)

      try {
        await updatePost(mockRepository, 'inexistente', { title: 'Novo' })
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.status).toBe(404)
      }
    })

    it('deve validar título mínimo em update', async () => {
      const existing = {
        id: '123',
        title: 'Título Original',
        content: 'Conteúdo ok',
        author: 'João',
      }

      mockRepository.findById.mockResolvedValueOnce(existing)

      try {
        await updatePost(mockRepository, '123', { title: 'ab' })
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.message).toContain('title deve ter no mínimo 5 caracteres')
      }
    })
  })

  describe('deletePost', () => {
    it('deve deletar post existente', async () => {
      mockRepository.remove.mockResolvedValueOnce(true)

      const result = await deletePost(mockRepository, '123')

      expect(result).toBeUndefined()
      expect(mockRepository.remove).toHaveBeenCalledWith('123')
    })

    it('deve lançar 404 se post não existe', async () => {
      mockRepository.remove.mockResolvedValueOnce(false)

      try {
        await deletePost(mockRepository, 'inexistente')
        expect.fail('Deveria lançar erro')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.status).toBe(404)
        expect(error.code).toBe('NOT_FOUND')
      }
    })
  })
})
