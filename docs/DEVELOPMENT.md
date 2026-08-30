# Development Guide

This guide covers local development setup, common workflows, and debugging tips.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- pnpm package manager (or npm/yarn)
- PostgreSQL locally OR Neon database access
- Code editor (VS Code recommended)

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/htomi0928/v0-christmas-tree-farm-app.git
cd v0-christmas-tree-farm-app

# Install dependencies
pnpm install

# Create .env.local with database connection
echo 'DATABASE_URL=postgresql://...' > .env.local
echo 'AUTH_SECRET=dev-secret-key-not-for-production' >> .env.local
```

### 2. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
v0-christmas-tree-farm-app/
├── app/
│   ├── (auth)/
│   │   └── admin-login/          # Login page
│   ├── admin/
│   │   ├── reservations/         # Reservation management
│   │   ├── expenses/             # Expense tracking
│   │   ├── settings/             # Settings page
│   │   └── layout.tsx            # Admin layout wrapper
│   ├── booking/                  # Public booking page
│   ├── api/
│   │   ├── admin/
│   │   │   ├── login/           # Login endpoint
│   │   │   └── reservations/    # Reservation CRUD
│   │   └── reservations/        # Public reservation API
│   └── layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Shadcn/UI components
│   ├── admin-header.tsx          # Admin header
│   ├── navigation.tsx            # Navigation component
│   ├── reservation-detail-client.tsx
│   ├── reservation-filters.tsx
│   ├── reservation-table.tsx
│   └── ...                       # Other components
├── lib/
│   ├── auth.ts                   # Auth utilities
│   ├── db.ts                     # Database connection
│   ├── reservations.ts           # Reservation logic
│   ├── expenses.ts               # Expense logic
│   ├── types.ts                  # TypeScript types
│   ├── api.ts                    # API helpers
│   └── site.ts                   # Site configuration
├── app/globals.css              # Tailwind v4 config & design tokens (imported by app/layout.tsx)
├── styles/globals.css           # Legacy stylesheet (not imported by the app)
└── docs/                         # Documentation
```

## Database Setup

### Using Neon (Cloud)

Recommended for development:

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Set in `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:pass@...
   ```

### Using Local PostgreSQL

Alternatively, use a local database:

```bash
# On macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb christmas_tree_farm

# Get connection string
# postgresql://localhost/christmas_tree_farm
```

### Initialize Database

1. Create tables via the Neon SQL editor or `psql`. The schema lives in [docs/DEPLOYMENT.md](DEPLOYMENT.md#required-tables) — `admin_users`, `reservations`, `expenses`, `settings`.

2. Verify the connection:
   ```bash
   pnpm exec tsx scripts/test-db-connection.ts
   ```

3. Seed an admin user. Don't insert raw SQL — the app stores PBKDF2 hashes (`salt:hash`), not bcrypt. Use the seed endpoint:
   ```bash
   # Set SEED_ADMIN_KEY in .env.local first
   curl -X POST http://localhost:3000/api/seed-admin \
     -H "x-seed-key: $SEED_ADMIN_KEY" \
     -H "content-type: application/json" \
     -d '{"username":"admin","password":"at-least-12-chars"}'
   ```

## Development Workflows

### Adding a New Page

1. Create file in appropriate directory:
   ```
   app/admin/new-feature/page.tsx
   ```

2. Add to navigation in `components/navigation.tsx`

3. Test in development server

### Adding API Endpoint

1. Create route file:
   ```
   app/api/admin/new-endpoint/route.ts
   ```

2. Implement handler. Admin routes follow this pipeline (see existing routes in `app/api/admin/**`):
   ```typescript
   import "server-only"
   import { z } from "zod"
   import {
     enforceSameOrigin,
     parseJsonBody,
     requireAdminSessionResponse,
     logApiError,
   } from "@/lib/api"

   const schema = z.object({ /* ... */ })

   export async function POST(request: Request) {
     try {
       const originError = enforceSameOrigin(request)
       if (originError) return originError

       const authError = await requireAdminSessionResponse()
       if (authError) return authError

       const parsed = await parseJsonBody(request, schema)
       if (!parsed.success) return parsed.response

       // ...domain call against lib/* ...
       return Response.json({ success: true, data: {} })
     } catch (error) {
       logApiError("my route failed", error)
       return Response.json({ success: false, error: "Szerver hiba" }, { status: 500 })
     }
   }
   ```
   `lib/api.ts` exports `jsonError`, `jsonErrors`, `parseJsonBody`, `parseNumericId`, `requireAdminUser`, `requireAdminSessionResponse`, `enforceSameOrigin`, and `logApiError`. Success responses use `Response.json(...)` directly — there is no `jsonResponse` helper. User-facing error strings are in Hungarian.

3. Test with curl or API client

### Adding Database Query

1. Create helper function in appropriate lib file:
   ```typescript
   // lib/reservations.ts
   export async function getReservationById(id: number) {
     const result = await sql.query(
       'SELECT * FROM reservations WHERE id = $1',
       [id]
     )
     return result[0]
   }
   ```

2. Use in components or API routes

### Adding Component

1. Create in `/components`:
   ```typescript
   export function MyComponent({ prop }: MyComponentProps) {
     return <div>...</div>
   }
   
   interface MyComponentProps {
     prop: string
   }
   ```

2. Import and use in pages/components

3. Test locally

## Testing

There is no automated test runner in this project — `pnpm test` is not defined. All testing is manual.

### Manual Testing Checklist

Before committing code:

- [ ] Lint passes: `pnpm lint`
- [ ] Type check passes: `pnpm exec tsc --noEmit` (note: `pnpm build` ignores TS errors per `next.config.mjs`)
- [ ] App renders without errors
- [ ] Forms validate correctly (client + server)
- [ ] API endpoints return correct data
- [ ] Database queries work
- [ ] Mobile responsive (use DevTools)
- [ ] No console errors or warnings

### Testing Authentication

```bash
# Start dev server
pnpm dev

# Visit http://localhost:3000/admin-login
# Try invalid credentials - should show error
# Try valid credentials - should login
# Check that session cookie is set
```

### Testing Validation

Form validation happens on two levels:

1. **Client-side**: Real-time feedback with error messages
2. **Server-side**: Ensures data integrity

Test both:
```bash
# Try submitting form with invalid data in DevTools
# (Network tab should show 400 error from server)
```

### Testing Database

```typescript
// In your API route or helper
console.log("[v0] Query result:", result)

// Then check dev server console for output
```

## Debugging

### Enable Debug Logging

The app includes debug logs prefixed with `[v0]`:

```typescript
console.log("[v0] Current state:", formData)
```

View in:
- Terminal where `pnpm dev` is running
- Browser DevTools Console (for client-side logs)

### Common Issues

#### App won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Try again
pnpm dev
```

#### Database connection fails
```bash
# Check connection string
echo $DATABASE_URL

# Verify database is running
psql -c "SELECT 1"

# Check .env.local is loaded
# Restart dev server
```

#### Build errors
```bash
# Check TypeScript
pnpm run build

# Fix errors shown in output
# Common issues:
# - Missing type definitions
# - Import path errors
# - Unused variables
```

#### Styles not working
- Check TailwindCSS is imported in `app/layout.tsx`
- Verify class names are correct
- Check `globals.css` has proper config
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

## Code Quality

### TypeScript
- All files should have proper types
- Use `interface` for component props
- Avoid `any` type
- Use strict mode

### Naming Conventions
- Components: PascalCase (`MyComponent.tsx`)
- Functions: camelCase (`myFunction()`)
- Constants: UPPER_SNAKE_CASE (`MAX_USERS`)
- Files: kebab-case for files (`my-component.tsx`)

### Comments
- Write comments for complex logic
- Use `// TODO:` for planned work
- Use `// FIXME:` for known issues

## Performance Tips

### Image Optimization
- Use Next.js `Image` component
- Specify width/height
- Consider lazy loading

### Database
- Use indexes on frequently queried columns
- Avoid N+1 queries
- Cache when appropriate

### Bundling
- Code splitting happens automatically
- Monitor bundle size with `next/bundle-analyzer`

## Git Workflow

### Before Pushing

```bash
# Check for type errors (pnpm build does NOT — see next.config.mjs)
pnpm exec tsc --noEmit

# Lint
pnpm lint

# Review changes
git diff

# Commit with clear message
git commit -m "feat: describe your changes"
```

### Commit Messages

Follow conventional commits:
```
feat:   New feature
fix:    Bug fix
docs:   Documentation
style:  Formatting
refactor: Code restructuring
test:   Tests
chore:  Build, dependencies
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Neon Documentation](https://neon.tech/docs)

## Getting Help

1. Check existing issues on GitHub
2. Review code comments
3. Look at similar implementations
4. Read documentation
5. Ask in team discussions
