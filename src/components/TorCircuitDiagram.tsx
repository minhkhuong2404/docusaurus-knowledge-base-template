import React, { useState } from 'react';

type TorTab = 'circuit' | 'peeling' | 'hidden_services';

export default function TorCircuitDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TorTab>('circuit');
  const [peelStep, setPeelStep] = useState<number>(0); // 0: Client Pack, 1: Guard Peels, 2: Middle Peels, 3: Exit Delivers

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(152, 162, 179, 0.25)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Tor Engine: 3-Hop Circuit Telescoping, Cell Peeling &amp; V3 Onion Services
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('circuit')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'circuit' ? '1px solid #a78bfa' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'circuit' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
              color: activeTab === 'circuit' ? '#6b21a8' : 'var(--ifm-color-content)'
            }}
          >
            3-Hop Circuit Architecture
          </button>
          <button
            onClick={() => setActiveTab('peeling')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'peeling' ? '1px solid #38bdf8' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'peeling' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'peeling' ? '#0284c7' : 'var(--ifm-color-content)'
            }}
          >
            Onion Encryption Peeling
          </button>
          <button
            onClick={() => setActiveTab('hidden_services')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'hidden_services' ? '1px solid #10b981' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'hidden_services' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'hidden_services' ? '#15803d' : 'var(--ifm-color-content)'
            }}
          >
            V3 Onion (Rendezvous) Flow
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: 3-HOP CIRCUIT */}
        {activeTab === 'circuit' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '14px' }}>
              <svg viewBox="0 0 860 200" width="100%" height="auto" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="tor-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#8b5cf6" />
                  </marker>
                  <marker id="exit-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
                  </marker>
                </defs>

                {/* Tor Client */}
                <g transform="translate(10, 45)">
                  <rect width="140" height="95" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#0ea5e9" strokeWidth="2"/>
                  <text x="70" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Tor Client</text>
                  <text x="70" y="42" textAnchor="middle" fill="#64748b" fontSize="10">Local Proxy (:9050)</text>
                  <rect x="10" y="52" width="120" height="32" rx="4" fill="rgba(14, 165, 233, 0.1)"/>
                  <text x="70" y="66" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="600">Holds 3 Keys:</text>
                  <text x="70" y="78" textAnchor="middle" fill="#0284c7" fontSize="8" fontFamily="monospace">K_G, K_M, K_E</text>
                </g>

                {/* Arrow 1: TLS 1 */}
                <path d="M 154 90 L 206 90" fill="none" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#tor-arrow)" />

                {/* Guard Node */}
                <g transform="translate(210, 45)">
                  <rect width="140" height="95" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#8b5cf6" strokeWidth="2"/>
                  <text x="70" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Guard / Entry Relay</text>
                  <text x="70" y="42" textAnchor="middle" fill="#6b21a8" fontSize="10">Long-Term Pinned</text>
                  <rect x="10" y="52" width="120" height="32" rx="4" fill="rgba(139, 92, 246, 0.1)"/>
                  <text x="70" y="66" textAnchor="middle" fill="#4c1d95" fontSize="9">Knows: Client IP</text>
                  <text x="70" y="78" textAnchor="middle" fill="#4c1d95" fontSize="9">Blind To: Destination</text>
                </g>

                {/* Arrow 2: TLS 2 */}
                <path d="M 354 90 L 406 90" fill="none" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#tor-arrow)" />

                {/* Middle Node */}
                <g transform="translate(410, 45)">
                  <rect width="140" height="95" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#f59e0b" strokeWidth="2"/>
                  <text x="70" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Middle Relay</text>
                  <text x="70" y="42" textAnchor="middle" fill="#92400e" fontSize="10">Random Transit</text>
                  <rect x="10" y="52" width="120" height="32" rx="4" fill="rgba(245, 158, 11, 0.1)"/>
                  <text x="70" y="66" textAnchor="middle" fill="#78350f" fontSize="9">Sees: Guard &amp; Exit IP</text>
                  <text x="70" y="78" textAnchor="middle" fill="#78350f" fontSize="9">Blind To: Client &amp; Dest</text>
                </g>

                {/* Arrow 3: TLS 3 */}
                <path d="M 554 90 L 606 90" fill="none" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#tor-arrow)" />

                {/* Exit Node */}
                <g transform="translate(610, 45)">
                  <rect width="140" height="95" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#ef4444" strokeWidth="2"/>
                  <text x="70" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Exit Relay</text>
                  <text x="70" y="42" textAnchor="middle" fill="#b91c1c" fontSize="10">Egress Gateway</text>
                  <rect x="10" y="52" width="120" height="32" rx="4" fill="rgba(239, 68, 68, 0.1)"/>
                  <text x="70" y="66" textAnchor="middle" fill="#7f1d1d" fontSize="9">Knows: Destination</text>
                  <text x="70" y="78" textAnchor="middle" fill="#7f1d1d" fontSize="9">Blind To: Client IP</text>
                </g>

                {/* Arrow 4: Egress to Target */}
                <path d="M 754 90 L 786 90" fill="none" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#exit-arrow)" />

                {/* Web Target */}
                <g transform="translate(790, 55)">
                  <circle cx="35" cy="35" r="30" fill="var(--ifm-background-color, #ffffff)" stroke="#10b981" strokeWidth="2"/>
                  <text x="35" y="32" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10" fontWeight="700">Target</text>
                  <text x="35" y="46" textAnchor="middle" fill="#15803d" fontSize="9">Web Server</text>
                </g>
              </svg>
            </div>

            {/* Architectural Security Properties */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#6b21a8', marginBottom: '4px' }}>Guard Pinning (Anti-Sybil)</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
                  The client keeps 1-3 fixed entry guards for 60-120 days. Rotating guards on every connection would guarantee eventually hitting an attacker-controlled entry node, compromising anonymity.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#0284c7', marginBottom: '4px' }}>Fixed 514-Byte Cells</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
                  All Tor traffic is split into uniform 514-byte cells (3B CircID + 1B Command + 510B Payload). Variable payload padding prevents passive wire eavesdroppers from deducing packet contents by size.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#b91c1c', marginBottom: '4px' }}>Exit Node Snooping Hazard</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
                  The Exit Node strips the final onion layer. For unencrypted HTTP, the exit relay can read/alter passwords and session cookies! End-to-end HTTPS is still mandatory inside Tor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STEP-BY-STEP ONION PEELING */}
        {activeTab === 'peeling' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Simulation Step:</span>
              <button
                onClick={() => setPeelStep(0)}
                style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', border: '1px solid #8b5cf6', backgroundColor: peelStep === 0 ? 'rgba(139, 92, 246, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                0. Client (3 Layers)
              </button>
              <button
                onClick={() => setPeelStep(1)}
                style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', border: '1px solid #38bdf8', backgroundColor: peelStep === 1 ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                1. Guard Peels K_G
              </button>
              <button
                onClick={() => setPeelStep(2)}
                style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', border: '1px solid #f59e0b', backgroundColor: peelStep === 2 ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                2. Middle Peels K_M
              </button>
              <button
                onClick={() => setPeelStep(3)}
                style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', border: '1px solid #10b981', backgroundColor: peelStep === 3 ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                3. Exit Peels K_E &amp; Egresses
              </button>
            </div>

            {/* Visual Nested Boxes */}
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '18px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '14px' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Layer 1: Guard Layer */}
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: peelStep >= 1 ? '2px dashed #94a3b8' : '2px solid #8b5cf6',
                  backgroundColor: peelStep >= 1 ? 'transparent' : 'rgba(139, 92, 246, 0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: peelStep >= 1 ? '#94a3b8' : '#6b21a8' }}>
                    <span>Layer 1: Encrypted with Guard Key (K_Guard)</span>
                    <span>{peelStep >= 1 ? '[PEELED OFF BY GUARD]' : '[ACTIVE ON WIRE]'}</span>
                  </div>

                  {/* Layer 2: Middle Layer */}
                  <div style={{
                    marginTop: '10px',
                    padding: '14px',
                    borderRadius: '8px',
                    border: peelStep >= 2 ? '2px dashed #94a3b8' : '2px solid #0ea5e9',
                    backgroundColor: peelStep >= 2 ? 'transparent' : 'rgba(14, 165, 233, 0.1)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: peelStep >= 2 ? '#94a3b8' : '#0284c7' }}>
                      <span>Layer 2: Encrypted with Middle Key (K_Middle)</span>
                      <span>{peelStep >= 2 ? '[PEELED OFF BY MIDDLE]' : (peelStep >= 1 ? '[ACTIVE ON WIRE]' : '[NESTED]')}</span>
                    </div>

                    {/* Layer 3: Exit Layer */}
                    <div style={{
                      marginTop: '10px',
                      padding: '14px',
                      borderRadius: '6px',
                      border: peelStep >= 3 ? '2px dashed #94a3b8' : '2px solid #ef4444',
                      backgroundColor: peelStep >= 3 ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: peelStep >= 3 ? '#94a3b8' : '#b91c1c' }}>
                        <span>Layer 3: Encrypted with Exit Key (K_Exit)</span>
                        <span>{peelStep >= 3 ? '[PEELED OFF BY EXIT]' : (peelStep >= 2 ? '[ACTIVE ON WIRE]' : '[NESTED]')}</span>
                      </div>

                      {/* Innermost Payload */}
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        borderRadius: '4px',
                        backgroundColor: peelStep >= 3 ? 'rgba(16, 185, 129, 0.15)' : 'var(--ifm-background-color, #ffffff)',
                        border: '1px solid #10b981',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
                          Core Payload: <code>GET /index.html HTTP/1.1 (Target: duckduckgo.com:443)</code>
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          {peelStep >= 3 ? 'Plaintext exposed to Exit Relay (or TLS encrypted if HTTPS)' : 'Invisible to Guard and Middle Relays'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px', fontSize: '11px', lineHeight: 1.5, color: 'var(--ifm-color-content)' }}>
              <strong>Telescoping Cryptography Principle:</strong> The client executes a Diffie-Hellman handshake (Curve25519) with the Guard using <code>CREATE2</code>. Then it uses the existing encrypted channel through the Guard to send a <code>RELAY_EXTEND2</code> cell to the Middle node, establishing a second independent secret. It repeats this with the Exit node. When transmitting, the client encrypts the payload three times backwards: <code>E(K_Guard, E(K_Middle, E(K_Exit, payload)))</code>.
            </div>
          </div>
        )}

        {/* TAB 3: HIDDEN SERVICES V3 */}
        {activeTab === 'hidden_services' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', marginBottom: '8px' }}>
                Onion Services V3: 6-Hop Rendezvous Architecture
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                In a standard Tor session to a public site, the Exit Node knows the target IP address. With <strong>Onion Services (.onion)</strong>, neither the client nor the server ever learns each other's IP address. They meet at a designated middleman called a <strong>Rendezvous Point</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>Step 1: Introduction Points &amp; Descriptor</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px', lineHeight: 1.4 }}>
                    The service selects several random relays as Introduction Points and publishes a signed descriptor to the distributed hash table (HSDir) containing its Ed25519 public key.
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b21a8' }}>Step 2: Rendezvous Point &amp; One-Time Secret</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px', lineHeight: 1.4 }}>
                    The client builds a 3-hop circuit to a random relay (Rendezvous Point) and gives it a one-time secret cookie. Then, via an Introduction Point, it invites the service to connect to that Rendezvous Point.
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}>Step 3: Service Connects (6-Hop Circuit)</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px', lineHeight: 1.4 }}>
                    The hidden service builds its own 3-hop circuit to the Rendezvous Point and presents the cookie. The Rendezvous Point joins the two circuits end-to-end. Total hops: <strong>3 + 3 = 6 hops</strong>!
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>Step 4: End-to-End Cryptography</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px', lineHeight: 1.4 }}>
                    Client and service perform Diffie-Hellman through the rendezvous bridge. Traffic is encrypted end-to-end. Even the Rendezvous Point cannot read the payload!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
