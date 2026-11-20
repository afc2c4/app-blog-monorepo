import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { unlink, mkdir, rmdir } from 'node:fs/promises'
import { createPostsRepository, DataError } from './posts.repository.js'

describe('Posts Repository - Integração Real com Filesystem', () => {
  let testFilePath
  let repository

  beforeEach(async () => {
    // Cria arquivo temporário único para cada teste
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

  describe('findAll', () => {
    it('deve retornar array vazio para arquivo novo', async () => {
      const posts = await repository.findAll()

      expect(posts).toEqual([])
      expect(Array.isArray(posts)).toBe(true)
    })

    it('deve ler posts existentes', async () => {
      const testPost = { id: '1', title: 'Test', content: 'Content', author: 'Author' }
      await repository.save(testPost)

      const posts = await repository.findAll()

      expect(posts).toContainEqual(testPost)
      expect(posts.length).toBe(1)
    })

    it('deve rejeitar JSON corrompido com erro específico', async () => {
      // Escreve JSON inválido no arquivo
      const { writeFile } = await import('node:fs/promises')
      await mkdir(require('node:path').dirname(testFilePath), { recursive: true })
      await writeFile(testFilePath, '{invalid json}', 'utf-8')

      try {
        await repository.findAll()
        expect.fail('Deveria lançar DataError')
      } catch (error) {
        expect(error).toBeInstanceOf(DataError)
        expect(error.code).toBe('DATA_CORRUPTED')
        expect(error.status).toBe(500)
        expect(error.message).toContain('JSON inválido')
      }
    })

    it('deve rejeitar dados que não são array', async () => {
      const { writeFile } = await import('node:fs/promises')
      await mkdir(require('node:path').dirname(testFilePath), { recursive: true })
      await writeFile(testFilePath, '{"not": "array"}', 'utf-8')

      try {
        await repository.findAll()
        expect.fail('Deveria lançar DataError')
      } catch (error) {
        expect(error).toBeInstanceOf(DataError)
        expect(error.code).toBe('DATA_CORRUPTED')
        expect(error.message).toContain('esperado um array')
      }
    })
  })

  describe('findById', () => {
    it('deve encontrar post por ID', async () => {
      const post1 = { id: '1', title: 'Post 1', content: 'Content 1', author: 'Author 1' }
      const post2 = { id: '2', title: 'Post 2', content: 'Content 2', author: 'Author 2' }

      await repository.save(post1)
      await repository.save(post2)

      const found = await repository.findById('2')

      expect(found).toEqual(post2)
    })

    it('deve retornar null quando post não existe', async () => {
      const result = await repository.findById('inexistente')

      expect(result).toBeNull()
    })

    it('deve diferenciar entre IDs similares', async () => {
      const post1 = { id: '1', title: 'Post 1', content: 'Content 1', author: 'Author' }
      const post2 = { id: '10', title: 'Post 10', content: 'Content 10', author: 'Author' }

      await repository.save(post1)
      await repository.save(post2)

      const found = await repository.findById('1')

      expect(found.id).toBe('1')
      expect(found.title).toBe('Post 1')
    })
  })

  describe('save', () => {
    it('deve salvar novo post', async () => {
      const post = { id: '123', title: 'Test Post', content: 'Test Content', author: 'Test' }

      const result = await repository.save(post)

      expect(result).toEqual(post)

      // Verifica persistência lendo o arquivo
      const persisted = await repository.findById('123')
      expect(persisted).toEqual(post)
    })

    it('deve salvar múltiplos posts', async () => {
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

    it('deve manter propriedades do post', async () => {
      const post = {
        id: 'uuid-abc',
        title: 'Post Title',
        content: 'Post Content',
        author: 'Post Author',
        createdAt: '2024-01-15T10:30:00Z',
      }

      await repository.save(post)
      const found = await repository.findById('uuid-abc')

      expect(found).toEqual(post)
    })
  })

  describe('update', () => {
    it('deve atualizar post existente', async () => {
      const original = { id: '1', title: 'Original', content: 'Original', author: 'Author' }
      await repository.save(original)

      const updated = await repository.update('1', {
        title: 'Updated Title',
      })

      expect(updated).toEqual({
        ...original,
        title: 'Updated Title',
      })

      // Verifica persistência
      const persisted = await repository.findById('1')
      expect(persisted.title).toBe('Updated Title')
      expect(persisted.content).toBe('Original') // mantém
    })

    it('deve fazer merge de propriedades', async () => {
      const post = {
        id: '1',
        title: 'Title',
        content: 'Content',
        author: 'Author',
        extra: 'property',
      }
      await repository.save(post)

      const updated = await repository.update('1', {
        title: 'New Title',
      })

      expect(updated.title).toBe('New Title')
      expect(updated.content).toBe('Content')
      expect(updated.author).toBe('Author')
      expect(updated.extra).toBe('property')
    })

    it('deve retornar null quando post não existe', async () => {
      const result = await repository.update('inexistente', { title: 'New' })

      expect(result).toBeNull()
    })

    it('deve não afetar outros posts', async () => {
      const post1 = { id: '1', title: 'Post 1', content: 'Content 1', author: 'Author 1' }
      const post2 = { id: '2', title: 'Post 2', content: 'Content 2', author: 'Author 2' }

      await repository.save(post1)
      await repository.save(post2)

      await repository.update('1', { title: 'Updated 1' })

      const unchanged = await repository.findById('2')
      expect(unchanged.title).toBe('Post 2')
    })
  })

  describe('remove', () => {
    it('deve remover post existente', async () => {
      const post = { id: '1', title: 'Post', content: 'Content', author: 'Author' }
      await repository.save(post)

      const result = await repository.remove('1')

      expect(result).toBe(true)

      // Verifica que foi removido
      const found = await repository.findById('1')
      expect(found).toBeNull()
    })

    it('deve retornar false quando post não existe', async () => {
      const result = await repository.remove('inexistente')

      expect(result).toBe(false)
    })

    it('deve não afetar outros posts', async () => {
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

  describe('Concorrência', () => {
    it('deve lidar com múltiplas operações sequenciais', async () => {
      const posts = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        title: `Post ${i}`,
        content: `Content ${i}`,
        author: `Author ${i}`,
      }))

      // Salva todos
      for (const post of posts) {
        await repository.save(post)
      }

      // Atualiza todos
      for (const post of posts) {
        await repository.update(post.id, { title: `Updated ${post.id}` })
      }

      // Remove alguns
      await repository.remove('0')
      await repository.remove('5')
      await repository.remove('9')

      const remaining = await repository.findAll()
      expect(remaining).toHaveLength(7)
    })
  })

  describe('Edge Cases', () => {
    it('deve lidar com post com ID vazio', async () => {
      const post = { id: '', title: 'Title', content: 'Content', author: 'Author' }
      await repository.save(post)

      const found = await repository.findById('')
      expect(found).toEqual(post)
    })

    it('deve lidar com conteúdo com caracteres especiais', async () => {
      const post = {
        id: '1',
        title: 'Título com Acentuação',
        content: 'Conteúdo com "aspas", \'apóstrofos\' e \\barras\\',
        author: 'José da Silva',
      }

      await repository.save(post)
      const found = await repository.findById('1')

      expect(found).toEqual(post)
    })

    it('deve lidar com payload grande', async () => {
      const largeContent = 'A'.repeat(100000)
      const post = {
        id: '1',
        title: 'Large Post',
        content: largeContent,
        author: 'Author',
      }

      await repository.save(post)
      const found = await repository.findById('1')

      expect(found.content).toBe(largeContent)
    })
  })
})
