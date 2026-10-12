import React, { useState } from 'react';

type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'DELETE';

interface VerbDetails {
  verb: HttpVerb;
  color: string;
  badgeColor: string;
  safe: boolean;
  idempotent: boolean;
  rfcSpec: string;
  wireBody: string;
  statusCodes: string;
  concurrencyModel: string;
  productionGotcha: string;
  flowSteps: { from: string; to: string; label: string; note: string }[];
}

const VERB_DATA: Record<HttpVerb, VerbDetails> = {
  GET: {
    verb: 'GET',
    color: '#38bdf8',
    badgeColor: '#0284c7',
    safe: true,
    idempotent: true,
    rfcSpec: 'RFC 9110 §9.3.1 (Safe, Idempotent, Cacheable)',
    wireBody: 'No body (proxies/ALBs strip or reject with 400 Bad Request)',
    statusCodes: '200 OK, 206 Partial Content, 304 Not Modified, 404 Not Found',
    concurrencyModel: 'Conditional Headers (If-None-Match, If-Modified-Since)',
    productionGotcha: 'Prefetching crawl disasters (crawlers triggering mutations if GET modifies state); URI length limits (414 URI Too Long beyond 8KB).',
    flowSteps: [
      { from: 'Client / CDN', to: 'API Gateway', label: 'GET /videos/intro.mp4 (Range: bytes=0-1048575)', note: 'Byte-range streaming request' },
      { from: 'API Gateway', to: 'Origin / Storage', label: 'If-None-Match: "v4_hash"', note: 'Conditional validation' },
      { from: 'Origin / Storage', to: 'Client', label: 'HTTP 206 Partial Content (Content-Range: 0-1MB/50MB)', note: 'Zero-copy byte slice returned' },
    ],
  },
  POST: {
    verb: 'POST',
    color: '#34d399',
    badgeColor: '#059669',
    safe: false,
    idempotent: false,
    rfcSpec: 'RFC 9110 §9.3.3 (Unsafe, Non-Idempotent, Factory Pattern)',
    wireBody: 'Full Request Body (JSON, Protobuf, Multi-part Form)',
    statusCodes: '201 Created (+ Location header), 202 Accepted, 200 OK, 204 No Content',
    concurrencyModel: 'Distributed Idempotency-Key + Redis Lock (SET NX PX)',
    productionGotcha: 'Network retry double-charging. Two-generals problem requires database transactional outbox or Redis idempotency filter with SHA-256 payload verification.',
    flowSteps: [
      { from: 'Client / App', to: 'API Gateway', label: 'POST /payments (Idempotency-Key: uuid-v4)', note: 'Client generates unique retry token' },
      { from: 'API Gateway', to: 'Redis Distributed Lock', label: 'SET lock:uuid "PROCESSING" NX PX 10000', note: 'Atomic concurrency guard' },
      { from: 'Payment Engine', to: 'Client', label: 'HTTP 201 Created (Location: /payments/txn_99)', note: 'Cached response stored for retries' },
    ],
  },
  PUT: {
    verb: 'PUT',
    color: '#fbbf24',
    badgeColor: '#d97706',
    safe: false,
    idempotent: true,
    rfcSpec: 'RFC 9110 §9.3.4 (Complete Replacement / Upsert)',
    wireBody: 'Complete Resource Representation (all fields mandatory)',
    statusCodes: '200 OK (replaced), 204 No Content (replaced), 201 Created (upsert)',
    concurrencyModel: 'Optimistic Concurrency Control (If-Match: ETag)',
    productionGotcha: 'The Lost Update Problem! Without If-Match conditional header, concurrent PUTs silently overwrite and erase sibling field updates.',
    flowSteps: [
      { from: 'Client A & B', to: 'Origin Server', label: 'GET /users/42 -> Returns ETag: "v1"', note: 'Both clients read same base version' },
      { from: 'Client A', to: 'Origin Server', label: 'PUT /users/42 with If-Match: "v1" -> 200 OK (ETag="v2")', note: 'Client A commits first; version advances' },
      { from: 'Client B', to: 'Origin Server', label: 'PUT /users/42 with If-Match: "v1" -> 412 Precondition Failed', note: 'Client B update rejected, preventing lost update' },
    ],
  },
  PATCH: {
    verb: 'PATCH',
    color: '#a78bfa',
    badgeColor: '#7c3aed',
    safe: false,
    idempotent: false,
    rfcSpec: 'RFC 5789 (Partial Modification) / RFC 6902 (JSON Patch) / RFC 7396 (Merge Patch)',
    wireBody: 'Delta / Patch instructions (Merge Patch JSON or RFC 6902 op array)',
    statusCodes: '200 OK, 204 No Content, 409 Conflict, 422 Unprocessable Entity',
    concurrencyModel: 'In-band atomic CAS (JSON Patch "test" op) or If-Match ETag',
    productionGotcha: 'RFC 7396 Merge Patch cannot differentiate between "omit field" vs "set field to null". RFC 6902 is strictly needed for arrays and atomic test ops.',
    flowSteps: [
      { from: 'Client', to: 'API Gateway', label: 'PATCH /users/42 [application/json-patch+json]', note: 'Sends precise delta patch' },
      { from: 'Engine', to: 'Domain Entity', label: 'Op: {"op": "test", "path": "/version", "value": 4}', note: 'Atomic in-band CAS verification' },
      { from: 'Domain Entity', to: 'Client', label: 'Op: {"op": "replace", "path": "/email", "value": "new@corp.com"} -> 200 OK', note: 'Single attribute patched without payload bloat' },
    ],
  },
  OPTIONS: {
    verb: 'OPTIONS',
    color: '#2dd4bf',
    badgeColor: '#0f766e',
    safe: true,
    idempotent: true,
    rfcSpec: 'RFC 9110 §9.3.7 (Communication Capabilities & CORS Preflight)',
    wireBody: 'No body in request or response',
    statusCodes: '204 No Content, 200 OK (with Allow & CORS headers)',
    concurrencyModel: 'Stateless Capability Introspection',
    productionGotcha: '1-RTT Preflight Latency Tax! Browsers block data requests until OPTIONS completes. Mitigate via Access-Control-Max-Age or same-origin BFF routing.',
    flowSteps: [
      { from: 'Browser (SPA)', to: 'Origin API', label: 'OPTIONS /api/orders (Origin: app.com, Request-Method: DELETE)', note: 'Automatic preflight interrogation' },
      { from: 'Origin API', to: 'Browser', label: '204 No Content (Access-Control-Allow-Methods: DELETE, Max-Age: 86400)', note: 'Preflight cached for 24 hours' },
      { from: 'Browser (SPA)', to: 'Origin API', label: 'DELETE /api/orders/101 (Actual request executed)', note: 'Preflight clears browser security barrier' },
    ],
  },
  DELETE: {
    verb: 'DELETE',
    color: '#f87171',
    badgeColor: '#b91c1c',
    safe: false,
    idempotent: true,
    rfcSpec: 'RFC 9110 §9.3.5 (Mapping Termination)',
    wireBody: 'No body recommended (undefined semantics, rejected by many ALBs)',
    statusCodes: '204 No Content (sync), 202 Accepted (async batch), 200 OK, 404 (idempotent)',
    concurrencyModel: 'If-Match ETag (prevent deleting already modified resource)',
    productionGotcha: 'Soft Delete index bloat (partial indexes required); Kafka Event-Driven Tombstones (publishing null payload key to trigger log compaction).',
    flowSteps: [
      { from: 'Client / Admin', to: 'API Gateway', label: 'DELETE /tenants/881 -> 202 Accepted (Location: /jobs/purge_9)', note: 'Asynchronous purge queued' },
      { from: 'Worker Pool', to: 'Kafka Topic', label: 'Publish Key="tenant:881", Value=null (Kafka Tombstone)', note: 'Triggers partition log compaction' },
      { from: 'Database', to: 'Audit Trail', label: 'Soft Delete: UPDATE tenants SET deleted_at=NOW() WHERE id=881', note: 'Logical deletion with audit trail intact' },
    ],
  },
};

export default function HttpMethodSemanticsDiagram(): React.JSX.Element {
  const [selectedVerb, setSelectedVerb] = useState<HttpVerb>('GET');
  const details = VERB_DATA[selectedVerb];

  return (
    <div className="interactive-diagram-container" style={{ margin: '24px 0' }}>
      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid rgba(152, 162, 179, 0.3)',
          backgroundColor: '#0b0f19',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#38bdf8' }}>
            HTTP Method Protocol Semantics &amp; Wire Contracts (RFC 9110 / 5789)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'] as HttpVerb[]).map((v) => {
            const isSelected = selectedVerb === v;
            const item = VERB_DATA[v];
            return (
              <button
                key={v}
                onClick={() => setSelectedVerb(v)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${item.color}` : '1px solid rgba(152, 162, 179, 0.25)',
                  backgroundColor: isSelected ? item.color : '#090b14',
                  color: isSelected ? '#090b14' : '#e2e8f0',
                  transition: 'all 0.15s ease',
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '16px', backgroundColor: '#090b14' }}>
        {/* Core Attributes Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0f1e', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Safety Contract</div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: details.safe ? '#34d399' : '#f87171' }}>
              {details.safe ? 'Safe (f(S) = S)' : 'Unsafe (f(S) != S)'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              {details.safe ? 'No origin state mutation' : 'Mutates server state'}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0f1e', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Idempotency</div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: details.idempotent ? '#34d399' : '#fbbf24' }}>
              {details.idempotent ? 'Idempotent (f(f(S)) = f(S))' : 'Non-Idempotent (f(f(S)) != f(S))'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              {details.idempotent ? 'Safe for network retries' : 'Blind retry causes duplicates'}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0f1e', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Request Body Policy</div>
            <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px', color: '#e2e8f0' }}>
              {details.wireBody.includes('No body') ? 'No Payload' : 'Payload Required / Optional'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              {details.wireBody}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0f1e', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>RFC Standard</div>
            <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '4px', color: details.color }}>
              {details.rfcSpec.split(' ')[0]} {details.rfcSpec.split(' ')[1]}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              {details.rfcSpec.split('(')[1]?.replace(')', '') || 'HTTP Core'}
            </div>
          </div>
        </div>

        {/* Wire Protocol Flowchart (SVG) */}
        <div style={{ backgroundColor: '#0d0f1e', borderRadius: '10px', border: '1px solid rgba(152, 162, 179, 0.25)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: details.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Production Wire Flow &amp; Distributed Interaction ({selectedVerb})
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
              Status Codes: {details.statusCodes}
            </span>
          </div>

          {/* SVG Animated Conduits */}
          <div style={{ position: 'relative', width: '100%', minHeight: '120px' }}>
            <svg width="100%" height="110" viewBox="0 0 760 110" style={{ display: 'block', overflow: 'visible' }}>
              <defs>
                <marker id={`marker-${selectedVerb}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={details.color} />
                </marker>
              </defs>

              {/* Node 1: Client */}
              <rect x="10" y="25" width="160" height="55" rx="8" fill="#13172b" stroke={details.color} strokeWidth="2" />
              <text x="90" y="48" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Client / Edge Client</text>
              <text x="90" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9">Origin &amp; Browser</text>

              {/* Conduit 1 -> 2 */}
              <line x1="170" y1="52" x2="280" y2="52" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              <line x1="170" y1="52" x2="280" y2="52" stroke={details.color} strokeWidth="2" strokeDasharray="6 4" markerEnd={`url(#marker-${selectedVerb})`} />

              {/* Node 2: Gateway */}
              <rect x="290" y="25" width="180" height="55" rx="8" fill="#13172b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="380" y="48" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">API Gateway / Proxy</text>
              <text x="380" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9">Envoy / NGINX / Cloudflare</text>

              {/* Conduit 2 -> 3 */}
              <line x1="470" y1="52" x2="570" y2="52" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              <line x1="470" y1="52" x2="570" y2="52" stroke={details.color} strokeWidth="2" strokeDasharray="6 4" markerEnd={`url(#marker-${selectedVerb})`} />

              {/* Node 3: Service */}
              <rect x="580" y="25" width="170" height="55" rx="8" fill="#13172b" stroke="#34d399" strokeWidth="1.5" />
              <text x="665" y="48" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Microservice / Storage</text>
              <text x="665" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9">Database / Event Log</text>
            </svg>
          </div>

          {/* Step Sequence Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
            {details.flowSteps.map((step, idx) => (
              <div key={idx} style={{ padding: '8px 12px', backgroundColor: '#090b14', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: details.color }}>Step {idx + 1}: {step.from} &rarr; {step.to}</span>
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#e2e8f0', margin: '4px 0 2px 0' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {step.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Concurrency Model & Production Gotcha Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
          <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              Concurrency &amp; Coordination Model
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {details.concurrencyModel}
            </p>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#0c0e17', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
              Senior Production Gotcha &amp; Failure Mode
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {details.productionGotcha}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
