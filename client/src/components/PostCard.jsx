import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  const summary =
    post.content.length > 150
      ? post.content.slice(0, 150) + '...'
      : post.content

  const formattedDate = new Date(post.createdAt).toLocaleDateString('pt-BR')

  return (
    <article className="post-card" data-testid="post-card">
      <h2>
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </h2>
      <p className="post-summary">{summary}</p>
      <p className="post-meta">
        Por {post.author} em {formattedDate}
      </p>
    </article>
  )
}
