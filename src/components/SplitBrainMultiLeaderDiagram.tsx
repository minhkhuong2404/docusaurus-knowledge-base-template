import React, { useState } from 'react';

type TabMode = 'scenario' | 'fencing' | 'reconciliation' | 'comparison';

interface PartitionState {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'isolated' | 'zombie' | 'fenced';
  dataVersion: number;
  acceptedWrites: string[];
}

export default function SplitBrainMultiLeaderDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('scenario');
  const [partitionActive, setPartitionActive] = useState<boolean>(true);
  const [fencingToken, setFencingToken] = useState<number>(34);
  const [fencedAttemptBlocked, setFencedAttemptBlocked] = useState<boolean>(false);
  const [resolvedState, setResolvedState] = useState<'lww' | 'crdt' | 'manual'>('crdt');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 3h5v5" />
          <path d="M8 3H3v5" />
          <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L4 4" />
          <path d="m15 9 6-6" />
        </svg>
        <span style={{ color: '#f87171', fontWeight: 700, letterSpacing: '0.02em' }}>
          Split-Brain: Dual Primary & Multi-Leader Divergence Telemetry
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '9999px',
            background: 'rgba(248, 113, 113, 0.15)',
            color: '#fca5a5',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            fontWeight: 600,
          }}
        >
          Distributed Fault Engine
        </span>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'scenario', label: '1. Dual Primary Partition Flow' },
          { id: 'fencing', label: '2. Fencing Tokens & STONITH' },
          { id: 'reconciliation', label: '3. Multi-Leader Divergence & Repair' },
          { id: 'comparison', label: '4. Prevention Architecture Matrix' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabMode)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: activeTab === tab.id ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeTab === tab.id ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Body */}
      <div style={{ padding: '18px' }}>
        {/* TAB 1: DUAL PRIMARY SCENARIO */}
        {activeTab === 'scenario' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '15px' }}>
                  Network Partition Partitioning Leader Election
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Inspect how asymmetric WAN packet loss tricks both sides into believing they have sole cluster ownership.
                </p>
              </div>
              <button
                onClick={() => setPartitionActive(!partitionActive)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid ' + (partitionActive ? '#38bdf8' : '#f87171'),
                  background: partitionActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                  color: partitionActive ? '#38bdf8' : '#f87171',
                }}
              >
                {partitionActive ? 'Heal Network Partition' : 'Trigger WAN Partition (Split-Brain)'}
              </button>
            </div>

            {/* SVG Visualizer */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ position: 'relative', minHeight: '340px' }}>
              <svg width="100%" height="340" viewBox="0 0 760 340" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#f87171" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f87171" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Subnet A (DC East) */}
                <rect x="20" y="20" width="330" height="300" rx="10" fill="#0c0e17" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
                <text x="35" y="45" fill="#38bdf8" fontSize="13" fontWeight="700">DC EAST (Subnet A)</text>
                <text x="35" y="63" fill="#64748b" fontSize="11">Clients 1-500 Route Here</text>

                {/* Subnet B (DC West) */}
                <rect x="410" y="20" width="330" height="300" rx="10" fill="#0c0e17" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
                <text x="425" y="45" fill="#a78bfa" fontSize="13" fontWeight="700">DC WEST (Subnet B)</text>
                <text x="425" y="63" fill="#64748b" fontSize="11">Clients 501-1000 Route Here</text>

                {/* Partition Cut Barrier */}
                {partitionActive && (
                  <g>
                    <line x1="380" y1="20" x2="380" y2="320" stroke="#f87171" strokeWidth="3" strokeDasharray="6 4" />
                    <rect x="345" y="150" width="70" height="40" rx="6" fill="#1e131d" stroke="#f87171" strokeWidth="1.5" />
                    <text x="380" y="167" fill="#fca5a5" fontSize="10" fontWeight="700" textAnchor="middle">WAN CUT</text>
                    <text x="380" y="181" fill="#ef4444" fontSize="9" textAnchor="middle">0% Packets</text>
                  </g>
                )}

                {!partitionActive && (
                  <g>
                    <path d="M 320 170 L 440 170" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" />
                    <text x="380" y="162" fill="#34d399" fontSize="11" fontWeight="600" textAnchor="middle">Replication Link Active</text>
                  </g>
                )}

                {/* Node 1 in Subnet A */}
                <g transform="translate(45, 90)">
                  <rect x="0" y="0" width="130" height="90" rx="8" fill="#131929" stroke={partitionActive ? "#f87171" : "#38bdf8"} strokeWidth="1.5" />
                  <text x="12" y="25" fill="#ffffff" fontSize="12" fontWeight="700">Node 1 (Primary A)</text>
                  <text x="12" y="45" fill={partitionActive ? "#f87171" : "#34d399"} fontSize="11" fontWeight="600">
                    {partitionActive ? "STATE: DUAL PRIMARY" : "STATE: PRIMARY"}
                  </text>
                  <text x="12" y="65" fill="#94a3b8" fontSize="10">Accepts: balance -= 100</text>
                  <text x="12" y="80" fill="#64748b" fontSize="9">Term: 12 (Self-declared)</text>
                </g>

                {/* Node 2 in Subnet A */}
                <g transform="translate(200, 90)">
                  <rect x="0" y="0" width="130" height="90" rx="8" fill="#131929" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                  <text x="12" y="25" fill="#ffffff" fontSize="12" fontWeight="700">Node 2 (Replica A)</text>
                  <text x="12" y="45" fill="#94a3b8" fontSize="11">Follower</text>
                  <text x="12" y="65" fill="#64748b" fontSize="10">Acks Node 1</text>
                </g>

                {/* Client A Write Flow */}
                <path d="M 110 240 L 110 185" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-blue)" />
                <rect x="45" y="240" width="130" height="60" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <text x="55" y="260" fill="#38bdf8" fontSize="11" fontWeight="700">Client #128</text>
                <text x="55" y="278" fill="#e2e8f0" fontSize="10">UPDATE acct SET bal=400</text>
                <text x="55" y="292" fill="#22c55e" fontSize="9">✔ ACKed by Primary A</text>

                {/* Node 3 in Subnet B */}
                <g transform="translate(435, 90)">
                  <rect x="0" y="0" width="130" height="90" rx="8" fill="#131929" stroke={partitionActive ? "#f87171" : "#a78bfa"} strokeWidth="1.5" />
                  <text x="12" y="25" fill="#ffffff" fontSize="12" fontWeight="700">Node 3 (Primary B)</text>
                  <text x="12" y="45" fill={partitionActive ? "#f87171" : "#94a3b8"} fontSize="11" fontWeight="600">
                    {partitionActive ? "STATE: DUAL PRIMARY" : "STATE: REPLICA"}
                  </text>
                  <text x="12" y="65" fill="#94a3b8" fontSize="10">Accepts: balance -= 350</text>
                  <text x="12" y="80" fill="#64748b" fontSize="9">Term: 13 (Timeout elect)</text>
                </g>

                {/* Node 4 in Subnet B */}
                <g transform="translate(590, 90)">
                  <rect x="0" y="0" width="130" height="90" rx="8" fill="#131929" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                  <text x="12" y="25" fill="#ffffff" fontSize="12" fontWeight="700">Node 4 (Replica B)</text>
                  <text x="12" y="45" fill="#94a3b8" fontSize="11">Follower</text>
                  <text x="12" y="65" fill="#64748b" fontSize="10">Acks Node 3</text>
                </g>

                {/* Client B Write Flow */}
                <path d="M 500 240 L 500 185" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arrow-red)" />
                <rect x="435" y="240" width="130" height="60" rx="6" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />
                <text x="445" y="260" fill="#a78bfa" fontSize="11" fontWeight="700">Client #892</text>
                <text x="445" y="278" fill="#e2e8f0" fontSize="10">UPDATE acct SET bal=150</text>
                <text x="445" y="292" fill="#22c55e" fontSize="9">✔ ACKed by Primary B</text>
              </svg>
            </div>

            {/* Status explanation */}
            <div
              style={{
                marginTop: '14px',
                padding: '12px 16px',
                background: partitionActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                border: '1px solid ' + (partitionActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'),
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: partitionActive ? '#ef4444' : '#22c55e',
                  }}
                />
                <strong style={{ color: partitionActive ? '#fca5a5' : '#86efac', fontSize: '13px' }}>
                  {partitionActive
                    ? 'Catastrophic Divergence in Progress: Both Primaries are Acknowledging Conflicting Writes!'
                    : 'Partition Healed: Single Primary Active with Synchronous Replication'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {partitionActive
                  ? 'Because DC East and DC West cannot communicate heartbeat packets across the WAN cut, Node 3 timed out and assumed Node 1 died. Both nodes now claim the primary role. Client 128 deducted $100 while Client 892 deducted $350 against the same account balance ($500 starting). When the WAN link recovers, the two database state machines will diverge unrecoverably.'
                  : 'Replication link restored. Follower nodes synchronize with the true leader through consistent Raft/Paxos log index replay.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: FENCING TOKENS & STONITH */}
        {activeTab === 'fencing' && (
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>
              Defensive Fencing: Monotonic Tokens vs. Hardware STONITH
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
              How modern distributed systems physically forbid deposed zombie primaries from corrupting shared storage or external state machines.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Left Column: Monotonic Fencing Token */}
              <div
                style={{
                  background: '#0c0e17',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#38bdf820', color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>
                    Software Fencing
                  </span>
                  <strong style={{ color: '#ffffff', fontSize: '14px' }}>Monotonic Fencing Tokens</strong>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                  When the lock service (etcd / ZooKeeper / Consul) grants leadership, it hands out a strictly increasing 64-bit integer token. Storage layers reject any mutation carrying a token lower than the highest token observed.
                </p>

                <div style={{ background: '#131929', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Current Storage Fencing Watermark:</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>Token #{fencingToken} (New Primary)</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Deposed Zombie Primary has: Token #33</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setFencedAttemptBlocked(true);
                      setTimeout(() => setFencedAttemptBlocked(false), 3000);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Simulate Zombie Write (Token #33)
                  </button>
                  <button
                    onClick={() => setFencingToken((t) => t + 1)}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Increment Epoch
                  </button>
                </div>

                {fencedAttemptBlocked && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#fecaca',
                      fontSize: '12px',
                    }}
                  >
                    ⛔ <strong>409 Fencing Token Expired</strong>: Storage rejected write from Zombie Primary (Token #33 &lt; Max observed #34). Zero data corruption occurred!
                  </div>
                )}
              </div>

              {/* Right Column: Hardware STONITH */}
              <div
                style={{
                  background: '#0c0e17',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#f59e0b20', color: '#f59e0b', fontSize: '11px', fontWeight: 700 }}>
                    Hardware Fencing
                  </span>
                  <strong style={{ color: '#ffffff', fontSize: '14px' }}>STONITH / Power Fencing</strong>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                  <strong>STONITH</strong> (<em>Shoot The Other Node In The Head</em>) physically cuts power to the suspected node before promoting a standby replica.
                </p>

                <div style={{ background: '#131929', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Execution Sequence:</div>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    <li>Cluster detects missing heartbeat timeout (T &gt; 5000ms).</li>
                    <li>Cluster signals IPMI / iLO / PDU network power switch.</li>
                    <li>Power switch physically cuts AC power to Node 1 chassis.</li>
                    <li>Only after power switch sends positive ACK is Node 2 promoted to Primary.</li>
                  </ol>
                </div>

                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fde68a',
                    fontSize: '11px',
                  }}
                >
                  ⚠ <strong>Limitation</strong>: Relies on external power control interfaces (IPMI/iLO). In cloud environments (AWS/GCP), API calls to terminate instances or detach EBS volumes act as virtual STONITH.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-LEADER DIVERGENCE & RECONCILIATION */}
        {activeTab === 'reconciliation' && (
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>
              Multi-Leader Conflict Resolution: LWW vs. CRDT vs. Manual Merging
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
              In multi-master architectures (e.g. Cassandra, DynamoDB, CouchDB, Git), concurrent writes to disjoint leaders always diverge. Compare reconciliation strategies:
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'lww', name: 'Last-Write-Wins (LWW)', color: '#ef4444' },
                { id: 'crdt', name: 'Conflict-Free Replicated Data Types (CRDT)', color: '#34d399' },
                { id: 'manual', name: 'Application-Level / Git 3-Way Merge', color: '#38bdf8' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setResolvedState(m.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: resolvedState === m.id ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: resolvedState === m.id ? `${m.color}25` : 'rgba(255, 255, 255, 0.03)',
                    color: resolvedState === m.id ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Strategy Explanations */}
            <div
              style={{
                background: '#0c0e17',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              {resolvedState === 'lww' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#ef444420', color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
                      Silent Data Loss Trap
                    </span>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>Last-Write-Wins (Wall Clock Timestamps)</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                    Leader A writes key at timestamp 10:00:00.120. Leader B writes same key at timestamp 10:00:00.125. The engine blindly keeps the value with the highest wall-clock timestamp and drops the other.
                  </p>
                  <div style={{ background: '#131929', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <strong style={{ color: '#f87171', fontSize: '12px' }}>Critical Production Hazard:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      NTP clock skew can make an older write appear newer. If Leader B has a clock running 100ms ahead, it will silently overwrite newer writes from Leader A. <em>Never use LWW for financial balances, inventories, or append-only logs!</em>
                    </p>
                  </div>
                </div>
              )}

              {resolvedState === 'crdt' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#34d39920', color: '#34d399', fontSize: '11px', fontWeight: 700 }}>
                      Mathematically Deterministic
                    </span>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>CRDTs (State-Based / Operation-Based)</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                    Data structures designed with mathematically bounded join-semilattice properties: <strong>Associative</strong>, <strong>Commutative</strong>, and <strong>Idempotent</strong>.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: '#131929', padding: '10px', borderRadius: '6px' }}>
                      <strong style={{ color: '#38bdf8', fontSize: '12px' }}>PN-Counter (Positive-Negative)</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                        Each node tracks increments and decrements in an internal array: value = sum(P) - sum(N). Merging takes entry-wise max(P_A, P_B), ensuring 0 lost increments.
                      </p>
                    </div>
                    <div style={{ background: '#131929', padding: '10px', borderRadius: '6px' }}>
                      <strong style={{ color: '#a78bfa', fontSize: '12px' }}>OR-Set (Observed-Remove Set)</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                        Every element addition assigns a unique UUID tag. Removing an element removes only observed tags. Concurrent add-and-remove cleanly favors addition without race conditions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {resolvedState === 'manual' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#38bdf820', color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>
                      Application Sovereignty
                    </span>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>Application-Level 3-Way Merge & Version Vectors</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                    The storage engine preserves all divergent branches as sibling records (like DynamoDB siblings or CouchDB revisions). The application reads all conflicting siblings and executes custom business domain logic or prompts user intervention.
                  </p>
                  <div style={{ background: '#131929', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <strong style={{ color: '#38bdf8', fontSize: '12px' }}>Classic E-Commerce Cart Sibling Merge:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      Cart A = [Shoes, Socks] vs. Cart B = [Shoes, Belt]. Instead of dropping either, the application takes the mathematical union: Merged Cart = [Shoes, Socks, Belt].
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COMPARISON MATRIX */}
        {activeTab === 'comparison' && (
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>
              Split-Brain Defense Matrix Across Industry Systems
            </h4>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#94a3b8' }}>
              How different distributed databases, message queues, and consensus clusters eliminate or permit split-brain divergence.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  color: '#e2e8f0',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <th style={{ padding: '8px 10px', color: '#38bdf8' }}>System</th>
                    <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Consensus Model</th>
                    <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Split-Brain Immunity</th>
                    <th style={{ padding: '8px 10px', color: '#38bdf8' }}>Fencing & Protection Mechanism</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>Raft / etcd</td>
                    <td style={{ padding: '8px 10px' }}>Strict Quorum Majority</td>
                    <td style={{ padding: '8px 10px', color: '#34d399' }}>Immune (Strict)</td>
                    <td style={{ padding: '8px 10px' }}>Term epoch verification. Minority partition cannot form quorum $\lfloor N/2 \rfloor + 1$.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>Apache Kafka (KRaft)</td>
                    <td style={{ padding: '8px 10px' }}>KRaft Quorum</td>
                    <td style={{ padding: '8px 10px', color: '#34d399' }}>Immune</td>
                    <td style={{ padding: '8px 10px' }}>Producer ID (PID) + Producer Epoch fencing. Deposed broker writes trigger `PRODUCER_FENCED`.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>CockroachDB</td>
                    <td style={{ padding: '8px 10px' }}>Multi-Raft + Leaseholders</td>
                    <td style={{ padding: '8px 10px', color: '#34d399' }}>Immune</td>
                    <td style={{ padding: '8px 10px' }}>Time-bounded exclusive Raft leases per 64 MB range. MaxOffset crash panics.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>PostgreSQL (Patroni)</td>
                    <td style={{ padding: '8px 10px' }}>DCS-assisted Primary-Standby</td>
                    <td style={{ padding: '8px 10px', color: '#fbbf24' }}>Conditionally Immune</td>
                    <td style={{ padding: '8px 10px' }}>DCS TTL lock renewal loop. If DCS disconnects, Patroni demotes local Postgres to read-only.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>Redis Sentinel / Cluster</td>
                    <td style={{ padding: '8px 10px' }}>Asynchronous Master-Replica</td>
                    <td style={{ padding: '8px 10px', color: '#ef4444' }}>Vulnerable (AP)</td>
                    <td style={{ padding: '8px 10px' }}>Partitioned master continues accepting writes. Rejoining triggers full overwrite from new master (lost writes).</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>Apache Cassandra</td>
                    <td style={{ padding: '8px 10px' }}>Multi-Leader (Dynamo ring)</td>
                    <td style={{ padding: '8px 10px', color: '#f87171' }}>Permits Divergence (By Design)</td>
                    <td style={{ padding: '8px 10px' }}>LWW with client microsecond timestamps or Lightweight Transactions (Paxos LWT).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
