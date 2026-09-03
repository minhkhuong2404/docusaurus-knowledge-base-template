import React, { useState } from 'react';

type ArchCompany = 'shopify' | 'twitter' | 'facebook-tao' | 'uber';

interface ArchCase {
  id: ArchCompany;
  title: string;
  company: string;
  pattern: string;
  bottleneck: string;
  solution: string;
  color: string;
}

const ARCH_CASES: ArchCase[] = [
  {
    id: 'shopify',
    title: 'Shopify Pod Architecture (Cell-Based Scaling)',
    company: 'Shopify',
    pattern: 'Shared-Nothing Autonomous Pods',
    bottleneck: 'A single monolithic MySQL database and Redis cluster shared across all merchants created catastrophic single points of failure. Flash sales on one celebrity merchant crashed the entire platform for all other stores.',
    solution: 'Partitioned the entire platform into fully self-contained "Pods". Each Pod contains its own dedicated MySQL clusters, Redis, Memcached, and app workers. A smart NGINX/Lua router routes requests based on merchant_id. If a pod crashes, only 1% of merchants are affected; the remaining 99% continue serving traffic normally.',
    color: '#34d399',
  },
  {
    id: 'twitter',
    title: 'Twitter Timeline: Hybrid Fan-out on Write vs Read',
    company: 'Twitter / X',
    pattern: 'Hybrid Fan-out Push/Pull Architecture',
    bottleneck: 'Fan-out on write (pushing a tweet to every follower\'s timeline in Redis) failed for celebrity users (e.g. 100M followers = 100M Redis inserts per tweet, causing multi-minute ingestion lag). Fan-out on read (querying all followees at view time) crushed database reads.',
    solution: 'Hybrid Fan-Out: Standard users (followers < 25,000) use Fan-out on Write (push). Celebrity users (followers > 25,000) skip fan-out at tweet time. When a follower opens their home timeline, the system fetches their Redis home timeline and merges the celebrity tweets on-the-fly (Fan-out on Read) via a fast in-memory union.',
    color: '#38bdf8',
  },
  {
    id: 'facebook-tao',
    title: 'Facebook TAO: The Distributed Social Graph',
    company: 'Meta / Facebook',
    pattern: '2-Tier Graph Cache over Sharded MySQL',
    bottleneck: 'Billions of social graph edges (friends, likes, comments) generated trillions of read queries per day, overwhelming sharded relational databases.',
    solution: 'Designed TAO: an object (node) and association (edge) datastore. Operates a 2-tier caching hierarchy: Client ➔ Follower Cache Tier (distributed across datacenters) ➔ Leader Cache Tier (single datacenter per shard) ➔ Sharded MySQL. Followers handle 99.8% of reads in sub-millisecond memory lookups; Leader cache coordinates write serialization and invalidations.',
    color: '#fbbf24',
  },
  {
    id: 'uber',
    title: 'Uber DOMA: Domain-Oriented Microservice Architecture',
    company: 'Uber',
    pattern: 'Layered Domains & Gateway Decoupling',
    bottleneck: 'Explosion of 2,200+ microservices created chaotic spaghetti call graphs, circular dependency deadlocks, impossible debugging, and cascading latency degradation.',
    solution: 'Organized 2,200 services into Domain-Oriented Microservice Architecture (DOMA): (1) Domains (collections of related services); (2) Layers (strict dependency rules: lower layers cannot call upper layers); (3) Gateways (each domain exposes a single strict interface); (4) Extensions (custom business logic plugged in via extension points without modifying core domain code).',
    color: '#a78bfa',
  },
];

export default function CaseStudiesArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ArchCompany>('shopify');

  const selected = ARCH_CASES.find((c) => c.id === activeTab) || ARCH_CASES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .arch-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Hyper-Scale System Architecture Case Studies
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ARCH_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeTab === c.id ? c.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeTab === c.id ? `${c.color}22` : 'transparent',
                color: activeTab === c.id ? c.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {c.company}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Dynamic Flowing Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 180"
          className="interactive-diagram-svg"
          style={{ minHeight: '180px' }}
          role="img"
          aria-label="Hyper-scale traffic routing and sharding architecture"
        >
          <defs>
            <marker
              id="arrow-green-arch"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
            <marker
              id="arrow-blue-arch"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Client Edge Request */}
          <g>
            <rect x="30" y="45" width="160" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="14" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="55" y="77" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">🌐</text>
            <text x="115" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Client / App</text>
            <text x="115" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Anycast DNS / CDN</text>
            <text x="115" y="112" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">Millions of Req/s</text>
          </g>

          {/* Flow Line to Router */}
          <line x1="190" y1="90" x2="280" y2="90" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="190"
            y1="90"
            x2="280"
            y2="90"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-blue-arch)"
          />

          {/* Smart Edge Router / Gateway */}
          <g>
            <rect x="285" y="45" width="180" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="310" cy="72" r="14" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="310" y="77" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">⚡</text>
            <text x="380" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Edge Gateway</text>
            <text x="380" y="88" textAnchor="middle" fill="#fbbf24" fontSize="10">NGINX / Envoy / DOMA</text>
            <text x="380" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Partition Key Extract</text>
          </g>

          {/* Forking Paths to Isolated Pods / Caches */}
          <path d="M 465 90 C 530 90, 540 50, 600 50" fill="none" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.3" />
          <path
            d="M 465 90 C 530 90, 540 50, 600 50"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-arch)"
          />

          <path d="M 465 90 C 530 90, 540 130, 600 130" fill="none" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.3" />
          <path
            d="M 465 90 C 530 90, 540 130, 600 130"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-arch)"
          />

          {/* Pod / Tier 1 (Top) */}
          <g>
            <rect x="605" y="30" width="140" height="42" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#34d399" strokeWidth="1.2" />
            <text x="675" y="47" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Pod 01 / Follower Cache</text>
            <text x="675" y="63" textAnchor="middle" fill="#34d399" fontSize="9.5">Shared-Nothing Cell</text>
          </g>

          {/* Pod / Tier 2 (Bottom) */}
          <g>
            <rect x="605" y="110" width="140" height="42" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#34d399" strokeWidth="1.2" />
            <text x="675" y="127" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Pod 02 / Sharded Store</text>
            <text x="675" y="143" textAnchor="middle" fill="#34d399" fontSize="9.5">Isolated Blast Radius</text>
          </g>

          {/* Final Sink / Storage Line */}
          <line x1="745" y1="90" x2="800" y2="90" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="745"
            y1="90"
            x2="800"
            y2="90"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-blue-arch)"
          />

          {/* Storage / Persistence Sink */}
          <g>
            <rect x="805" y="45" width="120" height="90" rx="10" fill="rgba(6, 78, 59, 0.25)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="825" cy="72" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="825" y="77" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">🗄️</text>
            <text x="868" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Storage Core</text>
            <text x="868" y="88" textAnchor="middle" fill="#34d399" fontSize="9.5">MySQL / Vitess</text>
            <text x="868" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Sharded Datastore</text>
          </g>
        </svg>
      </div>

      {/* Details Split Pane */}
      <div className="arch-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${selected.color}` }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: selected.color, textTransform: 'uppercase' }}>
            {selected.pattern}
          </span>
          <h4 style={{ margin: '4px 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
            {selected.title}
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            <strong style={{ color: '#f87171' }}>The Bottleneck: </strong>
            {selected.bottleneck}
          </p>
        </div>

        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
            PRODUCTION ARCHITECTURAL SOLUTION
          </span>
          <h4 style={{ margin: '4px 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
            The Engineering Solution
          </h4>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
            {selected.solution}
          </p>
        </div>
      </div>
    </div>
  );
}
