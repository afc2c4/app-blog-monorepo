import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPost, deletePost } from '../services/api.js'

export default function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true)
        const data = await getPost(id)
        setPost(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja excluir este post?')) {
      return
    }
    try {
      await deletePost(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <p data-testid="loading">Carregando...</p>
  }

  if (error) {
    return <p data-testid="error" className="error-message">Erro: {error}</p>
  }

  if (!post) {
    return <p data-testid="not-found">Post não encontrado</p>
  }

  return (
    <article className="post-page" data-testid="post-detail">
      <h1>{post.title}</h1>
      <p className="post-meta">
        Por {post.author} em {new Date(post.createdAt).toLocaleDateString('pt-BR')}
      </p>
      <div className="post-content">{post.content}</div>
      <div className="post-actions">
        <Link to={`/posts/${id}/editar`} className="btn btn-edit">
          Editar
        </Link>
        <button onClick={handleDelete} className="btn btn-delete">
          Excluir
        </button>
      </div>
    </article>
  )
}
