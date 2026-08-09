import React, { useState } from 'react';

type TabType = 'compare' | 'strict' | 'truetime' | 'trap' | 'checklist';

// ─── helpers ────────────────────────────────────────────────────────────────

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
      background: `${color}18`, color, display: 'inline-block'
    }}>{text}</span>
  );
}

function InfoBox({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}30`,
      borderLeft: `4px solid ${color}`, borderRadius: '6px',
      padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '4px'
    }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>{children}</div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function SerializabilityLinearizabilityDiagram({
  initialTab = 'compare',
}: { initialTab?: TabType }): React.JSX.Element {
  const [tab, setTab] = useState<TabType>(initialTab);
  const [analogyView, setAnalogyView] = useState<'serializable' | 'linearizable'>('serializable');
  const [trapRevealed, setTrapRevealed] = useState(false);

  const TABS = [
    { id: 'compare', label: '1. Two Worlds' },
    { id: 'strict', label: '2. Strict Serializability' },
    { id: 'truetime', label: '3. TrueTime & Commit-Wait' },
    { id: 'trap', label: '4. The Single-Node Trap' },
    { id: 'checklist', label: '5. Decision Checklist' },
  ] as const;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>Serializability vs Linearizability — Two Strongest, Two Different Worlds</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as TabType)} style={{
              padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '12px',
              background: active ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
              color: active ? '#f97316' : 'var(--ifm-color-content-secondary)',
              boxShadow: active ? '0 0 0 1.5px #f97316' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.15s ease',
            }}>{t.label}</button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .srl-grid { display: grid; gap: 14px; }
        @media (max-width: 768px) {
          .srl-grid-2 { grid-template-columns: 1fr !important; }
          .srl-grid-3 { grid-template-columns: 1fr !important; }
        }
      ` }} />

      {/* ── TAB 1: TWO WORLDS ─────────────────────────────────────────────── */}
      {tab === 'compare' && (
        <div className="srl-grid">
          {/* TLDR banner */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '12px 16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          }} className="srl-grid-2">
            {[
              {
                color: '#f87171',
                title: 'Serializability',
                subtitle: 'The "I" in ACID — Transaction Isolation',
                contract: 'Many transactions × many objects → result must equal some serial ordering.',
                cares: 'Atomicity + correct ordering',
                doesnt: 'Real-time ordering. "Some order" is enough.',
              },
              {
                color: '#38bdf8',
                title: 'Linearizability',
                subtitle: 'The "C" in CAP — Consistency Model',
                contract: 'Single operation × single object → appears to take effect at one point in real-time.',
                cares: 'Recency (freshness)',
                doesnt: 'Grouping multiple ops into one atomic unit.',
              },
            ].map(w => (
              <div key={w.title} style={{
                background: `${w.color}08`, border: `1px solid ${w.color}30`,
                borderRadius: '8px', padding: '14px',
              }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: w.color, marginBottom: '4px' }}>{w.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>{w.subtitle}</div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '8px' }}>
                  <strong>Contract:</strong> {w.contract}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Cares about: </span>
                    <span style={{ color: 'var(--ifm-color-content)' }}>{w.cares}</span>
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>✗ Silent on: </span>
                    <span style={{ color: 'var(--ifm-color-content)' }}>{w.doesnt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dimension table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 12px', color: '#f97316', textAlign: 'left' }}>Dimension</th>
                  <th style={{ padding: '8px 12px', color: '#f87171', textAlign: 'left' }}>Serializability</th>
                  <th style={{ padding: '8px 12px', color: '#38bdf8', textAlign: 'left' }}>Linearizability</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Origin', 'DB transaction theory (ACID, 1970s–80s)', 'Concurrent object theory (Herlihy & Wing, 1990)'],
                  ['Scope', 'Many operations, many objects, one transaction unit', 'One operation, one object'],
                  ['Primary guarantee', 'Result ≡ some serial execution (correctness)', 'Operation takes effect at one real-time point (freshness)'],
                  ['Real-time constraint', '❌ None — serial order may differ from wall clock', '✅ Required — A completes before B starts → A precedes B always'],
                  ['Grouping ops', '✅ Yes — multiple ops are one atomic unit', '❌ No — no multi-op atomicity concept'],
                  ['Protects against', 'Lost updates, write skew, phantoms', 'Stale reads, replica lag visibility'],
                  ['Does NOT protect against', 'Stale reads (no freshness promise)', 'Lost updates, write skew (no multi-op atomicity)'],
                  ['Metric', '"Is there a valid serial ordering?"', '"Does every read see the latest write?"'],
                  ['Flagship system', 'PostgreSQL SERIALIZABLE, MySQL InnoDB Serializable', 'Google Spanner (TrueTime), etcd leader reads'],
                ].map(([dim, ser, lin], idx) => (
                  <tr key={dim} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{dim}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--ifm-color-content-secondary)' }}>{ser}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--ifm-color-content-secondary)' }}>{lin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Meeting room analogy */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '10px' }}>
              The Meeting Room Analogy — Click to Switch
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {(['serializable', 'linearizable'] as const).map(v => (
                <button key={v} onClick={() => setAnalogyView(v)} style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '11px',
                  background: analogyView === v ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                  color: analogyView === v ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
                  boxShadow: analogyView === v ? '0 0 0 1.5px #fbbf24' : '0 0 0 1px rgba(255,255,255,0.08)',
                }}>
                  {v === 'serializable' ? '📝 The Secretary (Serializable)' : '📹 The Camera (Linearizable)'}
                </button>
              ))}
            </div>
            {analogyView === 'serializable' ? (
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
                <strong style={{ color: '#f87171' }}>📝 The Secretary writes the meeting minutes.</strong>
                <br />
                As long as the minutes read coherently — no one appears to contradict themselves, no logical inconsistency — the secretary is completely free to <strong>reorder who spoke first</strong>. If Bob finished speaking before Alice raised her hand, the secretary may write "Alice spoke, then Bob responded" — because the final narrative is self-consistent.
                <br /><br />
                The secretary cares about <em>the story</em>, not <em>the clock</em>. A Serializable database is that secretary: it guarantees the story makes sense, not that it matches real-time wall-clock order.
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
                <strong style={{ color: '#38bdf8' }}>📹 The security camera in the corner, timestamp burning in.</strong>
                <br />
                No editing. No reordering. Whatever happens first on the clock is first on the tape. If Alice spoke at 10:00:01 and Bob at 10:00:03, that is the order, forever.
                <br /><br />
                But — <strong>the camera only points at one chair</strong>. What happens at the other three chairs is not filmed. Linearizability gives you perfect, tamper-proof real-time ordering for <em>one object at a time</em>. It does not give you any picture of cross-object atomicity.
              </div>
            )}
          </div>

          {/* Peter Bailis note */}
          <InfoBox color="#a78bfa" title="Peter Bailis (2014) — 'Linearizability versus Serializability'">
            These two concepts are <strong>orthogonal</strong>. They are measured on different axes with different rulers. Asking "which one is stronger?" is like comparing metres to kilograms. Each model is the strongest guarantee within its own domain — isolation for Serializability, recency for Linearizability.
          </InfoBox>
        </div>
      )}

      {/* ── TAB 2: STRICT SERIALIZABILITY ─────────────────────────────────── */}
      {tab === 'strict' && (
        <div className="srl-grid">

          {/* Formula block */}
          <div style={{
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>The Combination</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', borderRadius: '8px', padding: '10px 18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>Serializability</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Multi-op atomicity + ordering</div>
              </div>
              <div style={{ fontSize: '20px', color: '#fbbf24', fontWeight: 800 }}>+</div>
              <div style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', borderRadius: '8px', padding: '10px 18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>Linearizability</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Real-time ordering constraint</div>
              </div>
              <div style={{ fontSize: '20px', color: '#fbbf24', fontWeight: 800 }}>→</div>
              <div style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399', borderRadius: '8px', padding: '10px 18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>Strict Serializability</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Google: "external consistency"</div>
              </div>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
              Transactions execute in <strong>serial equivalence order</strong> AND that order <strong>must match real-time wall-clock order</strong>. If transaction A commits before transaction B begins, A must precede B in the serial ordering — no exceptions, no re-dating.
            </div>
          </div>

          {/* What this adds */}
          <div className="srl-grid srl-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <InfoBox color="#f87171" title="Serializability Alone — The Loophole">
              Transaction A commits at <strong>10:00</strong>. Transaction B starts at <strong>10:01</strong>. They never interact in the database.
              <br /><br />
              A purely Serializable system may legally record: <em>"B ran first, then A."</em> The story is still self-consistent. There is no constraint violation. And yet the person who committed A, then called someone to say "it's done, you can proceed," will find that person opens B and sees the old value.
              <br /><br />
              The causal link <strong>went through the telephone</strong>, outside the database. Serializability has no model for external causality.
            </InfoBox>
            <InfoBox color="#34d399" title="Strict Serializability — The Fix">
              Adding Linearizability seals the loophole. If A committed before B began (by any clock, in any region), the system is <strong>obligated</strong> to place A before B in the serial ordering.
              <br /><br />
              The result: <em>"What I just finished writing, the whole world sees"</em> — not eventually, not with a propagation delay, but <strong>immediately after my commit returns</strong>.
              <br /><br />
              This is what Google Spanner calls <strong>external consistency</strong> (OSDI 2012): the strongest guarantee they know how to provide for a distributed database.
            </InfoBox>
          </div>

          {/* The extreme loophole */}
          <div style={{
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '8px', padding: '14px'
          }}>
            <div style={{ fontWeight: 800, fontSize: '12px', color: '#f87171', marginBottom: '8px' }}>
              ⚠️ The Extreme Loophole — A Valid But Useless Database
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              A system achieving <em>only</em> Serializability can, in principle, answer <strong>every read-only transaction with the initial (empty) database state — forever</strong> — and remain technically compliant.
              <br /><br />
              How? Simply place all read-only transactions at the head of the serial order, before any write transactions. The story is coherent. No constraint is violated. The serial ordering is valid.
              <br /><br />
              The database just happens to be completely unusable. But it would pass a Serializability correctness checker. This is not a theoretical curiosity — it is the formal boundary of what the model actually promises.
            </div>
          </div>

          {/* Systems comparison */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>System</th>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Serializable</th>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Linearizable</th>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Strict (External)</th>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Google Spanner', '✅', '✅', '✅ "External consistency"', 'TrueTime GPS+atomic clock; commit-wait'],
                  ['CockroachDB', '✅', '⚠️ Per-key only', '❌ Not guaranteed cross-key', 'They document this explicitly as a deliberate tradeoff'],
                  ['PostgreSQL (single node)', '✅ SSI', '✅ (free — single timeline)', '✅ (implicit on 1 node)', 'Single node collapses real-time and serial order'],
                  ['PostgreSQL (logical replication)', '✅ on primary', '⚠️ Primary only', '❌ Replicas may lag', 'Reads on replicas break linearizability'],
                  ['etcd', '❌ No transactions', '✅ (leader reads)', '❌ N/A', 'Single-object KV; no multi-key transactions'],
                  ['Apache Cassandra', '❌', '❌ (eventual)', '❌', 'LWT (lightweight transactions) are linearizable on single partition only'],
                  ['DynamoDB Transactions', '✅ (TransactWriteItems)', '⚠️ Strong reads only', '⚠️ Partial', 'Transactions are serializable; strong reads are linearizable; not combined'],
                ].map(([sys, s, l, ss, note], idx) => (
                  <tr key={sys} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{sys}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--ifm-color-content)' }}>{s}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--ifm-color-content)' }}>{l}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--ifm-color-content)' }}>{ss}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--ifm-color-content-secondary)', fontSize: '10px' }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: TRUETIME & COMMIT-WAIT ─────────────────────────────────── */}
      {tab === 'truetime' && (
        <div className="srl-grid">
          <InfoBox color="#34d399" title="The Root Problem: Distributed Systems Have No Shared Clock">
            Strict Serializability requires ordering transactions by real-time. But real-time requires a shared clock. And distributed systems have no shared clock — each machine drifts independently. Network Time Protocol (NTP) achieves ~1–10ms accuracy. GPS-disciplined clocks achieve ~1µs. But even 1µs of uncertainty is enough to violate a strict ordering guarantee under high write throughput.
          </InfoBox>

          {/* TrueTime */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '10px' }}>
              Google's Solution: TrueTime API
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '12px' }}>
              Instead of pretending time is precise, TrueTime <strong>exposes the uncertainty explicitly</strong>. Every datacenter has GPS receivers and atomic clocks. The API returns not a timestamp but an <strong>interval</strong>:
            </div>
            <div style={{ background: 'rgba(52,211,153,0.08)', borderRadius: '6px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#34d399', marginBottom: '12px' }}>
              <div style={{ color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>// TrueTime returns an interval, not a point</div>
              <div>TrueTime.now() → <strong>[earliest: t-ε, latest: t+ε]</strong></div>
              <div style={{ color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>// ε (epsilon) is typically 1–7ms in production</div>
              <div style={{ marginTop: '8px' }}>// The guarantee:</div>
              <div>// "The TRUE current time is somewhere in [earliest, latest]"</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
              <Badge color="#fbbf24" text="Key insight" /> By admitting uncertainty openly, Spanner can reason about it. Two intervals that don't overlap have a guaranteed ordering. Two intervals that overlap are ambiguous — and Spanner resolves that ambiguity with <strong>commit-wait</strong>.
            </div>
          </div>

          {/* Commit-wait */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
              Commit-Wait: Intentionally Slowing Down to Be Correct
            </div>

            {/* Timeline visualization */}
            <div style={{ position: 'relative', height: '80px', marginBottom: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', overflow: 'hidden' }}>
              {/* Timeline base */}
              <div style={{ position: 'absolute', top: '40px', left: '5%', right: '5%', height: '2px', background: 'rgba(255,255,255,0.15)' }} />
              {/* Commit point */}
              <div style={{ position: 'absolute', top: '15px', left: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '2px', height: '50px', background: '#fbbf24' }} />
                <div style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap' }}>commit() called</div>
              </div>
              {/* Epsilon interval */}
              <div style={{ position: 'absolute', top: '30px', left: '20%', width: '35%', height: '20px', background: 'rgba(249,115,22,0.2)', border: '1px dashed #f97316', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '9px', color: '#f97316', fontWeight: 700 }}>commit-wait: sleep(2ε)</span>
              </div>
              {/* Release point */}
              <div style={{ position: 'absolute', top: '15px', left: '55%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '2px', height: '50px', background: '#34d399' }} />
                <div style={{ fontSize: '9px', color: '#34d399', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap' }}>lock released + "OK" sent</div>
              </div>
              {/* Any subsequent transaction marker */}
              <div style={{ position: 'absolute', top: '15px', left: '75%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '2px', height: '25px', background: '#a78bfa' }} />
                <div style={{ fontSize: '9px', color: '#a78bfa', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap' }}>any next txn</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              After deciding to commit, Spanner <strong>does not immediately release locks or return success</strong>. Instead, it waits until <code>TrueTime.now().earliest &gt; commit_timestamp</code> — i.e., it sleeps until even the most pessimistic clock on any node in the world has advanced past the commit point.
              <br /><br />
              Only then does it release locks and return success to the client. This means every write transaction intentionally adds <strong>2ε ≈ 2–14ms of latency</strong>. The cost of buying real-time ordering is paid in milliseconds, per write, globally.
            </div>
            <div style={{ marginTop: '10px', background: 'rgba(52,211,153,0.08)', borderLeft: '3px solid #34d399', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', color: 'var(--ifm-color-content)' }}>
              <strong style={{ color: '#34d399' }}>The guarantee produced:</strong> Any transaction that starts <em>after</em> receiving the success response is guaranteed to begin at a wall-clock time after the commit timestamp. So it will necessarily observe the committed data. External consistency is maintained with mathematical certainty, not probabilistic hope.
            </div>
          </div>

          {/* Cost summary */}
          <div className="srl-grid srl-grid-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { label: 'Hardware cost', color: '#f87171', text: 'GPS receivers + atomic clocks at every datacenter. Not available from software — physical infrastructure.' },
              { label: 'Latency cost', color: '#f97316', text: 'commit-wait: 2–14ms per write transaction. Cannot be eliminated; only reduced by better clocks (smaller ε).' },
              { label: 'CAP cost', color: '#fbbf24', text: 'Strict serializability + availability cannot coexist under partition. When the network splits, you must choose one.' },
            ].map(c => (
              <div key={c.label} style={{ background: `${c.color}08`, border: `1px solid ${c.color}25`, borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: c.color, textTransform: 'uppercase', marginBottom: '6px' }}>{c.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{c.text}</div>
              </div>
            ))}
          </div>

          <InfoBox color="#a78bfa" title="CockroachDB's Honest Tradeoff">
            CockroachDB explicitly documents that it provides <strong>Serializability</strong> but not <strong>Strict Serializability</strong>. Linearizability is only guaranteed per-key, not across keys. This is a deliberate engineering decision — without GPS-grade clock infrastructure, the commit-wait approach is approximated with HLC (Hybrid Logical Clocks), which cannot provide the same hard guarantee. They say so plainly in their documentation. That is not a bug; it is honesty about what they can afford to promise.
          </InfoBox>
        </div>
      )}

      {/* ── TAB 4: SINGLE-NODE TRAP ───────────────────────────────────────── */}
      {tab === 'trap' && (
        <div className="srl-grid">
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f87171', marginBottom: '10px' }}>
              ⚠️ The Single-Node Trap — Why "Serializable Is Enough" Feels True
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              On a <strong>single-node database</strong>, enabling SERIALIZABLE isolation gives you Strict Serializability <em>for free, without paying for it</em>.
              <br /><br />
              Why? Because a single-node PostgreSQL instance has <strong>one sequential commit log, one transaction ordering authority, one wall clock</strong>. The serial order of commits <em>is</em> the real-time order — they are identical by construction. There is no room for re-dating or reordering. Strict Serializability is an emergent property at no extra cost.
              <br /><br />
              Engineers who build intuition on single-node databases for years absorb the implicit assumption: <strong>"SERIALIZABLE means everything is correct and fresh."</strong> They are right — on that one node.
            </div>
          </div>

          {/* The moment of failure */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '10px' }}>
              The Moment the Intuition Fails — Moving to Distributed
            </div>
            <div className="srl-grid srl-grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>Single Node</div>
                {[
                  'One commit log → one timeline',
                  'Commit order = real-time order',
                  'SERIALIZABLE = Strict Serializable',
                  'Reads from any query hit same data',
                  'No replica lag exists',
                ].map(p => (
                  <div key={p} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ color: '#34d399', fontSize: '12px' }}>✓</span>
                    <span style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{p}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>Multi-Node Distributed</div>
                {[
                  'N nodes → N competing timelines',
                  'Commit order ≠ real-time order (by default)',
                  'SERIALIZABLE ≠ Strict Serializable',
                  'Read replicas may be 50–500ms behind',
                  'External causality invisible to DB',
                ].map(p => (
                  <div key={p} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ color: '#f87171', fontSize: '12px' }}>✗</span>
                    <span style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* The phone call example */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
              The Production Scenario — The Phone Call
            </div>

            {/* Sequence */}
            {[
              { time: '10:00:00', actor: 'Manager (Hanoi)', event: 'Approves credit limit increase → transaction commits in Hanoi region.', color: '#34d399' },
              { time: '10:00:01', actor: 'Manager (Hanoi)', event: 'Calls Ho Chi Minh City branch: "It\'s approved, proceed!"', color: '#fbbf24' },
              { time: '10:00:02', actor: 'Staff (HCM City)', event: 'Opens system, starts new transaction — reads OLD credit limit.', color: '#f87171' },
              { time: '10:00:03', actor: 'System', event: 'HCM City replica receives the update. Now shows new limit.', color: '#a78bfa' },
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '10px', color: step.color, fontWeight: 700, minWidth: '72px', paddingTop: '2px' }}>{step.time}</div>
                <div style={{ width: '2px', background: `${step.color}40`, alignSelf: 'stretch', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: step.color }}>{step.actor}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{step.event}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '10px', background: 'rgba(248,113,113,0.08)', borderLeft: '3px solid #f87171', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', color: 'var(--ifm-color-content)' }}>
              <strong style={{ color: '#f87171' }}>What went wrong:</strong> The Hanoi region's SERIALIZABLE isolation is perfectly intact. The HCM region's SERIALIZABLE isolation is also intact. No constraint was violated in any database. The causal link that made the stale read wrong <strong>traveled through a phone call</strong> — outside the database, invisible to the consistency mechanism.
              <br /><br />
              Only Strict Serializability / external consistency would have caught this — because it would have guaranteed the HCM replica had applied the Hanoi commit before serving any read.
            </div>
          </div>

          {/* Reveal the invisible bug */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', marginBottom: '8px' }}>
              The Invisible Bug Signature
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '12px' }}>
              Like all consistency violations, this produces no exception, no error log, no red dashboard. The only symptom:
            </div>
            <div style={{
              background: 'rgba(168,139,250,0.08)', borderRadius: '6px', padding: '12px',
              fontFamily: 'monospace', fontSize: '12px', color: '#a78bfa',
            }}>
              🎫 Support ticket #47291:<br />
              "The manager approved the credit limit increase and called us.<br />
              We opened the system 2 seconds later and it still showed the old limit.<br />
              We refreshed and it was fixed. Is this a bug?"<br /><br />
              📋 Resolution: "Could not reproduce. Closed. Possible network glitch."
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic' }}>
              The support answer "please try refreshing" is simultaneously the most effective consistency-bug cover-up and the most accurate description of what happened: the refresh routed to the primary, which had already received the update.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DECISION CHECKLIST ─────────────────────────────────────── */}
      {tab === 'checklist' && (
        <div className="srl-grid">
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            Ask these two questions before specifying consistency for any operation. Each question independently determines how much you need to pay.
          </div>

          {/* Two questions */}
          <div className="srl-grid srl-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              {
                q: '1. Do multiple operations need to be treated as one indivisible unit?',
                color: '#f87171',
                yes: { label: 'YES → Need Serializability', desc: 'Debit + credit must be atomic. Inventory check + reservation must be atomic. Any "check then act" pattern needs transaction atomicity.' },
                no: { label: 'NO → Single-op suffices', desc: 'Incrementing a like counter. Updating a single user profile field. Reading a config value. No cross-object atomicity needed.' },
              },
              {
                q: '2. Does someone outside the system hold a clock and expect to see changes immediately?',
                color: '#38bdf8',
                yes: { label: 'YES → Need Linearizability (pay for real-time)', desc: '"I just approved this, now they\'ll read it." "I just transferred money, let me check my balance." External causality requires Strict Serializability.' },
                no: { label: 'NO → Eventual or Session is fine', desc: 'Analytics aggregations. Feed rankings. Async notifications. Data where "a few seconds late" is operationally invisible.' },
              },
            ].map(item => (
              <div key={item.q} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: item.color, lineHeight: '1.4' }}>{item.q}</div>
                <div style={{ background: 'rgba(52,211,153,0.06)', borderLeft: '3px solid #34d399', padding: '8px 10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>{item.yes.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{item.yes.desc}</div>
                </div>
                <div style={{ background: 'rgba(168,139,250,0.06)', borderLeft: '3px solid #a78bfa', padding: '8px 10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>{item.no.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{item.no.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Combined matrix */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Q1: Need Atomicity?</th>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Q2: External Causality?</th>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Required Level</th>
                  <th style={{ padding: '8px 10px', color: '#f97316', textAlign: 'left' }}>Example Operations</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['NO', 'NO', <Badge color="#34d399" text="Eventual / Session" />, 'Like counter, view count, feed ranking'],
                  ['NO', 'YES', <Badge color="#38bdf8" text="Linearizability" />, 'Balance display after phone call, profile read after update'],
                  ['YES', 'NO', <Badge color="#f87171" text="Serializability" />, 'Flash sale inventory check-and-deduct (async notification ok)'],
                  ['YES', 'YES', <Badge color="#34d399" text="Strict Serializability" />, 'Bank transfer + immediate read, approval + downstream action'],
                ].map(([q1, q2, level, ex], idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content)' }}>{q1}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content)' }}>{q2}</td>
                    <td style={{ padding: '8px 10px' }}>{level}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--ifm-color-content-secondary)' }}>{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final principle */}
          <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f97316', marginBottom: '8px' }}>The Enduring Constraint</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              Database names will change. Syntax will evolve. Clock uncertainty shrinks a little each year as GPS and atomic oscillators improve. But the root constraint does not change hands:
              <br /><br />
              <strong>"Simultaneous" in a distributed system is not a given — it is something you must buy.</strong> You buy it with atomic clocks, with commit-wait latency, or with the honest admission that you do not need it here. The engineering skill is knowing which of those three answers applies to each operation in your system.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
