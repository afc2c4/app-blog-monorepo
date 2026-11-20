import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PostCard from '../components/PostCard.jsx'

// Wrapper para fornecer BrowserRouter (necessário para Link)
function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('PostCard - Componente Isolado', () => {
  it('deve renderizar o título do post como link', () => {
    // Arrange
    const mockPost = {
      id: '123',
      title: 'Meu Primeiro Post',
      content: 'Este é um conteúdo bem comprido que deve ser resumido...',
      author: 'João Silva',
      createdAt: '2024-01-15',
    }

    // Act
    renderWithRouter(<PostCard post={mockPost} />)

    // Assert
    const titleLink = screen.getByRole('link', { name: /Meu Primeiro Post/i })
    expect(titleLink).toBeInTheDocument()
    expect(titleLink).toHaveAttribute('href', '/posts/123')
  })

  it('deve renderizar resumo truncado quando conteúdo > 150 caracteres', () => {
    const longContent = 'A'.repeat(200)
    const mockPost = {
      id: '1',
      title: 'Post Longo',
      content: longContent,
      author: 'Maria',
      createdAt: '2024-01-15',
    }

    renderWithRouter(<PostCard post={mockPost} />)

    const summary = screen.getByText(/^A+\.\.\.$/)
    expect(summary.textContent).toBe('A'.repeat(150) + '...')
    expect(summary).toHaveClass('post-summary')
  })

  it('deve renderizar conteúdo completo quando < 150 caracteres', () => {
    const shortContent = 'Post curto'
    const mockPost = {
      id: '1',
      title: 'Post Curto',
      content: shortContent,
      author: 'João',
      createdAt: '2024-01-15',
    }

    renderWithRouter(<PostCard post={mockPost} />)

    const summary = screen.getByText('Post curto')
    expect(summary.textContent).toBe('Post curto')
  })

  it('deve formatar data em formato brasileiro (pt-BR)', () => {
    const mockPost = {
      id: '1',
      title: 'Teste Data',
      content: 'Conteúdo teste',
      author: 'João',
      createdAt: '2024-01-15T10:30:00Z',
    }

    renderWithRouter(<PostCard post={mockPost} />)

    // A data deve estar formatada em português
    const metaText = screen.getByText(/Por João em/)
    expect(metaText).toBeInTheDocument()
    // Verifica se a data está em formato pt-BR
    expect(metaText.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
  })

  it('deve renderizar com data testid correto', () => {
    const mockPost = {
      id: '1',
      title: 'Teste',
      content: 'Conteúdo teste',
      author: 'João',
      createdAt: '2024-01-15',
    }

    renderWithRouter(<PostCard post={mockPost} />)

    const article = screen.getByTestId('post-card')
    expect(article).toBeInTheDocument()
    expect(article).toHaveClass('post-card')
  })

  it('deve renderizar author e data na metadata', () => {
    const mockPost = {
      id: '1',
      title: 'Teste',
      content: 'Conteúdo completo teste',
      author: 'Carlos Santos',
      createdAt: '2024-02-20',
    }

    renderWithRouter(<PostCard post={mockPost} />)

    const metaText = screen.getByText(/Por Carlos Santos em/)
    expect(metaText).toBeInTheDocument()
    expect(metaText).toHaveClass('post-meta')
  })

  it('deve renderizar estrutura semântica correta', () => {
    const mockPost = {
      id: '1',
      title: 'Teste Semântica',
      content: 'Conteúdo teste completo',
      author: 'João',
      createdAt: '2024-01-15',
    }

    renderWithRouter(<PostCard post={mockPost} />)

    const article = screen.getByTestId('post-card')
    expect(article.tagName).toBe('ARTICLE')

    const heading = article.querySelector('h2')
    expect(heading).toBeInTheDocument()

    const paragraphs = article.querySelectorAll('p')
    expect(paragraphs).toHaveLength(2) // summary + meta
  })
})
