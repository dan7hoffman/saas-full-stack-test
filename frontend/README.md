# SaaS Frontend Starter

Modern Angular 19 frontend generated with professional structure and best practices.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser
http://localhost:4200
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/               # Singleton services, guards, interceptors
│   │   │   ├── guards/         # Route guards (auth, role-based)
│   │   │   ├── interceptors/   # HTTP interceptors (auth, error handling)
│   │   │   ├── services/       # Core services (auth, api)
│   │   │   └── models/         # TypeScript interfaces and types
│   │   ├── shared/             # Reusable components, directives, pipes
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/           # Authentication feature (login, register)
│   │   │   └── dashboard/      # Dashboard feature
│   │   ├── layouts/            # Layout components
│   │   │   ├── auth-layout/    # Layout for auth pages
│   │   │   └── main-layout/    # Layout for authenticated pages
│   │   └── app.routes.ts       # App routing configuration
│   ├── environments/           # Environment-specific config
│   └── styles/                 # Global styles (Tailwind CSS)
└── .github/
    └── workflows/
        └── ci.yml              # CI/CD pipeline
```

## 🛠️ Available Scripts

```bash
npm start              # Start dev server (http://localhost:4200)
npm run build          # Build for production
npm test               # Run unit tests
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## 🎨 Tech Stack

- **Framework**: Angular 19 (standalone components)
- **Styling**: Tailwind CSS + SCSS
- **Language**: TypeScript (strict mode)
- **Testing**: Jasmine + Karma (unit), Playwright (E2E)
- **Linting**: ESLint
- **CI/CD**: GitHub Actions

## 📦 Key Dependencies

- `@angular/core` - Angular framework
- `@angular/common` - HTTP client and common utilities
- `@angular/router` - Routing and navigation
- `@angular/forms` - Reactive forms
- `tailwindcss` - Utility-first CSS framework
- `date-fns` - Date utility library

## 🔐 Authentication

This frontend is designed to work with the backend authentication system:

- Session-based auth (cookies)
- Login, register, email verification
- Password reset flows
- Protected routes with auth guards

Backend API expected at: `http://localhost:3000/api`

## 🚦 Next Steps

### Phase 2: Authentication UI (Coming Soon)
- Login component
- Register component
- Email verification page
- Password reset flows
- Auth service implementation
- Auth guard implementation

### Phase 3: Dashboard + Layout
- Main layout with navbar
- Dashboard home page
- User profile page
- Account settings

### Phase 4: API Integration
- Type-safe API service
- HTTP interceptors
- Error handling
- Loading states

## 📚 Documentation

- [Angular Documentation](https://angular.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This is a generated starter project. Customize it for your SaaS needs!

---

Generated with ❤️ by Frontend Generator (Phase 1)
