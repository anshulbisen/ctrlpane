# Deployment

- Status: partial
- Last verified: 2026-03-12
- Scope: current operational reality for the ctrlpane repository

## Purpose

This runbook documents what is actually true today for local and single-node operation, alongside the planned two-machine topology. It does not claim that release automation, rollback, backup, or incident response are complete. Those are tracked in the [CI/CD Design spec](../architecture/cicd-design.md).

## Current Runtime Model

ctrlpane currently runs as supervised local processes on Mac Studio plus Docker-managed infrastructure. The two-machine topology (Mac Studio dev + Kali production) is planned but not yet implemented.

### Application Processes

From `process-compose.yml` (development on Mac Studio):

| Process | Port | Description |
|---------|------|-------------|
| `api` | 33001 | Hono.js API server on Bun |
| `web` | 33000 | React/Vite dev server (dev) or Bun static server (production) |

### Infrastructure Services

From `docker-compose.yml`:

| Service | Port | Description |
|---------|------|-------------|
| Postgres 17 | 35432 | Primary data store with RLS, multi-tenant |
| Redis 7 | 36379 | Session cache, rate limiting, ephemeral state |
| NATS JetStream | 34222 | Event streaming, transactional outbox |
| Centrifugo v5 | 38000 | WebSocket server for realtime updates |

### Production Services (Planned -- Kali)

Once the two-machine topology is implemented:

| Service | Port | Manager | systemd Unit |
|---------|------|---------|-------------|
| API | 33001 | systemd | `ctrlpane-api.service` |
| Web | 33000 | systemd | `ctrlpane-web.service` |
| Postgres 17 | 35432 | Docker Compose | `docker-compose@ctrlpane.service` |
| Redis 7 | 36379 | Docker Compose | `docker-compose@ctrlpane.service` |
| NATS JetStream | 34222 | Docker Compose | `docker-compose@ctrlpane.service` |
| Centrifugo v5 | 38000 | Docker Compose | `docker-compose@ctrlpane.service` |

## Primary Commands

### Development and Local Supervision

```bash
# Start all services (process-compose + Docker infra)
bun run dev

# Check service status
bun run dev:status

# View logs
bun run dev:logs

# Stop all services
bun run dev:stop
```

### Infrastructure

```bash
# Start/stop Docker infrastructure (Postgres, Redis, NATS, Centrifugo)
bun run db:up
bun run db:down
```

### Verification Gates

```bash
# Run all checks (lint + typecheck + test)
bun run check

# Individual checks
bun run typecheck
bun run test
bun run lint
```

### Database

```bash
# Run migrations
bun run db:migrate

# Generate migration from schema changes
bun run db:generate

# Open Drizzle Studio (database browser)
bun run db:studio
```

## Health Endpoints

Current health routes are mounted in `apps/api/src/index.ts`:

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `/health` | Combined health | `200 { ok: true }` or `503` |
| `/health/live` | Process liveness | `200 { ok: true }` |
| `/health/ready` | Dependency readiness | `200 { db: true, redis: true, nats: true }` or `503` |

**Important current limitation:**
- Readiness and combined health may not yet be fully dependency-truthful
- Treat them as process placeholders until readiness hardening is complete

## Observability

The shared observability stack lives outside this repo in `~/projects/personal/dev-infra/`.

`process-compose.yml` invokes:

```bash
$HOME/projects/personal/dev-infra/scripts/ensure.sh
```

before starting the app stack.

If the stack is down, local development can still continue, but traces and metrics may be absent or degraded.

## Production Deploy (Planned)

Once the CI/CD pipeline is implemented, production deploys will follow this flow:

### Automated Deploy (via GitHub Actions)

```
1. Agent merges PR to main
2. Changesets creates "Version Packages" PR
3. Version Packages PR is merged
4. release.yml workflow triggers on Kali:
   a. turbo run build --filter=...[HEAD~1]
   b. Per changed app:
      - pg_dump (pre-deploy snapshot)
      - rclone sync snapshot to Google Drive
      - bun run db:migrate
      - Copy build to /opt/ctrlpane/{app}/releases/{version}/
      - systemctl stop ctrlpane-{app}
      - ln -sfn releases/{version} {app}/current
      - systemctl start ctrlpane-{app}
      - Health check
   c. Telegram notification
```

### Manual Deploy (Emergency)

If the CI/CD pipeline is unavailable, deploy manually on Kali:

```bash
# SSH into Kali
ssh kali

# Pull latest code
cd /opt/ctrlpane/repo
git pull origin main

# Install dependencies
bun install --frozen-lockfile

# Build
bun run build

# Pre-deploy database backup
pg_dump -h localhost -p 35432 -U ctrlpane_app ctrlpane | gzip > /opt/ctrlpane/backups/manual-$(date +%Y%m%d-%H%M%S).sql.gz

# Run migrations
bun run db:migrate

# Deploy API
cp -r apps/api/dist/* /opt/ctrlpane/api/releases/manual-$(date +%Y%m%d)/
systemctl stop ctrlpane-api
ln -sfn /opt/ctrlpane/api/releases/manual-$(date +%Y%m%d) /opt/ctrlpane/api/current
systemctl start ctrlpane-api

# Deploy Web
cp -r apps/web/dist/* /opt/ctrlpane/web/releases/manual-$(date +%Y%m%d)/
systemctl stop ctrlpane-web
ln -sfn /opt/ctrlpane/web/releases/manual-$(date +%Y%m%d) /opt/ctrlpane/web/current
systemctl start ctrlpane-web

# Verify
curl -sf http://localhost:33001/health
curl -sf http://localhost:33000/health
```

## Rollback (Planned)

### Automated Rollback (via GitHub Actions)

```
GitHub -> Actions -> "Rollback Production" -> Run workflow
  Select app: [api | web]
  Select version: [dropdown of available releases]
  Restore database?: [yes | no]
```

### Manual Rollback

```bash
# SSH into Kali
ssh kali

# List available releases
ls -la /opt/ctrlpane/api/releases/
ls -la /opt/ctrlpane/web/releases/

# Check current version
readlink /opt/ctrlpane/api/current
readlink /opt/ctrlpane/web/current

# Rollback API to a previous version
systemctl stop ctrlpane-api
ln -sfn /opt/ctrlpane/api/releases/{previous-version} /opt/ctrlpane/api/current
systemctl start ctrlpane-api

# Rollback Web to a previous version
systemctl stop ctrlpane-web
ln -sfn /opt/ctrlpane/web/releases/{previous-version} /opt/ctrlpane/web/current
systemctl start ctrlpane-web

# If database rollback is needed:
gunzip -c /opt/ctrlpane/backups/{app}@{version}-pre-deploy.sql.gz | psql -h localhost -p 35432 -U ctrlpane_app ctrlpane

# Verify
curl -sf http://localhost:33001/health
curl -sf http://localhost:33000/health
```

## Checking Logs

### Development (Mac Studio)

```bash
# All process-compose logs
bun run dev:logs

# Specific process logs
bun run dev:logs -- --process api
bun run dev:logs -- --process web
```

### Production (Kali -- Planned)

```bash
# API logs
journalctl -u ctrlpane-api -f
journalctl -u ctrlpane-api --since "1 hour ago"

# Web logs
journalctl -u ctrlpane-web -f

# Docker infrastructure logs
docker compose -f /opt/ctrlpane/docker-compose.prod.yml logs -f postgres
docker compose -f /opt/ctrlpane/docker-compose.prod.yml logs -f redis
docker compose -f /opt/ctrlpane/docker-compose.prod.yml logs -f nats
docker compose -f /opt/ctrlpane/docker-compose.prod.yml logs -f centrifugo

# All ctrlpane systemd units
journalctl -u 'ctrlpane-*' --since "1 hour ago"
```

## Service Management (Kali -- Planned)

```bash
# Check status of all ctrlpane services
systemctl status ctrlpane-api ctrlpane-web

# Restart a specific service
systemctl restart ctrlpane-api

# Stop/start
systemctl stop ctrlpane-api
systemctl start ctrlpane-api

# Docker infrastructure
docker compose -f /opt/ctrlpane/docker-compose.prod.yml ps
docker compose -f /opt/ctrlpane/docker-compose.prod.yml restart postgres
```

## Backup Verification (Planned)

```bash
# Check latest backup
ls -lht /opt/ctrlpane/backups/ | head -5

# Check Google Drive sync status
rclone ls ctrlpane-gdrive:ctrlpane-backups/pg-dumps/ --max-depth 1 | tail -5

# Verify backup integrity (restore to a test schema)
gunzip -c /opt/ctrlpane/backups/latest.sql.gz | psql -h localhost -p 35432 -U ctrlpane_app -d ctrlpane -c "CREATE SCHEMA backup_test;" -c "SET search_path TO backup_test;" -f -
# ... verify data ...
psql -h localhost -p 35432 -U ctrlpane_app -d ctrlpane -c "DROP SCHEMA backup_test CASCADE;"
```

## What Is Not Yet Ready

The following are not yet implemented as trustworthy operational paths in this repo:

- **Two-machine topology** -- production still runs on Mac Studio as dev servers
- **systemd service units** -- planned for Kali, not yet created
- **GitHub Actions CI/CD workflows** -- planned, not yet implemented
- **Changesets versioning** -- planned, not yet configured
- **Release automation** -- no automated versioning or deploy pipeline
- **Rollback automation** -- no workflow dispatch rollback yet
- **PR preview environments** -- planned for Kali, not yet implemented
- **Backup automation** -- no scheduled pg_dump or rclone sync
- **External monitoring** -- no Cloudflare health checks or GitHub Actions cron
- **Telegram notifications** -- planned, not yet integrated with CI/CD
- **Turborepo remote cache** -- planned for Kali, not yet running

Do not assume any of these exist because design docs or plans mention them.

## Deployment Truth Rules

- Prefer `process-compose.yml`, `docker-compose.yml`, and `package.json` over older narrative docs
- If a command is not present in `package.json` or a checked-in script, do not document it as available
- If a route is not mounted in `apps/api/src/index.ts`, do not document it as live
- Planned items are clearly marked with "(Planned)" throughout this document

## Related Docs

- [CI/CD Design](../architecture/cicd-design.md) -- full release pipeline design
- [Deployment Architecture](../architecture/deployment-architecture.md) -- two-machine topology
- [ADR-007 Resilience & Deployment](../decisions/ADR-007-resilience-and-deployment.md) -- resilience patterns (still valid), deployment strategy (superseded by ADR-008)
- [ADR-008 CI/CD Deployment](../decisions/ADR-008-cicd-deployment.md) -- decision record for two-machine topology
- [Architecture README](../architecture/README.md) -- system overview
