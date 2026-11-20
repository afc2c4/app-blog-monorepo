import { useNavigate } from 'react-router-dom'
import { createPost } from '../services/api.js'
import PostForm from '../components/PostForm.jsx'

export default function NewPostPage() {
  const navigate = useNavigate()

  async function handleSubmit(data) {
    await createPost(data)
    navigate('/')
  }

  return (
    <div className="form-page">
      <h1>Novo Post</h1>
      <PostForm onSubmit={handleSubmit} submitLabel="Criar" />
    </div>
  )
}
