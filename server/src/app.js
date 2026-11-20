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
