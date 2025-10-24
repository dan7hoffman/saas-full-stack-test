# frontend

Generated with 4-FrontendGenerator

## Development

```bash
npm install
npm run dev
```

Frontend: http://localhost:4200

## Features

- Angular 19 standalone components
- Tailwind CSS styling
- 3-layer UI design system
- Session-based authentication with CSRF
- TypeScript strict mode

## API Integration

- Backend API: http://localhost:3000
- CSRF endpoint: http://localhost:3000/api/auth/csrf-token
- Login endpoint: http://localhost:3000/api/auth/login

## Project Structure

```
src/app/
├── core/           # Services, guards, models
├── features/       # Feature modules (auth, etc.)
├── ui/             # 3-layer design system
│   ├── tokens/     # Design tokens
│   ├── primitives/ # Headless components
│   └── components/ # Styled components
└── shared/         # Shared utilities
```

## Testing

```bash
npm test           # Unit tests
npm run lint       # Linting
npm run build:prod # Production build
```

## CI/CD

GitHub Actions workflows are included:

- **CI Pipeline** (`.github/workflows/ci.yml`)
  - Runs on push/PR to main/develop branches
  - Linting, tests, production build
  - npm security audit

- **Security Scan** (`.github/workflows/security.yml`)
  - CodeQL analysis for TypeScript/JavaScript
  - Weekly automated scans (Mondays 9am UTC)
  - Dependency review on PRs

- **Dependabot** (`.github/dependabot.yml`)
  - Weekly dependency updates
  - Automated GitHub Actions updates

To enable GitHub Advanced Security features (CodeQL, Dependabot alerts):
1. Push this repo to GitHub
2. Go to Settings → Security → Enable "Dependency graph" and "Dependabot alerts"
3. For CodeQL: Repository must be public OR have GitHub Advanced Security enabled
```
