# MWA Intranet

Internal staff intranet for **Marden Wealth Advisers** built with **Next.js 14**, **NextAuth (Microsoft Entra)**, **Prisma**, and **PostgreSQL**.  
Production runs on **Azure App Service (Linux)** with secrets in **Azure Key Vault**. CI/CD via **GitHub Actions**.

> For a deeper handover (architecture, runbooks, security, and onboarding), see **[`/docs/HANDBOOK.md`](docs/HANDBOOK.md)**.

---

## Quick links

- **Production**: https://mwa-intranet-c4hzepe9d9ghcdhd.australiaeast-01.azurewebsites.net  
- **Architecture diagram**: [`docs/architecture/mwa-intranet-architecture.svg`](docs/architecture/mwa-intranet-architecture.svg)
- **Contributing guide**: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- **Security policy**: [`docs/SECURITY.md`](docs/SECURITY.md)

---

## Tech Stack

- **Frontend/Server**: Next.js 14 (App Router), React 18, TailwindCSS  
- **Auth**: NextAuth (Microsoft Entra / Azure AD)  
- **DB/ORM**: PostgreSQL (Azure Flexible Server) + Prisma  
- **Hosting**: Azure App Service (Linux, Node 20)  
- **Secrets**: Azure Key Vault + Managed Identity  
- **CI/CD**: GitHub Actions (OneDeploy/Oryx to App Service)

---

## Local Development (quick start)

```bash
npm ci
npx prisma generate
npm run dev


asdfasdfadf
