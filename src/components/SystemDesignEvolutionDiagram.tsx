import React, { useState } from 'react';

type ScalingStage = 1 | 2 | 3 | 4 | 5 | 6;

export default function SystemDesignEvolutionDiagram(): React.JSX.Element {
  const [currentStage, setCurrentStage] = useState<ScalingStage>(3);

  const stageData: Record<ScalingStage, {
    scale: string;
    title: string;
    cost: string;
    bottleneck: string;
    solution: string;
    color: string;
  }> = {
    1: {
      scale: '1 – 1,000 Users',
      title: 'Stage 1: The All-in-One $10 Server',
      cost: '~$10 / month',
      bottleneck: 'Single Point of Failure (SPOF). App CPU spikes crash the database. Vertical scaling runs out of RAM.',
      solution: 'Start simple! Validate the product first. Put Node/Django/Spring and Postgres on a single VPS.',
      color: '#38bdf8'
    },
    2: {
      scale: '1,000 – 10,000 Users',
      title: 'Stage 2: Separate Compute & Database',
      cost: '~$50 / month',
      bottleneck: 'Database disk I/O and app CPU compete for memory. App server restart causes database downtime.',
      solution: 'Move Postgres to a dedicated managed instance (RDS). Scale app server and database independently.',
      color: '#34d399'
    },
    3: {
      scale: '10,000 – 100,000 Users',
      title: 'Stage 3: Horizontal App Tier & Load Balancer',
      cost: '~$250 / month',
      bottleneck: 'Single app server crashes under traffic spikes. Sticky user sessions cause unbalanced server load.',
      solution: 'Make app servers 100% stateless. Move sessions to Redis. Place an Application Load Balancer (ALB) in front.',
      color: '#fbbf24'
    },
    4: {
      scale: '100,000 – 1,000,000 Users',
      title: 'Stage 4: Caching & Content Delivery Network (CDN)',
      cost: '~$1,000 / month',
      bottleneck: 'Database read CPU reaches 100%. Repetitive queries (e.g. user feeds, homepages) thrash database disk.',
      solution: 'Implement Cache-Aside with Redis. Cache static assets and photos at edge locations using CloudFront CDN.',
      color: '#f97316'
    },
    5: {
      scale: '1,000,000 – 5,000,000 Users',
      title: 'Stage 5: Database Read Replicas & Sharding',
      cost: '~$5,000 / month',
      bottleneck: 'Single primary database bottlenecked on both reads and writes. Table size exceeds 100 million rows.',
      solution: 'Add Read Replicas for queries (80/20 read-heavy rule). Shard writes across multiple database nodes by User ID.',
      color: '#a78bfa'
    },
    6: {
      scale: '5,000,000 – 10,000,000+ Users',
      title: 'Stage 6: Asynchronous Message Queues & Microservices',
      cost: '~$20,000+ / month',
      bottleneck: 'Synchronous HTTP request timeouts on heavy background jobs (video encoding, push notifications, emails).',
      solution: 'Introduce Kafka / RabbitMQ message queues. Decompose monolith into specialized domain microservices.',
      color: '#f472b6'
    }
  };

  const current = stageData[currentStage];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Evolutionary System Design: From $10 Server to 10M Users
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Stage Timeline Buttons */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {([1, 2, 3, 4, 5, 6] as ScalingStage[]).map(s => {
            const data = stageData[s];
            const isSelected = currentStage === s;
            return (
              <button
                key={s}
                onClick={() => setCurrentStage(s)}
                style={{
                  flex: '1 1 140px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isSelected ? data.color : 'rgba(255,255,255,0.08)'}`,
                  background: isSelected ? `${data.color}20` : 'rgba(255,255,255,0.02)',
                  color: isSelected ? data.color : 'var(--ifm-color-content-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '12px' }}>Stage {s}</div>
                <div style={{ fontSize: '10px', opacity: 0.85 }}>{data.scale}</div>
              </button>
            );
          })}
        </div>

        {/* SVG Topology Visualizer */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arrow-evo-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-evo-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
              </marker>
              <marker id="arrow-evo-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#fbbf24" />
              </marker>
            </defs>

            {/* Stage 1: Single Server */}
            {currentStage === 1 && (
              <g transform="translate(150, 25)">
                <rect x="0" y="35" width="100" height="60" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="15" y="60" fill="#38bdf8" fontSize="11" fontWeight="700">Clients</text>
                <text x="15" y="78" fill="#e0f2fe" fontSize="9">1–1K Users</text>

                <path d="M 105 65 L 185 65" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />

                <rect x="190" y="10" width="300" height="115" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="210" y="35" fill="#38bdf8" fontSize="12" fontWeight="700">🖥️ Single $10 VPS (All-in-One)</text>
                <rect x="210" y="48" width="260" height="30" rx="4" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                <text x="220" y="68" fill="#a7f3d0" fontSize="10">App Server (Node / Spring / Django)</text>
                <rect x="210" y="85" width="260" height="30" rx="4" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" />
                <text x="220" y="105" fill="#fef08a" fontSize="10">Database (PostgreSQL / MySQL on localhost)</text>
              </g>
            )}

            {/* Stage 2: Separate DB */}
            {currentStage === 2 && (
              <g transform="translate(80, 25)">
                <rect x="0" y="35" width="100" height="60" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="15" y="60" fill="#38bdf8" fontSize="11" fontWeight="700">Clients</text>
                <text x="15" y="78" fill="#e0f2fe" fontSize="9">1K–10K Users</text>

                <path d="M 105 65 L 175 65" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />

                <rect x="180" y="20" width="200" height="90" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="195" y="45" fill="#34d399" fontSize="11" fontWeight="700">🖥️ Dedicated App Server</text>
                <text x="195" y="68" fill="#e2e8f0" fontSize="9">Handles HTTP & Business Logic</text>
                <text x="195" y="88" fill="#a7f3d0" fontSize="8">Independent CPU scaling</text>

                <path d="M 385 65 L 455 65" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-evo-green)" className="interactive-diagram-flowing-path" />

                <rect x="460" y="20" width="200" height="90" rx="8" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="475" y="45" fill="#fbbf24" fontSize="11" fontWeight="700">🗄️ Managed Database (RDS)</text>
                <text x="475" y="68" fill="#e2e8f0" fontSize="9">PostgreSQL on port 5432</text>
                <text x="475" y="88" fill="#fef08a" fontSize="8">Dedicated IOPS & Memory</text>
              </g>
            )}

            {/* Stage 3: Load Balancer + Stateless App Tier */}
            {currentStage === 3 && (
              <g transform="translate(20, 20)">
                <rect x="0" y="40" width="80" height="60" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="10" y="65" fill="#38bdf8" fontSize="10" fontWeight="700">100K Users</text>

                <path d="M 85 70 L 135 70" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />

                {/* Load Balancer */}
                <rect x="140" y="30" width="110" height="80" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                <text x="150" y="55" fill="#34d399" fontSize="11" fontWeight="700">⚖️ Load Balancer</text>
                <text x="150" y="75" fill="#e2e8f0" fontSize="8">Round Robin / L7</text>
                <text x="150" y="92" fill="#a7f3d0" fontSize="8">Health Checks</text>

                {/* App Servers */}
                <path d="M 255 50 L 305 35" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-evo-green)" className="interactive-diagram-flowing-path" />
                <path d="M 255 90 L 305 105" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-evo-green)" className="interactive-diagram-flowing-path" />

                <rect x="310" y="15" width="130" height="45" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                <text x="320" y="35" fill="#fbbf24" fontSize="9" fontWeight="700">App Server 1 (Stateless)</text>

                <rect x="310" y="80" width="130" height="45" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                <text x="320" y="100" fill="#fbbf24" fontSize="9" fontWeight="700">App Server 2 (Stateless)</text>

                {/* Redis Session & DB */}
                <g transform="translate(470, 0)">
                  <rect x="0" y="15" width="140" height="45" rx="4" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" />
                  <text x="10" y="35" fill="#f87171" fontSize="9" fontWeight="700">🔴 Redis Session Store</text>
                  <text x="10" y="50" fill="#fecaca" fontSize="8">Shared Auth Tokens</text>

                  <rect x="0" y="80" width="140" height="45" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                  <text x="10" y="100" fill="#38bdf8" fontSize="9" fontWeight="700">🗄️ PostgreSQL DB</text>
                  <text x="10" y="115" fill="#93c5fd" fontSize="8">Primary Storage</text>
                </g>
              </g>
            )}

            {/* Stage 4: Cache + CDN */}
            {currentStage === 4 && (
              <g transform="translate(15, 20)">
                <rect x="0" y="40" width="75" height="60" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="10" y="65" fill="#38bdf8" fontSize="10" fontWeight="700">1M Users</text>

                <path d="M 80 50 L 130 35" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />
                <path d="M 80 90 L 130 105" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />

                {/* CDN */}
                <rect x="135" y="10" width="140" height="45" rx="6" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" />
                <text x="145" y="30" fill="#f97316" fontSize="10" fontWeight="700">⚡ CloudFront CDN</text>
                <text x="145" y="45" fill="#fed7aa" fontSize="8">Edge Caching (Images/JS)</text>

                {/* ALB + App */}
                <rect x="135" y="80" width="140" height="50" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="145" y="100" fill="#34d399" fontSize="10" fontWeight="700">⚖️ ALB + App Fleet</text>
                <text x="145" y="118" fill="#a7f3d0" fontSize="8">Auto Scaling Group</text>

                <path d="M 280 105 L 340 105" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-evo-green)" className="interactive-diagram-flowing-path" />

                {/* Redis Cache */}
                <rect x="345" y="30" width="180" height="50" rx="6" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" strokeWidth="1.5" />
                <text x="355" y="50" fill="#f87171" fontSize="10" fontWeight="700">🔴 Redis Cache-Aside</text>
                <text x="355" y="68" fill="#fecaca" fontSize="8">90% Cache Hit Rate (Sub-ms reads)</text>

                {/* DB */}
                <rect x="345" y="90" width="180" height="45" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="355" y="110" fill="#38bdf8" fontSize="10" fontWeight="700">🗄️ PostgreSQL (10% Traffic)</text>
                <text x="355" y="125" fill="#93c5fd" fontSize="8">Shielded by Redis Cache</text>
              </g>
            )}

            {/* Stage 5: Read Replicas + Sharding */}
            {currentStage === 5 && (
              <g transform="translate(15, 15)">
                <rect x="0" y="45" width="80" height="60" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="10" y="70" fill="#38bdf8" fontSize="10" fontWeight="700">5M Users</text>

                <path d="M 85 75 L 145 75" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />

                <rect x="150" y="35" width="150" height="80" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="160" y="60" fill="#34d399" fontSize="11" fontWeight="700">App Router Tier</text>
                <text x="160" y="80" fill="#e2e8f0" fontSize="9">Routes Reads vs Writes</text>
                <text x="160" y="98" fill="#a7f3d0" fontSize="8">Shard Key Hashing</text>

                <path d="M 305 55 L 365 35" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-evo-amber)" className="interactive-diagram-flowing-path" />
                <path d="M 305 95 L 365 115" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />

                {/* Primary Write Node */}
                <rect x="370" y="15" width="210" height="45" rx="6" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="380" y="35" fill="#fbbf24" fontSize="10" fontWeight="700">✍️ Primary Shard (Writes Only)</text>
                <text x="380" y="50" fill="#fef08a" fontSize="8">Synchronous master node</text>

                {/* Read Replicas */}
                <rect x="370" y="85" width="210" height="55" rx="6" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                <text x="380" y="105" fill="#38bdf8" fontSize="10" fontWeight="700">📖 Read Replicas (Reads 80%)</text>
                <text x="380" y="125" fill="#93c5fd" fontSize="8">Async replication from Primary</text>
              </g>
            )}

            {/* Stage 6: Queues + Microservices */}
            {currentStage === 6 && (
              <g transform="translate(10, 15)">
                <rect x="0" y="45" width="80" height="60" rx="6" fill="rgba(244, 114, 182, 0.15)" stroke="#f472b6" />
                <text x="8" y="70" fill="#f472b6" fontSize="10" fontWeight="700">10M+ Users</text>

                <path d="M 85 75 L 135 75" fill="none" stroke="#f472b6" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />

                <rect x="140" y="25" width="160" height="100" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="150" y="48" fill="#34d399" fontSize="11" fontWeight="700">API Gateway</text>
                <text x="150" y="68" fill="#e2e8f0" fontSize="9">• Auth & Rate Limiting</text>
                <text x="150" y="86" fill="#e2e8f0" fontSize="9">• Service Decomposition</text>
                <text x="150" y="106" fill="#a7f3d0" fontSize="8">• Global Anycast CDN</text>

                <path d="M 305 50 L 355 35" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-evo-blue)" className="interactive-diagram-flowing-path" />
                <path d="M 305 95 L 355 110" fill="none" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow-evo-amber)" className="interactive-diagram-flowing-path" />

                {/* Core Microservices */}
                <rect x="360" y="10" width="180" height="45" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="370" y="30" fill="#38bdf8" fontSize="9" fontWeight="700">User / Feed Microservice</text>
                <text x="370" y="45" fill="#93c5fd" fontSize="8">Dedicated DB per service</text>

                {/* Async Kafka Message Queue */}
                <rect x="360" y="80" width="180" height="55" rx="4" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="1.5" />
                <text x="370" y="100" fill="#f97316" fontSize="10" fontWeight="700">📬 Kafka / SQS Event Bus</text>
                <text x="370" y="120" fill="#fed7aa" fontSize="8">Async video / push / analytics</text>
              </g>
            )}
          </svg>
        </div>

        {/* Stage Summary Panel */}
        <div style={{
          padding: '14px',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${current.color}40`,
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: current.color }}>
              {current.title}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${current.color}20`, color: current.color }}>
              Approx. Cost: {current.cost}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '6px', lineHeight: 1.5 }}>
            <strong>⚠️ Bottleneck at this scale:</strong> {current.bottleneck}
          </div>
          <div style={{ fontSize: '12px', color: '#86efac', lineHeight: 1.5 }}>
            <strong>✨ Architectural Evolution:</strong> {current.solution}
          </div>
        </div>
      </div>
    </div>
  );
}
