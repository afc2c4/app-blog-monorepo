import { useState } from 'react'

export default function PostForm({ initialData = {}, onSubmit, submitLabel }) {
  const [title, setTitle] = useState(initialData.title || '')
  const [content, setContent] = useState(initialData.content || '')
  const [author, setAuthor] = useState(initialData.author || '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate() {
    const newErrors = {}

    if (title.trim().length < 5) {
      newErrors.title = 'Título deve ter no mínimo 5 caracteres'
    }
    if (title.trim().length > 100) {
      newErrors.title = 'Título deve ter no máximo 100 caracteres'
    }

    if (content.length < 20) {
      newErrors.content = 'Conteúdo deve ter no mínimo 20 caracteres'
    }

    if (!author.trim()) {
      newErrors.author = 'Autor é obrigatório'
    }

    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccess(false)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await onSubmit({ title: title.trim(), content, author: author.trim() })
      setSuccess(true)
      if (!initialData.id) {
        setTitle('')
        setContent('')
        setAuthor('')
      }
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="post-form" data-testid="post-form">
      {errors.form && (
        <p className="error-message" data-testid="form-error">
          {errors.form}
        </p>
      )}

      {success && (
        <p className="success-message" data-testid="form-success">
          Operação realizada com sucesso!
        </p>
      )}

      <div className="form-field">
        <label htmlFor="title">Título</label>
        <input
          id="title"
          data-testid="title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
        />
        {errors.title && (
          <span className="field-error" data-testid="title-error">
            {errors.title}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="content">Conteúdo</label>
        <textarea
          id="content"
          data-testid="content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="10"
          disabled={submitting}
        />
        {errors.content && (
          <span className="field-error" data-testid="content-error">
            {errors.content}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="author">Autor</label>
        <input
          id="author"
          data-testid="author-input"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={submitting}
        />
        {errors.author && (
          <span className="field-error" data-testid="author-error">
            {errors.author}
          </span>
        )}
      </div>

      <button
        type="submit"
        data-testid="submit-button"
        disabled={submitting}
        className="btn btn-primary"
      >
        {submitting ? 'Enviando...' : submitLabel}
      </button>
    </form>
  )
}
