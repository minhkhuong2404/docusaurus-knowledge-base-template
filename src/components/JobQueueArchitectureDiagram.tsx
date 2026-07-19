import React, { useState } from 'react';

interface ArchNode {
  title: string;
  role: string;
  color: string;
  details: string[];
}

const NODES: Record<string, ArchNode> = {
  API: {
    title: 'API Server',
    role: 'Entrypoint for client requests. Dispatches tasks and queries status.',
    color: '#38bdf8',
    details: [
      'Persists initial PENDING status record in Metadata Database.',
      'Enqueues tasks into the Message Queue.',
      'Returns 202 Accepted response with job_id immediately.',
    ],
  },
  DB: {
    title: 'Job Metadata DB (PostgreSQL)',
    role: 'Durable relational database mapping job details and histories.',
    color: '#34d399',
    details: [
      'Stores client payloads, job state logs, and user metadata.',
      'Guarantees ACID transactions for client job submissions.',
      'Accessed by Admin Dashboard to monitor execution queues.',
    ],
  },
  QUEUE: {
    title: 'Message Queue (RabbitMQ / Kafka)',
    role: 'Asynchronous task broker managing execution delivery queues.',
    color: '#fbbf24',
    details: [
      'Ensures at-least-once message delivery to worker pools.',
      'Decouples client request loops from worker execution times.',
      'Queues are partitioned or configured for worker load balances.',
    ],
  },
  WORKER: {
    title: 'Worker Pool (Auto-scaling)',
    role: 'Stateless consumer services executing background job functions.',
    color: '#a78bfa',
    details: [
      'Consumes messages, parses configurations, and runs tasks.',
      'Publishes continuous task progress details to Redis.',
      'Scales horizontally based on message count thresholds.',
    ],
  },
  REDIS: {
    title: 'Progress Store (Redis / Cache)',
    role: 'In-memory data store cache handling transient status lookups.',
    color: '#2dd4bf',
    details: [
      'Stores transient completion percentages (e.g. 45% complete).',
      'Powers real-time progress push mechanisms (WebSockets/SSE).',
      'Prevents excessive disk read pressure on primary Metadata DB.',
    ],
  },
  S3: {
    title: 'Result Store (S3 / GCS)',
    role: 'Object store container persisting large finalized document attachments.',
    color: '#f87171',
    details: [
      'Stores large binary reports, exports, or media files.',
      'Ensures files are readable via expiring pre-signed URLs.',
      'Cleaned up automatically after expiration periods.',
    ],
  },
};

export default function JobQueueArchitectureDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<string>('API');

  const active = NODES[selectedNode];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"/>
          <rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/>
          <rect x="3" y="16" width="7" height="5"/>
        </svg>
        <span>Job Queue System Architecture</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'center' }}>
        
        {/* SVG layout */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 340 300" className="interactive-diagram-svg">
            <defs>
              <marker id="job-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
              </marker>
            </defs>

            {/* Paths */}
            {/* API -> DB */}
            <path id="e-api-db" d="M 80 50 L 80 90" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#job-arr)"
                  className={selectedNode === 'API' || selectedNode === 'DB' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />
            
            {/* API -> Queue */}
            <path id="e-api-q" d="M 120 30 L 210 30" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#job-arr)"
                  className={selectedNode === 'API' || selectedNode === 'QUEUE' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />

            {/* Queue -> Worker */}
            <path id="e-q-work" d="M 270 50 L 270 90" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#job-arr)"
                  className={selectedNode === 'QUEUE' || selectedNode === 'WORKER' ? 'interactive-diagram-flowing-path active-path-yellow' : ''} />

            {/* Worker -> Redis */}
            <path id="e-work-redis" d="M 210 110 L 140 110" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#job-arr)"
                  className={selectedNode === 'WORKER' || selectedNode === 'REDIS' ? 'interactive-diagram-flowing-path active-path-purple' : ''} />

            {/* Worker -> S3 */}
            <path id="e-work-s3" d="M 270 130 L 270 170" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#job-arr)"
                  className={selectedNode === 'WORKER' || selectedNode === 'S3' ? 'interactive-diagram-flowing-path active-path-purple' : ''} />

            {/* API Node */}
            <g onClick={() => setSelectedNode('API')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="20" width="100" height="30" rx="5"
                    fill={selectedNode === 'API' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'API' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="70" y="38" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="800">
                API Server
              </text>
            </g>

            {/* Metadata DB Node */}
            <g onClick={() => setSelectedNode('DB')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="90" width="100" height="30" rx="5"
                    fill={selectedNode === 'DB' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'DB' ? '#34d399' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="70" y="108" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="800">
                Metadata DB
              </text>
            </g>

            {/* Queue Node */}
            <g onClick={() => setSelectedNode('QUEUE')} style={{ cursor: 'pointer' }}>
              <rect x="220" y="20" width="100" height="30" rx="5"
                    fill={selectedNode === 'QUEUE' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'QUEUE' ? '#fbbf24' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="270" y="38" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="800">
                Message Queue
              </text>
            </g>

            {/* Worker Node */}
            <g onClick={() => setSelectedNode('WORKER')} style={{ cursor: 'pointer' }}>
              <rect x="220" y="90" width="100" height="40" rx="5"
                    fill={selectedNode === 'WORKER' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'WORKER' ? '#a78bfa' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="270" y="110" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="800">
                Worker Pool
              </text>
              <text x="270" y="121" textAnchor="middle" fill="#475569" fontSize="7" fontStyle="italic">
                Stateless Workers
              </text>
            </g>

            {/* Progress Store Node */}
            <g onClick={() => setSelectedNode('REDIS')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="160" width="100" height="30" rx="5"
                    fill={selectedNode === 'REDIS' ? 'rgba(45,212,191,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'REDIS' ? '#2dd4bf' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="70" y="178" textAnchor="middle" fill="#2dd4bf" fontSize="9.5" fontWeight="800">
                Progress (Redis)
              </text>
            </g>

            {/* S3 Result Store Node */}
            <g onClick={() => setSelectedNode('S3')} style={{ cursor: 'pointer' }}>
              <rect x="220" y="170" width="100" height="30" rx="5"
                    fill={selectedNode === 'S3' ? 'rgba(248,113,113,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'S3' ? '#f87171' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="270" y="188" textAnchor="middle" fill="#f87171" fontSize="9.5" fontWeight="800">
                Result Store (S3)
              </text>
            </g>

            <text x="170" y="235" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
              💡 Click on nodes to inspect architecture functions.
            </text>
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${active.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: active.color }}>{active.title}</h3>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0 }}>
            {active.role}
          </p>
          <ul style={{ margin: 0, paddingLeft: '14px' }}>
            {active.details.map((detail, idx) => (
              <li key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginBottom: '4px', lineHeight: 1.4 }}>
                {detail}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
