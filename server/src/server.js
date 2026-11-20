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
