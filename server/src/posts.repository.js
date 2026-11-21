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
    async reset() {
      await writeAll([])
    },
  }
}
