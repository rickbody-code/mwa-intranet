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
set DATABASE_URL=file:./dev.db && npx prisma db push
set DATABASE_URL=file:./dev.db && npm run db:seed-links
set DATABASE_URL=file:./dev.db && npm run dev
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

## Current System (Stage 1 Complete)

The application now includes a **hierarchical link management system**:
- 3-level organization: Category → SubCategory → SubSubCategory → Links
- 9 pre-configured business categories
- Full CRUD operations for all levels
- Admin interface at `/admin`

## Branching & PRs

* `main` is protected. Create feature branches: `feat/<short-name>` or `fix/<short-name>`
* Open a Pull Request; request review from a teammate
* Use **Conventional Commits** in titles: `feat: …`, `fix: …`, `chore: …`

## Coding standards

* Language: TypeScript + React (Next.js App Router)
* Style: TailwindCSS utility-first
* ORM: Prisma; run `set DATABASE_URL=file:./dev.db && npx prisma db push` locally when you change `prisma/schema.prisma`
* Prefer small, focused components; server actions for data ops

## Database Development

**Local SQLite (recommended):**
```bash
set DATABASE_URL=file:./dev.db && npx prisma db push
set DATABASE_URL=file:./dev.db && npm run db:seed-links
```

**Schema changes:**
1. Update `prisma/schema.prisma`
2. Run `set DATABASE_URL=file:./dev.db && npx prisma db push`
3. Test locally before committing

## Build, test, deploy

```bash
npm run build    # production build
npm start        # serve built app locally
```

CI/CD: GitHub Actions deploy to Azure App Service. Avoid using Azure Deployment Center simultaneously.

## Working with the Hierarchical System

The link management system has these key components:
- `HierarchicalLinks.tsx` - User-facing display component
- `HierarchicalLinksAdmin.tsx` - Admin management interface
- `/api/links/*` - API routes for all CRUD operations
- `seed-links.ts` - Seeds the 9 main business categories

## PR checklist

* [ ] Builds locally (`npm run build`)
* [ ] No secrets in code or `.env.*`
* [ ] Schema changes include a note in PR description
* [ ] Tested sign-in flow (if auth touched)
* [ ] Screenshots/GIFs for UI changes
* [ ] If modifying hierarchical system, test all CRUD operations
* [ ] Admin interface tested if backend changes made
