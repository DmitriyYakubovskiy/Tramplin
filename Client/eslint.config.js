import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'src/components/Header.tsx',
    'src/pages/HomePage.tsx',
    'src/pages/LoginPage.tsx',
    'src/pages/RegisterPage.tsx',
    'src/pages/DashboardPage.tsx',
    'src/pages/CreateOpportunityPage.tsx',
    'src/pages/OpportunityDetailPage.tsx',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/components/AuthContext.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
