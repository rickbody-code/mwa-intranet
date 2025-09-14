# MWA Intranet

Internal staff intranet for **Marsden Wealth Advisers** built with **Next.js 14**, **NextAuth (Microsoft Entra)**, **Prisma**, and **PostgreSQL**.  
Production runs on **Azure App Service (Linux)** with secrets in **Azure Key Vault**. CI/CD via **GitHub Actions**.

> **STAGE 1 COMPLETE:** Hierarchical Link Management System with 3-level organization (Category → SubCategory → SubSubCategory → Links)

> For operational details, see **[`/docs/HANDBOOK.md`](docs/HANDBOOK.md)**.

---

## Quick links

- **Production**: https://mwa-intranet-c4hzepe9d9ghcdhd.australiaeast-01.azurewebsites.net  
- **Contributing guide**: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- **Security policy**: [`docs/SECURITY.md`](docs/SECURITY.md)

---

## Current Features (Stage 1 Complete)

### ✅ Hierarchical Business Link Management
- **3-level organization:** Categories → Subcategories → Sub-subcategories → Links
- **9 main business categories** pre-configured for MWA operations
- **Full CRUD operations:** Create, edit, delete at all levels
- **Smart deletion:** Only allows deleting empty folders
- **Admin interface:** Complete management at `/admin`

### ✅ Authentication & Authorization
- **Microsoft Entra ID (Azure AD)** single sign-on
- **Role-based access:** Admin vs Staff permissions
- **Secure admin area:** Protected link management

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
set DATABASE_URL=file:./dev.db && npx prisma db push

# Seed business categories
set DATABASE_URL=file:./dev.db && npm run db:seed-links

# Start development server
set DATABASE_URL=file:./dev.db && npm run dev
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

## Stage 2 Roadmap: SharePoint Integration

**Next Phase Priorities:**
- Direct SharePoint folder links (Clients, Prospects, Templates)
- Microsoft Graph API integration for file listings
- Quick access to frequently used SharePoint resources
- Embedded SharePoint content where appropriate

---

## Stage 3 Planning: Knowledge Base

**Future Features:**
- Wiki-style content management system
- Easy content creation/editing interface  
- Structured knowledge organization
- Search functionality across all content
- Version control for knowledge updates

---

## Project Context

**Company:** Marsden Wealth Advisers (financial planning startup)  
**Current Size:** 3 staff, growing to 20-30  
**Purpose:** Replace simple bookmark system with sophisticated business hub  
**Focus:** Organized access to business systems, knowledge, and resources