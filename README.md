# MWA Intranet

Internal staff intranet for **Marsden Wealth Advisers** built with **Next.js 14**, **NextAuth (Microsoft Entra)**, **Prisma**, and **PostgreSQL**.  
Production runs on **Azure App Service (Linux)** with secrets in **Azure Key Vault**. CI/CD via **GitHub Actions**.

> **CURRENT VERSION:** Hierarchical Link Management + Marsden Apps Hub (Deployed September 2025)

> For operational details, see **[`/docs/HANDBOOK.md`](docs/HANDBOOK.md)**.

---

## Quick links

- **Production**: https://mwa-intranet-c4hzepe9d9ghcdhd.australiaeast-01.azurewebsites.net  
- **Contributing guide**: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- **Security policy**: [`docs/SECURITY.md`](docs/SECURITY.md)

---

## Current Features (Live in Production)

### ✅ Marsden Apps Hub
- **Featured applications carousel** on homepage
- **Quick access** to core MWA business applications
- **Custom icons and descriptions** for each app
- **Direct links** to Xplan, Class, BGL, and other key systems
- **Admin management** for adding/editing/removing apps

### ✅ Hierarchical Business Link Management
- **3-level organization:** Categories → Subcategories → Sub-subcategories → Links
- **9 main business categories** pre-configured for MWA operations
- **Full CRUD operations:** Create, edit, delete at all levels
- **Smart deletion:** Only allows deleting empty folders
- **Admin interface:** Complete management at `/admin`

### ✅ Authentication & Authorization
- **Microsoft Entra ID (Azure AD)** single sign-on
- **Role-based access:** Admin vs Staff permissions
- **Secure admin area:** Protected link and app management

### ✅ Core Infrastructure
- **Next.js 14** with App Router
- **Prisma ORM** with PostgreSQL (production) / SQLite (local)
- **TailwindCSS** modern UI
- **Azure deployment** with Key Vault secrets management

---

## Business Categories (Live)

The system includes these main business areas:

1. **Knowledge Topics** - Internal knowledge base
2. **MSA Website** - Company website and portal access  
3. **MSA Resources** - Internal business resources
4. **Foreign Country Info** - International client resources
5. **Product Adviser Sites** - Financial product platforms
6. **MSA Applications** - Business applications and tools
7. **CPAL** - Compliance and regulatory resources
8. **Third Party Authorities** - External regulatory bodies
9. **Competitor Websites** - Market research and analysis

Each category supports unlimited subcategories and sub-subcategories for detailed organization.

---

## Tech Stack

- **Frontend/Server**: Next.js 14 (App Router), React 18, TailwindCSS  
- **Auth**: NextAuth (Microsoft Entra / Azure AD)  
- **DB/ORM**: PostgreSQL (Azure Flexible Server) + Prisma  
- **Hosting**: Azure App Service (Linux, Node 20)  
- **Secrets**: Azure Key Vault + Managed Identity  
- **CI/CD**: GitHub Actions (OneDeploy/Oryx to App Service)

---

## Local Development 

```bash
# Clone and setup
git clone <repository-url>
cd mwa-intranet

# Install dependencies
npm ci

# Setup local environment (SQLite)
cp .env.example .env.local
# Edit .env.local with your Azure AD credentials

# Initialize database
npx prisma db push

# Seed business categories and sample apps
npm run db:seed-links
npm run db:seed-apps  # If you have a seed script for Marsden Apps

# Start development server
npm run dev
```

Then visit `http://localhost:3000`

### Required Environment Variables (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-long-random-string
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret  
AZURE_AD_TENANT_ID=your-tenant-id
DATABASE_URL=file:./dev.db
ADMIN_EMAILS=rick@marsdenwealth.com.au
```

---

## Admin Guide

### Adding Marsden Apps
1. Sign in with an admin account
2. Navigate to `/admin`
3. Use the "Manage Marsden Apps" section
4. Add apps with name, description, URL, and icon

### Managing Links
1. Sign in with an admin account
2. Navigate to `/admin`
3. Use the "Business Systems & Resources" section
4. Create categories, then subcategories, then add links

---

## Recent Updates (September 2025)

- ✅ Added Marsden Apps feature for quick access to key applications
- ✅ Deployed hierarchical link management system
- ✅ Fixed TypeScript compatibility issues with Prisma
- ✅ Successfully migrated to production database schema

---

## Next Phase Roadmap

### Stage 2: SharePoint Integration
- Direct SharePoint folder links (Clients, Prospects, Templates)
- Microsoft Graph API integration for file listings
- Quick access to frequently used SharePoint resources
- Embedded SharePoint content where appropriate

### Stage 3: Knowledge Base
- Wiki-style content management system
- Easy content creation/editing interface  
- Structured knowledge organization
- Search functionality across all content
- Version control for knowledge updates

---

## Project Context

**Company:** Marsden Wealth Advisers (financial planning startup)  
**Current Size:** 3 staff, growing to 20-30  
**Purpose:** Central hub for all business systems and resources  
**Vision:** Replace simple bookmarks with sophisticated business portal
