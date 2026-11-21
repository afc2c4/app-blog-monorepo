import { defineConfig, devices } from '@playwright/test'

/**
 * Configuração de Testes E2E com Playwright
 * 
 * Estratégia:
 * 1. Inicia servidor Express em background
 * 2. Executa testes contra navegador real
 * 3. Sem mocks (fluxo completo)
 * 4. Browser pode ser Chromium, Firefox, Safari
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Executa sequencial para evitar conflito de dados
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Inicia servidor antes dos testes
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Descomente para testar em múltiplos browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
})
