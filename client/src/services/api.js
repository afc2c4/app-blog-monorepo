async function handleResponse(response) {
  if (!response.ok) {
    let message = 'Erro na requisição'
    try {
      const data = await response.json()
      message = data.error?.message || message
    } catch {
      // ignora erro de parsing
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

export async function listPosts() {
  const response = await fetch('/api/posts')
  return handleResponse(response)
}

export async function getPost(id) {
  const response = await fetch(`/api/posts/${id}`)
  return handleResponse(response)
}

export async function createPost(data) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export async function updatePost(id, data) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export async function deletePost(id) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
  })
  return handleResponse(response)
}
