# UK Calculator Platform Production Deployment Runbook

## Overview
This runbook details the steps for deploying the UK Calculator Platform to production.

## Prerequisites
- Node.js 18+
- npm installed
- Vercel or other Next.js compatible hosting platform
- Environment variables configured (e.g. `NEXT_PUBLIC_BASE_URL`)

## Steps
1. Build the application: `npm run build`
2. Run tests to verify the build: `npm run test` and `npm run test:e2e`
3. Deploy to production environment using your standard CI/CD pipeline.
4. Verify environment variables are correctly populated in the production environment.
5. Perform smoke tests (see POST_DEPLOYMENT_SMOKE_TEST.md).
