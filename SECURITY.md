# Security Policy

## Supported Versions

Currently, ProLink is in pre-release development. Security updates are applied to the main branch.

## Reporting a Vulnerability

Please report security vulnerabilities by emailing the project maintainer. **Do not create public GitHub issues** for security vulnerabilities.

We will acknowledge receipt within 48 hours and provide a timeline for the fix.

## Security Best Practices

### Authentication
- All sessions use **httpOnly cookies** (not localStorage) for JWT storage
- JWT tokens are verified using `jose` (Edge Runtime) and `jsonwebtoken` (Node.js)
- Passwords are hashed using **bcrypt** before storage
- Reset tokens are hashed before database storage

### API Security
- Rate limiting is applied to all endpoints (configurable per environment)
- Auth endpoints have stricter limits (5 requests/minute)
- CORS is configured to allow only the frontend origin
- Helmet.js is used for secure HTTP headers

### Payments
- Paystack integration uses secret keys from environment variables
- Escrow release requires milestone to be in 'funded' status
- Mock payment endpoints are disabled in production
- Transfer recipients are auto-created when providers save bank details

### Data Validation
- All inputs are validated using Zod schemas
- Bid amounts must be greater than 0
- Proposals must be at least 20 characters

### Development
- `console.log` is not used in production backend code
- Sensitive error details are hidden in production environments
- Environment variables are used for all secrets (JWT_SECRET, PAYSTACK_SECRET_KEY, etc.)
