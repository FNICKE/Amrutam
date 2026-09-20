# Security Checklist And Threat Model

## Data Classification

- Highly sensitive: passwords, MFA secrets, refresh tokens, prescriptions, diagnoses, consultation notes.
- Sensitive: email, phone, profile data, doctor license numbers, payment IDs.
- Internal: audit logs, request IDs, operational metrics.
- Public: verified doctor listing fields intentionally exposed by APIs.

## Security Checklist

- Passwords are hashed with bcrypt.
- JWT access tokens are short-lived.
- Refresh tokens are persisted and rotated.
- RBAC middleware protects doctor and admin routes.
- Zod validation protects request payloads.
- Helmet sets baseline security headers.
- Global rate limiting reduces brute force and scraping risk.
- Request body size is limited.
- Idempotency keys are used for booking writes.
- Prisma parameterizes database queries.
- `.env` is ignored by Git and secrets are read from environment variables.
- `npm audit --audit-level=high` is part of CI.

## Required Production Hardening

- Enforce MFA for doctors and admins before launch.
- Store JWT secrets, SMTP credentials, and payment keys in a secret manager.
- Encrypt sensitive columns or use application-level envelope encryption for PHI fields.
- Rotate signing keys and secrets on a fixed schedule and on incident response.
- Add refresh token hashing at rest instead of storing raw refresh tokens.
- Add audit events for all privileged actions and sensitive data reads.
- Add dependency scanning with Dependabot or a security scanner.
- Add SAST and container image scanning in CI.
- Add TLS-only ingress, HSTS, and strict allowed origins.

## Attack Surface

- Public auth endpoints: credential stuffing, account enumeration, weak passwords.
- Doctor search: scraping, excessive filtering load.
- Booking writes: duplicate submissions and race conditions.
- Prescription APIs: unauthorized PHI access and tampering.
- Admin analytics and audit logs: privilege escalation and overbroad access.
- CI/CD and container images: vulnerable dependencies and leaked secrets.

## OWASP Mitigations

- Broken access control: central auth and RBAC middleware; ownership checks in services.
- Cryptographic failures: bcrypt passwords, TLS requirement, planned key rotation.
- Injection: Prisma query parameterization and strict validation.
- Insecure design: idempotency, transactions, and explicit state transitions.
- Security misconfiguration: Helmet, env validation, and production CORS allowlist.
- Vulnerable components: `npm audit` in CI and lockfile-based installs.
- Identification failures: short access token TTL, refresh rotation, planned MFA.
- Logging failures: structured logs and audit table for sensitive workflows.

## Threat Model Summary

| Threat | Impact | Mitigation |
| --- | --- | --- |
| Duplicate booking | Patient double-charged or slot oversold | Idempotency key and atomic slot claim |
| Stolen access token | Unauthorized PHI access | Short TTL, TLS, refresh rotation, MFA for elevated roles |
| Doctor impersonation | Fake prescriptions | RBAC, doctor verification, audit trail, digital signature placeholder |
| SQL injection | Data breach | Prisma and Zod validation |
| Admin account compromise | Broad data exposure | MFA, least privilege, audit logs, anomaly alerts |
| Dependency exploit | Remote code execution | Audit, lockfile, container scanning |
