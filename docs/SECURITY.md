### SECURITY.md (drop-in content)

```md
# Security Policy

## Reporting a vulnerability
If you believe you’ve found a security issue, please email **rick@marsdenwealth.com.au**.
Include a description, steps to reproduce, and potential impact. We aim to acknowledge within 2 business days.

## Supported versions
The production branch is `main`. Security fixes are applied to `main` and rolled out via CI/CD.

## Secrets & credentials
- **Do not** commit `.env*` files or credentials.
- Production secrets live in **Azure Key Vault**; the App Service uses **Managed Identity** with **Secrets Get/List** only.
- Rotate DB passwords and Entra client secrets per policy and update Key Vault references.

## Authentication & authorization
- AuthN: Microsoft Entra (Azure AD) via NextAuth.
- Admin access is gated by `ADMIN_EMAILS` allow-list (comma-separated emails).

## Dependencies
- Use `npm ci` and lockfile. Run `npm audit` periodically.
- Update critical vulnerabilities promptly; test sign-in and DB flows after upgrades.

## Incident response
1. Contain: Revoke exposed tokens/rotate keys (Key Vault), disable compromised accounts.
2. Eradicate: Patch vulnerabilities, remove malicious code, bump dependencies.
3. Recover: Redeploy clean build, verify logs and access.
4. Postmortem: Document timeline, fixes, and prevention steps.
````
