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

  // Reset endpoint for testing
  router.post('/api/posts/reset', async (_req, res, next) => {
    try {
      await repo.reset()
      res.json({ message: 'Posts resetados com sucesso' })
    } catch (err) {
      next(err)
    }
  })

  return router
}
