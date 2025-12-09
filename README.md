# Service Manager - Authentication System

A production-ready React + TypeScript application with complete authentication system including auto-registration, JWT token management, and device tracking.

## Features

- **Auto-registration**: Users are automatically registered on first login
- **JWT Token Management**: Secure access token storage and automatic refresh
- **Device Tracking**: Collects device fingerprint for security
- **Protected Routes**: Route guards for authenticated pages
- **Persistent Auth**: Authentication state persists across page refreshes
- **Token Refresh**: Automatic token refresh on 401/403 errors

## Setup

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Authentication Flow

1. User submits User ID → Login attempt
2. If user doesn't exist (404/400) → Auto-register
3. Receive access token → Store in state + localStorage
4. Fetch user details → Update user state
5. Initialize auth state on app load from persisted storage

## API Endpoints

The application expects the following API endpoints:

- `POST /v2/users/login` - Login with userId query param
- `POST /v2/users/register` - Auto-register new users
- `GET /v2/users/details` - Fetch user details (requires auth)
- `POST /v2/users/refresh_token` - Refresh access token
- `POST /v2/users/logout` - Logout user

## Project Structure

```
src/
├── api/
│   └── client.ts          # Axios client with interceptors
├── components/
│   └── ProtectedRoute.tsx # Route guard component
├── pages/
│   ├── LoginPage.tsx      # Login form
│   └── Dashboard.tsx      # Protected dashboard
├── stores/
│   └── authStore.ts       # Zustand auth store with persistence
├── types/
│   └── auth.ts            # TypeScript types
├── utils/
│   └── device.ts          # Device info collection
└── App.tsx                # Main app with routing
```

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
