# MWA Intranet – Handover & Operations Guide

*Last updated: 15 Sep 2025 (AEST)*

> This document explains what the app does, how it's wired up on Azure, how to develop locally, deploy, and operate it safely. **STAGE 1 COMPLETE:** Hierarchical Link Management System.

---

## 1) What this app is

**MWA Intranet** is a secure internal staff portal built with:

* **Next.js 14 (App Router)**
* **NextAuth** with **Microsoft Entra (Azure AD)** for SSO
* **PostgreSQL** (Azure Database for PostgreSQL – Flexible Server)
* **Prisma ORM**
* **TailwindCSS**

**Core Features (Stage 1 Complete):**

* **Hierarchical Link Management** – 3-level organization system (Category → SubCategory → SubSubCategory → Links)
* **Business System Organization** – 9 main business categories with unlimited sub-organization
* **Admin Interface** – Complete CRUD operations for all organizational levels
* **Smart Deletion** – Only allows deleting empty folders to prevent data loss
* **Role-Based Access** – Admin vs Staff permissions

**Legacy Features (Still Active):**
* **Announcements** – title/body, pinned flag, author
* **Staff Directory** – basic staff records with search
* **Global Search** – across announcements, links, and staff

Admin UI at `/admin` (restricted by SSO + admin email allow‑list).

---

## 2) Current Database Models

### Hierarchical Link System (New - Stage 1)
```prisma
model LinkCategory {
  id             String @id @default(cuid())
  name           String
  order          Int @default(0)
  links          Link[]
  subCategories  LinkSubCategory[]
  createdAt      DateTime @default(now())
}

model LinkSubCategory {
  id               String @id @default(cuid()) 
  name             String
  order            Int @default(0)
  categoryId       String
  category         LinkCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  links            Link[]
  subSubCategories LinkSubSubCategory[]
  createdAt        DateTime @default(now())
}

model LinkSubSubCategory {
  id            String @id @default(cuid())
  name          String  
  order         Int @default(0)
  subCategoryId String
  subCategory   LinkSubCategory @relation(fields: [subCategoryId], references: [id], onDelete: Cascade)
  links         Link[]
  createdAt     DateTime @default(now())
}

model Link {
  id                String @id @default(cuid())
  title             String
  url               String
  description       String?
  categoryId        String?
  subCategoryId     String?
  subSubCategoryId  String?
  category          LinkCategory? @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  subCategory       LinkSubCategory? @relation(fields: [subCategoryId], references: [id], onDelete: Cascade) 
  subSubCategory    LinkSubSubCategory? @relation(fields: [subSubCategoryId], references: [id], onDelete: Cascade)
  createdAt         DateTime @default(now())
}
```

### Legacy Models (Still Active)
```prisma
model User {
  id            String @id @default(cuid())
  email         String @unique
  name          String?
  image         String?
  role          Role @default(STAFF)
  announcements Announcement[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Announcement {
  id        String @id @default(cuid())
  title     String
  body      String
  pinned    Boolean @default(false)
  authorId  String?
  author    User? @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model QuickLink {
  id        String @id @default(cuid())
  label     String
  url       String
  createdBy String?
  createdAt DateTime @default(now())
}

model Staff {
  id         String @id @default(cuid())
  name       String
  title      String
  email      String @unique
  phone      String?
  location   String?
  department String?
  image      String?
  createdAt  DateTime @default(now())
}
```

---

## 3) Current Azure setup (Production)

* **Subscription/Region**: Australia East / Australia Southeast (per resource)
* **Resource Group**: `rg-shared-services`
* **Web App (App Service, Linux)**: `mwa-intranet`
  * Public URL: `https://mwa-intranet-c4hzepe9d9ghcdhd.australiaeast-01.azurewebsites.net`
  * **Runtime**: Node.js 20 (Oryx build)
  * **Startup Command**: `bash -c "npm run start -- -p $PORT"`
  * **App settings**: `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, `ENABLE_ORYX_BUILD=true`

* **Database**: Azure Database for PostgreSQL – Flexible Server
  * Server: `mwa-intranet-db.postgres.database.azure.com`
  * DB name: `intranet`
  * Admin user (example): `dbadmin`
  * Connectivity: Public; **Allow Azure services** enabled

* **Key Vault**: `kv-shared-secrets-MWA`
  * Access: App Service **system‑assigned managed identity** with **Secrets Get/List**

* **Microsoft Entra (Azure AD) App Registration**: *Intranet*
  * Redirect URIs: `https://mwa-intranet-c4hzepe9d9ghcdhd.australiaeast-01.azurewebsites.net/api/auth/callback/azure-ad`
  * Local: `http://localhost:3000/api/auth/callback/azure-ad`
  * Permissions: `User.Read`

---

## 4) Local development (Stage 1)

### Prerequisites
- Node.js 20.x (LTS)
- Git access to repository
- Azure AD app registration credentials

### Setup Steps
```bash
# Clone repository
git clone <repository-url>
cd mwa-intranet

# Install dependencies
npm ci

# Setup environment file
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Environment Configuration (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-long-random-string-32-chars-plus
AZURE_AD_CLIENT_ID=your-client-id-from-azure
AZURE_AD_CLIENT_SECRET=your-client-secret-from-azure
AZURE_AD_TENANT_ID=your-tenant-id-from-azure
DATABASE_URL=file:./dev.db
ADMIN_EMAILS=rick@marsdenwealth.com.au
```

### Initialize Database & Seed Data
```bash
# Create database schema (SQLite for local)
set DATABASE_URL=file:./dev.db && npx prisma db push

# Seed business categories (Stage 1 data)  
set DATABASE_URL=file:./dev.db && npm run db:seed-links

# Optional: Seed legacy announcements/staff
set DATABASE_URL=file:./dev.db && npm run db:seed

# Start development server
set DATABASE_URL=file:./dev.db && npm run dev
```

Visit `http://localhost:3000` - you should see the hierarchical link system.

---

## 5) Business Categories (Stage 1)

The system is pre-configured with these 9 main business areas:

1. **Knowledge Topics** - Internal procedures, guides, best practices
2. **MSA Website** - Main website, client portal access
3. **MSA Resources** - Internal forms, templates, resources  
4. **Foreign Country Info** - International client resources
5. **Product Adviser Sites** - Investment platforms, fund managers
6. **MSA Applications** - CRM, email, business applications
7. **CPAL** - Compliance, legal, regulatory resources
8. **Third Party Authorities** - ASIC, ATO, professional bodies
9. **Competitor Websites** - Market research, competitor analysis

Each category supports unlimited subcategories and sub-subcategories.

---

## 6) API Routes (Current)

### Hierarchical Links (Stage 1)
```
POST   /api/links/categories              # Create category
PATCH  /api/links/categories/[id]         # Update category  
DELETE /api/links/categories/[id]         # Delete empty category

POST   /api/links/subcategories           # Create subcategory
PATCH  /api/links/subcategories/[id]      # Update subcategory
DELETE /api/links/subcategories/[id]      # Delete empty subcategory

POST   /api/links/subsubcategories        # Create sub-subcategory  
PATCH  /api/links/subsubcategories/[id]   # Update sub-subcategory
DELETE /api/links/subsubcategories/[id]   # Delete empty sub-subcategory

GET    /api/links                         # Get all hierarchical data
POST   /api/links                         # Create link
PATCH  /api/links/[id]                    # Update link
DELETE /api/links/[id]                    # Delete link
```

### Legacy APIs (Still Active)
```
GET/POST    /api/announcements            # Announcements CRUD
GET/POST    /api/announcements/[id]       # Individual announcement
GET         /api/staff                    # Staff directory with search
```

---

## 7) Key Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "postinstall": "npx prisma generate",
    "db:seed": "node --import tsx src/scripts/seed.ts",
    "db:seed-links": "node --import tsx src/scripts/seed-links.ts"
  }
}
```

**Important for local development:**
```bash
# Always set DATABASE_URL for local SQLite
set DATABASE_URL=file:./dev.db && npm run dev
set DATABASE_URL=file:./dev.db && npx prisma db push  
set DATABASE_URL=file:./dev.db && npm run db:seed-links
```

---

## 8) Stage 2 Planning: SharePoint Integration

**Immediate Roadmap:**
- Direct links to SharePoint folders (Clients, Prospects, Templates)
- Microsoft Graph API integration for file listings
- Quick access to frequently used SharePoint resources
- Embedded SharePoint content where appropriate

**Required Setup:**
- Additional Microsoft Graph API permissions
- SharePoint site URL configuration
- File access permissions and security

---

## 9) Operations & Deployment

### Current Deployment
- **GitHub Actions** CI/CD pipeline 
- **Azure App Service** with Node.js 20
- **PostgreSQL** for production database
- **Key Vault** for secrets management

### Common Commands
```bash
# Production build test
npm run build

# Database operations (production)
npx prisma migrate deploy
npx prisma generate

# View database
npx prisma studio
```

### Troubleshooting

**Local Development Issues:**
- Always use `set DATABASE_URL=file:./dev.db &&` prefix for local commands
- Ensure `.env.local` has all required variables
- Check Azure AD redirect URI includes `http://localhost:3000/api/auth/callback/azure-ad`

**Missing Business Categories:**
```bash
# Re-seed the 9 main categories
set DATABASE_URL=file:./dev.db && npm run db:seed-links
```

**Admin Access Issues:**
- Verify your email is in `ADMIN_EMAILS` environment variable
- Check browser console for authentication errors
- Ensure Azure AD app permissions are granted

---

## 10) File Structure (Stage 1)

```
mwa-intranet/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Homepage with hierarchical links
│   │   ├── admin/page.tsx               # Admin management interface  
│   │   └── api/
│   │       └── links/                   # Hierarchical API routes
│   │           ├── categories/
│   │           ├── subcategories/  
│   │           ├── subsubcategories/
│   │           └── [id]/
│   ├── components/
│   │   ├── HierarchicalLinks.tsx       # User-facing display
│   │   ├── HierarchicalLinksAdmin.tsx  # Admin management
│   │   ├── AnnouncementList.tsx        # Legacy announcements
│   │   ├── StaffDirectory.tsx          # Legacy staff directory
│   │   └── Search.tsx                  # Legacy global search
│   ├── scripts/
│   │   ├── seed.ts                     # Legacy data seeding
│   │   └── seed-links.ts               # Business categories seeding
│   └── lib/
│       ├── prisma.ts                   # Database connection
│       └── auth.ts                     # NextAuth configuration
├── prisma/
│   └── schema.prisma                   # Database schema
├── .env.example                        # Environment template
└── docs/                              # Documentation
    ├── HANDBOOK.md                    # This file
    ├── CONTRIBUTING.md                # Development guide  
    └── SECURITY.md                    # Security policy
```

---

## 11) Stage 3 Vision: Knowledge Base

**Future Features:**
- Wiki-style content management system
- Easy content creation/editing interface
- Structured knowledge organization with categories
- Full-text search across all knowledge articles  
- Version control and change tracking
- Collaborative editing capabilities

This will transform the intranet from a link hub into a comprehensive knowledge management platform.

---

*For technical issues contact: rick@marsdenwealth.com.au*