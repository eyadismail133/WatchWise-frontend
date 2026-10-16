import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Compiler-generated declaration snapshot exception:
  // src/contracts/app-router.d.ts is automatically bundled from the backend AppRouter
  // declaration emit. In this generated declaration file only:
  // - @typescript-eslint/no-explicit-any is disabled to faithfully preserve Zod 3 inferred
  //   error metadata (zodError: typeToFlattenedError<any, string> | null).
  // - @typescript-eslint/no-empty-object-type is configured to allowInterfaces: 'with-single-extends'
  //   for generated Prisma JsonArray (interface JsonArray extends Array<JsonValue> {}).
  // All handwritten source code rules remain strictly enforced.
  {
    files: ['src/contracts/app-router.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'with-single-extends',
        },
      ],
    },
  },
])
