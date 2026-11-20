import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import PostPage from './pages/PostPage.jsx'
import NewPostPage from './pages/NewPostPage.jsx'
import EditPostPage from './pages/EditPostPage.jsx'
import './styles.css'

export default function App() {
  return (
    <BrowserRouter>
      <header className="app-header">
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/posts/novo">
            Novo post
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/novo" element={<NewPostPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/posts/:id/editar" element={<EditPostPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
