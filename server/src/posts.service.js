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
