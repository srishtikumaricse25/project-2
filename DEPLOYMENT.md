# Deployment Guide
## Donation & Reuse Platform — DonateEase

**Version:** 1.0

---

## 1. Environments

| Environment | Purpose | Infrastructure Notes |
|---|---|---|
| **Local** | Development | Docker Compose (Node.js, PostgreSQL/SQLite, Redis, local S3 storage) |
| **Staging** | QA / UAT / Pre-prod | Mirrors production config; seeded test dataset; isolated credentials |
| **Production** | Live Traffic | Containerized services, managed DB/Redis, S3 storage, automated backups, SSL/TLS |

---

## 2. Recommended Infrastructure Architecture

```
                       USERS / BROWSERS
                              │
                              ▼
                     Cloudflare / CDN
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
      Next.js Frontend                  API Gateway / ALB
   (Vercel / AWS Amplify)                      │
                                               ▼
                                      Containerized API
                                    (AWS ECS Fargate / GCP)
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
       Managed PostgreSQL                Managed Redis                   S3 Storage
      (AWS RDS / Supabase)          (ElastiCache / Upstash)           (AWS S3 / R2)
```

### Infrastructure Components
- **Frontend**: Next.js App Router deployed on Vercel or AWS Amplify with global CDN caching.
- **Backend API**: Stateless API routes / NestJS containerized with Docker, deployed behind an Application Load Balancer (ALB).
- **Database**: Managed PostgreSQL (AWS RDS / Supabase) with automated multi-AZ failover and daily snapshots.
- **Cache & Queue**: Managed Redis (AWS ElastiCache / Upstash) for session state, slot-locking, rate limiting, and background notification worker queue.
- **Object Storage**: S3-compatible storage (AWS S3 / Cloudflare R2) with private buckets and pre-signed URL access for item photos & verification papers.
- **DNS & Security**: Cloudflare / AWS Route 53 with automated SSL/TLS certificate renewal.

---

## 3. CI/CD Pipeline (GitHub Actions)

A GitHub Actions workflow `.github/workflows/ci-cd.yml` automates testing, building, and deployment:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Lint & Type Check
        run: npm run lint

      - name: Run Build Verification
        run: npm run build

  deploy-staging:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Staging Environment
        run: echo "Deploying to Staging..."

  deploy-production:
    needs: deploy-staging
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Production Environment
        run: echo "Deploying to Production..."
```

---

## 4. Environment Variables

Create a `.env.production` file on your hosting server (do not commit secrets to Git):

```env
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://donateease.org

# Database
DATABASE_URL=postgresql://user:password@rds-instance.amazonaws.com:5432/donateease?schema=public

# Cache & Redis
REDIS_URL=redis://default:secret@elasticache-instance.amazonaws.com:6379

# Authentication & Security
JWT_SECRET=super-secret-jwt-key-change-in-production-2026
JWT_REFRESH_SECRET=super-secret-refresh-key-2026

# Object Storage (S3)
STORAGE_BUCKET=donateease-uploads-prod
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=AKIAXXXXXXXXXXXXXXXX
STORAGE_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Third-Party Integrations
EMAIL_PROVIDER_API_KEY=re_1234567890
MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENTRY_DSN=https://xxxxxx@sentry.io/123456
```

---

## 5. Database Migrations Strategy

- Schema changes are managed via version-controlled migration scripts (`Prisma` / SQL scripts).
- Migrations execute automatically as a pre-deploy step in Staging.
- In Production, migrations are executed via a controlled CLI deployment step prior to traffic switching.
- **Zero-Downtime Rule**: Destructive operations (dropping columns or tables) must follow a two-release cycle:
  1. Release 1: Mark column as deprecated, make nullable, and update code to stop writing to it.
  2. Release 2: Remove column from database in a subsequent deploy.

---

## 6. Deployment & Release Workflow

1. **Feature Merge**: PR approved and merged into `main`.
2. **Automated Staging Deploy**: CI builds and deploys code to `staging.donateease.org`.
3. **QA & Smoke Tests**: Verify auth, donation submission, pickup scheduling, and NGO verification on staging.
4. **Release Tagging**: Tag release commit (e.g. `git tag v1.0.0 && git push origin v1.0.0`).
5. **Production Gate**: Manual approval granted in GitHub Environments.
6. **Production Deploy**: Automated container rollout and CDN cache purge.
7. **Post-Deploy Verification**: Execute production smoke test:
   - Login with donor/NGO/admin test accounts
   - Create test donation
   - Verify NGO verification queue and stats APIs

---

## 7. Rollback Strategy

If a critical P0 regression is detected post-deploy:

1. **Instant CDN & Traffic Rollback**: Revert load balancer / Vercel pointer to the previous deployment artifact.
2. **Container Rollback**: Redeploy the previous tagged Docker image (`v0.9.9`).
3. **Database Compatibility**: Since schema migrations follow zero-downtime guidelines, rolling back code will not break existing database constraints.

---

## 8. Monitoring & Observability

Post-deployment monitoring via Sentry, CloudWatch, and Grafana:
- **API Error Rates**: Alert if HTTP 5xx error rate > 0.5%.
- **Response Latency**: Alert if p95 API latency > 500ms.
- **Account Lockout Events**: Monitor frequency of HTTP 403 lockout triggers for security audits.
- **Database Connection Pool**: Alert on high pool exhaustion or lock contention.

---

## 9. Backup & Disaster Recovery Plan

- **Database Snapshots**: Automated daily full RDS snapshots with 30-day retention; continuous Point-In-Time Recovery (PITR) enabled.
- **Object Storage**: S3 bucket versioning and cross-region replication (CRR) enabled for verification documents and photos.
- **Recovery Targets**:
  - **RPO (Recovery Point Objective)**: < 5 minutes (via WAL archiving).
  - **RTO (Recovery Time Objective)**: < 1 hour.
- **Drills**: Quarterly automated restore verification drills in Staging.
