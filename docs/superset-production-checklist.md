# Production-Grade Enterprise Readiness — The Complete Superset Checklist

**Version:** 1.0 — Final Merged Edition
**Purpose:** A single, standardized checklist for evaluating and ensuring the production-grade enterprise readiness of any software system. Intended to be used as a living reference across all projects.

**Sources synthesized:** 12-Factor App, Beyond the 12-Factor App (Kevin Hoffman), AWS Well-Architected Framework, Azure Well-Architected Framework, Google SRE Handbook, CNCF Cloud Native Principles, OWASP Top 10, OWASP ASVS, NIST Cybersecurity Framework (CSF 2.0), NIST SSDF, SLSA Framework, OpenSSF Scorecard, SOC 2, ISO 27001, HIPAA, PCI DSS, FedRAMP, GDPR, CCPA, Reactive Manifesto, CIS Benchmarks, Release It! (Michael Nygard), Accelerate / DORA Metrics, The Pragmatic Programmer, Team Topologies, and broader DevOps / SRE / FinOps community practices.

---

## How to Use This Checklist

Not every item applies to every system. Use judgment based on your context, risk profile, and regulatory requirements. However, every section heading should be *considered* — even if specific items are intentionally skipped, that skip should be a conscious decision, not an oversight.

Recommended approach:
1. Start a new project or readiness review by walking through every section heading.
2. For each section, identify which items apply given your system's criticality, data sensitivity, and compliance obligations.
3. Mark items as Required, Recommended, or Not Applicable.
4. Track completion over time. Revisit quarterly.

---

## 1. PRODUCT, BUSINESS, AND SERVICE READINESS

*Before anything technical, ensure the business context is clear.*

- [ ] Product scope, target users, and critical user journeys are clearly defined
- [ ] SLAs, SLOs, and support expectations are documented and agreed with stakeholders
- [ ] Service tiers, entitlements, and usage limits are defined
- [ ] Non-functional requirements are documented: availability, latency, throughput, durability, retention
- [ ] Launch criteria and go-live gates are documented (what must be true before production traffic)
- [ ] Customer support ownership is assigned (who handles tickets, escalations, on-call)
- [ ] Business continuity expectations are documented (what happens if this system is down for 1h / 24h / 1w)
- [ ] Legal, contractual, and regulatory obligations are identified
- [ ] Revenue impact and business criticality tier are classified (Tier 1 / 2 / 3)
- [ ] Stakeholder sign-off process exists for launch and major changes

---

## 2. ARCHITECTURE AND SYSTEM DESIGN

- [ ] Architecture diagrams are current (C4 model or equivalent, covering context, container, component levels)
- [ ] Architecture Decision Records (ADRs) exist for all major decisions
- [ ] Domain boundaries and service boundaries are clear and documented
- [ ] Monolith / modular monolith / microservices choice is intentional and justified
- [ ] Synchronous vs asynchronous communication boundaries are documented
- [ ] Scalability model is defined (what scales, how, and to what limit)
- [ ] Failure domains are isolated (a failure in subsystem A does not cascade to B)
- [ ] Tenancy model is documented (single-tenant, multi-tenant, hybrid)
- [ ] Data flow diagrams exist for all major flows
- [ ] Threat modeling is performed (STRIDE, PASTA, or equivalent)
- [ ] Single points of failure are identified and mitigated
- [ ] Architecture review gate exists before implementation begins
- [ ] Production readiness review gate exists before launch
- [ ] Dependency map exists: which services depend on what, with criticality ratings

---

## 3. CODEBASE AND VERSION CONTROL

*12-Factor: I — One codebase tracked in revision control, many deploys.*

- [ ] One codebase in version control, many deploys
- [ ] All application code, IaC, policies, config schemas, and automation scripts are version-controlled
- [ ] Branching and release strategy are documented and enforced (trunk-based, GitFlow, etc.)
- [ ] CODEOWNERS file defined for critical paths
- [ ] Commit signing enabled (GPG or SSH)
- [ ] Repository permissions follow least privilege
- [ ] Pre-commit and pre-push hooks enforce linting, formatting, and secret scanning
- [ ] Secret scanning enabled in CI and repository settings
- [ ] Protected branches required for critical repos (main, release branches)
- [ ] Code review rules and approval thresholds are defined and enforced
- [ ] Monorepo vs polyrepo decision is intentional and documented

---

## 4. DEPENDENCY AND SUPPLY-CHAIN SECURITY

*12-Factor: II — Explicitly declare and isolate dependencies.*

- [ ] All dependencies explicitly declared and isolated
- [ ] Lock files committed (package-lock.json, Pipfile.lock, go.sum, etc.)
- [ ] Dependency vulnerability scanning automated in CI (Snyk, Dependabot, Trivy, etc.)
- [ ] Software Bill of Materials (SBOM) generated and stored per release
- [ ] Build provenance generated for all release artifacts
- [ ] SLSA target level defined per system (Level 1 minimum, Level 2+ for critical systems)
- [ ] Artifact signing and verification enforced before deploy
- [ ] Private artifact registry used for internal packages
- [ ] Dependency update cadence defined (weekly/monthly automated PRs)
- [ ] Transitive dependency tree reviewed for supply chain risk
- [ ] License compliance audited and enforced (no GPL in proprietary code, etc.)
- [ ] OpenSSF Scorecard or equivalent dependency trust checks applied to critical dependencies
- [ ] Critical dependencies have contingency plans (vendoring, forks, or alternatives identified)

---

## 5. SECURE SOFTWARE DEVELOPMENT LIFECYCLE (SSDF)

*NIST SSDF — Embedding security into every phase of development, not just testing.*

- [ ] Secure SDLC is defined, documented, and adopted across teams
- [ ] NIST SSDF practices are mapped into the engineering workflow
- [ ] Security requirements are defined during planning (not retrofitted)
- [ ] Security design review occurs before implementation of significant features
- [ ] Mandatory secure code review exists for security-sensitive changes
- [ ] Security testing is shift-left: integrated into CI, not just a pre-release gate
- [ ] Release security gate is defined (what security criteria must pass before deploy)
- [ ] Vulnerability intake, triage, and remediation workflow exists with SLA by severity
- [ ] Security training exists for engineers (at least annual, role-appropriate)
- [ ] Security exceptions require documented approval with expiry dates
- [ ] Third-party code and open-source contributions follow the same security review standards

---

## 6. CONFIGURATION AND SECRETS MANAGEMENT

*12-Factor: III — Store config in the environment.*

- [ ] Configuration is externalized from code (no hardcoded connection strings, URLs, or credentials)
- [ ] Secrets are managed in a dedicated vault (HashiCorp Vault, AWS Secrets Manager, etc.)
- [ ] Configuration schema validation happens at startup (fail fast on bad config)
- [ ] Safe and secure defaults are enforced (deny by default)
- [ ] Configuration changes are audited (who changed what, when)
- [ ] Environment config parity is preserved (same schema across dev/staging/prod)
- [ ] No config drift across instances — config is centralized or templated
- [ ] Feature flags system in place for progressive rollouts and kill switches
- [ ] Secret rotation is automated where possible
- [ ] Emergency secret rotation process exists and is tested
- [ ] Break-glass access is controlled, time-bound, and logged
- [ ] Sensitive configuration values are encrypted at rest and in transit

---

## 7. BACKING SERVICES AND INTEGRATIONS

*12-Factor: IV — Treat backing services as attached resources.*

- [ ] All backing services (databases, caches, queues, SMTP, object storage) are treated as attached resources, swappable via config
- [ ] Service contracts (API schemas, message formats) are documented for each integration
- [ ] Connection pooling configured with proper limits and timeouts
- [ ] Health checks implemented for all backing service connections
- [ ] Retry logic uses exponential backoff with jitter (no thundering herd)
- [ ] Circuit breakers in place for all external service calls
- [ ] Bulkhead pattern isolates failures between backing services
- [ ] Graceful degradation paths exist (reduced functionality > total failure)
- [ ] Dead-letter queues or equivalent handling exist for failed async processing
- [ ] External dependency SLAs and business criticality are documented
- [ ] Third-party risk review exists for key vendors and sub-processors
- [ ] Connection credentials can rotate without downtime

---

## 8. BUILD, RELEASE, AND ARTIFACT MANAGEMENT

*12-Factor: V — Strictly separate build, release, and run stages.*

- [ ] Build, release, and run stages are strictly separated
- [ ] Builds are reproducible (same commit → same artifact, deterministically)
- [ ] Every release has a unique, immutable identifier (semantic version, SHA, timestamp)
- [ ] Releases are immutable — rollback by deploying a previous release, not by patching in place
- [ ] Artifact registry is used for all build outputs (Docker registry, Nexus, etc.)
- [ ] Build pipeline includes: lint → test → SAST → build → publish
- [ ] Pipelines are defined as code (Jenkinsfile, GitHub Actions, etc.)
- [ ] Build provenance is retained and traceable to source commit
- [ ] Container images / base images are hardened, minimal, and regularly updated
- [ ] Release metadata is traceable: commit SHA → build → artifact → deploy
- [ ] Rollback path is documented and tested (< 5 minute target)
- [ ] No manual steps in the build/release pipeline

---

## 9. RUNTIME PROCESSES AND STATE

*12-Factor: VI, IX — Execute the app as stateless processes; maximize robustness with fast startup and graceful shutdown.*

- [ ] Workloads are stateless where possible
- [ ] All persistent state is externalized (databases, caches, object stores)
- [ ] No local filesystem dependency for durable state
- [ ] Graceful startup: dependency checks, warming, readiness signaling
- [ ] Graceful shutdown: drain connections, finish in-flight requests, release resources
- [ ] SIGTERM-safe behavior exists (handle preemption at any time)
- [ ] Processes are disposable — can be started/stopped at a moment's notice
- [ ] Horizontal scaling works by adding processes, not bigger machines
- [ ] Session state is externalized (no sticky sessions)
- [ ] Crash recovery does not corrupt shared state
- [ ] Startup time is minimized (< 30 seconds target)

---

## 10. NETWORKING, EDGE, AND TRAFFIC MANAGEMENT

*12-Factor: VII — Export services via port binding.*

- [ ] App is self-contained and exports services via explicit port binding
- [ ] TLS/HTTPS enforced for all external-facing endpoints
- [ ] Internal service-to-service communication encrypted (mTLS or service mesh)
- [ ] Network segmentation and policies implemented (namespace isolation, security groups)
- [ ] Zero-trust networking assumptions applied (no implicit trust based on network location)
- [ ] API gateway or ingress controller exists for external traffic
- [ ] Rate limiting, quotas, and abuse protection configured
- [ ] DDoS protections in place for public endpoints
- [ ] DNS-based service discovery standardized (not hardcoded IPs)
- [ ] Maintenance mode / fail-safe traffic controls exist (drain, redirect, block)
- [ ] Load balancing strategy defined and tested (round-robin, least-connections, weighted, etc.)

---

## 11. API AND INTERFACE DESIGN

*Beyond 12-Factor: XIII — API-first design.*

- [ ] API contracts defined before implementation (OpenAPI, GraphQL schema, protobuf)
- [ ] API versioning strategy defined and enforced (URL path, header, or content negotiation)
- [ ] Backward compatibility rules documented (what constitutes a breaking change)
- [ ] Deprecation policy defined with timeline and communication plan
- [ ] Consistent error response model across all endpoints
- [ ] Pagination, filtering, sorting, and field projection standards exist
- [ ] Idempotency keys supported for mutating operations
- [ ] Contract tests exist between service boundaries (Pact, etc.)
- [ ] API documentation auto-generated, versioned, and kept in sync with code
- [ ] Webhook / event contracts are versioned and signed where needed
- [ ] Rate limiting and throttling configured per-client / per-tier

---

## 12. IDENTITY, AUTHENTICATION, AND AUTHORIZATION

*Beyond 12-Factor: XV — Authentication and authorization.*

- [ ] Authentication architecture is defined (OAuth 2.0, OIDC, SAML, etc.)
- [ ] Authorization model is defined and implemented: RBAC, ABAC, ReBAC, or policy-as-code (OPA)
- [ ] Principle of least privilege enforced at every layer
- [ ] Multi-factor authentication supported/enforced for privileged access
- [ ] SSO integration available for enterprise customers
- [ ] Service-to-service authentication implemented (mTLS, service accounts, workload identity)
- [ ] Token management: short expiry, refresh tokens, revocation support
- [ ] Session invalidation and concurrent session limits supported
- [ ] All authentication and authorization events are audited
- [ ] Access reviews occur regularly (quarterly minimum for privileged access)
- [ ] JIT (Just-In-Time) access and break-glass processes are documented and tested
- [ ] API keys are scoped, rotatable, and revocable

---

## 13. APPLICATION SECURITY VERIFICATION

*OWASP ASVS, OWASP Top 10, NIST CSF.*

- [ ] OWASP ASVS target level is defined (Level 1 minimum, Level 2 for most production systems)
- [ ] OWASP Top 10 mitigations are implemented and verified
- [ ] Threat modeling completed for all major attack surfaces
- [ ] Server-side input validation enforced on all user-supplied data
- [ ] Output encoding applied correctly to prevent injection
- [ ] Defenses verified for: CSRF, SSRF, injection (SQL/NoSQL/LDAP/OS), XSS, insecure deserialization, broken access control
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] CORS policy configured restrictively
- [ ] WAF rules defined and tuned for public endpoints
- [ ] Penetration testing performed on schedule (at least annually, after major changes)
- [ ] Security findings tracked to remediation with SLA by severity
- [ ] Static Application Security Testing (SAST) in CI pipeline
- [ ] Dynamic Application Security Testing (DAST) against staging
- [ ] Software Composition Analysis (SCA) for dependency vulnerabilities
- [ ] Container image scanning before deploy
- [ ] Infrastructure security scanning (CIS Benchmarks, ScoutSuite, Prowler)
- [ ] Vulnerability disclosure program exists (security.txt, bug bounty, or coordinated disclosure)

---

## 14. DATA MANAGEMENT, GOVERNANCE, AND PRIVACY

- [ ] Data classification policy exists and is applied (public, internal, confidential, restricted)
- [ ] Data inventory exists (what data is stored, where, by whom, for how long)
- [ ] PII, PHI, and PCI data are identified and access-controlled
- [ ] Data retention and deletion policies exist and are automated where possible
- [ ] Right-to-erasure (data deletion) workflows exist and are testable
- [ ] Data lineage is documented for critical data flows (where data comes from, where it goes)
- [ ] Non-production data is anonymized or synthesized (never production PII in staging)
- [ ] Schema evolution strategy is zero-downtime (expand-contract pattern)
- [ ] Database backups are automated and restore is regularly tested
- [ ] Recovery Point Objective (RPO) and Recovery Time Objective (RTO) are defined
- [ ] Point-in-time recovery (PITR) is supported where needed
- [ ] Audit logging exists for all data access and modification
- [ ] Data residency / regional sovereignty requirements are documented and enforced
- [ ] Database connection pooling with limits and health checks
- [ ] Read/write splitting or sharding strategy defined for scale
- [ ] Multi-region replication for disaster recovery if required
- [ ] Database query performance monitored (slow queries, replication lag)
- [ ] Data consistency model documented (strong, eventual, causal)
- [ ] Data Processing Agreements (DPAs) in place with all sub-processors

---

## 15. RELIABILITY, RESILIENCE, AND RECOVERY

*Google SRE, Release It!, Chaos Engineering, Reactive Manifesto.*

- [ ] SLIs (Service Level Indicators) defined for each critical user journey
- [ ] SLOs (Service Level Objectives) defined with error budgets
- [ ] Error budget policy defined (what happens when budget is exhausted)
- [ ] Capacity planning is proactive (not just reactive auto-scaling)
- [ ] Timeouts configured for every network call (no unbounded waits)
- [ ] Retries are bounded, safe, and use exponential backoff with jitter
- [ ] Circuit breakers prevent cascading failures
- [ ] Bulkhead pattern isolates failure domains
- [ ] Load shedding: under extreme load, reject lowest-priority work
- [ ] Backpressure mechanisms exist for async pipelines
- [ ] Queue depth and async failure handling are monitored
- [ ] Multi-AZ or multi-region resilience implemented based on SLA requirements
- [ ] Disaster recovery strategy matches business criticality
- [ ] Chaos experiments or fault injection are performed regularly
- [ ] Game days / DR drills are run (at least quarterly for critical systems)
- [ ] Recovery procedures are rehearsed, not just documented
- [ ] No single points of failure in the architecture
- [ ] No untested failover assumptions remain
- [ ] Thundering herd prevention exists (staggered retries, cache stampede protection)

---

## 16. OBSERVABILITY AND TELEMETRY

*Beyond 12-Factor: XIV — Telemetry. 12-Factor: XI — Treat logs as event streams.*

- [ ] The three pillars are implemented: Logs, Metrics, Traces
- [ ] OpenTelemetry is the default telemetry standard (or explicit justification for alternative)
- [ ] Structured logging (JSON) with consistent fields (timestamp, level, service, trace_id)
- [ ] Logs written to stdout/stderr, aggregated externally
- [ ] Context propagation and correlation IDs enforced across all service boundaries
- [ ] Distributed tracing implemented end-to-end
- [ ] Metrics exported in standard format (Prometheus, OTLP, StatsD)
- [ ] Error tracking integrated with deduplication and alerting (Sentry, Bugsnag, etc.)
- [ ] Health, readiness, and startup probes exist
- [ ] Dashboards exist for both business health and technical health
- [ ] Alerts are actionable: every alert has an owner and a runbook
- [ ] Alert ownership and escalation paths are defined
- [ ] No alert fatigue: alerts are tuned, deduplicated, and prioritized
- [ ] Log and telemetry retention policies defined and compliant with regulations
- [ ] Sensitive data (PII, secrets) is excluded from all telemetry
- [ ] Synthetic monitoring exists for critical endpoints and user journeys
- [ ] Real User Monitoring (RUM) exists for key frontend products
- [ ] Custom business metrics tracked (conversion rates, queue depths, revenue signals)
- [ ] Centralized log aggregation in place (ELK, Loki, Splunk, Datadog, etc.)

---

## 17. CI/CD AND CHANGE MANAGEMENT

*DORA Metrics from Accelerate.*

- [ ] CI/CD pipeline is fully automated (no manual deploy steps)
- [ ] Quality gates defined at each stage (lint, test, security scan, approval)
- [ ] SAST, DAST, SCA, and container image scanning integrated into pipeline
- [ ] Deployment strategy standardized (blue-green, canary, rolling, progressive)
- [ ] Canary analysis automated where applicable (comparing error rates, latency)
- [ ] Rollback is automated and fast (< 5 minutes)
- [ ] Forward-fix strategy is also defined (when to roll back vs. fix forward)
- [ ] Feature flags separate deploy from release
- [ ] Database migrations decoupled from application deploys
- [ ] Ephemeral environments exist for PR-level testing
- [ ] Smoke tests run automatically after every deployment
- [ ] Change approval policy is proportional to risk (not one-size-fits-all)
- [ ] Emergency change process exists and is documented
- [ ] Deployment notifications and audit trails exist
- [ ] Maintenance windows and change calendars exist for enterprise systems
- [ ] DORA metrics tracked: deployment frequency (target: daily+), lead time for changes (target: < 1 day), change failure rate (target: < 15%), MTTR (target: < 1 hour)

---

## 18. TESTING AND QUALITY ENGINEERING

- [ ] Testing pyramid is defined (unit → integration → E2E ratio)
- [ ] Unit test coverage > 80% for business-critical logic
- [ ] Integration tests cover all critical paths and service boundaries
- [ ] End-to-end tests cover top user journeys
- [ ] Critical-path coverage is explicit (which flows must pass for a release to ship)
- [ ] Contract testing exists across service boundaries (Pact, etc.)
- [ ] Load and stress testing run regularly (k6, Locust, Gatling)
- [ ] Soak testing run for memory leaks and resource exhaustion
- [ ] Resilience testing run (fault injection, dependency failure simulation)
- [ ] Security testing automated where possible (integrated into CI)
- [ ] Accessibility testing exists for UI systems (WCAG 2.1 AA minimum)
- [ ] Regression suite runs on every PR or release candidate
- [ ] Flaky test detection and quarantine process exists
- [ ] Test data strategy is documented (factories, fixtures, synthetic data — never production PII)
- [ ] Mutation testing considered for the most critical modules

---

## 19. PERFORMANCE, CAPACITY, AND EFFICIENCY

*AWS Well-Architected: Performance Efficiency Pillar.*

- [ ] Baseline latency and throughput targets defined for key endpoints
- [ ] p50, p95, p99 latency measured and alerted on
- [ ] Resource requests and limits set for all containers (CPU, memory)
- [ ] Database query efficiency monitored (N+1 detection, slow query logs)
- [ ] Caching strategy documented (what to cache, TTL, invalidation, cache-aside vs write-through)
- [ ] CDN for static assets and cacheable API responses
- [ ] Compression enabled (gzip/brotli for HTTP, compression for data at rest)
- [ ] Connection reuse maximized (keep-alive, HTTP/2, gRPC multiplexing)
- [ ] Async I/O used for I/O-bound workloads
- [ ] Bundle size monitoring exists for web applications
- [ ] Cold start optimization exists for serverless/FaaS workloads
- [ ] Capacity thresholds are tied to alerts (not discovered during outages)
- [ ] Efficiency tradeoffs are documented (where you're trading cost for speed or vice versa)
- [ ] Image and asset optimization (lazy loading, responsive images, modern formats)

---

## 20. COMPLIANCE, RISK, AND GOVERNANCE

*NIST CSF 2.0 (including Govern), SOC 2, ISO 27001, GDPR, HIPAA, PCI DSS, FedRAMP.*

- [ ] NIST CSF 2.0 functions are mapped, including the Govern function
- [ ] Risk register exists and is actively maintained
- [ ] Risk owners are assigned for each identified risk
- [ ] Policy framework exists (information security policy, acceptable use, etc.)
- [ ] Control mapping exists for all applicable regulatory regimes
- [ ] Applicability determined for: SOC 2 / ISO 27001 / HIPAA / PCI DSS / GDPR / CCPA / FedRAMP
- [ ] Vendor and sub-processor risk is reviewed (third-party risk management)
- [ ] Audit evidence collection process exists (not scrambled at audit time)
- [ ] Periodic access reviews occur (quarterly for privileged access)
- [ ] Policy exceptions are approved, documented, and time-bound
- [ ] Board / leadership visibility exists for critical risks
- [ ] Cookie consent and tracking transparency implemented where required
- [ ] Data Processing Agreements (DPAs) in place with all sub-processors
- [ ] Incident response plan documented and rehearsed

---

## 21. INCIDENT, PROBLEM, AND SERVICE OPERATIONS

*Google SRE Handbook.*

- [ ] Incident management process is documented (detect → triage → mitigate → resolve → review)
- [ ] Severity levels defined (Sev 1–4) with response time targets
- [ ] On-call rotation exists and is adequately staffed
- [ ] Paging and escalation paths are tested (not just documented)
- [ ] Customer communication templates exist for incidents
- [ ] Status page exists and is maintained (Statuspage, Betteruptime, etc.)
- [ ] Blameless postmortems are standard for Sev 1/2
- [ ] Action items from postmortems are tracked to completion
- [ ] Problem management tracks recurring root causes (distinct from incident management)
- [ ] Runbooks exist for top 20+ operational scenarios
- [ ] Toil is measured and actively reduced
- [ ] Support handoff between engineering and customer-facing teams is defined
- [ ] War room / incident channel process defined
- [ ] Automated incident detection and paging configured

---

## 22. DOCUMENTATION AND KNOWLEDGE MANAGEMENT

- [ ] System architecture documentation is current and accessible
- [ ] Architecture Decision Records (ADRs) are maintained
- [ ] Operational runbooks are maintained and version-controlled
- [ ] Onboarding guide exists: new engineer can deploy to staging within 1 day
- [ ] Service catalog exists: what services exist, who owns them, how to contact owners
- [ ] Dependency map exists and is kept current
- [ ] Operational ownership is documented (who is on-call for what)
- [ ] Disaster recovery documentation exists and is tested
- [ ] Customer-facing admin / ops documentation exists where needed
- [ ] Documentation review cadence exists (at least quarterly)
- [ ] Change management process documented
- [ ] Capacity planning documentation maintained

---

## 23. ORGANIZATION AND TEAM READINESS

*Accelerate, Team Topologies.*

- [ ] Every service has a clear owning team and point of contact
- [ ] Bus factor > 1 for every critical system (no single knowledge holders)
- [ ] Teams can deploy and recover independently (no cross-team blocking for routine operations)
- [ ] Security ownership is assigned (security champion per team or dedicated AppSec)
- [ ] Platform ownership is assigned (who maintains shared infrastructure)
- [ ] Cross-functional collaboration is built into team structure (dev, ops, security, product)
- [ ] Engineering standards and best practices are documented and reviewed quarterly
- [ ] Technical debt is tracked and prioritized alongside feature work
- [ ] Training and certification plans exist for key technologies
- [ ] Operational readiness is part of the delivery culture (not an afterthought)
- [ ] Blameless culture for incident reviews and failure analysis
- [ ] Knowledge sharing: regular tech talks, documentation reviews, pairing

---

## 24. FINOPS, SUSTAINABILITY, AND RESOURCE GOVERNANCE

*FinOps Foundation, AWS Well-Architected: Cost Optimization & Sustainability Pillars.*

- [ ] Resource tagging is enforced (every cloud resource tagged by team, environment, product)
- [ ] Cost visibility exists by environment, team, and product line
- [ ] Cost anomaly detection configured with alerts
- [ ] Right-sizing reviewed regularly (not just at initial provisioning)
- [ ] Idle resource detection and cleanup automated
- [ ] Reserved / committed-use capacity evaluated for predictable workloads
- [ ] Spot / preemptible instances used for fault-tolerant workloads
- [ ] Storage lifecycle policies exist (archive cold data, delete expired data)
- [ ] Cost-performance tradeoffs are measured and documented
- [ ] Sustainability considerations included where material (region selection, scheduling)
- [ ] Engineering reviews include cost impact assessment
- [ ] FinOps reviews occur regularly (monthly or per-sprint for high-spend systems)
- [ ] Carbon-aware computing considerations documented

---

## 25. AI / LLM / MODEL READINESS (IF APPLICABLE)

*Applicable when the system includes AI/ML models, LLM integrations, or model-as-a-service components.*

- [ ] Model purpose and risk classification are defined (low / medium / high / critical)
- [ ] Training and fine-tuning data sources are documented with provenance
- [ ] Model provenance is documented (version, training data, hyperparameters, base model)
- [ ] Evaluation datasets and acceptance thresholds exist before production deployment
- [ ] Prompt engineering / policy / safety controls are versioned alongside code
- [ ] Human review checkpoints defined for high-risk outputs
- [ ] Model monitoring covers drift, quality degradation, and abuse detection
- [ ] Fallback behavior exists when model quality drops below threshold
- [ ] Sensitive data handling controls exist for prompts and model outputs
- [ ] AI-specific secure development guidance followed (OWASP LLM Top 10, NIST AI RMF)
- [ ] Cost monitoring for model inference (token usage, GPU hours)
- [ ] Bias and fairness evaluation performed where applicable
- [ ] Explainability requirements defined based on use case risk level
- [ ] Data retention policies cover model inputs and outputs

---

## APPENDIX A: SOURCE MAPPING

| Section | Primary Sources |
|---|---|
| 1. Product & Business Readiness | Enterprise SRE, Launch Readiness Reviews |
| 2. Architecture & Design | C4 Model, ADRs, Threat Modeling (STRIDE) |
| 3. Codebase & Version Control | 12-Factor I |
| 4. Dependency & Supply Chain | 12-Factor II, SLSA, OpenSSF Scorecard |
| 5. Secure SDLC | NIST SSDF, OWASP SAMM |
| 6. Configuration & Secrets | 12-Factor III |
| 7. Backing Services | 12-Factor IV, Release It! |
| 8. Build/Release/Run | 12-Factor V, SLSA |
| 9. Runtime Processes | 12-Factor VI, IX |
| 10. Networking & Traffic | 12-Factor VII, Zero Trust, CNCF |
| 11. API Design | Beyond 12-Factor XIII |
| 12. Identity & Auth | Beyond 12-Factor XV, OWASP |
| 13. Application Security | OWASP ASVS, OWASP Top 10, CIS |
| 14. Data Management | GDPR, CCPA, HIPAA, PCI DSS |
| 15. Reliability & Resilience | Google SRE, Release It!, Chaos Engineering, Reactive Manifesto |
| 16. Observability & Telemetry | Beyond 12-Factor XIV, OpenTelemetry, Google SRE |
| 17. CI/CD & Change Mgmt | DORA / Accelerate |
| 18. Testing & Quality | Continuous Delivery, Shift-Left Testing |
| 19. Performance & Capacity | AWS Well-Architected (Performance) |
| 20. Compliance & Governance | NIST CSF 2.0, SOC 2, ISO 27001 |
| 21. Incident & Operations | Google SRE Handbook |
| 22. Documentation | The Pragmatic Programmer, C4 Model |
| 23. Organization & Teams | Accelerate, Team Topologies |
| 24. FinOps & Sustainability | FinOps Foundation, AWS Well-Architected (Cost, Sustainability) |
| 25. AI/LLM Readiness | OWASP LLM Top 10, NIST AI RMF |

---

## APPENDIX B: READINESS GATE TEMPLATE

Use this template at each gate (Architecture Review, Pre-Launch, Post-Launch):

| Gate Question | Status | Owner | Notes |
|---|---|---|---|
| Are all Tier-1 items for this section complete? | | | |
| Are known gaps documented with risk acceptance? | | | |
| Is there a timeline for addressing Tier-2 items? | | | |
| Has the relevant stakeholder signed off? | | | |

---

*This checklist is a living document. Review and update it quarterly. Not every item applies to every system — but every section should be considered. The goal is conscious, documented decisions, not 100% completion.*
