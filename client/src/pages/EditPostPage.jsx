import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPost, updatePost } from '../services/api.js'
import PostForm from '../components/PostForm.jsx'

export default function EditPostPage() {
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

  async function handleSubmit(data) {
    await updatePost(id, data)
    navigate(`/posts/${id}`)
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
    <div className="form-page">
      <h1>Editar Post</h1>
      <PostForm
        initialData={post}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />
    </div>
  )
}
