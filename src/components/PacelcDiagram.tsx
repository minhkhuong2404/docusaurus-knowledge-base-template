import React, { useState } from 'react';

type TabType = 'formula' | 'el-tradeoff' | 'database-matrix' | 'github-incident' | 'conflict-cost';

// ─── helpers ────────────────────────────────────────────────────────────────

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
      background: `${color}18`, color, display: 'inline-block',
    }}>{text}</span>
  );
}

function InfoBox({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}30`,
      borderLeft: `4px solid ${color}`, borderRadius: '6px',
      padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>{children}</div>
    </div>
  );
}

// ─── data ────────────────────────────────────────────────────────────────────

const DB_MATRIX = [
  {
    name: 'Apache Cassandra',
    partition: 'PA', partitionColor: '#34d399',
    normal: 'EL', normalColor: '#34d399',
    label: 'PA/EL',
    why: 'During partition: accept writes to all available nodes (AP). Normally: writes return after local node only, async propagate (low latency, eventual consistency).',
    leaning: 'Availability + Speed',
    notes: 'Tunable via consistency levels (ONE, QUORUM, ALL). ALL effectively becomes CP. Default is availability-first.',
  },
  {
    name: 'Riak',
    partition: 'PA', partitionColor: '#34d399',
    normal: 'EL', normalColor: '#34d399',
    label: 'PA/EL',
    why: 'Core design mirrors Amazon Dynamo (2007): always writeable, last-write-wins by default, vector clocks for conflict tracking.',
    leaning: 'Availability + Speed',
    notes: 'Strongly influenced by the "Dynamo" paper. Same trade-offs as Cassandra by design.',
  },
  {
    name: 'Google Spanner',
    partition: 'PC', partitionColor: '#f87171',
    normal: 'EC', normalColor: '#f87171',
    label: 'PC/EC',
    why: 'During partition: refuse writes rather than risk inconsistency (CP). Normally: every write waits for Paxos quorum + TrueTime commit-wait — pays latency for strong consistency.',
    leaning: 'Consistency always',
    notes: 'Five-nines availability means partition events are so rare the CP penalty is practically invisible. Brewer calls it "effectively CA" from user\'s perspective.',
  },
  {
    name: 'CockroachDB',
    partition: 'PC', partitionColor: '#f87171',
    normal: 'EC', normalColor: '#f87171',
    label: 'PC/EC',
    why: 'Raft consensus for writes — majority quorum required. During partition: refuses writes to minority. Normally: each write is synchronous Raft round-trip.',
    leaning: 'Consistency always',
    notes: 'Does not claim strict serializability (linearizability across keys). Serializability on each key group, not global external consistency.',
  },
  {
    name: 'Amazon DynamoDB',
    partition: 'PA/PC', partitionColor: '#fbbf24',
    normal: 'EL/EC', normalColor: '#fbbf24',
    label: 'Per-request',
    why: 'Internally leader-based (Multi-Paxos). Eventually consistent reads → cheap, available. Strongly consistent reads → linearizable, 2× cost, leader-only.',
    leaning: 'Per-operation choice',
    notes: 'The PACELC label is determined by your read API call, not the database. eventuallyConsistentRead = PA/EL; stronglyConsistentRead = PC/EC.',
  },
  {
    name: 'MongoDB (v4+)',
    partition: 'PC', partitionColor: '#f87171',
    normal: 'EC', normalColor: '#f87171',
    label: 'PC/EC (default)',
    why: 'Since v4, default is majority write concern and reads from primary — effectively CP. Older defaults were PA/EL. Label moved with product evolution.',
    leaning: 'Consistency (default)',
    notes: 'Can be tuned to PA/EL by lowering write concern to w:1 and reading from secondaries. The database\'s PACELC profile is not fixed.',
  },
  {
    name: 'PostgreSQL (single node)',
    partition: 'N/A', partitionColor: '#a78bfa',
    normal: 'EC', normalColor: '#f87171',
    label: '—/EC',
    why: 'Single node has no network partition. All writes are serialized through one commit log. Full ACID + linearizability for free.',
    leaning: 'Consistency always',
    notes: 'Add logical replication or read replicas → partition becomes real → must choose. Default replica lag ≈ async (PA/EL behavior on replicas).',
  },
  {
    name: 'Apache ZooKeeper / etcd',
    partition: 'PC', partitionColor: '#f87171',
    normal: 'EC', normalColor: '#f87171',
    label: 'PC/EC',
    why: 'Raft/ZAB: majority quorum required for every write. Minority partition nodes refuse writes. Read from leader is linearizable but expensive.',
    leaning: 'Consistency always',
    notes: 'Designed as coordination services, not general databases. High consistency overhead is acceptable because operation rate is low.',
  },
];

const GITHUB_EVENTS = [
  { time: '22:52', type: 'maintenance', label: 'Scheduled Maintenance', desc: 'GitHub engineers begin replacing 100G optical equipment at US East Coast datacenter.', color: '#38bdf8' },
  { time: '22:52:43', type: 'partition', label: 'Network Partition', desc: 'East Coast ↔ West Coast link drops. Duration: 43 seconds. Shorter than reading this sentence.', color: '#f87171' },
  { time: '22:52:49', type: 'failover', label: 'Automated Failover Fires', desc: 'Orchestrator (MySQL HA tool) detects East Coast primary as "dead" → promotes West Coast replica to primary. Two primaries now exist.', color: '#f97316' },
  { time: '22:53:26', type: 'rejoin', label: 'Network Restores', desc: 'Link comes back. East Coast and West Coast both believe they are the write authority. Split-brain.', color: '#fbbf24' },
  { time: '22:55', type: 'discovery', label: 'Engineers Discover Split-Brain', desc: 'Data from 43s of writes on each side is divergent. 6 MySQL clusters. Backfilling in progress. Decision: halt new writes.', color: '#a78bfa' },
  { time: '23:10', type: 'degraded', label: 'Service Degraded (CP chosen)', desc: 'GitHub goes effectively read-only. GitHub chooses Consistency: halt writes, reconcile manually rather than serve divergent data.', color: '#34d399' },
  { time: '+24h11m', type: 'recovery', label: 'Full Recovery', desc: 'Reconciliation complete. Full write access restored. 24 hours 11 minutes of service degradation from 43 seconds of network loss.', color: '#2dd4bf' },
];

const CONFLICT_COSTS = [
  {
    strategy: 'Last-Write-Wins (LWW)',
    color: '#f87171',
    description: 'Whoever has the higher timestamp survives; the other write is silently discarded.',
    problem: 'Clock skew between nodes means "higher timestamp" is not reliable. Data loss is silent — no exception, no log, no alert.',
    when: 'Acceptable for: user profile fields where losing 1 update in 100 is tolerable (e.g. display name, avatar).',
    notFor: 'Financial balances, inventory counts, any field where every write must survive.',
    example: 'Node A writes balance=900 at t=1001ms; Node B writes balance=950 at t=1000ms (clock skew). LWW picks Node A: 900. The 50-unit deposit on Node B is gone.',
  },
  {
    strategy: 'Vector Clocks',
    color: '#fbbf24',
    description: 'Each write carries a vector of (nodeId → version). The system can determine if writes are concurrent or causally ordered.',
    problem: 'Does not resolve conflicts — it detects them. Resolution logic must be written by the application. Vectors grow unbounded as nodes are added.',
    when: 'Acceptable for: systems that can present conflicts to a human (collaborative documents) or have deterministic merge logic.',
    notFor: 'High-throughput writes at scale where vector growth becomes memory-prohibitive.',
    example: 'Amazon Dynamo shopping cart: [{node1: v3}, {node2: v2}] signals a conflict. Dynamo surfaces both versions; client-side merge keeps all items.',
  },
  {
    strategy: 'CRDTs (Conflict-free Replicated Data Types)',
    color: '#34d399',
    description: 'Data structures designed so any two states can be merged deterministically without conflicts — mathematically guaranteed.',
    problem: 'Only works for specific data shapes: grow-only sets, counters, sequence types. Cannot model arbitrary application logic. Often memory-expensive.',
    when: 'Ideal for: distributed counters, collaborative text (Yjs), shopping carts modeled as add-only item sets.',
    notFor: 'General relational data, arbitrary account balances, ordered transactional data.',
    example: 'G-Counter: {node1: 5, node2: 3}. Each node tracks its own count. Total = sum. Merge = max per node. Concurrent increments always converge correctly.',
  },
  {
    strategy: 'Saga / Compensating Transactions',
    color: '#a78bfa',
    description: 'Instead of preventing conflicting writes, define compensating operations to undo the effect after the fact.',
    problem: 'Compensation logic is business-specific and expensive to write correctly. Not all operations are reversible (sent email, fired missile). Requires idempotency keys.',
    when: 'The standard pattern for AP systems doing multi-step workflows: e-commerce order flows, financial transfer flows.',
    notFor: 'Real-time bidding, live inventory deduction, any operation that is not semantically reversible.',
    example: 'Order created (optimistic). Payment fails 2 seconds later. CompensateCreateOrder fires: cancels shipment, restores inventory, refunds card.',
  },
];

// ─── main ────────────────────────────────────────────────────────────────────

export default function PacelcDiagram({
  initialTab = 'formula',
}: { initialTab?: TabType }): React.JSX.Element {
  const [tab, setTab] = useState<TabType>(initialTab);
  const [selectedDb, setSelectedDb] = useState(DB_MATRIX[0]);
  const [selectedConflict, setSelectedConflict] = useState(0);

  const TABS: { id: TabType; label: string }[] = [
    { id: 'formula',         label: '1. PACELC Formula' },
    { id: 'el-tradeoff',     label: '2. Latency vs Consistency' },
    { id: 'database-matrix', label: '3. Database Matrix' },
    { id: 'github-incident', label: '4. GitHub Incident (2018)' },
    { id: 'conflict-cost',   label: '5. The AP Invoice' },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span>CAP Theorem & PACELC — What Happens When the Network is Fine</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '12px',
              background: active ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
              color: active ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
              boxShadow: active ? '0 0 0 1.5px #fbbf24' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.15s ease',
            }}>{t.label}</button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pacelc-grid { display: grid; gap: 14px; }
        @media (max-width: 768px) {
          .pacelc-2col { grid-template-columns: 1fr !important; }
          .pacelc-3col { grid-template-columns: 1fr !important; }
        }
      ` }} />

      {/* ── TAB 1: FORMULA ─────────────────────────────────────────────────── */}
      {tab === 'formula' && (
        <div className="pacelc-grid">

          {/* The formula */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textAlign: 'center', marginBottom: '16px' }}>
              Daniel Abadi, 2010 — "Problems with CAP, and Yahoo's little known NoSQL system"
            </div>

            {/* Formula visual */}
            <div style={{ display: 'flex', gap: '0', alignItems: 'stretch', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              {/* P side */}
              <div style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '8px 0 0 8px', padding: '14px 18px', textAlign: 'center', minWidth: '160px' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#f87171', marginBottom: '4px' }}>P</div>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, marginBottom: '8px' }}>Partition occurs</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.4' }}>Choose between:</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '6px' }}>
                  <Badge color="#34d399" text="A (Availability)" />
                  <span style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px' }}>vs</span>
                  <Badge color="#f87171" text="C (Consistency)" />
                </div>
              </div>

              {/* divider */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: 'none', borderRight: 'none' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fbbf24' }}>else</div>
              </div>

              {/* E side */}
              <div style={{ background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.35)', borderRadius: '0 8px 8px 0', padding: '14px 18px', textAlign: 'center', minWidth: '160px' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8', marginBottom: '4px' }}>E</div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '8px' }}>Else (no partition)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.4' }}>Choose between:</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '6px' }}>
                  <Badge color="#34d399" text="L (Latency)" />
                  <span style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px' }}>vs</span>
                  <Badge color="#f87171" text="C (Consistency)" />
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7', textAlign: 'center' }}>
              PACELC reads: <strong style={{ color: '#fbbf24' }}>PAC</strong> (during partition) — <strong style={{ color: '#38bdf8' }}>ELC</strong> (no partition)
            </div>
          </div>

          {/* Why CAP is incomplete */}
          <div className="pacelc-grid pacelc-2col" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <InfoBox color="#f87171" title="CAP's Blind Spot">
              CAP only describes trade-offs <strong>during a network partition</strong>. But partitions are rare — most systems experience them for seconds to minutes per year. What trade-offs does the system make during the other <strong>99.99%</strong> of the time?<br /><br />
              CAP is silent on this. PACELC answers it: during normal operation (E), systems still must choose between <strong>lower latency</strong> (accept writes without waiting for all replicas) vs <strong>stronger consistency</strong> (wait for replica acknowledgement before confirming success).
            </InfoBox>
            <InfoBox color="#38bdf8" title="The EL Insight">
              Consistency requires coordination. Coordination requires round-trips. Round-trips take time. Therefore: <strong>consistency costs latency</strong>.<br /><br />
              This is not a configuration choice — it is physics. Replicas in the same AZ: ~0.5ms. Replicas across regions: Singapore→Tokyo ~70ms, Vietnam→us-east-1 ~200ms+. Each strongly-consistent write adds at least one round-trip to that replica.<br /><br />
              Amazon internal study (2006): <strong>+100ms latency = −1% revenue</strong>.
            </InfoBox>
          </div>

          {/* C in ACID vs C in CAP vs C in PACELC */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '10px' }}>
              ⚠️ Three Different C's — Not the Same Letter
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'C in ACID', color: '#34d399', desc: 'Database moves from one valid state to another — no constraint is violated (e.g. balance never goes negative). This is about data CORRECTNESS relative to your business rules.' },
                { label: 'C in CAP', color: '#38bdf8', desc: 'Linearizability — any read returns the most recent successful write, everywhere, immediately. This is about data RECENCY across replicas.' },
                { label: 'C in PACELC (ELC part)', color: '#f97316', desc: 'Same as CAP\'s C: strong consistency (linearizability). The "else" case asks: when there\'s no partition, how much consistency do you maintain — and how much latency do you pay for it?' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px', background: `${item.color}06`, borderRadius: '6px', border: `1px solid ${item.color}20` }}>
                  <div style={{ background: item.color, color: '#0a0f1e', fontWeight: 900, fontSize: '10px', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EL TRADEOFF ─────────────────────────────────────────────── */}
      {tab === 'el-tradeoff' && (
        <div className="pacelc-grid">
          <InfoBox color="#38bdf8" title="The Two-Branch Manager — The EL Tradeoff Made Concrete">
            Two branches share one inventory ledger. The phone line (network) is working fine. One TV left. Customer walks into each branch simultaneously.
            <br /><br />
            <strong>Option L (Low latency):</strong> Manager sells based on local ledger without calling the other branch. Fast for the customer. Risk: both branches sell the last TV.
            <br /><br />
            <strong>Option C (Consistency):</strong> Manager calls the other branch to confirm before completing the sale. Correct. The customer waits while the call goes through. If the other branch doesn't answer in 3 rings — what then?
          </InfoBox>

          {/* Latency vs Consistency spectrum */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
              Round-Trip Latency by Replica Distance
            </div>

            {[
              { label: 'Same rack (same datacenter)', latency: '<1ms', cost: 'Negligible', color: '#34d399', bar: 2 },
              { label: 'Different AZ (same region)', latency: '1–5ms', cost: 'Low', color: '#34d399', bar: 8 },
              { label: 'Cross-region (same continent)', latency: '10–50ms', cost: 'Noticeable', color: '#fbbf24', bar: 35 },
              { label: 'Singapore → Tokyo', latency: '~70ms', cost: 'Significant', color: '#f97316', bar: 55 },
              { label: 'Vietnam → us-east-1', latency: '200ms+', cost: 'High', color: '#f87171', bar: 90 },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: '11px', color: row.color, fontWeight: 800 }}>{row.latency}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${row.bar}%`, background: row.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic' }}>
              Each strongly-consistent write must wait for at least one round-trip to the quorum before returning success. Multi-region strong consistency = multi-region latency on every write, every time.
            </div>
          </div>

          {/* DynamoDB billing example */}
          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>
              💰 Consistency Is a Line Item — Amazon DynamoDB Pricing
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              DynamoDB's pricing page makes the PACELC trade-off literal:
            </div>
            <div className="pacelc-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#34d399' }}>1 RCU</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>Eventually Consistent Read</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Up to 4KB. May return stale data.</div>
              </div>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#f87171' }}>2 RCU</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>Strongly Consistent Read</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Up to 4KB. Guaranteed latest value.</div>
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
              Consistency is not an abstract theoretical concept here. It is a specific number of cents per million requests, printed in black and white on the AWS billing console.
            </div>
          </div>

          {/* Operation-level guidance */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>Operation</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>EL Choice</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>Latency Cost</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>Business Reason</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Inventory deduct (flash sale)', 'EC (Consistency)', 'Pay round-trip', 'Oversell costs more than the latency: customer dissatisfaction + refund ops'],
                  ['Like / share counter', 'EL (Latency)', 'None', '3 stale likes on a post harms nobody. Blocking 10M concurrent likes would.'],
                  ['User profile read', 'EL (Latency)', 'None', 'Session guarantee (Read-Your-Writes) covers the user\'s own view. No global consistency needed.'],
                  ['Bank balance before debit', 'EC (Consistency)', 'Pay round-trip', 'Reading stale balance before deduction risks overdraft.'],
                  ['Product catalog search', 'EL (Latency)', 'None', 'Showing 5-second-old prices is fine. Sub-millisecond search matters more.'],
                  ['Feature flag read', 'EL (Latency) + bounded staleness', 'None (cache TTL)', '1-5 min staleness acceptable. Consistency within a request session is enough.'],
                ].map(([op, choice, cost, reason], idx) => (
                  <tr key={op} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{op}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <Badge color={choice.startsWith('EC') ? '#f87171' : '#34d399'} text={choice} />
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--ifm-color-content-secondary)' }}>{cost}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--ifm-color-content-secondary)' }}>{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: DATABASE MATRIX ─────────────────────────────────────────── */}
      {tab === 'database-matrix' && (
        <div className="pacelc-grid">
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            Click a database to see the full PACELC reasoning. Note: many databases let you change this label per-request or per-operation — the matrix shows defaults.
          </div>

          <div className="pacelc-grid pacelc-2col" style={{ gridTemplateColumns: '38% 62%', alignItems: 'start' }}>
            {/* Database list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {DB_MATRIX.map(db => {
                const isSelected = selectedDb.name === db.name;
                return (
                  <div key={db.name} onClick={() => setSelectedDb(db)} style={{
                    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                  }}>
                    <span style={{ fontWeight: isSelected ? 800 : 600, fontSize: '12px', color: isSelected ? 'var(--ifm-color-content)' : 'var(--ifm-color-content-secondary)' }}>{db.name}</span>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <Badge color={db.partitionColor} text={db.partition} />
                      <Badge color={db.normalColor} text={db.normal} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>{selectedDb.name}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                  <Badge color="#fbbf24" text={`PACELC: ${selectedDb.label}`} />
                  <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Leaning: {selectedDb.leaning}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Why This Classification</div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>{selectedDb.why}</div>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.06)', borderLeft: '3px solid #fbbf24', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '3px' }}>Important Nuance</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedDb.notes}</div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.06)', borderLeft: '3px solid #34d399', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '3px' }}>Abadi's Key Insight</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                  The PACELC label is not always a fixed property of a database — it is often a property of a specific operation on that database. DynamoDB and MongoDB are the clearest examples: the same database can be PA/EL or PC/EC depending on how you call it.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: GITHUB INCIDENT ─────────────────────────────────────────── */}
      {tab === 'github-incident' && (
        <div className="pacelc-grid">

          {/* Summary banner */}
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>October 21, 2018 — GitHub Outage</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
              <strong>Root Cause:</strong> 43-second network interruption during routine maintenance at US East Coast datacenter.<br />
              <strong>CAP choice made:</strong> Consistency (CP) — halted writes, reconciled manually.<br />
              <strong>Cost:</strong> 24 hours 11 minutes of service degradation.<br />
              <strong>Ratio:</strong> 43 seconds of partition → 2051× that in recovery time.
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>Incident Timeline</div>
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: '8px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(255,255,255,0.08)' }} />

              {GITHUB_EVENTS.map((event, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '16px' }}>
                  {/* Dot */}
                  <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: event.color, border: '2px solid rgba(0,0,0,0.3)' }} />
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '10px', color: event.color, fontWeight: 800, minWidth: '58px', paddingTop: '1px' }}>{event.time}</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: event.color, marginBottom: '2px' }}>{event.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{event.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lessons */}
          <div className="pacelc-grid pacelc-2col" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <InfoBox color="#f87171" title="CAP Lesson 1 — P Cannot Be Opted Out">
              GitHub did not choose to have a partition. A technician replaced hardware, a fiber link blinked, and the system was already in CAP territory before anyone clicked anything. Partition tolerance is not optional — it is the premise of any distributed system.
              <br /><br />
              The only choice is what to do when it happens. GitHub chose Consistency.
            </InfoBox>
            <InfoBox color="#fbbf24" title="CAP Lesson 2 — Timeout Cannot Distinguish 3 Scenarios">
              The automated failover fired because it detected timeout. But one timeout can mean three completely different things:
              <br /><br />
              (1) Node is dead permanently → promote replica (correct).<br />
              (2) Node is slow (GC pause, CPU spike) → wait (correct).<br />
              (3) Network blinked momentarily → do nothing (correct).<br /><br />
              The orchestrator can only see timeout. It cannot see which case it is in. Set the threshold too low → false failovers (what happened here). Set it too high → slow recovery when nodes actually die.
            </InfoBox>
          </div>

          {/* Brewer's correction */}
          <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
              Eric Brewer — "CAP Twelve Years Later" (2012)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              Twelve years after proposing CAP, Brewer wrote a correction paper. His key clarifications:
              <br /><br />
              1. <strong>"Choose 2 of 3" is a misleading framing.</strong> The real question is: "What does the system do during the window of a partition?" The right question to ask is not which two you pick, but: how do you <strong>detect</strong> a partition, <strong>manage</strong> data during it, and <strong>recover</strong> after it ends?
              <br /><br />
              2. <strong>The recovery phase is not free.</strong> GitHub's incident demonstrates this precisely: 43 seconds of partition → 24 hours of reconciliation. CAP says nothing about what that recovery costs. PACELC says nothing either. The cost of the reconciliation phase is the real bill for choosing AP.
            </div>
          </div>

          {/* Real world analogy */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
              The World Already Runs on Eventual Consistency
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              Pat Helland's observation: the real world has always been eventually consistent, long before computers existed.
              <br /><br />
              — Airlines <strong>overbook</strong> flights, then resolve with vouchers and upgrades.<br />
              — Hotels <strong>overbook</strong> rooms, then move guests to nearby hotels at cost.<br />
              — Banks process transactions as "<strong>pending</strong>" for 1–3 business days.<br />
              — E-commerce flash sales <strong>oversell</strong>, cancel orders, and apologize by email.<br /><br />
              None of them stop the entire business to ensure every ledger entry is consistent at every moment. They choose availability, and they have a compensation process for when things diverge. The engineering terms — <strong>saga, compensating transaction, reconciliation, read-repair</strong> — are the software equivalents of vouchers, apology emails, and manual ledger corrections that human organizations have run for centuries.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: CONFLICT COST ───────────────────────────────────────────── */}
      {tab === 'conflict-cost' && (
        <div className="pacelc-grid">
          <InfoBox color="#f97316" title="The Hidden Cost of Choosing AP">
            Choosing AP (availability during partition) does not cost you during the partition. It costs you <strong>after</strong> — when the network reconnects and two nodes try to reconcile their diverged states. The conflict resolution strategy you choose determines whether that cost is small and automatic or large and manual.
          </InfoBox>

          {/* Strategy selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CONFLICT_COSTS.map((c, idx) => (
              <button key={c.strategy} onClick={() => setSelectedConflict(idx)} style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '11px',
                background: selectedConflict === idx ? `${c.color}15` : 'rgba(255,255,255,0.04)',
                color: selectedConflict === idx ? c.color : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedConflict === idx ? `0 0 0 1.5px ${c.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
              }}>{c.strategy}</button>
            ))}
          </div>

          {/* Strategy detail */}
          {(() => {
            const c = CONFLICT_COSTS[selectedConflict];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: `${c.color}08`, border: `1px solid ${c.color}30`, borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: c.color, marginBottom: '8px' }}>{c.strategy}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>{c.description}</div>
                </div>

                <div className="pacelc-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>The Problem</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{c.problem}</div>
                  </div>
                  <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>Use When</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{c.when}</div>
                  </div>
                  <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>Not For</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{c.notFor}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', borderLeft: '3px solid #a78bfa', padding: '10px 12px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '4px' }}>Concrete Example</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>{c.example}</div>
                </div>
              </div>
            );
          })()}

          <InfoBox color="#fbbf24" title="The Accounting Principle — AP Defers, Never Cancels">
            Choosing AP is not "free" — it is a deferred payment. You serve the request now (availability), but you create a debt: the two diverged states must eventually be reconciled. The size of that debt depends on:
            <br /><br />
            (1) How long the partition lasted (more writes = more divergence).<br />
            (2) How many objects diverged (write hotspots magnify the debt).<br />
            (3) Which conflict resolution strategy you chose (LWW = silent data loss; CRDT = auto-resolved; Saga = compensating ops).<br /><br />
            GitHub's 43-second partition created 24 hours of reconciliation debt across 6 MySQL clusters. The partition was cheap. The bill arrived later.
          </InfoBox>
        </div>
      )}

    </div>
  );
}
