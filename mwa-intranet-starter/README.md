# MWA Intranet Starter (Next.js + Azure AD + Prisma + Tailwind)

A production‑ready starter for an internal staff intranet. It ships with:
- **Announcements** (CRUD for admins)
- **Quick Links** (CRUD for admins)
- **Staff Directory** (searchable)
- **Global Search** (announcements, links, staff)
- **Authentication** via Microsoft **Entra ID (Azure AD)** using NextAuth
- **RBAC** (`ADMIN` vs `STAFF`) with route protection for `/admin`
- **SQLite + Prisma** to keep infra minimal at the start
- **Tailwind** UI with a clean, modern aesthetic

> You can later swap SQLite for Postgres (Azure Database for PostgreSQL) without changing app code, or integrate SharePoint/OneDrive via Microsoft Graph.

## 1) Prereqs
- Node.js 18+
- pnpm (recommended) or npm
- An Azure tenant where you can register an app (Enterprise App)

## 2) Setup
```bash
pnpm install
cp .env.example .env.local
# edit .env.local (NEXTAUTH_SECRET, AZURE creds)
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000

### Azure Entra ID (Azure AD)
Create an **App registration**:
- Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
- Copy **Application (client) ID**, **Directory (tenant) ID**
- Create a **Client Secret** and copy the value

Set in `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-long-random-string
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
DATABASE_URL=file:./dev.db
ADMIN_EMAILS=you@yourdomain.com,another.admin@yourdomain.com
```

Users who sign in will be created in the local DB as `STAFF` by default, unless their email is in `ADMIN_EMAILS`.

## 3) What’s included
- **Home**: Announcements, Quick Links, Staff Directory, Search
- **/admin**: Manage announcements + quick links (admins only)
- **API**: `/api/announcements`, `/api/links`, `/api/staff`
- **Auth**: `/signin` page (NextAuth Azure AD provider)

## 4) Production notes
- Swap SQLite for Postgres by changing `DATABASE_URL` and running Prisma migrate.
- Host on Azure App Service or Vercel; set the correct `NEXTAUTH_URL` and Env Vars.
- Protect with your corporate network or Azure App Proxy if needed.
- Integrate **SharePoint/OneDrive** docs by adding a `/documents` page that lists sites/drive items via Microsoft Graph (requires additional API permissions).

## 5) Next steps / ideas
- Document library view (Graph API) with search + previews
- Service desk intake (simple forms) that posts to Teams/Planner
- HR policies CMS (Prisma model + rich text editor)
- Org chart (pull from Azure AD)
- Announcements email digest (cron job)
- Audit logs for admin actions

---

**Have fun!** This is a solid base to iterate quickly and align with your MWA stack.
