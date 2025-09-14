# Contributing to MWA Intranet

## Prerequisites
- Node.js 20.x (LTS)
- GitHub account with access to the repo
- (Optional) Access to Azure resources for integration testing

## Getting started
```bash
npm ci
npx prisma generate

# For local development with SQLite
npx prisma db push
npm run db:seed-links
npm run db:seed-apps  # Optional: seed sample apps
npm run dev
```

Create `.env.local` (do **not** commit):

```bash
NEXTAUTH_URL=http://localhost:3000
AZURE_AD_CLIENT_ID=<client id>
AZURE_AD_CLIENT_SECRET=<client secret>
AZURE_AD_TENANT_ID=<tenant id>
DATABASE_URL=file:./dev.db
ADMIN_EMAILS=rick@marsdenwealth.com.au
```

## Current System

The application includes:

### Marsden Apps Hub
- Featured applications carousel on homepage
- Quick access to key business systems (Xplan, Class, BGL, etc.)
- Admin management for apps with custom icons and descriptions

### Hierarchical Link Management
- 3-level organization: Category → SubCategory → SubSubCategory → Links
- 9 pre-configured business categories
- Full CRUD operations for all levels
- Smart deletion (only empty folders can be deleted)

### Admin Interface
- Complete management system at `/admin`
- Separate sections for Marsden Apps and Hierarchical Links
- Role-based access control

## Branching & PRs

* `main` is protected. Create feature branches: `feat/<short-name>` or `fix/<short-name>`
* Open a Pull Request; request review from a teammate
* Use **Conventional Commits** in titles: `feat: …`, `fix: …`, `chore: …`
* Wait for all GitHub Actions checks to pass before merging

## Coding standards

* Language: TypeScript + React (Next.js App Router)
* Style: TailwindCSS utility-first
* ORM: Prisma; run `npx prisma db push` locally when you change `prisma/schema.prisma`
* Prefer small, focused components; server actions for data ops
* Use type adapters when needed (e.g., converting Prisma nulls to undefined for React)

## Database Development

**Local SQLite (recommended for development):**
```bash
# Initialize database
npx prisma db push

# Seed data
npm run db:seed-links    # Business categories
npm run db:seed-apps     # Sample Marsden Apps (if script exists)
```

**Schema changes:**
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` locally
3. Test locally before committing
4. After deployment, run migrations on production via Azure SSH

## Build, test, deploy

```bash
npm run build    # production build (must pass TypeScript checks)
npm start        # serve built app locally
```

CI/CD: GitHub Actions automatically deploy to Azure App Service on merge to main.

## Working with Key Components

### Marsden Apps
- `MarsdenApps.tsx` - Homepage carousel display
- `MarsdenAppsAdmin.tsx` - Admin management interface
- `/api/marsden-apps/*` - API routes for CRUD operations

### Hierarchical Links
- `HierarchicalLinks.tsx` - User-facing display component
- `HierarchicalLinksAdmin.tsx` - Admin management interface
- `/api/links/*` - API routes for all CRUD operations
- `seed-links.ts` - Seeds the 9 main business categories

### Type Compatibility
When working with Prisma data, remember to handle null/undefined conversions:
```typescript
// Convert Prisma nulls to undefined for React components
const adapted = data.map(item => ({
  ...item,
  description: item.description ?? undefined
}));
```

## Testing Checklist

Before submitting a PR, test:
- [ ] Homepage loads with both Marsden Apps and Hierarchical Links
- [ ] Admin panel accessible for admin users
- [ ] Create/Edit/Delete operations work for apps and links
- [ ] Search functionality works
- [ ] Mobile responsive layout
- [ ] No console errors in browser

## PR checklist

* [ ] Builds locally (`npm run build`)
* [ ] No TypeScript errors
* [ ] No secrets in code or `.env.*`
* [ ] Schema changes include a note in PR description
* [ ] Tested sign-in flow (if auth touched)
* [ ] Screenshots/GIFs for UI changes
* [ ] Admin interface tested if backend changes made
* [ ] Database migrations documented if schema changed

## Common Issues & Solutions

**TypeScript build errors:**
- Check for null/undefined type mismatches
- Use explicit type annotations in reduce functions
- Add adapter functions for Prisma → React data conversion

**Local development issues:**
- Ensure `.env.local` has all required variables
- Run `npx prisma generate` after schema changes
- Check Azure AD redirect URI includes localhost

**Production deployment:**
- Wait for GitHub Actions to complete
- Check Azure App Service logs if errors occur
- Run `npx prisma db push` via SSH for new schema changes
