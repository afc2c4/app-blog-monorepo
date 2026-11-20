import { useState, useEffect } from 'react'
import { listPosts } from '../services/api.js'
import PostCard from '../components/PostCard.jsx'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        const data = await listPosts()
        setPosts(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const filteredPosts = posts.filter((post) => {
    const term = searchTerm.toLowerCase()
    return (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term)
    )
  })

  return (
    <div className="home-page">
      <h1>Blog</h1>

      <div className="search-box">
        <label htmlFor="search">Buscar:</label>
        <input
          id="search"
          data-testid="search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite uma palavra-chave..."
        />
      </div>

      {loading && <p data-testid="loading">Carregando...</p>}

      {error && (
        <p data-testid="error" className="error-message">
          Erro: {error}
        </p>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <p data-testid="empty-state">Nenhum post encontrado</p>
      )}

      {!loading && !error && filteredPosts.length > 0 && (
        <div className="posts-list" data-testid="posts-list">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
