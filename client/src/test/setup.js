import { expect, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// Limpa o DOM após cada teste
afterEach(() => {
  cleanup()
})

// Mock global de fetch para testes
global.fetch = vi.fn()
