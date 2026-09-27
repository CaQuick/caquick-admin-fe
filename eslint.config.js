import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// 의존 방향(guide §2): shared는 features를 모른다. feature 간 import는 대상 index.ts로만. routes는 features의 pages·shared만 본다.
export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules', 'src/graphql/generated', 'src/routeTree.gen.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh, boundaries },
    settings: {
      // 별칭(@/)을 tsconfig paths로 푼다 — 없으면 boundaries가 외부 모듈로 보고 검사하지 않는다
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' } },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'routes', pattern: 'src/routes/**' },
        { type: 'feature', pattern: 'src/features/*', capture: ['name'] },
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'graphql', pattern: 'src/graphql/**' },
        { type: 'test', pattern: 'src/test/**' },
      ],
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      // React Compiler를 쓰지 않는다 — 컴파일러 호환성 경고는 의미가 없다
      'react-hooks/incompatible-library': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: {
                to: { element: { types: { anyOf: ['app', 'shared', 'routes', 'graphql'] } } },
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { type: 'feature', fileInternalPath: 'index.ts' } } },
            },
            {
              from: { element: { type: 'routes' } },
              allow: { to: { element: { types: { anyOf: ['routes', 'shared', 'app'] } } } },
            },
            {
              from: { element: { type: 'routes' } },
              allow: { to: { element: { type: 'feature', fileInternalPath: 'index.ts' } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { types: { anyOf: ['shared', 'graphql'] } } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    type: 'feature',
                    captured: { name: '{{ from.element.captured.name }}' },
                  },
                },
              },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { type: 'feature', fileInternalPath: 'index.ts' } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { types: { anyOf: ['shared', 'graphql'] } } } },
            },
            {
              from: { element: { type: 'graphql' } },
              allow: { to: { element: { type: 'graphql' } } },
            },
            {
              from: { element: { type: 'test' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['test', 'shared', 'feature', 'graphql', 'app', 'routes'] },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    // 라우트 파일은 Route 객체를, shadcn 컴포넌트는 variants를 함께 export한다
    files: ['src/routes/**', 'src/shared/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // TanStack Router는 redirect()/notFound() 객체를 throw하는 게 규약이다
    files: ['src/routes/**'],
    rules: { '@typescript-eslint/only-throw-error': 'off' },
  },
  {
    // 스펙은 어느 계층이든 test 헬퍼·feature·shared를 가져온다 — 경계 규칙은 소스에만
    files: ['src/**/*.spec.{ts,tsx}', 'src/test/**'],
    rules: {
      'boundaries/dependencies': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['*.{js,mjs,ts}', 'scripts/**', '.github/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
