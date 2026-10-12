import React, { useState } from 'react';

interface IdempotencyScenario {
  id: string;
  name: string;
  color: string;
  httpStatus: string;
  responseDesc: string;
  flowStep: number;
  explanation: string;
  details: string[];
}

const IDEMPOTENCY_SCENARIOS: IdempotencyScenario[] = [
  {
    id: 'first_attempt',
    name: '1. First-Time Request (Happy Path)',
    color: '#34d399',
    httpStatus: '201 Created',
    responseDesc: 'Payment accepted, funds reserved, ledger posted, result persisted.',
    flowStep: 4,
    explanation: 'Client provides a new Idempotency-Key. The Gateway hashes the canonical payload, acquires a distributed lock in Redis, writes a PENDING state record, executes the core ledger debit, marks the key COMPLETED, and returns the response.',
    details: [
      'Edge Gateway computes SHA-256 fingerprint of canonical JSON payload',
      'Redis executes atomic SETNX pmt:key {hash, PENDING} EX 86400',
      'Core Engine debit executed inside DB transaction with serializable/row lock',
      'Idempotency store commits HTTP 201 + response payload with 7-day TTL'
    ]
  },
  {
    id: 'inflight_duplicate',
    name: '2. Concurrent In-Flight Retry (Race Condition)',
    color: '#fbbf24',
    httpStatus: '409 Conflict / 425 Too Early',
    responseDesc: 'Request already in progress. Client instructed to back off and poll.',
    flowStep: 2,
    explanation: 'A network timeout caused the client to retry while request 1 is still being processed by the core ledger. The Gateway sees the key exists with status PENDING. To prevent concurrent double-spend, it rejects the second request or instructs client to retry after 2 seconds.',
    details: [
      'Redis lock acquisition fails (SETNX returns 0)',
      'Gateway checks status of existing record: status == PENDING_EXECUTION',
      'Gateway sends 409 Conflict with Retry-After: 3s header',
      'Zero downstream load placed on Core Banking System ledger'
    ]
  },
  {
    id: 'completed_duplicate',
    name: '3. Duplicate Completed Request (Safe Replay)',
    color: '#38bdf8',
    httpStatus: '200 OK (Cached Original Result)',
    responseDesc: 'Original response served from cache without touching Core Banking.',
    flowStep: 2,
    explanation: 'Client never received the original 201 response due to a client-side network disconnect. Client resends the exact same request with the same Idempotency-Key. The server detects identical hash and status COMPLETED, immediately returning the stored response.',
    details: [
      'Edge Gateway calculates payload hash — matches stored fingerprint exactly',
      'Record lookup returns COMPLETED with stored HTTP 201 response body',
      'Gateway returns cached response with header X-Cache-Lookup: HIT-IDEMPOTENT',
      'Client obtains transaction confirmation; no duplicate debit occurs'
    ]
  },
  {
    id: 'tampered_payload',
    name: '4. Key Reused with Mutated Payload (Tamper Attack)',
    color: '#f87171',
    httpStatus: '409 Conflict (Payload Mismatch)',
    responseDesc: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD error.',
    flowStep: 1,
    explanation: 'Client reuses the same Idempotency-Key but changes the amount or creditor account. The calculated SHA-256 payload fingerprint differs from the stored record. The system halts immediately to prevent key-hijacking or state corruption.',
    details: [
      'Incoming hash SHA256(req_body) != stored_fingerprint',
      'Gateway immediately aborts processing without acquiring lock',
      'Returns RFC 7807 Problem Details: 409 Conflict with errorCode IDEMPOTENCY_MISMATCH',
      'Security event emitted to SIEM for potential API abuse / replay tampering'
    ]
  }
];

interface ResilienceScenario {
  id: string;
  name: string;
  color: string;
  pattern: string;
  solution: string;
  steps: string[];
}

const RESILIENCE_SCENARIOS: ResilienceScenario[] = [
  {
    id: 'outbox',
    name: '1. Preventing Lost Payment (Transactional Outbox)',
    color: '#34d399',
    pattern: 'Transactional Outbox + Debezium CDC',
    solution: 'Eliminates dual-write divergence between Postgres Ledger and Kafka broker.',
    steps: [
      'Client triggers payment. Core Engine opens Postgres ACID transaction.',
      'Step 1: Ledger entry inserted (Debit Payer, Credit Settlement Escrow).',
      'Step 2: Payment event inserted into outbox_events table in same atomic transaction.',
      'Transaction commits atomically: Either BOTH write to disk WAL, or NEITHER does.',
      'Debezium reads Postgres WAL (CDC) and streams event to Kafka payment-dispatch topic with acks=all.',
      'Scheme worker consumes Kafka event and forwards to payment clearing rail (NPP/SWIFT).'
    ]
  },
  {
    id: 'reverse_inquiry',
    name: '2. In-Flight Downstream Timeout (Reverse Inquiry)',
    color: '#fbbf24',
    pattern: 'Active Polling & In-Flight Status Query',
    solution: 'Never fail or retry blind when downstream times out; query scheme truth.',
    steps: [
      'Bank dispatches pacs.008 to scheme rail (e.g. NPP Fast Settlement).',
      'Network socket times out after 15s. Bank does NOT know if scheme processed it.',
      'DANGER: Do NOT cancel immediately and do NOT retry blind (double payment risk!).',
      'Bank transitions payment status to PENDING_INVESTIGATION with lock.',
      'Reverse Inquiry Poller queries Scheme Status API (pacs.002 query or SWIFT gpi tracker) with UETR.',
      'If scheme processed: reconcile as COMPLETED. If scheme unknown after TTL: issue camt.056 recall.'
    ]
  },
  {
    id: 'three_way_rec',
    name: '3. 3-Way Reconciliation & Self-Healing',
    color: '#38bdf8',
    pattern: 'Intraday Stream + T+1 EOD 3-Way Matching Engine',
    solution: 'Detects orphaned holds, dropped callbacks, and rail settlement discrepancies.',
    steps: [
      'Dataset A: Bank Internal Core Ledger (Double-entry debits/credits).',
      'Dataset B: Payment Gateway & Rail Dispatch Logs (Outbox & Kafka offsets).',
      'Dataset C: External Clearing Statement (Central Bank RITS/FedNow camt.053).',
      'Matching Engine performs 3-way join on (EndToEndId, UETR, Amount, ValueDate).',
      'Self-Healing: Orphaned fund holds (>2h with no rail dispatch) automatically released.',
      'Discrepancies automatically routed to exception queue with automated pacs.004 return.'
    ]
  }
];

interface SecurityControl {
  id: string;
  name: string;
  layer: 'client' | 'internal';
  color: string;
  badge: string;
  rfc: string;
  description: string;
  mitigation: string;
  codeSnippet: string;
}

const SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: 'mtls',
    name: 'Mutual TLS (mTLS) with X.509 Certificates',
    layer: 'client',
    color: '#38bdf8',
    badge: 'TRANSPORT LAYER',
    rfc: 'RFC 8705 / TLS 1.3',
    description: 'Enforces bidirectional cryptographic handshake. Both client and API gateway present and verify X.509 PKI certificates signed by a trusted banking CA.',
    mitigation: 'Prevents Man-in-the-Middle (MitM) eavesdropping, DNS spoofing, and unauthorized network ingress.',
    codeSnippet: 'SSLContext sslContext = SSLContextBuilder.create()\n  .loadKeyMaterial(clientCertKeyStore, password)\n  .loadTrustMaterial(bankCaTrustStore)\n  .build();'
  },
  {
    id: 'http_signatures',
    name: 'RFC 9421 HTTP Message Signatures',
    layer: 'client',
    color: '#34d399',
    badge: 'REQUEST INTEGRITY',
    rfc: 'RFC 9421 / RFC 7638',
    description: 'Client cryptographically signs HTTP request headers, method, path, and payload digest using RSA-PSS or Ed25519 private key. Gateway verifies against client public key.',
    mitigation: 'Guarantees non-repudiation and detects any parameter tampering (e.g. altering beneficiary account or amount in transit).',
    codeSnippet: 'Signature: sig1=("@method" "@path" "content-digest" "date");\n  keyId="client-key-2026";alg="rsa-pss-sha512";\n  signature="mQENBF..."'
  },
  {
    id: 'nonce_replay',
    name: 'Timestamp & Nonce Anti-Replay Window',
    layer: 'client',
    color: '#fbbf24',
    badge: 'ANTI-REPLAY',
    rfc: 'NIST SP 800-63B',
    description: 'Every request includes a high-entropy Nonce (UUIDv4) and an ISO 8601 Timestamp. Gateway validates |t_req - t_now| <= 300s and checks Redis for duplicate nonce.',
    mitigation: 'Thwarts replay attacks where an attacker captures an authenticated packet and re-transmits it to double charge.',
    codeSnippet: 'boolean isFresh = Math.abs(reqTimestamp - System.currentTimeMillis()) <= 300_000;\nboolean unseen = redis.set("nonce:" + nonce, "1", "NX", "EX", 300);'
  },
  {
    id: 'dpop_tokens',
    name: 'DPoP: Demonstrating Proof-of-Possession',
    layer: 'client',
    color: '#a78bfa',
    badge: 'TOKEN SECURITY',
    rfc: 'RFC 9449 / OAuth 2.0',
    description: 'Binds OAuth 2.0 access tokens cryptographically to the client private key. Bearer tokens alone cannot be exploited if leaked or exfiltrated.',
    mitigation: 'Prevents token theft and cross-site request hijacking via stolen bearer tokens.',
    codeSnippet: 'DPoP: eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0Ii... (JWT signed by client ephemeral key matching thumbprint in token)'
  },
  {
    id: 'spiffe_mesh',
    name: 'Zero Trust Service Mesh (SPIFFE/SPIRE)',
    layer: 'internal',
    color: '#38bdf8',
    badge: 'INTERNAL ZERO-TRUST',
    rfc: 'CNCF SPIFFE / Istio',
    description: 'Every internal microservice possesses a cryptographically verifiable SPIFFE ID (e.g. spiffe://bank.internal/ns/payments/sa/ledger-svc) with automated short-lived X.509 rotation.',
    mitigation: 'Eliminates implicit network trust behind the firewall; prevents lateral movement if an edge pod is compromised.',
    codeSnippet: 'spiffe://core.bank/ns/payments/sa/payment-orchestrator\n-> mTLS verify peer SAN identity against SPIFFE trust bundle'
  },
  {
    id: 'pci_hsm',
    name: 'PCI-HSM Hardware Security Modules',
    layer: 'internal',
    color: '#34d399',
    badge: 'HARDWARE CRYPTOGRAPHY',
    rfc: 'FIPS 140-2 Level 3/4',
    description: 'Dedicated tamper-responsive cryptographic hardware handles PIN translation (DUKPT), CVV calculation, and master key wrapping. Keys NEVER enter general CPU RAM.',
    mitigation: 'Prevents memory scraping attacks, cold-boot exploits, and privileged root database admin key extraction.',
    codeSnippet: 'hsmClient.translatePinBlock(inboundDukptPin, outboundZpkPin, pan);\n// Keys remain in secure cryptographic enclave boundary'
  },
  {
    id: 'token_vault',
    name: 'PCI-DSS Tokenization Vault',
    layer: 'internal',
    color: '#fbbf24',
    badge: 'DATA PROTECTION',
    rfc: 'PCI-DSS v4.0 Scope Isolation',
    description: 'Raw PANs and bank account numbers are intercepted at network boundary and replaced with format-preserving surrogate tokens. Plaintext vault is strictly isolated in private VPC.',
    mitigation: 'Drastically reduces PCI audit scope and ensures data at rest exfiltration yields only useless surrogate tokens.',
    codeSnippet: 'String surrogateToken = tokenVaultService.tokenize(rawPan, Format.LUHN_VALID);\n// Core ledger stores only: 4111-XXXX-XXXX-1111 + token UUID'
  },
  {
    id: 'maker_checker',
    name: 'Maker-Checker Dual Control & WORM Audit',
    layer: 'internal',
    color: '#f87171',
    badge: 'GOVERNANCE & FRAUD',
    rfc: 'Four-Eyes Principle / SEC 17a-4',
    description: 'High-value payments (> $100k) or manual ledger overrides require two distinct cryptographic signatures (Maker initiates, Checker approves with hardware FIDO2 token).',
    mitigation: 'Prevents rogue employee fraud, unauthorized high-value embezzlement, and unilateral ledger manipulation.',
    codeSnippet: 'payment.assertDualControl(makerId, checkerId, makerSignature, checkerSignature);\nwormStorage.appendAuditRecord(payment.toCryptographicHashChain());'
  }
];

export default function BankingPaymentResilienceSecurityDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'idempotency' | 'resilience' | 'security'>('idempotency');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('first_attempt');
  const [selectedResilienceId, setSelectedResilienceId] = useState<string>('outbox');
  const [selectedControlId, setSelectedControlId] = useState<string>('mtls');

  const currentScenario = IDEMPOTENCY_SCENARIOS.find(s => s.id === selectedScenarioId) || IDEMPOTENCY_SCENARIOS[0];
  const currentResilience = RESILIENCE_SCENARIOS.find(r => r.id === selectedResilienceId) || RESILIENCE_SCENARIOS[0];
  const currentControl = SECURITY_CONTROLS.find(c => c.id === selectedControlId) || SECURITY_CONTROLS[0];

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        backgroundColor: '#090b14',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '0',
        overflow: 'hidden',
        color: '#ffffff',
        marginBottom: '24px'
      }}
    >
      <style>{`
        @keyframes flowingDash {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .anim-flowing-path {
          stroke-dasharray: 6 4;
          animation: flowingDash 1.2s linear infinite;
        }
        @media (max-width: 768px) {
          .resilience-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0b0f19'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <path d="M7 15h.01M11 15h2" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em' }}>
            Payment Processing Resilience, Idempotency & Security Architecture
          </span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>
            Enterprise Banking Standards: Multi-Tier Deduplication, Zero-Data-Loss Outbox, Reverse Inquiry & Cryptographic Security
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: '18px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'idempotency', label: '⚡ Idempotency & Deduplication Engine', color: '#38bdf8' },
            { id: 'resilience', label: '🔄 Retries & Zero-Lost-Payment Pipeline', color: '#34d399' },
            { id: 'security', label: '🛡️ End-to-End Payment Security (Client & Internal)', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}25` : 'rgba(255,255,255,0.03)',
                color: activeTab === t.id ? t.color : '#94a3b8',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: IDEMPOTENCY & DEDUPLICATION ================= */}
        {activeTab === 'idempotency' && (
          <div>
            {/* Scenario Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {IDEMPOTENCY_SCENARIOS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenarioId(s.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: selectedScenarioId === s.id ? `${s.color}25` : 'rgba(255,255,255,0.04)',
                    color: selectedScenarioId === s.id ? s.color : '#94a3b8',
                    boxShadow: selectedScenarioId === s.id ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)'
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Split View: SVG Architecture + Detail Inspector */}
            <div className="resilience-split-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
              {/* Left Column: Visual Telemetry Flow */}
              <div
                style={{
                  backgroundColor: '#0d0f1e',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
                    MULTI-TIER IDEMPOTENCY TELEMETRY PIPELINE
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${currentScenario.color}20`, color: currentScenario.color, fontWeight: 700, border: `1px solid ${currentScenario.color}50` }}>
                    {currentScenario.httpStatus}
                  </span>
                </div>

                <svg viewBox="0 0 620 280" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <defs>
                    <pattern id="dot-grid-resilience" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.25" />
                    </pattern>
                    <marker id="arrow-mint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                    </marker>
                    <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                    </marker>
                    <marker id="arrow-crimson" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                    </marker>
                    <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                  </defs>

                  <rect width="620" height="280" fill="url(#dot-grid-resilience)" rx="8" />

                  {/* Nodes */}
                  {/* Node 1: Client Ingress */}
                  <g transform="translate(10, 30)">
                    <rect width="120" height="64" rx="6" fill="#1e293b" stroke={currentScenario.flowStep >= 1 ? '#38bdf8' : '#475569'} strokeWidth="1.5" />
                    <text x="60" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Client Ingress</text>
                    <text x="60" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">POST /payments</text>
                    <text x="60" y="54" textAnchor="middle" fill="#38bdf8" fontSize="8">Idempotency-Key</text>
                  </g>

                  {/* Node 2: API Gateway Fingerprint */}
                  <g transform="translate(170, 30)">
                    <rect width="130" height="64" rx="6" fill="#1e293b" stroke={currentScenario.flowStep >= 1 ? currentScenario.color : '#475569'} strokeWidth="1.5" />
                    <text x="65" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">API Gateway Filter</text>
                    <text x="65" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">Payload SHA-256</text>
                    <text x="65" y="54" textAnchor="middle" fill={selectedScenarioId === 'tampered_payload' ? '#f87171' : '#34d399'} fontSize="8">
                      {selectedScenarioId === 'tampered_payload' ? 'Hash Mismatch (409)' : 'Fingerprint Matched'}
                    </text>
                  </g>

                  {/* Node 3: Redis Distributed Lock & Cache */}
                  <g transform="translate(340, 30)">
                    <rect width="130" height="64" rx="6" fill="#1e293b" stroke={currentScenario.flowStep >= 2 ? currentScenario.color : '#475569'} strokeWidth="1.5" />
                    <text x="65" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Redis State Lock</text>
                    <text x="65" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">SETNX key status EX</text>
                    <text x="65" y="54" textAnchor="middle" fill={currentScenario.color} fontSize="8">
                      {selectedScenarioId === 'first_attempt' ? 'Lock Acquired (OK)' : selectedScenarioId === 'inflight_duplicate' ? 'Lock Busy (PENDING)' : 'Cache HIT (COMPLETED)'}
                    </text>
                  </g>

                  {/* Node 4: Core Banking Ledger */}
                  <g transform="translate(500, 30)">
                    <rect width="110" height="64" rx="6" fill="#1e293b" stroke={currentScenario.flowStep >= 3 ? '#34d399' : '#475569'} strokeWidth="1.5" />
                    <text x="55" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Core Ledger DB</text>
                    <text x="55" y="42" textAnchor="middle" fill="#94a3b8" fontSize="9">ACID Double-Entry</text>
                    <text x="55" y="54" textAnchor="middle" fill="#34d399" fontSize="8">UNIQUE(key, acct)</text>
                  </g>

                  {/* Connecting Flow Paths */}
                  {/* Client -> Gateway */}
                  <path
                    d="M 130 62 L 164 62"
                    fill="none"
                    stroke={currentScenario.flowStep >= 1 ? '#38bdf8' : '#334155'}
                    strokeWidth="2"
                    className={currentScenario.flowStep >= 1 ? 'anim-flowing-path' : ''}
                    markerEnd="url(#arrow-cyan)"
                  />

                  {/* Gateway -> Redis */}
                  {selectedScenarioId !== 'tampered_payload' ? (
                    <path
                      d="M 300 62 L 334 62"
                      fill="none"
                      stroke={currentScenario.flowStep >= 2 ? currentScenario.color : '#334155'}
                      strokeWidth="2"
                      className={currentScenario.flowStep >= 2 ? 'anim-flowing-path' : ''}
                      markerEnd={`url(#arrow-${currentScenario.color === '#34d399' ? 'mint' : currentScenario.color === '#fbbf24' ? 'amber' : 'cyan'})`}
                    />
                  ) : (
                    <path
                      d="M 235 94 L 235 150 L 100 150 L 100 96"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="2"
                      className="anim-flowing-path"
                      markerEnd="url(#arrow-crimson)"
                    />
                  )}

                  {/* Redis -> Core Ledger (Happy Path only) */}
                  {selectedScenarioId === 'first_attempt' && (
                    <path
                      d="M 470 62 L 494 62"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      className="anim-flowing-path"
                      markerEnd="url(#arrow-mint)"
                    />
                  )}

                  {/* Return Path from Cache / Conflict */}
                  {(selectedScenarioId === 'completed_duplicate' || selectedScenarioId === 'inflight_duplicate') && (
                    <path
                      d="M 405 94 L 405 160 L 70 160 L 70 96"
                      fill="none"
                      stroke={currentScenario.color}
                      strokeWidth="2"
                      className="anim-flowing-path"
                      markerEnd={`url(#arrow-${currentScenario.color === '#38bdf8' ? 'cyan' : 'amber'})`}
                    />
                  )}

                  {/* Lower Legend Box */}
                  <g transform="translate(15, 195)">
                    <rect width="590" height="70" rx="6" fill="#090b14" stroke="#1e293b" />
                    <text x="14" y="22" fill="#38bdf8" fontSize="10" fontWeight="700">EXECUTION STATUS & VERDICT:</text>
                    <text x="14" y="42" fill="#ffffff" fontSize="11">{currentScenario.responseDesc}</text>
                    <text x="14" y="58" fill="#94a3b8" fontSize="9">
                      {selectedScenarioId === 'first_attempt' ? 'Execution State: PENDING -> EXECUTING -> COMMITTED. Core DB write verified.' :
                       selectedScenarioId === 'inflight_duplicate' ? 'Zero duplicate debits. Concurrent race protected via distributed atomic lock.' :
                       selectedScenarioId === 'completed_duplicate' ? 'Zero ledger execution. Result fetched from durable Redis idempotency store in 1.4ms.' :
                       'Tamper attempt blocked at edge. Payload hash mismatch strictly prevents key-reuse hijacking.'}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Right Column: Architectural Mechanics & Rules */}
              <div
                style={{
                  backgroundColor: '#0c0e17',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: currentScenario.color, textTransform: 'uppercase' }}>
                    SCENARIO ARCHITECTURAL BREAKDOWN
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    {currentScenario.name}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {currentScenario.explanation}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                    SAFETY GUARDS & ATOMIC CHECKS:
                  </span>
                  {currentScenario.details.map((detail, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '11px',
                        color: '#cbd5e1',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        borderLeft: `2px solid ${currentScenario.color}`
                      }}
                    >
                      <span style={{ color: currentScenario.color, fontWeight: 800 }}>•</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: RETRIES & PREVENTING LOST PAYMENTS ================= */}
        {activeTab === 'resilience' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {RESILIENCE_SCENARIOS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResilienceId(r.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: selectedResilienceId === r.id ? `${r.color}25` : 'rgba(255,255,255,0.04)',
                    color: selectedResilienceId === r.id ? r.color : '#94a3b8',
                    boxShadow: selectedResilienceId === r.id ? `0 0 0 1.5px ${r.color}` : '0 0 0 1px rgba(255,255,255,0.08)'
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <div className="resilience-split-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
              {/* Left Column: Visual Pattern Flow */}
              <div
                style={{
                  backgroundColor: '#0d0f1e',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: currentResilience.color, letterSpacing: '0.05em' }}>
                    {currentResilience.pattern}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Zero-Data-Loss Architecture</span>
                </div>

                <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>
                  {currentResilience.solution}
                </div>

                {/* Stepper Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentResilience.steps.map((st, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: `${currentResilience.color}25`,
                          color: currentResilience.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Error Taxonomy & Truncated Jittered Backoff */}
              <div
                style={{
                  backgroundColor: '#0c0e17',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
                    PRODUCTION RETRY DECISION MATRIX
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    Retriable vs Non-Retriable Classification
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '2px' }}>
                      ✅ RETRIABLE (Transient Exceptions)
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      • HTTP 502 / 503 / 504 Gateway Timeouts<br />
                      • OptimisticLockingFailureException / DB Deadlock<br />
                      • HikariCP Connection Pool Exhaustion<br />
                      • Downstream rail maintenance window (NPP / SWIFT)
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '2px' }}>
                      ❌ NON-RETRIABLE / FATAL (Do NOT Retry)
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      • HTTP 400 Bad Request / Schema Validation Failed<br />
                      • HTTP 422 Insufficient Available Balance<br />
                      • Account Closed / Frozen / Invalid BSB or BIC<br />
                      • Sanctions Hit (OFAC / UN Match) or AML Block
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>
                    FULL JITTER EXPONENTIAL BACKOFF FORMULA:
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', background: '#070913', padding: '8px', borderRadius: '6px', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                    t_sleep = random(0, min(T_max, T_base * 2^attempt))<br />
                    // Prevents thundering herds on Core Banking System!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: END-TO-END SECURITY ARCHITECTURE ================= */}
        {activeTab === 'security' && (
          <div>
            {/* Control Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {SECURITY_CONTROLS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedControlId(c.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: selectedControlId === c.id ? `${c.color}25` : 'rgba(255,255,255,0.04)',
                    color: selectedControlId === c.id ? c.color : '#94a3b8',
                    boxShadow: selectedControlId === c.id ? `0 0 0 1.5px ${c.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: c.layer === 'client' ? '#38bdf820' : '#a78bfa20', color: c.layer === 'client' ? '#38bdf8' : '#a78bfa' }}>
                    {c.layer === 'client' ? 'CLIENT' : 'INTERNAL'}
                  </span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            {/* Split View: Security Architecture Card & Code Inspector */}
            <div className="resilience-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
              {/* Left Column: Security Control Detail */}
              <div
                style={{
                  backgroundColor: '#0d0f1e',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: currentControl.color, letterSpacing: '0.05em' }}>
                    {currentControl.badge} • {currentControl.rfc}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: currentControl.layer === 'client' ? 'rgba(56,189,248,0.15)' : 'rgba(167,139,250,0.15)', color: currentControl.layer === 'client' ? '#38bdf8' : '#a78bfa', fontWeight: 700 }}>
                    {currentControl.layer === 'client' ? 'EXTERNAL INGRESS BOUNDARY' : 'INTERNAL CORE & VAULT BOUNDARY'}
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                  {currentControl.name}
                </div>

                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {currentControl.description}
                </div>

                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${currentControl.color}` }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: currentControl.color, marginBottom: '2px' }}>
                    SECURITY THREAT MITIGATION:
                  </div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0' }}>
                    {currentControl.mitigation}
                  </div>
                </div>
              </div>

              {/* Right Column: Code & Implementation Artifact */}
              <div
                style={{
                  backgroundColor: '#0c0e17',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                    PRODUCTION IMPLEMENTATION CODE / SPEC
                  </span>
                  <span style={{ fontSize: '10px', color: currentControl.color, fontFamily: 'monospace' }}>
                    Java 21 / Spring / RFC Wire Protocol
                  </span>
                </div>

                <pre
                  style={{
                    backgroundColor: '#070913',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    lineHeight: 1.4,
                    overflowX: 'auto',
                    margin: 0
                  }}
                >
                  {currentControl.codeSnippet}
                </pre>

                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
                  Audited against PCI-DSS v4.0 (Requirement 3: Protect Cardholder Data) and APRA CPS 234 Information Security.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
