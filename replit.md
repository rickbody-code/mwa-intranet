# MWA Intranet

## Overview

The MWA Intranet is an internal staff portal for Marsden Wealth Advisers built with Next.js 14. It provides secure access to business applications and resources through a modern web interface. The application features two main components: a Marsden Apps Hub for quick access to business systems like Xplan and Class, and a hierarchical link management system that organizes resources into categories, subcategories, and sub-subcategories. The system uses Microsoft Entra ID for single sign-on authentication and provides role-based access control for administrative functions.

## Recent Changes

### October 4, 2025 - Azure Deployment Configuration Complete
- Fixed Azure build failures by adding `export const dynamic = 'force-dynamic'` to all 35 API routes
- Updated startup validation to log warnings instead of blocking builds when environment variables are missing
- Resolved TypeScript compilation issues with Prisma JSON types using `toInputJson()` helper
- All API routes properly configured for server-side rendering in production
- Build verified successful with zero TypeScript errors
- Azure deployment pipeline configured and validated

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router for modern React-based development
- **Styling**: TailwindCSS for utility-first CSS styling with custom components
- **UI Components**: Custom React components using Lucide React for icons
- **State Management**: React hooks and server-side rendering for optimal performance
- **Client-Side Rendering**: Strategic use of client components for interactive features

### Backend Architecture
- **API Design**: Next.js API routes following RESTful conventions
- **Database Layer**: Prisma ORM for type-safe database operations
- **Authentication**: NextAuth with Microsoft Entra ID provider for SSO
- **Authorization**: Role-based access control (ADMIN vs STAFF) with middleware protection
- **Session Management**: JWT-based sessions with server-side validation

### Data Storage Solutions
- **Database**: PostgreSQL in production, SQLite for local development
- **ORM**: Prisma for database schema management and migrations
- **Schema Design**: Hierarchical structure supporting three-level link organization
- **Key Models**: 
  - MarsdenApp for featured business applications (blue gradient cards on homepage)
  - WikiSection for knowledge base sections (white cards on wiki homepage)
  - LinkCategory, LinkSubCategory, LinkSubSubCategory for hierarchical organization
  - User model with role-based permissions
  - Legacy models for announcements and staff directory

### Authentication and Authorization
- **SSO Provider**: Microsoft Entra ID (Azure AD) for enterprise authentication
- **Session Strategy**: JWT tokens with role information embedded
- **Admin Access**: Email-based allowlist system via environment variables
- **Route Protection**: Middleware-based protection for `/admin` routes
- **User Management**: Automatic user creation on first sign-in with role assignment

### Data Models and Relationships
- **Hierarchical Links**: Three-level category system with proper foreign key relationships
- **Smart Deletion**: Business logic prevents deletion of non-empty categories
- **Order Management**: Numeric ordering system for consistent display
- **Type Safety**: Full TypeScript integration with Prisma-generated types

## External Dependencies

### Core Infrastructure
- **Hosting**: Azure App Service (Linux) for production deployment
- **Secrets Management**: Azure Key Vault for secure credential storage
- **CI/CD**: GitHub Actions for automated deployment pipeline

### Authentication Services
- **Microsoft Entra ID**: Primary authentication provider for SSO
- **NextAuth**: Authentication library handling OAuth flows and session management

### Database Services
- **PostgreSQL**: Production database hosted on Azure Database for PostgreSQL Flexible Server
- **Connection Management**: Prisma connection pooling and management

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting standards
- **Prisma Studio**: Database administration and debugging tool

### Third-Party Libraries
- **Lucide React**: Icon library for consistent UI elements
- **Zod**: Runtime type validation for API requests
- **clsx**: Utility for conditional CSS classes
- **tsx**: TypeScript execution for development scripts

### Business System Integrations
- **Xplan**: Financial planning software integration via direct links
- **Class**: Superannuation administration system access
- **BGL**: Tax and SMSF software integration
- **Various Industry Tools**: Configurable links to external business applications