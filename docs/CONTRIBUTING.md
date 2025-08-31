### CONTRIBUTING.md (drop-in content)

````md
# Contributing to MWA Intranet

## Prerequisites
- Node.js 20.x (LTS)
- GitHub account with access to the repo
- (Optional) Access to Azure resources for integration testing

## Getting started
```bash
npm ci
npx prisma generate
npm run dev
````

Create `.env.local` (do **not** commit):

```bash
NEXTAUTH_URL=http://localhost:3000
AZURE_AD_CLIENT_ID=<client id>
AZURE_AD_CLIENT_SECRET=<client secret>
AZURE_AD_TENANT_ID=<tenant id>
DATABASE_URL=file:./dev.db
ADMIN_EMAILS=rick@marsdenwealth.com.au
```

## Branching & PRs

* `main` is protected. Create feature branches: `feat/<short-name>` or `fix/<short-name>`
* Open a Pull Request; request review from a teammate
* Use **Conventional Commits** in titles: `feat: …`, `fix: …`, `chore: …`

## Coding standards

* Language: TypeScript + React (Next.js App Router)
* Style: TailwindCSS utility-first
* ORM: Prisma; run `npx prisma db push` locally when you change `prisma/schema.prisma`
* Prefer small, focused components; server actions for data ops

## Build, test, deploy

```bash
npm run build    # production build
npm start        # serve built app locally
```

CI/CD: GitHub Actions deploy to Azure App Service. Avoid using Azure Deployment Center simultaneously.

## PR checklist

* [ ] Builds locally (`npm run build`)
* [ ] No secrets in code or `.env.*`
* [ ] Schema changes include a note in PR description
* [ ] Tested sign-in flow (if auth touched)
* [ ] Screenshots/GIFs for UI changes
