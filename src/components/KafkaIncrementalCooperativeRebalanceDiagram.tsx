import React, { useState, useEffect } from 'react';

type SimMode = 'cooperative' | 'eager' | 'static';

interface ConsumerNodeState {
  id: string;
  label: string;
  sublabel: string;
  status: 'ACTIVE' | 'PAUSED' | 'REVOKING' | 'OFFLINE' | 'JOINING';
  partitions: string[];
  color: string;
}

interface SimStep {
  title: string;
  badge: string;
  badgeColor: string;
  activePartitionsCount: number;
  rebalanceRound: string;
  description: string;
  wireProtocol: string[];
  consumers: ConsumerNodeState[];
  flows: {
    from: 'c1' | 'c2' | 'c3' | 'coord';
    to: 'c1' | 'c2' | 'c3' | 'coord';
    label: string;
    color: string;
  }[];
}

const COOPERATIVE_STEPS: SimStep[] = [
  {
    title: '1. Initial Stable State',
    badge: '100% Throughput (6/6 Partitions)',
    badgeColor: '#34d399',
    activePartitionsCount: 6,
    rebalanceRound: 'Generation 1 • Stable',
    description:
      'Two consumers (C1 and C2) use CooperativeStickyAssignor. C1 owns [P0, P1, P2] and C2 owns [P3, P4, P5]. Both are actively polling and committing offsets.',
    wireProtocol: [
      'C1 Heartbeat (gen=1, owned=[P0,P1,P2]) -> Coordinator: OK',
      'C2 Heartbeat (gen=1, owned=[P3,P4,P5]) -> Coordinator: OK',
    ],
    consumers: [
      { id: 'c1', label: 'Consumer 1 (Leader)', sublabel: 'CooperativeSticky', status: 'ACTIVE', partitions: ['P0', 'P1', 'P2'], color: '#38bdf8' },
      { id: 'c2', label: 'Consumer 2', sublabel: 'CooperativeSticky', status: 'ACTIVE', partitions: ['P3', 'P4', 'P5'], color: '#34d399' },
      { id: 'c3', label: 'Consumer 3 (Pending)', sublabel: 'Not started', status: 'OFFLINE', partitions: [], color: '#64748b' },
    ],
    flows: [
      { from: 'c1', to: 'coord', label: 'Heartbeat OK', color: '#38bdf8' },
      { from: 'c2', to: 'coord', label: 'Heartbeat OK', color: '#34d399' },
    ],
  },
  {
    title: '2. Rebalance Round 1: C3 Joins (NO Global Revoke!)',
    badge: '100% Throughput Kept (6/6)',
    badgeColor: '#38bdf8',
    activePartitionsCount: 6,
    rebalanceRound: 'Rebalance 1 • JoinGroup + SyncGroup',
    description:
      'C3 joins the group. Unlike Eager mode, C1 and C2 DO NOT revoke all partitions before JoinGroup! They encode their currently owned partitions in JoinGroup metadata and keep processing P0–P5. Leader C1 computes the desired target (2 each) and sees P2 & P5 must move.',
    wireProtocol: [
      'C3 -> Coordinator: JoinGroup(owned=[])',
      'C1, C2 -> Coordinator: JoinGroup(owned=[P0..P2], [P3..P5]) WITHOUT revoking!',
      'Leader C1 -> SyncGroup: Keep [P0,P1] on C1 (revoke P2), Keep [P3,P4] on C2 (revoke P5), C3=[]',
    ],
    consumers: [
      { id: 'c1', label: 'Consumer 1 (Leader)', sublabel: 'Still fetching P0–P2', status: 'ACTIVE', partitions: ['P0', 'P1', 'P2'], color: '#38bdf8' },
      { id: 'c2', label: 'Consumer 2', sublabel: 'Still fetching P3–P5', status: 'ACTIVE', partitions: ['P3', 'P4', 'P5'], color: '#34d399' },
      { id: 'c3', label: 'Consumer 3', sublabel: 'Joined (0 partitions yet)', status: 'JOINING', partitions: [], color: '#a78bfa' },
    ],
    flows: [
      { from: 'c3', to: 'coord', label: 'JoinGroup(owned=[])', color: '#a78bfa' },
      { from: 'coord', to: 'c1', label: 'Target: Drop P2', color: '#fbbf24' },
      { from: 'coord', to: 'c2', label: 'Target: Drop P5', color: '#fbbf24' },
    ],
  },
  {
    title: '3. Selective Revocation & Auto-Rejoin',
    badge: '67% Throughput (4/6 Active)',
    badgeColor: '#fbbf24',
    activePartitionsCount: 4,
    rebalanceRound: 'Between Round 1 & Round 2',
    description:
      'C1 invokes onPartitionsRevoked([P2]) ONLY (commits P2 offset and keeps P0, P1 running!). C2 revokes ONLY [P5] (keeps P3, P4 running!). Because partitions were revoked, C1 and C2 immediately trigger Rebalance Round 2 so C3 can claim the newly freed P2 and P5.',
    wireProtocol: [
      'C1: onPartitionsRevoked([P2]) -> commits P2 offset; P0 & P1 NEVER stopped!',
      'C2: onPartitionsRevoked([P5]) -> commits P5 offset; P3 & P4 NEVER stopped!',
      'C1, C2, C3 -> Coordinator: JoinGroup (Round 2) with updated owned lists',
    ],
    consumers: [
      { id: 'c1', label: 'Consumer 1 (Leader)', sublabel: 'Revoked P2 only', status: 'REVOKING', partitions: ['P0', 'P1'], color: '#38bdf8' },
      { id: 'c2', label: 'Consumer 2', sublabel: 'Revoked P5 only', status: 'REVOKING', partitions: ['P3', 'P4'], color: '#34d399' },
      { id: 'c3', label: 'Consumer 3', sublabel: 'Awaiting [P2, P5]', status: 'JOINING', partitions: [], color: '#a78bfa' },
    ],
    flows: [
      { from: 'c1', to: 'coord', label: 'Rejoin(owned=[P0,P1])', color: '#38bdf8' },
      { from: 'c2', to: 'coord', label: 'Rejoin(owned=[P3,P4])', color: '#34d399' },
      { from: 'c3', to: 'coord', label: 'Rejoin(owned=[])', color: '#a78bfa' },
    ],
  },
  {
    title: '4. Rebalance Round 2: Balanced & Stable',
    badge: '100% Throughput (6/6 Partitions)',
    badgeColor: '#34d399',
    activePartitionsCount: 6,
    rebalanceRound: 'Generation 3 • Stable',
    description:
      'Leader C1 assigns the unowned partitions [P2, P5] to C3. Unaffected partitions (P0, P1, P3, P4) experienced ZERO downtime during the entire scale-out.',
    wireProtocol: [
      'Coordinator -> SyncGroupResponse: C1=[P0,P1], C2=[P3,P4], C3=[P2,P5]',
      'C3: onPartitionsAssigned([P2, P5]) -> seeks last committed offsets & starts poll()',
      'Total global stop-the-world pause: 0 ms',
    ],
    consumers: [
      { id: 'c1', label: 'Consumer 1 (Leader)', sublabel: 'Zero downtime on P0,P1', status: 'ACTIVE', partitions: ['P0', 'P1'], color: '#38bdf8' },
      { id: 'c2', label: 'Consumer 2', sublabel: 'Zero downtime on P3,P4', status: 'ACTIVE', partitions: ['P3', 'P4'], color: '#34d399' },
      { id: 'c3', label: 'Consumer 3', sublabel: 'Assigned [P2, P5]', status: 'ACTIVE', partitions: ['P2', 'P5'], color: '#a78bfa' },
    ],
    flows: [
      { from: 'coord', to: 'c1', label: 'Keep [P0, P1]', color: '#38bdf8' },
      { from: 'coord', to: 'c2', label: 'Keep [P3, P4]', color: '#34d399' },
      { from: 'coord', to: 'c3', label: 'Assign [P2, P5]', color: '#a78bfa' },
    ],
  },
];

const EAGER_STEPS: SimStep[] = [
  {
    title: '1. Initial Stable State (Range / RoundRobin)',
    badge: '100% Throughput (6/6 Partitions)',
    badgeColor: '#34d399',
    activePartitionsCount: 6,
    rebalanceRound: 'Generation 1 • Stable',
    description:
      'C1 and C2 use legacy Eager protocol (RangeAssignor). Both are actively consuming P0–P5.',
    wireProtocol: [
      'C1 Heartbeat (gen=1) -> Coordinator: OK',
      'C2 Heartbeat (gen=1) -> Coordinator: OK',
    ],
    consumers: [
      { id: 'c1', label: 'Consumer 1 (Leader)', sublabel: 'RangeAssignor', status: 'ACTIVE', partitions: ['P0', 'P1', 'P2'], color: '#38bdf8' },
      { id: 'c2', label: 'Consumer 2', sublabel: 'RangeAssignor', status: 'ACTIVE', partitions: ['P3', 'P4', 'P5'], color: '#34d399' },
      { id: 'c3', label: 'Consumer 3 (Pending)', sublabel: 'Not started', status: 'OFFLINE', partitions: [], color: '#64748b' },
    ],
    flows: [
      { from: 'c1', to: 'coord', label: 'Heartbeat OK', color: '#38bdf8' },
      { from: 'c2', to: 'coord', label: 'Heartbeat OK', color: '#34d399' },
    ],
  },
  {
    title: '2. Stop-the-World: ALL Partitions Revoked!',
    badge: '0% Throughput (GLOBAL PAUSE)',
    badgeColor: '#f87171',
    activePartitionsCount: 0,
    rebalanceRound: 'PreparingRebalance • Stop-the-World',
    description:
      'C3 sends JoinGroupRequest. Coordinator replies REBALANCE_IN_PROGRESS to C1 & C2. Under Eager protocol, C1 and C2 MUST revoke ALL 6 partitions immediately before rejoining—halting 100% of group throughput!',
    wireProtocol: [
      'C3 -> Coordinator: JoinGroupRequest',
      'C1: onPartitionsRevoked([P0, P1, P2]) -> STOPPED!',
      'C2: onPartitionsRevoked([P3, P4, P5]) -> STOPPED!',
    ],
    consumers: [
      { id: 'c1', label: 'Consumer 1', sublabel: 'ALL partitions dropped', status: 'PAUSED', partitions: [], color: '#f87171' },
      { id: 'c2', label: 'Consumer 2', sublabel: 'ALL partitions dropped', status: 'PAUSED', partitions: [], color: '#f87171' },
      { id: 'c3', label: 'Consumer 3', sublabel: 'Waiting on SyncGroup', status: 'JOINING', partitions: [], color: '#fbbf24' },
    ],
    flows: [
      { from: 'c1', to: 'coord', label: 'Revoked ALL -> JoinGroup', color: '#f87171' },
      { from: 'c2', to: 'coord', label: 'Revoked ALL -> JoinGroup', color: '#f87171' },
      { from: 'c3', to: 'coord', label: 'JoinGroup', color: '#fbbf24' },
    ],
  },
  {
    title: '3. New Assignment & Cold State Rebuild',
    badge: '100% Throughput Resumed',
    badgeColor: '#34d399',
    activePartitionsCount: 6,
    rebalanceRound: 'Generation 2 • Stable',
    description:
      'SyncGroup finishes and partitions are redistributed. In Kafka Streams or stateful consumers, dropping all partitions forces local state stores / caches to flush and reload, spiking consumer lag.',
    wireProtocol: [
      'Coordinator -> SyncGroupResponse: C1=[P0,P1], C2=[P2,P3], C3=[P4,P5]',
      'All consumers cold-start fetch() from last committed offsets',
    ],
    consumers: [
      { id: 'c1', label: 'Consumer 1', sublabel: 'Resumed [P0, P1]', status: 'ACTIVE', partitions: ['P0', 'P1'], color: '#38bdf8' },
      { id: 'c2', label: 'Consumer 2', sublabel: 'Moved! [P2, P3]', status: 'ACTIVE', partitions: ['P2', 'P3'], color: '#34d399' },
      { id: 'c3', label: 'Consumer 3', sublabel: 'Assigned [P4, P5]', status: 'ACTIVE', partitions: ['P4', 'P5'], color: '#a78bfa' },
    ],
    flows: [
      { from: 'coord', to: 'c1', label: 'Assign [P0, P1]', color: '#38bdf8' },
      { from: 'coord', to: 'c2', label: 'Assign [P2, P3]', color: '#34d399' },
      { from: 'coord', to: 'c3', label: 'Assign [P4, P5]', color: '#a78bfa' },
    ],
  },
];

const STATIC_STEPS: SimStep[] = [
  {
    title: '1. Static Membership Active (group.instance.id)',
    badge: '100% Throughput (6/6 Partitions)',
    badgeColor: '#34d399',
    activePartitionsCount: 6,
    rebalanceRound: 'Generation 1 • Static Map Cached',
    description:
      'Each Kubernetes pod sets a persistent group.instance.id (pod-1, pod-2, pod-3) and session.timeout.ms=45000. The Group Coordinator maps instance IDs to stable member IDs and caches their assignments.',
    wireProtocol: [
      'pod-1 (instance=order-pod-1) -> [P0, P1]',
      'pod-2 (instance=order-pod-2) -> [P2, P3]',
      'pod-3 (instance=order-pod-3) -> [P4, P5]',
    ],
    consumers: [
      { id: 'c1', label: 'order-pod-1', sublabel: 'Static ID cached', status: 'ACTIVE', partitions: ['P0', 'P1'], color: '#38bdf8' },
      { id: 'c2', label: 'order-pod-2', sublabel: 'Static ID cached', status: 'ACTIVE', partitions: ['P2', 'P3'], color: '#34d399' },
      { id: 'c3', label: 'order-pod-3', sublabel: 'Static ID cached', status: 'ACTIVE', partitions: ['P4', 'P5'], color: '#a78bfa' },
    ],
    flows: [
      { from: 'c1', to: 'coord', label: 'Static Heartbeat', color: '#38bdf8' },
      { from: 'c2', to: 'coord', label: 'Static Heartbeat', color: '#34d399' },
      { from: 'c3', to: 'coord', label: 'Static Heartbeat', color: '#a78bfa' },
    ],
  },
  {
    title: '2. Rolling Restart: pod-2 Bounces (0 Rebalances!)',
    badge: '67% Active • ZERO Rebalance',
    badgeColor: '#fbbf24',
    activePartitionsCount: 4,
    rebalanceRound: 'Generation 1 Unchanged • Waiting 45s',
    description:
      'Kubernetes restarts order-pod-2 for a deployment. Because it is a static member, close() DOES NOT send LeaveGroupRequest. The Coordinator holds [P2, P3] reserved for order-pod-2 up to session.timeout.ms (45s). pod-1 & pod-3 are completely untouched!',
    wireProtocol: [
      'order-pod-2.close(): Suppresses LeaveGroupRequest!',
      'Coordinator: Starts 45s session.timeout.ms grace timer for order-pod-2',
      'order-pod-1 & order-pod-3: 0 interruptions, Generation stays 1',
    ],
    consumers: [
      { id: 'c1', label: 'order-pod-1', sublabel: 'Untouched! Gen=1', status: 'ACTIVE', partitions: ['P0', 'P1'], color: '#38bdf8' },
      { id: 'c2', label: 'order-pod-2 (Restarting)', sublabel: 'Reserved 45s grace', status: 'OFFLINE', partitions: ['P2', 'P3'], color: '#fbbf24' },
      { id: 'c3', label: 'order-pod-3', sublabel: 'Untouched! Gen=1', status: 'ACTIVE', partitions: ['P4', 'P5'], color: '#a78bfa' },
    ],
    flows: [
      { from: 'c1', to: 'coord', label: 'Heartbeat OK (No Rebalance)', color: '#38bdf8' },
      { from: 'c3', to: 'coord', label: 'Heartbeat OK (No Rebalance)', color: '#a78bfa' },
    ],
  },
  {
    title: '3. pod-2 Rejoins Within 45s -> Instant Reclaim!',
    badge: '100% Throughput • 0 Rebalances',
    badgeColor: '#34d399',
    activePartitionsCount: 6,
    rebalanceRound: 'Generation 1 • Instant Resume',
    description:
      'order-pod-2 boots up in 12s and sends JoinGroupRequest with group.instance.id="order-pod-2". Coordinator recognizes its known static ID, returns its exact cached assignment [P2, P3] immediately, and assigns a new member.id (fencing any old zombie).',
    wireProtocol: [
      'order-pod-2 -> Coordinator: JoinGroup(group.instance.id="order-pod-2")',
      'Coordinator -> order-pod-2: Instant SyncGroup([P2, P3]) — NO group rebalance!',
      'Total rebalances triggered across rolling deploy: ZERO',
    ],
    consumers: [
      { id: 'c1', label: 'order-pod-1', sublabel: 'Zero interruption', status: 'ACTIVE', partitions: ['P0', 'P1'], color: '#38bdf8' },
      { id: 'c2', label: 'order-pod-2', sublabel: 'Reclaimed [P2, P3]', status: 'ACTIVE', partitions: ['P2', 'P3'], color: '#34d399' },
      { id: 'c3', label: 'order-pod-3', sublabel: 'Zero interruption', status: 'ACTIVE', partitions: ['P4', 'P5'], color: '#a78bfa' },
    ],
    flows: [
      { from: 'c2', to: 'coord', label: 'Join(instance="order-pod-2")', color: '#34d399' },
      { from: 'coord', to: 'c2', label: 'Instant [P2, P3] (0 Rebalance)', color: '#34d399' },
    ],
  },
];

const NODE_COORDS = {
  c1: { x: 40, y: 28, w: 220, h: 74 },
  c2: { x: 40, y: 122, w: 220, h: 74 },
  c3: { x: 40, y: 216, w: 220, h: 74 },
  coord: { x: 640, y: 98, w: 245, h: 120 },
};

export default function KafkaIncrementalCooperativeRebalanceDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<SimMode>('cooperative');
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  const steps =
    mode === 'cooperative' ? COOPERATIVE_STEPS : mode === 'eager' ? EAGER_STEPS : STATIC_STEPS;
  const current = steps[Math.min(stepIdx, steps.length - 1)];

  useEffect(() => {
    if (!playing) {
      return;
    }
    if (stepIdx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepIdx((prev) => prev + 1);
    }, 2200);
    return () => clearTimeout(timer);
  }, [playing, stepIdx, steps.length]);

  const handleModeChange = (nextMode: SimMode) => {
    setPlaying(false);
    setMode(nextMode);
    setStepIdx(0);
  };

  const handlePlay = () => {
    setStepIdx(0);
    setPlaying(true);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kafka-coop-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="interactive-diagram-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span style={{ color: '#34d399', fontWeight: 700 }}>
            Kafka Rebalance Protocol Simulator (Eager vs. Cooperative vs. Static)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleModeChange('cooperative')}
            style={{
              padding: '5px 11px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              background: mode === 'cooperative' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255,255,255,0.05)',
              color: mode === 'cooperative' ? '#34d399' : '#94a3b8',
              boxShadow: mode === 'cooperative' ? '0 0 0 1.5px rgba(52, 211, 153, 0.5)' : '0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            Incremental Cooperative
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('eager')}
            style={{
              padding: '5px 11px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              background: mode === 'eager' ? 'rgba(248, 113, 113, 0.18)' : 'rgba(255,255,255,0.05)',
              color: mode === 'eager' ? '#f87171' : '#94a3b8',
              boxShadow: mode === 'eager' ? '0 0 0 1.5px rgba(248, 113, 113, 0.5)' : '0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            Eager (Legacy)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('static')}
            style={{
              padding: '5px 11px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              background: mode === 'static' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.05)',
              color: mode === 'static' ? '#38bdf8' : '#94a3b8',
              boxShadow: mode === 'static' ? '0 0 0 1.5px rgba(56, 189, 248, 0.5)' : '0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            Static Membership
          </button>
          <button
            type="button"
            onClick={handlePlay}
            disabled={playing}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: playing ? 'not-allowed' : 'pointer',
              fontSize: '11.5px',
              fontWeight: 700,
              background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(251, 191, 36, 0.18)',
              color: playing ? '#94a3b8' : '#fbbf24',
              boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(251, 191, 36, 0.45)',
            }}
          >
            {playing ? 'Simulating…' : '▶ Simulate'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {steps.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => {
                setPlaying(false);
                setStepIdx(idx);
              }}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 600,
                background: stepIdx === idx ? `${s.badgeColor}20` : 'rgba(255,255,255,0.04)',
                color: stepIdx === idx ? s.badgeColor : '#94a3b8',
                boxShadow: stepIdx === idx ? `0 0 0 1.5px ${s.badgeColor}55` : '0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {s.title}
            </button>
          ))}

          <span
            style={{
              marginLeft: 'auto',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              background: `${current.badgeColor}20`,
              color: current.badgeColor,
              border: `1px solid ${current.badgeColor}55`,
            }}
          >
            {current.badge}
          </span>
        </div>

        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '14px' }}>
          <svg viewBox="0 0 920 315" style={{ width: '100%', minWidth: '720px', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="kcr-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="kcr-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="kcr-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
              </marker>
              <marker id="kcr-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
              </marker>
              <marker id="kcr-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
              </marker>
            </defs>

            {/* Flowing protocol arrows between consumers and Group Coordinator */}
            {current.flows.map((flow, i) => {
              const fromBox = NODE_COORDS[flow.from];
              const toBox = NODE_COORDS[flow.to];
              const isFromLeft = flow.from !== 'coord';
              const x1 = isFromLeft ? fromBox.x + fromBox.w + 6 : fromBox.x - 6;
              const y1 = isFromLeft
                ? fromBox.y + fromBox.h / 2
                : fromBox.y + 28 + i * 30;
              const x2 = isFromLeft ? toBox.x - 10 : toBox.x + toBox.w + 10;
              const y2 = isFromLeft
                ? toBox.y + 28 + i * 30
                : toBox.y + toBox.h / 2;

              const midX = (x1 + x2) / 2;
              const pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
              const markerId =
                flow.color === '#34d399'
                  ? 'kcr-arr-green'
                  : flow.color === '#a78bfa'
                    ? 'kcr-arr-purple'
                    : flow.color === '#fbbf24'
                      ? 'kcr-arr-amber'
                      : flow.color === '#f87171'
                        ? 'kcr-arr-red'
                        : 'kcr-arr-blue';

              return (
                <g key={`${flow.from}-${flow.to}-${i}`}>
                  <path d={pathD} stroke="rgba(148,163,184,0.2)" strokeWidth="2" fill="none" />
                  <path
                    d={pathD}
                    stroke={flow.color}
                    strokeWidth="2.2"
                    fill="none"
                    className="interactive-diagram-flowing-path"
                    markerEnd={`url(#${markerId})`}
                  />
                  <rect
                    x={midX - 92}
                    y={(y1 + y2) / 2 - 11}
                    width="184"
                    height="20"
                    rx="5"
                    fill="rgba(13, 15, 30, 0.92)"
                    stroke={`${flow.color}60`}
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={(y1 + y2) / 2 + 3}
                    textAnchor="middle"
                    fill={flow.color}
                    fontSize="10.5"
                    fontWeight="700"
                  >
                    {flow.label}
                  </text>
                </g>
              );
            })}

            {/* Consumer Nodes */}
            {current.consumers.map((c) => {
              const box = NODE_COORDS[c.id as 'c1' | 'c2' | 'c3'];
              const isPaused = c.status === 'PAUSED' || c.status === 'OFFLINE';
              return (
                <g key={c.id}>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.w}
                    height={box.h}
                    rx={10}
                    fill={isPaused ? 'rgba(15, 23, 42, 0.65)' : `${c.color}18`}
                    stroke={c.color}
                    strokeWidth={isPaused ? 1.2 : 2}
                    strokeDasharray={c.status === 'OFFLINE' ? '5 4' : undefined}
                  />
                  <text x={box.x + 12} y={box.y + 21} fill={c.color} fontSize="12" fontWeight="700">
                    {c.label}
                  </text>
                  <text x={box.x + 12} y={box.y + 37} fill="#94a3b8" fontSize="10">
                    {c.sublabel} • {c.status}
                  </text>
                  {c.partitions.length > 0 ? (
                    c.partitions.map((p, idx) => (
                      <g key={p}>
                        <rect
                          x={box.x + 12 + idx * 42}
                          y={box.y + 46}
                          width={36}
                          height={20}
                          rx={5}
                          fill={`${c.color}28`}
                          stroke={c.color}
                          strokeWidth="1"
                        />
                        <text
                          x={box.x + 30 + idx * 42}
                          y={box.y + 60}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10.5"
                          fontWeight="700"
                        >
                          {p}
                        </text>
                      </g>
                    ))
                  ) : (
                    <text x={box.x + 12} y={box.y + 59} fill="#64748b" fontSize="10.5" fontStyle="italic">
                      [ No active partitions ]
                    </text>
                  )}
                </g>
              );
            })}

            {/* Group Coordinator Broker Box */}
            <rect
              x={NODE_COORDS.coord.x}
              y={NODE_COORDS.coord.y}
              width={NODE_COORDS.coord.w}
              height={NODE_COORDS.coord.h}
              rx={12}
              fill="rgba(15, 23, 42, 0.94)"
              stroke="#fbbf24"
              strokeWidth="2"
            />
            <text x={NODE_COORDS.coord.x + 14} y={NODE_COORDS.coord.y + 24} fill="#fbbf24" fontSize="12.5" fontWeight="700">
              Kafka Group Coordinator
            </text>
            <text x={NODE_COORDS.coord.x + 14} y={NODE_COORDS.coord.y + 44} fill="#e2e8f0" fontSize="11">
              {current.rebalanceRound}
            </text>
            <text x={NODE_COORDS.coord.x + 14} y={NODE_COORDS.coord.y + 66} fill="#94a3b8" fontSize="10.5">
              Active Partitions: {current.activePartitionsCount} / 6
            </text>
            <rect
              x={NODE_COORDS.coord.x + 14}
              y={NODE_COORDS.coord.y + 78}
              width={215}
              height={10}
              rx={5}
              fill="rgba(255,255,255,0.08)"
            />
            <rect
              x={NODE_COORDS.coord.x + 14}
              y={NODE_COORDS.coord.y + 78}
              width={(215 * current.activePartitionsCount) / 6}
              height={10}
              rx={5}
              fill={current.badgeColor}
            />
            <text x={NODE_COORDS.coord.x + 14} y={NODE_COORDS.coord.y + 106} fill="#94a3b8" fontSize="9.5">
              __consumer_offsets state &amp; generation epoch
            </text>
          </svg>
        </div>

        <div className="kafka-coop-split" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '14px', alignItems: 'start' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.badgeColor}`, padding: '14px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: current.badgeColor, marginBottom: '6px' }}>
              {current.title}
            </div>
            <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.55 }}>
              {current.description}
            </div>
          </div>

          <div className="interactive-diagram-details-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              Protocol Wire Trace (JoinGroup / SyncGroup / Heartbeat)
            </div>
            {current.wireProtocol.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: '11.5px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  marginBottom: '5px',
                  lineHeight: 1.45,
                }}
              >
                • {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
