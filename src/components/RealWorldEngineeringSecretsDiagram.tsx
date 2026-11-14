import React, { useState } from 'react';

export type EngineeringSecretsTab =
  | 'code_review_pr'
  | 'production_war_room'
  | 'career_impact_matrix'
  | 'practical_qa_traps';

interface Props {
  initialTab?: EngineeringSecretsTab;
}

interface PipelineNode {
  id: string;
  stage: string;
  title: string;
  subtitle: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  secretRule: string;
  juniorTrap: string;
  seniorPlaybook: string;
  codeOrCommand: string;
}

const PR_PIPELINE_NODES: PipelineNode[] = [
  {
    id: 'rfc_design',
    stage: 'STAGE 1',
    title: '1-Page RFC & Trade-off Alignment',
    subtitle: 'Prevent 2-Week Rewrite Before Coding',
    color: '#38bdf8',
    x: 20,
    y: 36,
    width: 215,
    height: 70,
    secretRule:
      'Never write 1,000 lines of code in secret and surprise the team in a PR. Write a 1-page RFC (Context, Non-Goals, 2 Alternatives, Failure Modes) and get Staff/Lead sign-off in 15 minutes.',
    juniorTrap:
      'Spending 5 days coding a complex Kafka consumer architecture only to have the Principal Engineer comment on the PR: "We should do this synchronously via Postgres."',
    seniorPlaybook:
      'Include an explicit "Non-Goals" section and "Why We Rejected Alternative B" table. This preempts 90% of bikeshedding in architectural reviews.',
    codeOrCommand:
      '## RFC: Idempotent Order Refund\n- Invariant: sum(refunds) <= captured_amount\n- Rejected Option: Distributed 2PC (locks DB connections across HTTP)\n- Chosen Option: Transactional Outbox + Unique Idempotency Key',
  },
  {
    id: 'stacked_pr',
    stage: 'STAGE 2',
    title: 'Stacked Atomic PRs (<200 LOC)',
    subtitle: 'DB Expand -> Domain Core -> Adapter -> API',
    color: '#34d399',
    x: 275,
    y: 36,
    width: 215,
    height: 70,
    secretRule:
      'Law of PR Inverse Scrutiny: A 1,500-line PR gets 2 nitpicks ("fix typo") and a rubber-stamp LGTM. A 120-line atomic PR gets reviewed in 4 minutes and catches real concurrency bugs.',
    juniorTrap:
      'Bundling Flyway DDL migrations, domain refactoring, formatting changes, and REST controllers into one giant branch that stays in merge-conflict hell for a week.',
    seniorPlaybook:
      'Self-review your own PR line-by-line on GitHub BEFORE tagging reviewers. Leave 2–3 inline comments explaining non-obvious lines so reviewers have instant context.',
    codeOrCommand:
      '# Stacked PR Sequence:\nPR #1 (50 LOC): Flyway V42__add_nullable_refund_key.sql (Expand phase)\nPR #2 (110 LOC): Pure RefundCalculator domain engine + 100% unit tests\nPR #3 (95 LOC): REST endpoint behind Dark-Launch Feature Flag',
  },
  {
    id: 'code_review',
    stage: 'STAGE 3',
    title: 'High-Signal Code Review Pyramid',
    subtitle: 'Data Integrity -> Concurrency -> Bounds',
    color: '#a78bfa',
    x: 530,
    y: 36,
    width: 215,
    height: 70,
    secretRule:
      'Automate formatting and style via Checkstyle/Spotless in CI. Human reviewers must focus exclusively on: (1) Race conditions, (2) Backward-compatible DB/Wire schemas, (3) Missing timeouts/bounds.',
    juniorTrap:
      'Leaving 15 blocking comments about variable names or brace placement while completely missing an unbounded SELECT * query or @Transactional lock held over an external HTTP call.',
    seniorPlaybook:
      'Use Prefix Labels in reviews: [BLOCKER] (data loss/race condition), [QUESTION] (clarifying intent), [NIT] (non-blocking polish — approve anyway so you never block velocity).',
    codeOrCommand:
      '// [BLOCKER] Calling stripeClient.refund() inside @Transactional holds\n// a HikariCP connection for 800ms! Under gateway degradation, all 20\n// DB connections exhaust in 2 seconds. Move HTTP call outside TX.',
  },
  {
    id: 'expand_contract',
    stage: 'STAGE 4',
    title: 'Zero-Downtime Expand & Contract',
    subtitle: 'Rolling K8s Pod v1 + v2 Compatibility',
    color: '#fbbf24',
    x: 145,
    y: 146,
    width: 225,
    height: 70,
    secretRule:
      'During a Kubernetes rolling deployment, Old Pods (v1) and New Pods (v2) run simultaneously against the SAME database for 3–10 minutes. Every DB migration must be backward-compatible with v1 code!',
    juniorTrap:
      'Running ALTER TABLE RENAME COLUMN or adding a NOT NULL column without a DEFAULT in the same deployment that updates the Java Entity—instantly crashing all running v1 pods with SQLGrammarException.',
    seniorPlaybook:
      'Always separate schema changes into 3 phases across releases: (1) Expand (add nullable column, dual-write), (2) Backfill in batches, (3) Contract (switch reads, drop old column in next sprint).',
    codeOrCommand:
      '-- PostgreSQL Safe Non-Blocking Constraint Pattern:\nALTER TABLE orders ADD CONSTRAINT chk_amt CHECK (amount >= 0) NOT VALID;\n-- Takes ACCESS EXCLUSIVE lock for ~2ms only, then validate online:\nALTER TABLE orders VALIDATE CONSTRAINT chk_amt;',
  },
  {
    id: 'canary_flag',
    stage: 'STAGE 5',
    title: 'Feature Flags & Canary Telemetry',
    subtitle: 'Decouple Deployment from Release',
    color: '#f472b6',
    x: 410,
    y: 146,
    width: 225,
    height: 70,
    secretRule:
      'Deployment is a physical infrastructure event (moving binaries to production). Release is a business event (exposing logic to traffic). Never couple them—kill-switch any feature in <1 second without redeploying.',
    juniorTrap:
      'Merging to main at 4:30 PM on Friday, deploying to 100% of users at once, and needing a 25-minute CI/CD rollback build when a memory leak or edge-case NPE surfaces.',
    seniorPlaybook:
      'Roll out via progressive rings: 1% internal employee accounts -> 5% canary pods (compare p99 latency & 5xx rate vs baseline) -> 25% -> 100%.',
    codeOrCommand:
      'if (featureFlags.isEnabled("new-pricing-engine", userContext)) {\n    return v2PricingEngine.quote(request); // Instant runtime toggle\n}\nreturn legacyPricingEngine.quote(request);',
  },
];

interface WarRoomStep {
  id: string;
  minuteMark: string;
  phase: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  objective: string;
  goldenPrinciple: string;
  diagnosticCommands: string;
  antiPattern: string;
}

const WAR_ROOM_STEPS: WarRoomStep[] = [
  {
    id: 'triage_stabilize',
    minuteMark: 'T + 0 to 5m',
    phase: '1. Triage Blast Radius & Roles',
    color: '#f87171',
    x: 18,
    y: 42,
    width: 170,
    height: 82,
    objective:
      'Quantify exact user impact (% of failed checkouts, affected regions, revenue burn/min) and assign Incident Commander (IC), Ops Lead, and Scribe.',
    goldenPrinciple:
      'STOP THE BLEEDING FIRST. Never spend 45 minutes reading stack traces to "find the root cause" while customers are seeing HTTP 503s.',
    diagnosticCommands:
      '# Check 5xx error rate, p99 latency, and recent deployment timestamp\nkubectl rollout history deployment/payment-service -n prod\n# Check if blast radius correlates with a release or traffic spike',
    antiPattern:
      '5 engineers randomly SSHing into production pods and restarting services without telling anyone, destroying forensic evidence.',
  },
  {
    id: 'mitigate_bleeding',
    minuteMark: 'T + 5 to 15m',
    phase: '2. Mitigate (Rollback / Kill-Switch)',
    color: '#fbbf24',
    x: 206,
    y: 42,
    width: 170,
    height: 82,
    objective:
      'Restore service health via the fastest reversible lever: (1) Flip feature flag off, (2) Rollback K8s deployment, (3) Shed non-critical load / open circuit breaker.',
    goldenPrinciple:
      'If a deployment happened within 2 hours of the alert, roll back immediately—ask questions after traffic recovers.',
    diagnosticCommands:
      '# Instant Kubernetes rollback to previous healthy ReplicaSet (~15s)\nkubectl rollout undo deployment/payment-service -n prod\n# Or kill runaway DB queries blocking the connection pool:\nSELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = \'active\' AND now() - query_start > interval \'30 seconds\';',
    antiPattern:
      'Trying to write a "quick hotfix" under panic, skipping tests, and deploying a second bug that corrupts the database.',
  },
  {
    id: 'preserve_forensics',
    minuteMark: 'T + 15 to 30m',
    phase: '3. Capture Forensics Before Restart',
    color: '#38bdf8',
    x: 394,
    y: 42,
    width: 170,
    height: 82,
    objective:
      'If pods are deadlocked, CPU-pinned at 100%, or OOMing, isolate 1 pod from the Load Balancer Service and capture thread dump + JFR profile before killing it.',
    goldenPrinciple:
      '3 Thread Dumps taken 5 seconds apart are 10x more valuable than a single dump: they distinguish a moving slow thread from a permanently deadlocked/pinned thread.',
    diagnosticCommands:
      '# 1. Remove pod from K8s Service Endpoints (preserve state, stop traffic)\nkubectl label pod payment-7f8b9-x2k app=isolated-debug --overwrite\n# 2. Take 3 thread dumps 5s apart + 60s Flight Recorder profile\nfor i in 1 2 3; do jcmd 1 Thread.print > /tmp/td_$i.txt; sleep 5; done\njcmd 1 JFR.start name=outage settings=profile duration=60s filename=/tmp/outage.jfr',
    antiPattern:
      'Running jmap -dump:live on a 32GB heap pod that is still serving live traffic—freezing the JVM for 40 seconds and triggering a cascading retry storm.',
  },
  {
    id: 'coe_five_whys',
    minuteMark: 'T + 24 Hours',
    phase: '4. Blameless COE & 5 Whys',
    color: '#34d399',
    x: 582,
    y: 42,
    width: 165,
    height: 82,
    objective:
      'Conduct a Correction of Error (COE) post-mortem that identifies systemic architectural gaps, detection blind spots, and automated guardrails.',
    goldenPrinciple:
      '"Human Error" is NEVER a valid root cause. If an engineer could take down production with one typo or unindexed query, the SYSTEM lacked automated guardrails.',
    diagnosticCommands:
      'Why 1: API returned 503 -> HikariCP pool exhausted (0 idle, 80 waiting)\nWhy 2: All 20 DB connections held for 30s -> Partner Webhook HTTP call inside @Transactional\nWhy 3: Partner API degraded -> WebClient had NO responseTimeout configured!\nSystemic Fix: ArchUnit rule banning HTTP clients inside @Transactional + global 3s timeout.',
    antiPattern:
      'Ending a post-mortem with action item: "Engineers will be more careful during code review next time." (Guaranteed repeat outage).',
  },
];

interface ScenarioQA {
  id: string;
  category: string;
  badgeColor: string;
  question: string;
  symptom: string;
  rootCauseMechanics: string;
  juniorReaction: string;
  seniorSolution: string;
  codeFix: string;
}

const PRACTICAL_SCENARIOS: ScenarioQA[] = [
  {
    id: 'hikari_http_tx',
    category: 'Spring / DB Outage',
    badgeColor: '#f87171',
    question:
      '1. Production API suddenly freezes with "HikariPool-1 - Connection is not available, request timed out after 30000ms", yet DB CPU is only 8%! What is happening?',
    symptom:
      'All Tomcat/Virtual threads block on DataSource.getConnection(). PostgreSQL CPU is idle (8%), zero slow SQL queries in pg_stat_statements.',
    rootCauseMechanics:
      'A method annotated with @Transactional makes an external HTTP call (or Kafka publish / S3 upload) inside the transaction boundary. Spring acquires the physical JDBC connection on the first query and holds it open until the method exits. When the downstream HTTP partner slows down from 50ms to 15s, all 20 HikariCP connections are held idle by threads waiting on network sockets!',
    juniorReaction:
      'Increasesspring.datasource.hikari.maximum-pool-size from 20 to 200—which exhausts PostgreSQL max_connections and crashes the entire database.',
    seniorSolution:
      'Never perform network I/O inside a database transaction! Split into 3 steps using TransactionTemplate: (1) Short TX1: validate & insert PENDING state (2ms), (2) Execute external HTTP call with strict 2s timeout outside TX, (3) Short TX2: update state to COMPLETED/FAILED (2ms).',
    codeFix: `// ✅ Senior Pattern: Programmatic TransactionTemplate (Zero DB lock during HTTP)
public PaymentReceipt processPayment(PaymentCmd cmd) {
    // Step 1: 2ms DB Transaction -> Commit PENDING record immediately
    OrderId id = txTemplate.execute(status -> orderRepo.createPending(cmd));

    // Step 2: External HTTP I/O OUTSIDE transaction (Zero DB connection held!)
    GatewayResponse res = paymentClient.chargeWithTimeout(cmd, Duration.ofSeconds(2));

    // Step 3: 2ms DB Transaction -> Finalize status
    return txTemplate.execute(status -> orderRepo.markCompleted(id, res.txRef()));
}`,
  },
  {
    id: 'k8s_deploy_502',
    category: 'Kubernetes / DevOps',
    badgeColor: '#38bdf8',
    question:
      '2. Every time you deploy a new version on Kubernetes, clients experience 5–10 seconds of HTTP 502/504 errors despite Readiness Probes. Why?',
    symptom:
      'Ingress / Envoy / ALB logs show "upstream prematurely closed connection" or "connection refused" for 5–10 seconds during every rolling update.',
    rootCauseMechanics:
      'When K8s terminates a pod, two things happen ASYNCHRONOUSLY in parallel: (1) Kubelet sends SIGTERM to the container, and (2) EndpointsController removes the pod IP from kube-proxy iptables / Ingress Envoy upstream list. Propagation across the cluster takes 2–8 seconds! If your Spring Boot app shuts down its Tomcat port immediately on SIGTERM, traffic still arriving during that 5s window hits a closed socket (502).',
    juniorReaction:
      'Blames Kubernetes networking or adds retries on the frontend without fixing the server lifecycle race condition.',
    seniorSolution:
      'Configure a 3-part Graceful Shutdown contract: (1) preStop lifecycle hook sleep 5–10s so Envoy drains the endpoint BEFORE the JVM receives SIGTERM, (2) server.shutdown=graceful in Spring Boot so Tomcat stops accepting new requests while finishing in-flight requests, (3) terminationGracePeriodSeconds > preStop + max request timeout.',
    codeFix: `# application.yml + k8s deployment.yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 25s
---
lifecycle:
  preStop:
    exec:
      # Wait 8s for Ingress/kube-proxy endpoint removal propagation before SIGTERM
      command: ["sh", "-c", "sleep 8"]
terminationGracePeriodSeconds: 40`,
  },
  {
    id: 'deep_pagination_db',
    category: 'Database Performance',
    badgeColor: '#fbbf24',
    question:
      '3. An admin export or user feed works in 5ms on Page 1, but spikes to 12 seconds and 95% DB CPU on Page 5,000 (LIMIT 20 OFFSET 100000). How do you fix it?',
    symptom:
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20 OFFSET 100000 causes massive disk I/O and buffer pool churn.',
    rootCauseMechanics:
      'B+Tree indexes do not store row offsets! To serve OFFSET 100000 LIMIT 20, the storage engine must walk 100,020 index entries, perform 100,020 random heap/clustered page lookups, materialize all 100,020 rows, and throw away the first 100,000 rows in memory ($O(N + K)$ work).',
    juniorReaction:
      'Adds a Redis cache on top of every page number, which misses on cold scans and blows up Redis memory.',
    seniorSolution:
      'Use Keyset (Cursor / Seek) Pagination for infinite scroll/APIs ($O(\\log N)$ B+Tree seek straight to the exact tuple). If page numbers are strictly required by UI, use a Deferred Join (fetch only the 20 PK IDs via a covering index scan, then INNER JOIN the main table for those 20 rows).',
    codeFix: `-- ✅ Option A: Keyset / Seek Pagination (Constant 1.2ms at Page 1 or Page 50,000!)
SELECT id, account_id, amount, created_at
FROM transactions
WHERE (created_at, id) < (:lastSeenCreatedAt, :lastSeenId)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- ✅ Option B: Deferred Join (When UI strictly requires numeric page jumps)
SELECT t.* FROM transactions t
INNER JOIN (
    SELECT id FROM transactions ORDER BY created_at DESC LIMIT 20 OFFSET 100000
) AS page_keys ON t.id = page_keys.id;`,
  },
  {
    id: 'kafka_duplicate_side_effect',
    category: 'Distributed Messaging',
    badgeColor: '#34d399',
    question:
      '4. A Kafka consumer processes an event, charges the customer credit card, and then crashes before committing the offset (or hits max.poll.interval.ms). On restart, the customer is charged TWICE! How do you prevent this?',
    symptom:
      'Duplicate emails, double ledger debits, or duplicate third-party API calls after consumer group rebalances or pod restarts.',
    rootCauseMechanics:
      'Kafka provides At-Least-Once delivery by default. Even Kafka "Exactly-Once Semantics" (EOS) only guarantees atomic read-process-write WITHIN Kafka topics—it CANNOT roll back an external HTTP call to Stripe or an email sent via SendGrid!',
    juniorReaction:
      'Sets enable.auto.commit=true with a 1-second interval, which switches the bug from duplicate charges to silently dropped orders when a pod crashes mid-processing.',
    seniorSolution:
      'Combine (1) Database Upsert / Unique Idempotency Key table (INSERT INTO processed_events ON CONFLICT DO NOTHING) in the same local DB transaction as state mutation, and (2) Pass a deterministic Idempotency-Key (e.g. orderId + step) in the HTTP header to the external payment gateway.',
    codeFix: `// ✅ Senior Idempotent Consumer + Deterministic Downstream Idempotency Key
@Transactional
public void onOrderCreated(OrderCreatedEvent event) {
    // 1. Atomic DB claim: returns 0 if eventId was already processed
    int inserted = idempotencyRepo.tryClaimEvent(event.eventId(), Instant.now());
    if (inserted == 0) {
        log.info("Duplicate delivery ignored for eventId={}", event.eventId());
        return;
    }
    // 2. Deterministic key ensures external gateway deduplicates retries too
    String idempotencyKey = "charge:order:" + event.orderId();
    stripeGateway.charge(event.amount(), idempotencyKey);
}`,
  },
  {
    id: 'k8s_jvm_oomkilled',
    category: 'JVM / Containers',
    badgeColor: '#a78bfa',
    question:
      '5. Your Spring Boot pod has -Xmx2048m and Kubernetes memory limit 2Gi (2048Mi). Every few hours K8s kills the pod with Exit Code 137 (OOMKilled), yet no Java OutOfMemoryError heap dump is generated!',
    symptom:
      'kubectl describe pod shows State: Terminated, Reason: OOMKilled, Exit Code: 137. JVM heap usage in Grafana was only 1.5GB.',
    rootCauseMechanics:
      'A JVM process consumes much more physical RSS memory than just Heap (-Xmx)! Total Process RSS = Heap (-Xmx) + Metaspace (~256MB) + Direct ByteBuffers / Netty / NIO off-heap (~256MB) + Thread Stacks (200 threads x 1MB = 200MB) + JIT CodeCache (~240MB) + glibc native malloc arenas. Setting -Xmx equal to the container memory limit guarantees the Linux kernel cgroup OOM killer (SIGKILL / 137) will assassinate the process before the JVM GC even knows memory is tight!',
    juniorReaction:
      'Keeps lowering -Xmx randomly or disabling GC features without budgeting off-heap memory.',
    seniorSolution:
      'Size Java Heap to 65%–70% of the container memory limit (`-XX:MaxRAMPercentage=70.0`), bound Metaspace and Direct Memory explicitly, and leave 30% headroom for Metaspace, thread stacks, Netty direct buffers, and native libc.',
    codeFix: `# Production Container JVM Memory Budget (for 2Gi / 2048Mi K8s Limit):
JAVA_TOOL_OPTIONS="
  -XX:+UseContainerSupport
  -XX:InitialRAMPercentage=50.0
  -XX:MaxRAMPercentage=68.0
  -XX:MaxMetaspaceSize=256m
  -XX:MaxDirectMemorySize=256m
  -XX:+ExitOnOutOfMemoryError
  -XX:+HeapDumpOnOutOfMemoryError
  -XX:HeapDumpPath=/var/log/dumps/heap.hprof
"`,
  },
];

export default function RealWorldEngineeringSecretsDiagram({
  initialTab = 'code_review_pr',
}: Props): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<EngineeringSecretsTab>(initialTab);
  const [selectedPrNodeId, setSelectedPrNodeId] = useState<string>('stacked_pr');
  const [selectedWarStepId, setSelectedWarStepId] = useState<string>('preserve_forensics');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('hikari_http_tx');

  const selectedPrNode =
    PR_PIPELINE_NODES.find((n) => n.id === selectedPrNodeId) || PR_PIPELINE_NODES[1];
  const selectedWarStep =
    WAR_ROOM_STEPS.find((s) => s.id === selectedWarStepId) || WAR_ROOM_STEPS[2];
  const selectedScenario =
    PRACTICAL_SCENARIOS.find((q) => q.id === selectedScenarioId) || PRACTICAL_SCENARIOS[0];

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        background: '#090b14',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '20px',
        color: '#f8fafc',
        margin: '24px 0',
      }}
    >
      <style>{`
        @keyframes engSecretsDashFlow {
          to {
            stroke-dashoffset: -24;
          }
        }
        .eng-secrets-flowing-edge {
          stroke-dasharray: 6 6;
          animation: engSecretsDashFlow 0.9s linear infinite;
        }
        .eng-secrets-split-grid {
          display: grid;
          grid-template-columns: 56% 44%;
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .eng-secrets-split-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '14px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#34d399' }}>
            Real-World Production Engineering Playbook & War-Room Telemetry
          </span>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'code_review_pr', label: '1. RFC, PR & Safe Deploy Pipeline', color: '#38bdf8' },
            { id: 'production_war_room', label: '2. Sev-1 Incident War Room', color: '#f87171' },
            { id: 'practical_qa_traps', label: '3. Top 5 Production Crisis Scenarios', color: '#fbbf24' },
            { id: 'career_impact_matrix', label: '4. Senior Impact & Workplace Secrets', color: '#a78bfa' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as EngineeringSecretsTab)}
                style={{
                  background: isActive ? 'rgba(52, 211, 153, 0.14)' : '#0f172a',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: `1px solid ${isActive ? tab.color : '#334155'}`,
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: RFC, STACKED PR & SAFE RELEASE PIPELINE */}
      {activeTab === 'code_review_pr' && (
        <div className="eng-secrets-split-grid">
          <div
            style={{
              background: '#0d0f1e',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                color: '#94a3b8',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Click any delivery stage to inspect Senior execution rules</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>● Zero-Downtime Delivery Flow</span>
            </div>

            <svg viewBox="0 0 765 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker
                  id="eng-arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                </marker>
                <marker
                  id="eng-arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#34d399" />
                </marker>
                <marker
                  id="eng-arrow-amber"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#fbbf24" />
                </marker>
                <marker
                  id="eng-arrow-pink"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#f472b6" />
                </marker>
              </defs>

              {/* Directed Flowing Edges */}
              {/* Stage 1 -> Stage 2 */}
              <path
                d="M 241 71 L 269 71"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path eng-secrets-flowing-edge"
                markerEnd="url(#eng-arrow-cyan)"
              />
              {/* Stage 2 -> Stage 3 */}
              <path
                d="M 496 71 L 524 71"
                stroke="#34d399"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path eng-secrets-flowing-edge"
                markerEnd="url(#eng-arrow-emerald)"
              />
              {/* Stage 3 -> Stage 4 */}
              <path
                d="M 637 112 L 265 140"
                stroke="#fbbf24"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path eng-secrets-flowing-edge"
                markerEnd="url(#eng-arrow-amber)"
              />
              {/* Stage 4 -> Stage 5 */}
              <path
                d="M 376 181 L 404 181"
                stroke="#f472b6"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path eng-secrets-flowing-edge"
                markerEnd="url(#eng-arrow-pink)"
              />

              {PR_PIPELINE_NODES.map((node) => {
                const isSelected = node.id === selectedPrNodeId;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedPrNodeId(node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx="8"
                      fill={isSelected ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.85)'}
                      stroke={node.color}
                      strokeWidth={isSelected ? '2.5' : '1.4'}
                    />
                    <text
                      x={node.x + 12}
                      y={node.y + 21}
                      fill={node.color}
                      fontSize="10"
                      fontWeight="700"
                    >
                      [{node.stage}]
                    </text>
                    <text
                      x={node.x + 12}
                      y={node.y + 40}
                      fill="#ffffff"
                      fontSize="11.5"
                      fontWeight="700"
                    >
                      {node.title}
                    </text>
                    <text x={node.x + 12} y={node.y + 57} fill="#94a3b8" fontSize="10">
                      {node.subtitle}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Detail Panel */}
          <div
            style={{
              background: '#0c0e17',
              border: `1px solid ${selectedPrNode.color}`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: selectedPrNode.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px',
              }}
            >
              {selectedPrNode.stage} — Senior Execution Secret
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              {selectedPrNode.title}
            </div>
            <p style={{ fontSize: '0.83rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '10px' }}>
              {selectedPrNode.secretRule}
            </p>
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                borderLeft: '3px solid #f87171',
                padding: '8px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171' }}>
                COMMON JUNIOR TRAP
              </div>
              <div style={{ fontSize: '0.79rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedPrNode.juniorTrap}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.1)',
                borderLeft: '3px solid #34d399',
                padding: '8px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399' }}>
                STAFF / PRINCIPAL PLAYBOOK
              </div>
              <div style={{ fontSize: '0.79rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedPrNode.seniorPlaybook}
              </div>
            </div>
            <pre
              style={{
                background: '#090b14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.74rem',
                color: '#38bdf8',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              <code>{selectedPrNode.codeOrCommand}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: SEV-1 INCIDENT WAR ROOM TIMELINE */}
      {activeTab === 'production_war_room' && (
        <div className="eng-secrets-split-grid">
          <div
            style={{
              background: '#0d0f1e',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                color: '#94a3b8',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Click any Incident Response phase to inspect War-Room commands</span>
              <span style={{ color: '#f87171', fontWeight: 600 }}>● Sev-1 Outage Protocol</span>
            </div>

            <svg viewBox="0 0 765 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker
                  id="war-arrow"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Connecting flowing arrows across the 4 phases */}
              <path
                d="M 192 83 L 201 83"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path eng-secrets-flowing-edge"
                markerEnd="url(#war-arrow)"
              />
              <path
                d="M 380 83 L 389 83"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path eng-secrets-flowing-edge"
                markerEnd="url(#war-arrow)"
              />
              <path
                d="M 568 83 L 577 83"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path eng-secrets-flowing-edge"
                markerEnd="url(#war-arrow)"
              />

              {WAR_ROOM_STEPS.map((step) => {
                const isSelected = step.id === selectedWarStepId;
                return (
                  <g
                    key={step.id}
                    onClick={() => setSelectedWarStepId(step.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={step.x}
                      y={step.y}
                      width={step.width}
                      height={step.height}
                      rx="8"
                      fill={isSelected ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.85)'}
                      stroke={step.color}
                      strokeWidth={isSelected ? '2.5' : '1.4'}
                    />
                    <text
                      x={step.x + 10}
                      y={step.y + 22}
                      fill={step.color}
                      fontSize="10"
                      fontWeight="700"
                    >
                      [{step.minuteMark}]
                    </text>
                    <text
                      x={step.x + 10}
                      y={step.y + 44}
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {step.phase}
                    </text>
                    <text x={step.x + 10} y={step.y + 64} fill="#94a3b8" fontSize="9.5">
                      Click to inspect runbook
                    </text>
                  </g>
                );
              })}
            </svg>

            <div
              style={{
                marginTop: '12px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#e2e8f0',
              }}
            >
              <strong style={{ color: '#38bdf8' }}>Status Update Template (Every 15 mins in #incidents):</strong>{' '}
              <code>
                [STATUS: MITIGATING] Impact: 18% of EU checkout requests failing with HTTP 503 since 14:02 UTC.
                Action: Rolling back payment-service from v2.8.4 to v2.8.3. Next update: 14:20 UTC.
              </code>
            </div>
          </div>

          <div
            style={{
              background: '#0c0e17',
              border: `1px solid ${selectedWarStep.color}`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: selectedWarStep.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px',
              }}
            >
              {selectedWarStep.minuteMark} — War-Room Runbook
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              {selectedWarStep.phase}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '10px' }}>
              {selectedWarStep.objective}
            </p>
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.1)',
                borderLeft: '3px solid #34d399',
                padding: '8px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399' }}>
                GOLDEN WAR-ROOM PRINCIPLE
              </div>
              <div style={{ fontSize: '0.79rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedWarStep.goldenPrinciple}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                borderLeft: '3px solid #f87171',
                padding: '8px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171' }}>
                WHAT NEVER TO DO
              </div>
              <div style={{ fontSize: '0.79rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedWarStep.antiPattern}
              </div>
            </div>
            <pre
              style={{
                background: '#090b14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.74rem',
                color: '#38bdf8',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              <code>{selectedWarStep.diagnosticCommands}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: TOP 5 REAL-WORLD PRODUCTION CRISIS SCENARIOS */}
      {activeTab === 'practical_qa_traps' && (
        <div className="eng-secrets-split-grid">
          <div
            style={{
              background: '#0d0f1e',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Select a classic production crisis scenario to inspect its physical engine root cause & fix:
            </div>
            {PRACTICAL_SCENARIOS.map((item) => {
              const isSelected = item.id === selectedScenarioId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(item.id)}
                  style={{
                    textAlign: 'left',
                    background: isSelected ? 'rgba(30, 41, 59, 0.95)' : '#090b14',
                    border: `1px solid ${isSelected ? item.badgeColor : '#1e293b'}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    color: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: item.badgeColor,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Inspect Scenario →</span>
                  </div>
                  <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                    {item.question}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            style={{
              background: '#0c0e17',
              border: `1px solid ${selectedScenario.badgeColor}`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: selectedScenario.badgeColor,
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              {selectedScenario.category} — Under-the-Hood Analysis
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
              <strong style={{ color: '#ffffff' }}>Production Symptom:</strong> {selectedScenario.symptom}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '10px' }}>
              <strong style={{ color: '#38bdf8' }}>Physical Engine Mechanics:</strong>{' '}
              {selectedScenario.rootCauseMechanics}
            </p>
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                borderLeft: '3px solid #f87171',
                padding: '8px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171' }}>
                JUNIOR PANIC REACTION (MAKES IT WORSE)
              </div>
              <div style={{ fontSize: '0.79rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedScenario.juniorReaction}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.1)',
                borderLeft: '3px solid #34d399',
                padding: '8px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399' }}>
                PRINCIPAL ARCHITECT FIX
              </div>
              <div style={{ fontSize: '0.79rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                {selectedScenario.seniorSolution}
              </div>
            </div>
            <pre
              style={{
                background: '#090b14',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.73rem',
                color: '#34d399',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              <code>{selectedScenario.codeFix}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: SENIOR IMPACT & WORKPLACE SECRETS */}
      {activeTab === 'career_impact_matrix' && (
        <div
          style={{
            background: '#0d0f1e',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a78bfa', marginBottom: '12px' }}>
            The 4 High-Leverage Workplace Secrets That Separate Senior/Staff Engineers from Code Monkeys
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '14px',
            }}
          >
            {[
              {
                title: '1. The 30-Minute Rule & Structured Escalation',
                color: '#38bdf8',
                rule: 'Never spin your wheels silently for 2 days, and never ask "It doesn\'t work, help me" after 30 seconds.',
                template:
                  'Ask with the 4-Part Senior Escalation Template: (1) Goal & Context, (2) Exact Error / Stacktrace / Metric, (3) 3 Hypotheses I already tested & ruled out, (4) My current suspect.',
              },
              {
                title: '2. Manage Up with Options & Risk Trade-offs',
                color: '#34d399',
                rule: 'When a deadline is at risk or a requirement changes, never wait until Demo Day to surprise your PM/Manager.',
                template:
                  'Come with 2–3 concrete options: "Option A ships Friday with manual CSV reconciliation; Option B ships Wednesday next week with full automated webhook retry. I recommend Option A to hit our launch SLA."',
              },
              {
                title: '3. Maintain a Live "Brag Document" (Impact Ledger)',
                color: '#fbbf24',
                rule: 'Your manager will not remember what you did 5 months ago during Performance Review calibration.',
                template:
                  'Every 2 weeks, log 3 bullets with hard metrics: (1) Feature shipped & revenue/adoption impact, (2) Outage prevented or latency reduced (e.g. p99 820ms -> 45ms), (3) Engineers mentored / RFCs authored.',
              },
              {
                title: '4. Leave Artifacts, Not Just Slack Messages',
                color: '#f472b6',
                rule: 'Answering a question in a direct message helps 1 person once. Writing a 1-page Runbook or Architecture Decision Record (ADR) scales your impact to 50 engineers 24/7.',
                template:
                  'Whenever you spend >1 hour debugging an obscure problem, document the symptom, root cause, and exact CLI commands in the team knowledge base before closing the ticket.',
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  background: '#090b14',
                  border: `1px solid ${card.color}`,
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: card.color, marginBottom: '6px' }}>
                  {card.title}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#ffffff', lineHeight: 1.45, marginBottom: '8px' }}>
                  {card.rule}
                </p>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
                  {card.template}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
