# Feature 014 - Deployment Preparation

Branch: `feature/deployment-preparation`

## Goal

Prepare the app for deployment to the future subdomain.

## Scope

Configure production readiness.

## Requirements

- Confirm Vite production build works.
- Add deployment notes for Netlify or Vercel.
- Add live URL placeholder.
- Confirm asset paths work.
- Confirm no local-only assumptions.
- Add metadata where appropriate.

## Commands

- `npm run build`
- `npm run preview`
- `npm test`

## Acceptance Criteria

- Production build succeeds.
- App is deployable.
- README includes deployment notes.
- Future subdomain is documented.
