import React, { useState } from 'react';

export default function KraftVsZookeeperDiagram({ initialTab = 'architecture' }: { initialTab?: 'architecture' | 'strimzi_k8s' | 'quorum_calc' | 'comparison' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'architecture' | 'strimzi_k8s' | 'quorum_calc' | 'comparison'>(initialTab);
  const [archMode, setArchMode] = useState<'zookeeper' | 'kraft'>('kraft');
  const [controllerCount, setControllerCount] = useState<number>(3);

  // Quorum calculation
  const faultTolerance = Math.floor((controllerCount - 1) / 2);
  const majorityNeeded = Math.floor(controllerCount / 2) + 1;
  const isEvenWarning = controllerCount % 2 === 0;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kraft-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Apache Kafka Metadata Engine: KRaft (KIP-500) vs Legacy ZooKeeper
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'architecture', label: '🏛️ 1. Architecture Topology Graph', color: '#34d399' },
            { id: 'strimzi_k8s', label: '☸️ 2. Strimzi K8s NodePools Spec', color: '#38bdf8' },
            { id: 'quorum_calc', label: '🧮 3. Quorum Math (2F + 1) Simulator', color: '#fbbf24' },
            { id: 'comparison', label: '📊 4. Deep Comparison Matrix', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ARCHITECTURE TOPOLOGY GRAPH */}
        {activeTab === 'architecture' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setArchMode('zookeeper')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: archMode === 'zookeeper' ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)',
                  color: archMode === 'zookeeper' ? '#f97316' : 'var(--ifm-color-content-secondary)',
                  boxShadow: archMode === 'zookeeper' ? '0 0 0 1px #f97316' : 'none'
                }}
              >
                ❌ Legacy ZooKeeper Mode (Dual Clustered Overhead)
              </button>
              <button
                onClick={() => setArchMode('kraft')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: archMode === 'kraft' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                  color: archMode === 'kraft' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  boxShadow: archMode === 'kraft' ? '0 0 0 1px #34d399' : 'none'
                }}
              >
                ✅ Modern KRaft Mode (Unified Raft Quorum)
              </button>
            </div>

            {/* Topology SVG */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 280" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="kraft-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="kraft-arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
                  </marker>
                  <marker id="kraft-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {archMode === 'zookeeper' ? (
                  <g>
                    {/* ZooKeeper Ensemble */}
                    <rect x="20" y="20" width="220" height="240" rx="8" fill="rgba(249,115,22,0.08)" stroke="#f97316" strokeWidth="1.2" strokeDasharray="3 3" />
                    <text x="130" y="45" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="700">ZooKeeper Ensemble</text>
                    <text x="130" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">External Clustered Storage (ZAB)</text>

                    {[
                      { y: 75, name: 'ZK Node 1 (Follower)' },
                      { y: 135, name: 'ZK Node 2 (Leader)' },
                      { y: 195, name: 'ZK Node 3 (Follower)' }
                    ].map((zk, idx) => (
                      <g key={idx}>
                        <rect x="35" y={zk.y} width="190" height="45" rx="6" fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth="1" />
                        <text x="130" y={zk.y + 27} textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">{zk.name}</text>
                      </g>
                    ))}

                    {/* Controller Broker */}
                    <path d="M 240 157 L 330 157" stroke="#f97316" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#kraft-arrow-orange)" />
                    <rect x="330" y="80" width="180" height="150" rx="8" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="420" y="105" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700">Active Controller Broker</text>
                    <text x="420" y="125" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">Single Broker elected by ZK</text>
                    <text x="420" y="145" textAnchor="middle" fill="#f87171" fontSize="9">⚠️ Cold failover reload (30s+)</text>
                    <text x="420" y="165" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Reads entire ZNode tree</text>
                    <text x="420" y="185" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Capped at ~200k partitions</text>

                    {/* Regular Brokers */}
                    <path d="M 510 157 L 590 157" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#kraft-arrow-orange)" />
                    <rect x="590" y="20" width="190" height="240" rx="8" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.2" />
                    <text x="685" y="45" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Kafka Data Brokers</text>
                    <text x="685" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Receive metadata via RPC push</text>

                    {[
                      { y: 75, name: 'Broker 1' },
                      { y: 135, name: 'Broker 2' },
                      { y: 195, name: 'Broker 3' }
                    ].map((b, idx) => (
                      <g key={idx}>
                        <rect x="605" y={b.y} width="160" height="45" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1" />
                        <text x="685" y={b.y + 27} textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">{b.name}</text>
                      </g>
                    ))}
                  </g>
                ) : (
                  <g>
                    {/* KRaft Quorum Controller */}
                    <rect x="20" y="20" width="360" height="240" rx="8" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="200" y="45" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">KRaft Metadata Quorum (Raft Engine)</text>
                    <text x="200" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Replicates @metadata Partition Event Sourcing Log</text>

                    {/* Active Controller */}
                    <rect x="35" y="75" width="330" height="55" rx="6" fill="rgba(52,211,153,0.25)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="200" y="98" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Active Controller (Leader)</text>
                    <text x="200" y="116" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">Appends changes instantly to @metadata log</text>

                    {/* Standby Controllers */}
                    <path d="M 200 130 L 200 160" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#kraft-arrow-green)" />
                    <rect x="35" y="160" width="160" height="85" rx="6" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1" />
                    <text x="115" y="185" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">Standby Controller 2</text>
                    <text x="115" y="205" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Hot In-Memory State</text>
                    <text x="115" y="222" textAnchor="middle" fill="#38bdf8" fontSize="8">Failover &lt; 1 second!</text>

                    <rect x="205" y="160" width="160" height="85" rx="6" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1" />
                    <text x="285" y="185" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">Standby Controller 3</text>
                    <text x="285" y="205" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Hot In-Memory State</text>
                    <text x="285" y="222" textAnchor="middle" fill="#38bdf8" fontSize="8">Zero-lookup standby</text>

                    {/* Streaming connection to Brokers */}
                    <path d="M 380 102 L 460 102" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#kraft-arrow-blue)" />

                    {/* Kafka Data Brokers */}
                    <rect x="460" y="20" width="320" height="240" rx="8" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.2" />
                    <text x="620" y="45" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Kafka Data Brokers (Event Observers)</text>
                    <text x="620" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Streaming consumer pulls metadata deltas into local RAM</text>

                    {[
                      { y: 75, name: 'Data Broker 1 (Pod 1)', sub: 'In-Memory Metadata Cache' },
                      { y: 135, name: 'Data Broker 2 (Pod 2)', sub: 'In-Memory Metadata Cache' },
                      { y: 195, name: 'Data Broker 3 (Pod 3)', sub: 'In-Memory Metadata Cache' }
                    ].map((b, idx) => (
                      <g key={idx}>
                        <rect x="475" y={b.y} width="290" height="45" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1" />
                        <text x="620" y={b.y + 20} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">{b.name}</text>
                        <text x="620" y={b.y + 35} textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">{b.sub}</text>
                      </g>
                    ))}
                  </g>
                )}
              </svg>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, color: archMode === 'kraft' ? '#34d399' : '#f97316', marginBottom: '4px', fontSize: '13px' }}>
                {archMode === 'kraft' ? 'How KRaft Operates: Event Sourcing & Sub-Second Failover' : 'The ZooKeeper Bottleneck: Dual Systems & Cold Recovery'}
              </div>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'var(--ifm-color-content-secondary)' }}>
                {archMode === 'kraft'
                  ? 'In KRaft, metadata is managed as a dedicated internal log (__cluster_metadata). Standby Controllers and Data Brokers continuously stream these log records and store them in RAM. When the Active Controller dies, a standby node is elected Leader in milliseconds and already possesses 100% of cluster metadata—enabling instant failover without reloading anything from disk!'
                  : 'In ZooKeeper mode, every metadata change required updating an external ZNode tree. When the single Active Controller crashed, the newly elected Controller had to pull and deserialize hundreds of thousands of ZNodes from ZooKeeper before handling any client requests, causing 30s to 30min cluster freezes.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: STRIMZI KUBERNETES NODEPOOLS */}
        {activeTab === 'strimzi_k8s' && (
          <div>
            <div className="kraft-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px', marginBottom: '14px' }}>
              {/* Controller NodePool */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  1. Dedicated Controller Pool (Raft Quorum)
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#86efac' }}>
{`apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaNodePool
metadata:
  name: controller-pool
  namespace: kafka
spec:
  replicas: 3
  roles:
    - controller # Dedicated KRaft Quorum
  storage:
    type: persistent-claim
    size: 20Gi # Small NVMe volume for metadata`}
                </pre>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                  Controllers require fast low-latency disk, small storage, and isolated CPU so heavy producer traffic never starves the Raft quorum heartbeat.
                </div>
              </div>

              {/* Broker NodePool */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  2. Dedicated Broker Pool (Data Traffic)
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#7dd3fc' }}>
{`apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaNodePool
metadata:
  name: broker-pool
  namespace: kafka
spec:
  replicas: 5
  roles:
    - broker     # Handles client producer/consumer I/O
  storage:
    type: persistent-claim
    size: 500Gi # Large storage for user topic logs`}
                </pre>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                  Brokers scale horizontally as data volume grows, independent of the 3-node controller quorum.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUORUM MATH 2F + 1 */}
        {activeTab === 'quorum_calc' && (
          <div>
            <div className="kraft-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                  KRaft Quorum Size Selector
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {[1, 3, 4, 5, 7].map(n => (
                    <button
                      key={n}
                      onClick={() => setControllerCount(n)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '12px',
                        background: controllerCount === n ? '#fbbf24' : 'rgba(255,255,255,0.05)',
                        color: controllerCount === n ? '#0f172a' : 'var(--ifm-color-content-secondary)'
                      }}
                    >
                      {n} Nodes
                    </button>
                  ))}
                </div>

                {/* Calculation breakdown */}
                <div style={{ background: isEvenWarning ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)', border: `1px solid ${isEvenWarning ? '#f87171' : '#34d399'}`, borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Fault Tolerance Formula: 2F + 1</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: isEvenWarning ? '#f87171' : '#34d399', marginTop: '2px' }}>
                    Can survive {faultTolerance} node failure{faultTolerance !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                    Majority vote required: {majorityNeeded} of {controllerCount} nodes.
                  </div>
                  {isEvenWarning && (
                    <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700, marginTop: '6px' }}>
                      ⚠️ WARNING: Even number of nodes (4) provides the SAME fault tolerance (F=1) as 3 nodes, while increasing network split-vote risk!
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation card */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  Senior Production Rules for KRaft Quorum
                </div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '14px', lineHeight: '1.6' }}>
                  <li><strong>Small / Medium Production:</strong> Exactly <strong>3 Controllers</strong>. Tolerate 1 node failure ($F=1$).</li>
                  <li><strong>Mission-Critical / Multi-AZ Production:</strong> Exactly <strong>5 Controllers</strong> (spread across 3 Availability Zones: 2 in AZ-A, 2 in AZ-B, 1 in AZ-C). Tolerate 2 node failures ($F=2$).</li>
                  <li><strong>Never use 2 or 4 nodes:</strong> 2 nodes require both to be alive for a majority of 2 ($F=0$). 4 nodes require 3 for a majority ($F=1$), identical to 3 nodes.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEEP COMPARISON */}
        {activeTab === 'comparison' && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--ifm-color-content-secondary)' }}>Feature</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#f97316' }}>ZooKeeper Mode (Deprecated)</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#34d399' }}>KRaft Mode (Modern Kafka 3.3+)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px' }}><strong>Infrastructure</strong></td>
                  <td style={{ color: '#f97316' }}>2 separate clusters (Kafka + ZK)</td>
                  <td style={{ color: '#34d399' }}>1 unified cluster (Single binary)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px' }}><strong>Controller Failover</strong></td>
                  <td style={{ color: '#f87171' }}>30s to 30min (Cold ZNode reload)</td>
                  <td style={{ color: '#34d399' }}>&lt; 1s (Hot in-memory state)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px' }}><strong>Partition Ceiling</strong></td>
                  <td style={{ color: '#f87171' }}>~200,000 partitions</td>
                  <td style={{ color: '#34d399' }}>&gt; 1,000,000+ partitions</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px' }}><strong>Security & ACLs</strong></td>
                  <td style={{ color: '#f97316' }}>Split between ZK ACLs and Kafka</td>
                  <td style={{ color: '#34d399' }}>Centralized in @metadata log</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}><strong>Metadata Propagation</strong></td>
                  <td style={{ color: '#f97316' }}>Push RPCs from Controller</td>
                  <td style={{ color: '#34d399' }}>Continuous consumer pull deltas</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}