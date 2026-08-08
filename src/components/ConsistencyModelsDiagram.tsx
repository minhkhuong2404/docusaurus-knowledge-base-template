import React, { useState } from 'react';

type TabType = 'spectrum' | 'two-lenses' | 'session-guarantees' | 'decision' | 'anomalies';

interface ConsistencyModel {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  color: string;
  type: 'data-centric' | 'intermediate' | 'session';
  tagline: string;
  contract: string;
  origin: string;
  analogy: string;
  idealFor: string;
  notFor: string;
  realWorldExamples: string[];
  capPosition: string;
}

const MODELS: ConsistencyModel[] = [
  {
    id: 'linearizability',
    rank: 1,
    name: 'Linearizability',
    subtitle: '(Strongest — Real-Time Total Order)',
    color: '#f87171',
    type: 'data-centric',
    tagline: 'Every operation appears to execute atomically at exactly one point between its invocation and response, in real-time global order.',
    contract: 'After a write completes, any client anywhere in the world reading the same key must see the new value — no exceptions, no "give it a moment".',
    origin: 'Herlihy & Wing, 1990 — The formal definition behind "C" in CAP theorem.',
    analogy: '🏠 Whole team in one room: anyone who speaks is heard by everyone instantly, in exact order.',
    idealFor: 'Financial ledgers, inventory deduction before purchase, security permission checks.',
    notFor: 'High-throughput social feeds, analytics counters, replication-heavy multi-region writes.',
    realWorldExamples: ['Google Spanner (TrueTime clock)', 'etcd leader reads', 'ZooKeeper writes', 'CockroachDB serializable'],
    capPosition: 'This IS the C in CAP. Choosing it means sacrificing Availability during partition.'
  },
  {
    id: 'sequential',
    rank: 2,
    name: 'Sequential Consistency',
    subtitle: '(Agreed Total Order, No Real-Time Constraint)',
    color: '#f97316',
    type: 'data-centric',
    tagline: 'All nodes agree on one total ordering of operations, and per-process order is preserved — but the global order need not match wall-clock time.',
    contract: 'The system can be "slow" relative to reality, but everyone sees the same slowness. No node ever sees a reordering or rewind of history.',
    origin: 'Lamport, 1979 — Originally defined for shared memory across CPUs. Java volatile variables have sequential consistency per JMM.',
    analogy: '📹 Everyone watches the same recording of a meeting: exact same order, but some people may watch it a few minutes later.',
    idealFor: 'Multi-threaded CPU memory models, multi-producer log ordering.',
    notFor: 'Most distributed database APIs (rarely offered as a named tier; operators usually jump from causal straight to linearizability).',
    realWorldExamples: ['Java volatile variables (JMM)', 'CPU memory ordering barriers', 'Single-leader DB with synchronous replication'],
    capPosition: 'Weaker than linearizability (relaxes real-time), but consensus is still needed — so most systems skip this tier and go full linearizable.'
  },
  {
    id: 'causal',
    rank: 3,
    name: 'Causal Consistency',
    subtitle: '(Cause-Before-Effect Ordering)',
    color: '#fbbf24',
    type: 'data-centric',
    tagline: 'If operation A causally precedes operation B, all nodes see A before B. Concurrent (unrelated) operations may appear in any order.',
    contract: 'A reply can never appear before the comment it responds to. But two completely independent posts may arrive in any order on different nodes.',
    origin: 'Mahajan, Alvisi & Dahlin, 2011 — Proven to be the STRONGEST consistency model achievable while maintaining availability under network partition. It is the ceiling of the "A" side of CAP.',
    analogy: '💬 Group chat over flaky network: answers never appear before questions. Two unrelated posts may shuffle freely.',
    idealFor: 'Social media threads, collaborative document editing, comment systems, Git-like version control.',
    notFor: 'Scenarios requiring single global ordering across unrelated events. Full causal graphs are expensive at scale.',
    realWorldExamples: ['MongoDB causally consistent sessions (v3.6+)', 'DynamoDB eventually consistent + DAX', 'COPS / Eiger (research systems)', 'Azure Cosmos DB (session consistency approximates this)'],
    capPosition: 'The theoretical maximum consistency for AP systems. Stronger than this = CP (hits CAP wall).'
  },
  {
    id: 'bounded-staleness',
    rank: 4,
    name: 'Bounded Staleness',
    subtitle: '(Stale-But-With-Limits)',
    color: '#34d399',
    type: 'intermediate',
    tagline: 'Data may be stale, but staleness is capped by a declared maximum — either K versions or T seconds. The system blocks reads if the lag exceeds the bound.',
    contract: 'You declare: "I can tolerate data that is at most 5 seconds or 10 versions old." Once the replica exceeds that threshold, it blocks reads until it catches up.',
    origin: 'Azure Cosmos DB named tier. Practical compromise between Causal and Eventual.',
    analogy: '📰 A newspaper that can be at most 1 edition behind the latest — never more.',
    idealFor: 'ATM balance displays, product availability estimations, dashboards where approximate real-time matters.',
    notFor: 'Financial transactions at the moment of execution, auth token validation.',
    realWorldExamples: ['Azure Cosmos DB "Bounded Staleness" tier', 'Read replicas with max-lag-seconds parameter', 'MySQL replica with max_allowed_replication_lag'],
    capPosition: 'Sits between Causal and Eventual on the data-centric spectrum. More predictable than Eventual but cheaper than Causal.'
  },
  {
    id: 'session',
    rank: 5,
    name: 'Session / Client-Centric Consistency',
    subtitle: '(Per-User Logical View)',
    color: '#38bdf8',
    type: 'session',
    tagline: 'Within a single client session, consistency guarantees are maintained. Other clients may see the world differently.',
    contract: 'Read-your-writes + Monotonic reads + Monotonic writes + Writes-follow-reads — all bundled as a single user-visible coherent session contract.',
    origin: 'Terry et al., Bayou project, Xerox PARC (1994) — The original "Session Guarantees" paper defined all four sub-guarantees.',
    analogy: '👤 What matters is YOUR experience: your own story is always coherent, even if globally things are fuzzy.',
    idealFor: 'User profiles, shopping carts, order status, any personal-state UI where the user must see what they just did.',
    notFor: 'Global leaderboards, shared inventory counts, multi-user collaborative edits without conflict resolution.',
    realWorldExamples: ['Azure Cosmos DB default tier (Session Consistency)', 'MongoDB causally consistent sessions', 'Sticky read routing to primary after write', 'Cosmos DB Session Token propagation'],
    capPosition: 'Not on the data-centric spectrum — it measures a different dimension (client coherence, not global order). Azure Cosmos DB defaults to this because it covers ~80% of real user pain points.'
  },
  {
    id: 'consistent-prefix',
    rank: 6,
    name: 'Consistent Prefix',
    subtitle: '(Temporal Ordering Without Staleness Bound)',
    color: '#a78bfa',
    type: 'intermediate',
    tagline: 'Reads always see a valid prefix of the write history — never a future event without its past. The world may be "old" but it is never internally contradictory.',
    contract: 'You may see the world as it was 3 seconds ago, but you will NEVER see a reply before the comment it references, or a transaction result before the transaction request.',
    origin: 'Azure Cosmos DB named tier, also a correctness property of many streaming and log-based systems.',
    analogy: '📺 Watching a TV series streaming behind by 2 episodes: you see episodes in order, just a bit delayed. Episode 8 never airs before Episode 5.',
    idealFor: 'Social feeds, activity streams, notification logs, CDC event streams.',
    notFor: 'Real-time pricing, inventory, anything where "stale" causes real financial or operational harm.',
    realWorldExamples: ['Azure Cosmos DB "Consistent Prefix" tier', 'Kafka consumer group reads (within a partition)', 'MySQL binlog-based replication feeds', 'Event sourcing replay streams'],
    capPosition: 'One level weaker than Session in Cosmos DB. Guarantees ordering, not freshness or personal coherence.'
  },
  {
    id: 'eventual',
    rank: 7,
    name: 'Eventual Consistency',
    subtitle: '(Weakest — Convergence Guaranteed, Timing Not)',
    color: '#8b5cf6',
    type: 'data-centric',
    tagline: 'If writes stop long enough, all replicas will eventually converge to the same value. During the convergence window, all bets are off.',
    contract: 'The system promises ONE thing: given enough quiet time, replicas will agree. It makes zero guarantees about the path to convergence — you may read a value written in the future, miss a value written in the past, or read new-then-old on successive reads.',
    origin: 'Werner Vogels, "Eventually Consistent" (2008) — popularized via Amazon/Dynamo architecture.',
    analogy: '📦 Drop messages in a box labeled "open later" — eventually everyone gets everything, but in what order and when is unknown.',
    idealFor: 'Like/share counters, DNS records, global catalog, analytics aggregations, search indexes.',
    notFor: 'Anything the user will immediately read back after writing. Any financial, security, or inventory operation.',
    realWorldExamples: ['Amazon S3 (pre-Dec 2020 for LIST/GET)', 'Apache Cassandra (default)', 'Amazon DynamoDB eventually consistent reads (half the cost!)', 'CouchDB', 'Riak'],
    capPosition: 'Maximum availability. Minimum consistency guarantees. Maximum developer responsibility for handling anomalies.'
  }
];

const FOUR_ANOMALIES = [
  {
    name: 'Read-Your-Writes Violation',
    color: '#f87171',
    scenario: 'User updates phone number → clicks Save → navigates back → sees OLD phone number.',
    cause: 'Write hit primary replica → 200 OK returned → Next read routed to read replica still 300ms behind → Returns stale value.',
    detection: 'User files "system lost my change" support ticket. No exception thrown. No error log.',
    fix: 'Route reads to primary for 5s after write, or embed write timestamp token in session and refuse stale replica responses.'
  },
  {
    name: 'Monotonic Reads Violation',
    color: '#f97316',
    scenario: 'User refreshes the feed and alternately sees 1,423 and 1,420 likes — the count goes backwards on every other refresh.',
    cause: 'Load balancer round-robins requests across two replicas with different replication lag. User sees replica A (fresh), then replica B (stale), then A again.',
    detection: 'Support ticket: "the like count is glitching." F5 refresh "fixes" it temporarily.',
    fix: 'Sticky read routing (same user → same replica per session), or use consistent-prefix / session consistency tier.'
  },
  {
    name: 'Monotonic Writes Violation',
    color: '#fbbf24',
    scenario: 'User renames a document, then adds a comment. Other readers see the comment with the OLD document title, then later the rename.',
    cause: 'Two writes dispatched to different replica nodes. Rename replication is slow; comment replication is fast. Readers on both replicas see out-of-order apply.',
    detection: 'Observed as "content mismatch" by readers. Writer does not experience the bug themselves.',
    fix: 'Single-writer sequencing, causal tokens attached to both writes, or use causal consistency tier.'
  },
  {
    name: 'Writes-Follow-Reads Violation',
    color: '#a78bfa',
    scenario: 'User reads a comment → writes a reply → Some users see the reply but the original comment is missing.',
    cause: 'The reply was written to a node that has not yet received the original comment. Reply is visible; parent comment is not.',
    detection: '"Orphaned reply" support tickets. Moderate-to-low reproduction rate because it depends on replication timing.',
    fix: 'Attach read-token to the write: "I read version X of this thread before replying." Replicas must satisfy X before serving the reply.'
  }
];

const COSMOS_TIERS = [
  { name: 'Strong', model: 'linearizability', cost: '2x read units', latency: 'Highest', color: '#f87171' },
  { name: 'Bounded Staleness', model: 'bounded-staleness', cost: '2x read units', latency: 'High', color: '#f97316' },
  { name: 'Session (DEFAULT)', model: 'session', cost: '1x read units', latency: 'Low', color: '#38bdf8' },
  { name: 'Consistent Prefix', model: 'consistent-prefix', cost: '1x read units', latency: 'Low', color: '#a78bfa' },
  { name: 'Eventual', model: 'eventual', cost: '0.5x read units', latency: 'Lowest', color: '#8b5cf6' }
];

export default function ConsistencyModelsDiagram({ initialTab = 'spectrum' }: { initialTab?: TabType }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedModel, setSelectedModel] = useState<ConsistencyModel>(MODELS[0]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(0);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Distributed Consistency Models — Full Spectrum & Session Guarantees</span>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          { id: 'spectrum', label: '1. Consistency Spectrum' },
          { id: 'two-lenses', label: '2. Two Lenses' },
          { id: 'session-guarantees', label: '3. Session Guarantees' },
          { id: 'anomalies', label: '4. Consistency Anomalies' },
          { id: 'decision', label: '5. Decision Matrix' },
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease'
              }}
            >{t.label}</button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .cm-grid-split { grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* TAB 1: SPECTRUM */}
      {activeTab === 'spectrum' && (
        <div className="cm-grid-split" style={{ display: 'grid', gridTemplateColumns: '44% 56%', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Strongest → Weakest (Click to Inspect)
            </div>

            {/* Type Labels */}
            {[
              { label: 'Data-Centric (Global Ordering)', ids: ['linearizability', 'sequential', 'causal', 'eventual'], color: '#38bdf8' },
              { label: 'Intermediate (Named DB Tiers)', ids: ['bounded-staleness', 'consistent-prefix'], color: '#fbbf24' },
              { label: 'Session / Client-Centric', ids: ['session'], color: '#34d399' },
            ].map(group => {
              const groupModels = MODELS.filter(m => group.ids.includes(m.id));
              if (groupModels.length === 0) return null;
              return (
                <div key={group.label}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: group.color, textTransform: 'uppercase', padding: '3px 6px', background: `${group.color}10`, borderRadius: '4px', marginBottom: '4px', width: 'fit-content' }}>
                    {group.label}
                  </div>
                  {MODELS.filter(m => group.ids.includes(m.id)).map(model => {
                    const isSelected = selectedModel.id === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        style={{
                          padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                          background: isSelected ? `${model.color}15` : 'rgba(255,255,255,0.02)',
                          borderLeft: `4px solid ${model.color}`,
                          border: isSelected ? `1px solid ${model.color}60` : '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '12px', color: isSelected ? model.color : 'var(--ifm-color-content)' }}>
                          {model.rank}. {model.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                          {model.subtitle}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${selectedModel.color}40`, borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: selectedModel.color, marginBottom: '4px' }}>
                {selectedModel.rank}. {selectedModel.name}
              </div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                {selectedModel.origin}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.5', margin: 0 }}>
                {selectedModel.tagline}
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>The Contract</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedModel.contract}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: selectedModel.color, textTransform: 'uppercase', marginBottom: '4px' }}>Analogy</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontStyle: 'italic' }}>{selectedModel.analogy}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>Ideal For</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedModel.idealFor}</div>
              </div>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>Not For</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedModel.notFor}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Real-World Systems</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedModel.realWorldExamples.map(ex => (
                  <span key={ex} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: `${selectedModel.color}15`, color: selectedModel.color, fontWeight: 600 }}>{ex}</span>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(234, 179, 8, 0.08)', borderLeft: `3px solid #eab308`, padding: '8px 10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#eab308', textTransform: 'uppercase', marginBottom: '3px' }}>CAP Position</div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedModel.capPosition}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TWO LENSES */}
      {activeTab === 'two-lenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
            <strong style={{ color: '#38bdf8' }}>The Root of Most Consistency Debates:</strong> Engineers arguing about consistency are often speaking two different languages without knowing it. One person talks about global data state; the other talks about what a single user sees. Both are valid — they are just measuring different things.
          </div>

          <div className="cm-grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Data-Centric */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
                📡 Data-Centric Lens
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '12px' }}>
                <strong>Question:</strong> "Do all the replicas of this database, taken together, tell a consistent story?"
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'Linearizability', color: '#f87171' },
                  { name: 'Sequential Consistency', color: '#f97316' },
                  { name: 'Causal Consistency', color: '#fbbf24' },
                  { name: 'Eventual Consistency', color: '#8b5cf6' },
                ].map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{m.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic' }}>
                These are global properties of the distributed system — independent of any single user's experience.
              </div>
            </div>

            {/* Client-Centric */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '10px' }}>
                👤 Client-Centric Lens
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '12px' }}>
                <strong>Question:</strong> "Does THIS particular user, within THEIR session, see a logically coherent world?"
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'Read-Your-Writes', color: '#34d399' },
                  { name: 'Monotonic Reads', color: '#2dd4bf' },
                  { name: 'Monotonic Writes', color: '#38bdf8' },
                  { name: 'Writes-Follow-Reads', color: '#a78bfa' },
                ].map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{m.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic' }}>
                These are per-session properties. They make life sane for individual users without requiring global ordering.
              </div>
            </div>
          </div>

          {/* Azure Cosmos DB Tiers */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
              Azure Cosmos DB — Commercial Blending of Both Lenses (5 Tiers)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
              Cosmos DB collapses both lenses into a single dial for commercial usability. The default is <strong style={{ color: '#38bdf8' }}>Session</strong> — not the cheapest, not the most strict, but the one that resolves ~80% of real user-visible pain.
            </div>
            {COSMOS_TIERS.map((t, idx) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: idx < COSMOS_TIERS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: t.color, flexShrink: 0 }} />
                <div style={{ fontWeight: 700, fontSize: '11px', color: t.name.includes('DEFAULT') ? t.color : 'var(--ifm-color-content)', flex: 1 }}>{t.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Cost: {t.cost}</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Latency: {t.latency}</div>
              </div>
            ))}
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic' }}>
              💡 Amazon DynamoDB takes the opposite default: eventually consistent reads cost <strong>half</strong> a strongly consistent read. Same engineering, different product philosophy.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SESSION GUARANTEES */}
      {activeTab === 'session-guarantees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            <strong style={{ color: '#34d399' }}>Bayou Project (Xerox PARC, 1994):</strong> Terry et al. defined these 4 session guarantees as the most practical consistency requirements for real user interactions. Together they form "Session Consistency" — Azure Cosmos DB's default tier.
          </div>

          <div className="cm-grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              {
                name: 'Read-Your-Writes',
                color: '#34d399',
                rule: 'A write by a process is always reflected in subsequent reads by the same process.',
                realBug: 'User updates phone number → sees old number on next page load.',
                implementation: 'Route reads to primary for N seconds after write, OR embed write-timestamp token in session and check replica lag.',
                caveat: 'Breaks when user switches device, or load balancer changes session affinity. Token-based approach is more robust.'
              },
              {
                name: 'Monotonic Reads',
                color: '#2dd4bf',
                rule: 'If a process reads the value of a data item x, any successive read of x by that same process will always return that value or a more recent value.',
                realBug: 'User F5-refreshes a count that goes 1,423 → 1,419 → 1,425 → 1,418 because LB bounces between two replicas with different lag.',
                implementation: 'Sticky routing: same user ID always routed to same replica within a session.',
                caveat: 'Sticky routing creates hot replicas if some users are much heavier readers than others.'
              },
              {
                name: 'Monotonic Writes',
                color: '#38bdf8',
                rule: 'Writes by a single process are applied in the order they were issued — no write can be reordered relative to other writes by the same process.',
                realBug: 'User renames a document, then immediately adds a paragraph. Readers see the paragraph under the OLD name, then later the rename applies.',
                implementation: 'Write sequencing tokens; multi-master replication with causal metadata attached to each write operation.',
                caveat: 'Hard to enforce across multiple concurrent browser tabs for the same user.'
              },
              {
                name: 'Writes-Follow-Reads',
                color: '#a78bfa',
                rule: 'A write by a process on item x following a read of x will take place on the same or a more recent version of x that was read.',
                realBug: 'User reads a post, writes a reply. Some readers see the reply but the original post is missing (orphaned reply).',
                implementation: 'Attach a "read vector" to every write: the write declares which version it was based on. Replicas must satisfy that dependency before serving the write.',
                caveat: 'This is a simplified per-client causal tracking — far cheaper than full global causal consistency.'
              }
            ].map(g => (
              <div key={g.name} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${g.color}30`, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: g.color }}>{g.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}><strong>Rule:</strong> {g.rule}</div>
                <div style={{ background: 'rgba(248,113,113,0.08)', borderLeft: `3px solid #f87171`, padding: '6px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                  <strong style={{ color: '#f87171' }}>Real Bug:</strong> {g.realBug}
                </div>
                <div style={{ background: 'rgba(52,211,153,0.08)', borderLeft: `3px solid #34d399`, padding: '6px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                  <strong style={{ color: '#34d399' }}>Fix:</strong> {g.implementation}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic' }}>⚠️ {g.caveat}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
              ⚠️ The "Session" Is More Fragile Than You Think
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              Session guarantees depend on session identity being stable — but sessions break when users switch networks (WiFi → 4G), switch devices (laptop → phone), or when the sticky replica restarts. A more robust approach: use <strong>logical timestamp tokens</strong>. After each write, the server returns a monotonic token. The client attaches this token to all subsequent reads. Any replica lagging behind that token must block or forward the request. This is what <strong>MongoDB causally consistent sessions (v3.6)</strong> and <strong>Cosmos DB Session Token</strong> implement — the guarantee lives in the data, not in the network path.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANOMALIES */}
      {activeTab === 'anomalies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            Consistency violations do not throw exceptions. They manifest as confusing user-visible bugs that appear intermittently, are hard to reproduce, and get closed as "cannot reproduce" or resolved with "please refresh the page."
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FOUR_ANOMALIES.map((a, idx) => (
              <button
                key={a.name}
                onClick={() => setSelectedAnomaly(idx)}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '11px',
                  background: selectedAnomaly === idx ? `${a.color}15` : 'rgba(255,255,255,0.04)',
                  color: selectedAnomaly === idx ? a.color : 'var(--ifm-color-content-secondary)',
                  boxShadow: selectedAnomaly === idx ? `0 0 0 1.5px ${a.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                  transition: 'all 0.15s ease'
                }}
              >{a.name}</button>
            ))}
          </div>

          {(() => {
            const a = FOUR_ANOMALIES[selectedAnomaly];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: `${a.color}10`, border: `1px solid ${a.color}40`, borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: a.color, marginBottom: '8px' }}>{a.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
                    <strong>Scenario:</strong> {a.scenario}
                  </div>
                </div>

                <div className="cm-grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '6px' }}>Root Cause</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{a.cause}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>Detection Pattern</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{a.detection}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>Fix Strategy</div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{a.fix}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(234, 179, 8, 0.06)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', color: 'var(--ifm-color-content)' }}>
                  <strong style={{ color: '#eab308' }}>The Invisible Bug:</strong> Consistency violations do not increment error counters. They do not appear in application logs. Replication lag dashboards show the <em>shadow</em> of the problem, not the problem itself. The only reliable detection method is user reports — and the support answer "please try refreshing" is the most effective consistency-bug cover-up in existence.
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 5: DECISION MATRIX */}
      {activeTab === 'decision' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            <strong style={{ color: '#38bdf8' }}>Per-Operation Consistency Scoping:</strong> The expert approach is NOT "pick one consistency level for the entire system." It is to scope the consistency requirement to each individual business operation. Over-specifying costs money and latency. Under-specifying costs user trust.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>Business Operation</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>Required Model</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>Why</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'left' }}>User Impact if Wrong</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { op: 'Deduct inventory / bank balance', model: 'Linearizability', color: '#f87171', why: 'Two concurrent debits must see each other to prevent oversell or overdraft.', wrong: 'Oversell, overdraft, financial loss, legal risk.' },
                  { op: 'User profile / personal settings', model: 'Session (Read-Your-Writes)', color: '#38bdf8', why: 'User expects to see their own changes immediately, no one else needs real-time.', wrong: 'Support ticket: "I changed my address but it still shows the old one."' },
                  { op: 'Comment / reply thread ordering', model: 'Causal Consistency', color: '#fbbf24', why: 'A reply must never appear before the comment it responds to.', wrong: 'Replies appear with no parent. Conversations look nonsensical.' },
                  { op: 'Like/share/view counters', model: 'Consistent Prefix / Eventual', color: '#8b5cf6', why: 'Counter can be 3 seconds stale. No one cares. Chronological ordering still matters.', wrong: 'Counter briefly shows lower value. Barely noticed.' },
                  { op: 'Social feed / notification stream', model: 'Consistent Prefix', color: '#a78bfa', why: 'New posts visible in creation order. Slight delay acceptable. No time-travel.', wrong: 'Reply appears before the post it references. Confusing but non-critical.' },
                  { op: 'Feature flag / config read', model: 'Session / Bounded Staleness', color: '#2dd4bf', why: 'Flag should be consistent within a request lifecycle. 1-5 min staleness acceptable.', wrong: 'Feature appears enabled/disabled inconsistently within same session. A/B test contamination.' },
                  { op: 'Global leaderboard', model: 'Eventual / Bounded Staleness', color: '#34d399', why: '5-second delay in top-10 ranking is acceptable for fun/social contexts.', wrong: 'Rank oscillates. Annoying but not harmful unless prizes are real-money.' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{row.op}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${row.color}15`, color: row.color, fontWeight: 700 }}>{row.model}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content-secondary)', fontSize: '11px' }}>{row.why}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content-secondary)', fontSize: '11px' }}>{row.wrong}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
              ⚡ The S3 Case Study: Consistency That Became Free
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              Amazon S3 launched in 2006 with <strong>eventual consistency</strong> for GET/LIST operations. For 14 years, data pipelines built on S3 struggled: a file just written might not appear in a LIST for seconds. The workaround? <strong>Amazon EMR's EMRFS Consistent View</strong> — an entire DynamoDB table as an auxiliary "file just wrote this" ledger. One missing guarantee in S3's contract required a whole external database to compensate.
              <br/><br/>
              On <strong>December 1, 2020</strong>, AWS quietly announced <strong>strong read-after-write consistency</strong> for all GET, PUT, and LIST operations on S3 — all objects, all regions, zero extra cost, zero performance penalty. An entire class of workarounds became obsolete overnight. The lesson: what costs a full satellite system today may cost nothing tomorrow. But understanding the model always matters, regardless of what the vendor's implementation does.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
