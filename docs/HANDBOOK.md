# MWA Intranet – Handover & Operations Guide

*Last updated: 1 Sep 2025 (AEST)*

> This document explains what the app does, how it’s wired up on Azure, how to develop locally, deploy, and operate it safely. It’s designed to be dropped into the repo (e.g., `/docs/HANDBOOK.md`) and shared with a developer for smooth handover.

---

## 1) What this app is

**MWA Intranet** is a secure internal staff portal built with:

* **Next.js 14 (App Router)**
* **NextAuth** with **Microsoft Entra (Azure AD)** for SSO
* **PostgreSQL** (Azure Database for PostgreSQL – Flexible Server)
* **Prisma ORM**
* **TailwindCSS**

Core entities (starter):

* **Announcements** – title/body, pinned flag, author
* **Quick Links** – label + URL
* **Staff** – basic staff records (optional usage in UI)

Admin UI at `/admin` (restricted by SSO + admin email allow‑list).

---

## 2) Current Azure setup (Production)

* **Subscription/Region**: Australia East / Australia Southeast (per resource)
* **Resource Group**: `rg-shared-services`
* **Web App (App Service, Linux)**: `mwa-intranet`

  * Public URL: `https://mwa-intranet-<hash>.australiaeast-01.azurewebsites.net` (Azure‑assigned)
  * **Runtime**: Node.js 20 (Oryx build)
  * **Startup Command**: `bash -c "npm run start -- -p $PORT"`
  * **App settings**: `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, `ENABLE_ORYX_BUILD=true`
* **Database**: Azure Database for PostgreSQL – Flexible Server

  * Server: `mwa-intranet-db.postgres.database.azure.com`
  * DB name: `intranet`
  * Admin user (example): `dbadmin`
  * Connectivity: Public; **Allow Azure services** enabled (so App Service can connect)
* **Key Vault**: `kv-shared-secrets-MWA`

  * Access: App Service **system‑assigned managed identity** with **Secrets Get/List**
* **Microsoft Entra (Azure AD) App Registration**: *Intranet* (name may vary)

  * Redirect URIs:

    * **Web**: `https://<your-app-url>/api/auth/callback/azure-ad`
    * (Optional local) `http://localhost:3000/api/auth/callback/azure-ad`
  * Permissions: `User.Read` (NextAuth OIDC flow)

> Note: Replace placeholders above with your tenant’s exact values when copying this doc for another environment.

---

## 3) Secrets & configuration

All sensitive values are stored in **Azure Key Vault** and referenced by the Web App via Key Vault references.

**Key Vault secrets (recommended names):**

* `intranet-database-url` → Postgres URL

  * Format: `postgresql://<user>:<password>@<server>:5432/intranet?sslmode=require`
* `intranet-nextauth-secret` → random 32+ char string (NextAuth signing secret)
* `intranet-azure-ad-client-id` → Entra App Registration **Application (client) ID**
* `intranet-azure-ad-client-secret` → Entra **client secret** value
* `intranet-azure-ad-tenant-id` → Directory (tenant) ID
* `intranet-admin-emails` → comma‑separated allow‑list, e.g. `rick@marsdenwealth.com.au`

**App Service → Environment variables** (use Key Vault references where noted):

* `NEXTAUTH_URL` = `https://<your-app-url>`
  ***Value must be URL only** (no quotes, no `NEXTAUTH_URL =`).*
* `DATABASE_URL` = **Key Vault reference** → `@Microsoft.KeyVault(SecretUri=https://kv-shared-secrets-MWA.vault.azure.net/secrets/intranet-database-url/...)`
* `NEXTAUTH_SECRET` = **Key Vault reference** → `intranet-nextauth-secret`
* `AZURE_AD_CLIENT_ID` = **Key Vault reference** → client id
* `AZURE_AD_CLIENT_SECRET` = **Key Vault reference** → client secret
* `AZURE_AD_TENANT_ID` = **Key Vault reference** → tenant id
* `ADMIN_EMAILS` = **Key Vault reference** → admin allow‑list

> After adding/updating env vars, **Save** and let the app restart. For build‑time vars like `NEXTAUTH_URL`, you also need to **redeploy** so the value is captured in the Next.js build.

---

## 4) Source, build & deploy

### Repository

Any GitHub repo (private). The starter uses:

* `next`, `react`, `react-dom`, `@prisma/client`, `prisma`, `tailwindcss`, `next-auth` (Azure AD provider)

### package.json (important parts)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p $PORT",
    "postinstall": "npx prisma generate"
  },
  "engines": { "node": ">=20" }
}
```

### GitHub Actions (CI/CD)

Use `azure/webapps-deploy@v3` to deploy to the **App Service** (no slot unless you created one):

```yaml
name: Deploy Intranet (App Service)

on:
  push:
    branches: [ main ]
  workflow_dispatch: {}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      # Package entire repo for OneDeploy
      - uses: azure/webapps-deploy@v3
        with:
          app-name: mwa-intranet
          package: .
          # slot-name: staging   # only if you actually created a slot
```

> **Avoid dual deployers**: Use **either** GitHub Actions **or** Deployment Center Sync, not both (prevents 409 conflicts).

---

## 5) Local development

1. **Prereqs**: Node 20.x (LTS), pnpm or npm; optional: pgAdmin.
2. **Clone** repo → create `.env.local` in project root:

```bash
NEXTAUTH_URL=http://localhost:3000
AZURE_AD_CLIENT_ID=<client id>
AZURE_AD_CLIENT_SECRET=<client secret>
AZURE_AD_TENANT_ID=<tenant id>
DATABASE_URL=file:./dev.db   # easiest: SQLite for local
ADMIN_EMAILS=rick@marsdenwealth.com.au
```

3. Install & run:

```bash
npm ci
npx prisma generate
npm run dev
```

4. **Using Postgres locally** (optional): set `DATABASE_URL` to your Azure Postgres string (or a local postgres) and ensure firewall rules permit your IP. Then run:

```bash
npx prisma db push  # create tables
# and optionally seed demo data
npm run db:seed
```

5. **SSO Callback (local)**: Ensure `http://localhost:3000/api/auth/callback/azure-ad` is added as a Web redirect URI in your Entra App Registration.

---

## 6) Database & Prisma

### Migrations

* **Local dev**: `npx prisma db push` for quick schema sync; `prisma migrate dev` for structured migrations.
* **Prod**: Run `npx prisma migrate deploy` during maintenance or as a startup step (optional). Safer to run from your workstation and confirm success.

### Seeding (optional)

```bash
npm run db:seed
```

(Adjust `src/scripts/seed.ts` for your use.)

### Backups

* Azure Database for PostgreSQL (Flexible Server) supports automated backups. Confirm retention and geo‑redundancy per your policy in the Azure Portal.

---

## 7) Operations (Runbook)

### Common checks

* **Is the site up?** App Service → **Overview** → Browse
* **Logs**: App Service → **Monitoring → Log stream**
* **Server shell**: App Service → **Advanced Tools → Go → Debug Console → Bash**
* **Build artifacts**: In Bash, `ls -la /home/site/wwwroot/.next`

### Restart

* App Service → **Overview → Restart** (safe, quick)

### Environment changes

* Update in **Configuration → Application settings** → **Save** (auto‑restart).
* For build‑time envs (e.g., `NEXTAUTH_URL`), **redeploy** after saving.

### Key Vault resolution

* In Environment variables, red ❌ means reference unresolved. Check:

  * Web App **Managed Identity** is **On**
  * Key Vault access: role or access policy grants **Secrets Get/List** to the identity
  * Secret names/versions are correct
  * Click **Refresh** values and **Save**

### Typical incidents & fixes

* **Build error: `Invalid URL`** → `NEXTAUTH_URL` value has extra text; set the URL only.
* **`next: not found` on start** → ensure `next` is in `dependencies` (not devDependencies) and redeploy.
* **409 Conflict (deploy)** → don’t deploy from both Actions and Deployment Center; remove `slot-name` if no slot; restart to clear locks.
* **DB connect errors** → confirm `DATABASE_URL` is correct, SSL required, and Postgres firewall allows Azure services.

---

## 8) Security & compliance

* **Secrets** only in Key Vault; never commit `.env` to Git.
* **Managed Identity** for the Web App; avoid embedding credentials in settings.
* **Admin Allow‑list** via `ADMIN_EMAILS` (minimum one admin account). Consider group‑based auth later.
* **TLS**: Azure provides HTTPS by default; consider custom domain + managed cert as a next step.
* **Credential rotation**: rotate client secret & DB password per policy; update Key Vault, then redeploy.

---

## 9) Roadmap / Next steps

* Custom domain (e.g., `intranet.marsdenwealth.com.au`) + managed cert
* App Service **staging slot** with swap
* Monitoring/alerts: Application Insights, DB metrics/alerts
* Role‑based access (Groups from Entra)
* Content modules: Policies, Procedures, People/Org chart, Documents (SharePoint integration)
* Automated Prisma migrations in CI (guarded)

---

## 10) Handover checklist

* [ ] Access to Azure subscription & resource group
* [ ] Access to Web App and Key Vault (RBAC)
* [ ] Access to Entra App Registration
* [ ] GitHub repo access
* [ ] This document in `/docs/HANDBOOK.md`
* [ ] Environment variables verified in App Service
* [ ] Key Vault references show **Resolved**
* [ ] Postgres connection verified
* [ ] CI/CD run green from `main`

---

## Appendix A – Quick commands

**App Service (Kudu Bash)**

```bash
# Show build artifacts
ls -la /home/site/wwwroot/.next

# Restart app
touch /tmp/restart.txt
```

**Prisma (local / Kudu)**

```bash
npx prisma generate
npx prisma db push
npx prisma migrate deploy
```

**Node/Next (local)**

```bash
npm ci
npm run dev     # local
npm run build   # production build
npm start       # serve production build locally
```

---

If you need to extend the app (new models, pages, or integrations), add sections here and keep the “Last updated” date fresh for future maintainers.

---

## 11) Repo docs folder structure (ready to add)

Place these files in your repository so a new developer can ramp up quickly:

```
/docs/
  HANDBOOK.md          # this guide
  CONTRIBUTING.md      # how to work on the repo
  SECURITY.md          # how to report/handle security issues
  architecture/
    mwa-intranet-architecture.svg  # system diagram (exported asset)
