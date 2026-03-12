# ADR-008: CI/CD and Two-Machine Deployment Architecture

- Status: Accepted
- Date: 2026-03-12
- Decision-Makers: Anshul
- Consulted: LifeOS ADR-035 (homelab CI/CD deployment), LifeOS CI/CD design spec, GitHub Actions documentation, Changesets documentation
- Supersedes: ADR-007 Decision 5 (single-machine launchd deployment)

## Context and Problem Statement

ctrlpane runs as Bun dev servers on a Mac Studio, exposed via Cloudflare Tunnel as "production." During active multi-agent development (3-5 concurrent Claude Code sessions), these servers are unstable -- frequent restarts, hot-reload failures, occasional crashes. A stable production deployment is needed that survives dev churn.

ADR-007 Decision 5 established a single-machine deployment model with launchd and a manual `deploy.sh` script. This was appropriate when ctrlpane had no CI/CD infrastructure. With LifeOS establishing a two-machine topology on the same home lab, ctrlpane should adopt the same pattern for consistency, reliability, and shared infrastructure efficiency.

Two homelab machines are available:
- **Mac Studio** (M4 Max, 128GB RAM, 1.8TB SSD) -- currently running everything
- **Kali Linux server** (i7-12700H, 64GB RAM, 1TB NVMe) -- running LifeOS production + GitHub runners

Additionally, the project lacks:
- A release pipeline (no versioning, no changelogs, no rollback)
- Mechanical enforcement of code quality beyond pre-commit hooks
- PR preview environments for testing features before merge
- Off-site backups and external monitoring

## Decision Drivers

- Production stability: must survive dev server crashes and restarts
- Migration safety: dev operations must not affect production data
- Resource efficiency: both machines should be utilized optimally
- Consistency with LifeOS: shared patterns, shared infrastructure, reduced cognitive overhead
- Multi-tenant from day one: production reliability matters earlier than for single-user apps
- AI agents are the primary developers: mechanical enforcement over documentation

## Considered Options

### Option 1: Continue Single-Machine (Mac Studio Only)

Keep the ADR-007 Decision 5 model: Mac Studio runs both dev and production via launchd.

- **Pro:** Simple, no network dependency, already partially set up
- **Con:** Shared failure domain -- dev crashes break production. No CI/CD. No off-site backups. Bad migrations kill production database.

### Option 2: Kali Production with Shared Infrastructure

Kali runs app servers, shares Mac Studio's Postgres/Redis/NATS.

- **Pro:** Uses idle Kali capacity, process isolation
- **Con:** Shared Postgres means bad dev migrations still break production. Shared Docker lifecycle risk. Does not solve the data isolation problem.

### Option 3: Kali Production with Dedicated App Infra (Chosen)

Kali runs its own Postgres/Redis/NATS plus app servers for ctrlpane. Only AI inference and observability shared from Mac Studio.

- **Pro:** Complete data isolation, dedicated resources, dev cannot break production, uses idle machine optimally, consistent with LifeOS pattern
- **Con:** Two infrastructure stacks to maintain (but production infra is set-and-forget)

## Decision Outcome

**Chosen option: Option 3 (Kali Production with Dedicated App Infra)**

This mirrors the LifeOS decision (ADR-035) and shares the same rationale.

### Rationale

1. **Migration safety is the deciding factor.** Shared Postgres (Options 1, 2) means a bad `ALTER TABLE DROP COLUMN` or `docker compose down` in dev kills production. Option 3 eliminates this entirely.

2. **Resource headroom is massive.** Kali uses ~5-8% of 64GB RAM with LifeOS production. Adding ctrlpane production adds ~2-3GB. Still under 15% utilization.

3. **Infrastructure duplication is minimal.** Postgres (165MB) + Redis (10MB) + NATS (20MB) + Centrifugo (30MB) = ~225MB. Negligible on a 64GB machine.

4. **Observability stays shared** because it is read-only telemetry ingestion. A dev action cannot corrupt production metrics/logs/traces. One Grafana with environment and app labels is simpler than separate stacks.

5. **AI inference must stay on Mac Studio** -- 128GB RAM is required for the LLM models. ~1ms LAN latency is imperceptible when inference takes 2-10 seconds.

6. **Consistency with LifeOS** reduces cognitive overhead. Same patterns, same toolchain, same machine roles. Learning one project's deployment model teaches you both.

### Infrastructure Split

| Component | Machine | Rationale |
|-----------|---------|-----------|
| Production app servers (API, Web) | Kali | Stability isolation from dev |
| Production Postgres | Kali | Migration safety isolation |
| Production Redis | Kali | Cache isolation |
| Production NATS + Centrifugo | Kali | Event stream isolation |
| Production Cloudflare Tunnel | Kali | Direct routing, no middleman |
| GitHub runner (ctrlpane) | Kali | Build + deploy on same machine (shared runner with LifeOS) |
| Dev servers | Mac Studio | Active development |
| Dev infrastructure | Mac Studio | Existing setup unchanged |
| AI inference (vllm-mlx, Ollama) | Mac Studio | 128GB RAM required |
| Observability (Grafana stack) | Mac Studio | Shared dashboards, environment + app labels |

### Port Convention

ctrlpane uses port prefix `3` on both machines. LifeOS uses prefix `2`. No port conflicts.

| Service | ctrlpane Port | LifeOS Port |
|---------|--------------|-------------|
| Web | 33000 | 23000 |
| API | 33001 | 23001 |
| Postgres | 35432 | 25432 |
| Redis | 36379 | 26379 |
| NATS | 34222 | 24222 |
| Centrifugo | 38000 | 28000 |

### CI/CD Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CI/CD platform | GitHub Actions (self-hosted runner on Kali) | Standard, shared runner with LifeOS |
| Versioning | Changesets | Per-app versioning, monorepo-native |
| Commit format | Conventional Commits (commitlint + Lefthook) | Machine-readable, required by changesets |
| Build orchestration | Turborepo | Selective builds, remote cache |
| Process management (production) | systemd | Native Linux, auto-restart, logging |
| Process management (dev) | process-compose | Multi-process orchestration |
| Branching strategy | main-only with feature branches | Standard GitHub flow for AI agents |
| Backup destination | Google Drive via rclone | Off-site, 2TB capacity, free |
| External monitoring | Cloudflare Health Checks + GitHub Actions cron | Runs outside home lab power domain |
| Notifications | Telegram Bot API | Already integrated |

### Consequences

**Good:**
- Production survives any dev operation including Docker restarts, bad migrations, server crashes
- Kali goes from ~5% to ~10% utilization -- better resource use
- Mac Studio freed from production responsibility -- focus on dev + AI
- Consistent deployment model across ctrlpane and LifeOS
- Mechanical enforcement (7 layers) prevents agents from shipping broken code
- PR preview environments enable manual testing before merge

**Bad:**
- Two sets of Postgres/Redis/NATS/Centrifugo to maintain per project (but production infra is set-and-forget after initial setup)
- Database schema must be migrated in both environments (pipeline handles production, dev is manual)
- LAN must stay reliable for AI inference calls (Kali -> Mac Studio)
- Port space is getting crowded on Kali (two projects, up to 6 preview slots combined)

**Neutral:**
- Cloudflare DNS configuration for ctrlpane.com (one-time)
- GitHub runner label configuration for ctrlpane repo (one-time)
- ADR-007 Decision 5 is superseded but Decisions 1-4 (resilience patterns) remain valid

### What This Supersedes in ADR-007

ADR-007 Decision 5 established:
- launchd as the production process manager on Mac Studio
- A manual `deploy.sh` script with three phases (expand/deploy/contract)
- Git-tag-based releases

This ADR replaces those with:
- systemd on Kali (Linux, not macOS)
- GitHub Actions automated CI/CD pipeline
- Changesets-based versioning with symlink deployments
- The expand/contract migration pattern from ADR-007 remains valid -- it is now executed by the CI/CD pipeline instead of a manual script

### Irreversible Decisions

1. **Port prefix `3` for ctrlpane production on Kali** -- committed once Cloudflare Tunnel is configured
2. **Kali as production host** -- switching machines requires re-plumbing infra + tunnels
3. **GitHub Actions as CI/CD platform** -- workflow files committed to repo
4. **Changesets for versioning** -- changelog format and version history are permanent

## More Information

- Design spec: [CI/CD Design](../architecture/cicd-design.md)
- Deployment architecture: [Deployment Architecture](../architecture/deployment-architecture.md)
- Deployment runbook: [Deployment Runbook](../runbooks/deployment.md)
- ADR-007: [Resilience Patterns & Deployment](./ADR-007-resilience-and-deployment.md) (Decisions 1-4 remain valid)
- LifeOS precedent: LifeOS ADR-035 (homelab CI/CD deployment)
- Port convention: `~/.claude/CLAUDE.md` Port Allocation Convention
