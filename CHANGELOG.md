# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security & Trust (Phase 0)

#### Critical
- **#1**: Disabled `/api/payments/mock-confirm` in production — gated behind `NODE_ENV` check
- **#2**: Rate limiting applied to payment routes
- **#3**: Removed all `localStorage` token writes — auth now uses httpOnly cookies exclusively
  - Updated 16+ files across frontend and backend to use `withCredentials: true` for API calls and socket connections
  - Server-side socket middleware now falls back to reading token from cookie header
- **#4**: Replaced unsafe `atob` JWT decoding with `jose.jwtVerify` in Edge middleware
- **#6**: Fixed inconsistent password rules — backend now requires min 8 chars, uppercase, and number

#### High
- **#8**: Implemented real Paystack Transfer API for escrow release
  - Added `paystack_recipient_code` field to `BankAccount` model
  - Auto-create Paystack Transfer Recipient when providers save bank details
  - `releaseFunds` now validates milestone status and initiates real transfers
- **#9**: Removed `console.log` usage in backend controllers (already clean)

#### Medium
- **#11**: Bid amount validation (`> 0`) already implemented in `jobsService.js`

### Infrastructure
- Added `SECURITY.md`
- Added `CHANGELOG.md`
- Prisma migration generated for new `paystack_recipient_code` field
- `apiService.js` now sends cookies with `withCredentials: true`

## [Initial Release] - TBD
