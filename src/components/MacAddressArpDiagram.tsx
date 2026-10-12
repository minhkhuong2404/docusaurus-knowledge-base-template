import React, { useState } from 'react';

type MacTab = 'anatomy' | 'arp_flow' | 'garp_failover';

export default function MacAddressArpDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MacTab>('anatomy');
  const [isLocallyAdministered, setIsLocallyAdministered] = useState<boolean>(false);
  const [isMulticast, setIsMulticast] = useState<boolean>(false);
  const [arpStep, setArpStep] = useState<number>(1);
  const [primaryAlive, setPrimaryAlive] = useState<boolean>(true);

  // Compute first octet based on bits
  // Bit 0 (LSB of byte 1): Multicast/Broadcast (1) vs Unicast (0)
  // Bit 1: Locally Administered (1) vs Universally Unique (0)
  const baseHex = isLocallyAdministered
    ? (isMulticast ? '03' : '02')
    : (isMulticast ? '01' : '00');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(152, 162, 179, 0.25)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
            <path d="M12 10v4" />
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Layer 2 Engine: EUI-48 MAC Anatomy, ARP State Machine &amp; GARP Failover
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('anatomy')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'anatomy' ? '1px solid #10b981' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'anatomy' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'anatomy' ? '#15803d' : 'var(--ifm-color-content)'
            }}
          >
            EUI-48 Bit Anatomy
          </button>
          <button
            onClick={() => setActiveTab('arp_flow')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'arp_flow' ? '1px solid #38bdf8' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'arp_flow' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'arp_flow' ? '#0284c7' : 'var(--ifm-color-content)'
            }}
          >
            ARP Resolution Flow
          </button>
          <button
            onClick={() => setActiveTab('garp_failover')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'garp_failover' ? '1px solid #f59e0b' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'garp_failover' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'garp_failover' ? '#d97706' : 'var(--ifm-color-content)'
            }}
          >
            GARP &amp; VIP Failover
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: EUI-48 ANATOMY */}
        {activeTab === 'anatomy' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 600 }}>
                  48-Bit Hexadecimal MAC Representation
                </span>
                <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                  <span style={{ color: '#0ea5e9', borderBottom: '2px solid #0ea5e9' }}>{baseHex}:1A:2B</span>
                  <span style={{ color: '#94a3b8' }}> : </span>
                  <span style={{ color: '#10b981', borderBottom: '2px solid #10b981' }}>3C:4D:5E</span>
                </div>
              </div>

              {/* Visual Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0284c7' }}>Bits 0 - 23 (First 3 Octets)</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 600 }}>OUI Prefix</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
                    <strong>Organizationally Unique Identifier (OUI)</strong> assigned by IEEE to hardware vendors (Cisco, Apple, Intel, Broadcom).
                  </p>
                  <div style={{ marginTop: '8px', padding: '6px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '4px', fontSize: '10px' }}>
                    <div><strong>Octet 0 Bit 0 (I/G):</strong> {isMulticast ? '1 = Multicast / Group Address' : '0 = Individual (Unicast)'}</div>
                    <div><strong>Octet 0 Bit 1 (U/L):</strong> {isLocallyAdministered ? '1 = Locally Administered (Virtual/Container)' : '0 = Universally Administered (IEEE OEM)'}</div>
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#15803d' }}>Bits 24 - 47 (Last 3 Octets)</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#15803d', color: '#ffffff', fontWeight: 600 }}>NIC Specific</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
                    <strong>Network Interface Controller ID:</strong> Uniquely assigned by the manufacturer during silicon manufacturing (Burned-in Address / BIA).
                  </p>
                  <div style={{ marginTop: '8px', padding: '6px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '4px', fontSize: '10px' }}>
                    <div><strong>Broadcast MAC:</strong> <code style={{ color: '#b91c1c' }}>FF:FF:FF:FF:FF:FF</code> (All 48 bits set to 1)</div>
                    <div><strong>IPv4 Multicast MAC:</strong> <code style={{ color: '#6b21a8' }}>01:00:5E:xx:xx:xx</code> (RFC 1112)</div>
                  </div>
                </div>
              </div>

              {/* Bit Toggler Controls */}
              <div style={{ marginTop: '14px', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isLocallyAdministered}
                    onChange={(e) => setIsLocallyAdministered(e.target.checked)}
                  />
                  U/L Bit: Locally Administered (Docker / K8s veth / Cloud VM)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMulticast}
                    onChange={(e) => setIsMulticast(e.target.checked)}
                  />
                  I/G Bit: Multicast / Group Address
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARP PROTOCOL & CACHE */}
        {activeTab === 'arp_flow' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Step Animation:</span>
              <button
                onClick={() => setArpStep(1)}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #38bdf8', backgroundColor: arpStep === 1 ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                1. Broadcast Request
              </button>
              <button
                onClick={() => setArpStep(2)}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #10b981', backgroundColor: arpStep === 2 ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                2. Unicast Reply
              </button>
              <button
                onClick={() => setArpStep(3)}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #f59e0b', backgroundColor: arpStep === 3 ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                3. Kernel Cache State
              </button>
            </div>

            {/* SVG Diagram */}
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 200" width="100%" height="auto" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arp-req-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
                  </marker>
                  <marker id="arp-reply-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#15803d" />
                  </marker>
                </defs>

                {/* Host A */}
                <g transform="translate(30, 40)">
                  <rect width="180" height="90" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#0284c7" strokeWidth="2"/>
                  <text x="90" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Host A (Initiator)</text>
                  <text x="90" y="44" textAnchor="middle" fill="#334155" fontSize="10">IP: 192.168.1.10</text>
                  <text x="90" y="60" textAnchor="middle" fill="#64748b" fontSize="10">MAC: 00:AA:11:22:33:44</text>
                  <rect x="20" y="70" width="140" height="15" rx="3" fill="rgba(2, 132, 199, 0.1)"/>
                  <text x="90" y="81" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="600">ARP Cache: Empty</text>
                </g>

                {/* Layer 2 Switch */}
                <g transform="translate(320, 30)">
                  <rect width="160" height="110" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#64748b" strokeWidth="2"/>
                  <text x="80" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">L2 Switch</text>
                  <text x="80" y="42" textAnchor="middle" fill="#334155" fontSize="10">CAM Table (Port-MAC)</text>
                  <rect x="15" y="52" width="130" height="46" rx="4" fill="var(--ifm-background-color, #f2f4f7)" stroke="rgba(152, 162, 179, 0.3)"/>
                  <text x="25" y="68" fill="#334155" fontSize="9">Port 1: 00:AA:... (Learned)</text>
                  <text x="25" y="86" fill="#334155" fontSize="9">{arpStep >= 2 ? 'Port 2: 00:BB:... (Learned)' : 'Floods Broadcast!'}</text>
                </g>

                {/* Host B */}
                <g transform="translate(590, 40)">
                  <rect width="180" height="90" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#15803d" strokeWidth="2"/>
                  <text x="90" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Host B (Target)</text>
                  <text x="90" y="44" textAnchor="middle" fill="#334155" fontSize="10">IP: 192.168.1.20</text>
                  <text x="90" y="60" textAnchor="middle" fill="#64748b" fontSize="10">MAC: 00:BB:55:66:77:88</text>
                  <rect x="20" y="70" width="140" height="15" rx="3" fill="rgba(21, 128, 61, 0.1)"/>
                  <text x="90" y="81" textAnchor="middle" fill="#15803d" fontSize="9" fontWeight="600">{arpStep >= 2 ? 'Reply Sent' : 'Awaiting Request'}</text>
                </g>

                {/* Packet Flow Arrows */}
                {arpStep === 1 && (
                  <g>
                    <path d="M 216 75 L 314 75" fill="none" stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arp-req-arrow)" />
                    <text x="265" y="65" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="600">ARP Request (Who has .20?)</text>
                    <path d="M 486 75 L 584 75" fill="none" stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arp-req-arrow)" />
                    <text x="535" y="65" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="600">Flooded Broadcast (FF:FF:FF...)</text>
                  </g>
                )}

                {arpStep === 2 && (
                  <g>
                    <path d="M 584 95 L 486 95" fill="none" stroke="#15803d" strokeWidth="2.5" markerEnd="url(#arp-reply-arrow)" />
                    <text x="535" y="112" textAnchor="middle" fill="#15803d" fontSize="9" fontWeight="600">ARP Reply (.20 is at 00:BB...)</text>
                    <path d="M 314 95 L 216 95" fill="none" stroke="#15803d" strokeWidth="2.5" markerEnd="url(#arp-reply-arrow)" />
                    <text x="265" y="112" textAnchor="middle" fill="#15803d" fontSize="9" fontWeight="600">Unicast Direct to Port 1</text>
                  </g>
                )}

                {arpStep === 3 && (
                  <g>
                    <rect x="230" y="150" width="340" height="35" rx="6" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth="1.5"/>
                    <text x="400" y="172" textAnchor="middle" fill="#92400e" fontSize="11" fontWeight="700">
                      Linux ARP Cache Transition: REACHABLE (Timer ~30s) -&gt; STALE -&gt; DELAY
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Linux Kernel ARP State Machine Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>Linux Neighbor States (RFC 4861 / ip neigh)</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  <li><strong>INCOMPLETE:</strong> ARP request sent, awaiting reply.</li>
                  <li><strong>REACHABLE:</strong> Valid entry confirmed by reply; expires after <code>gc_stale_time</code> (~30s).</li>
                  <li><strong>STALE:</strong> Neighbor has not been confirmed recently; valid for sending without immediate blocking.</li>
                  <li><strong>DELAY / PROBE:</strong> Packet sent in STALE state triggers unicast probe to verify neighbor still exists.</li>
                  <li><strong>FAILED:</strong> No response received after max retries; packet dropped.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '6px' }}>ARP Poisoning &amp; DAI Security</div>
                <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
                  Because ARP is completely stateless and unauthenticated, an attacker can broadcast unsolicited ARP replies claiming <code>192.168.1.1 is at ATTACKER_MAC</code>.
                </p>
                <div style={{ fontSize: '10px', color: '#15803d', fontWeight: 600 }}>
                  <strong>Mitigation: Dynamic ARP Inspection (DAI)</strong> on managed switches validates ARP packets against the DHCP snooping binding table and drops rogue packets.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GARP & VIP FAILOVER */}
        {activeTab === 'garp_failover' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                  Keepalived / VRRP Virtual IP (192.168.1.1) Failover Simulation
                </span>
                <button
                  onClick={() => setPrimaryAlive(!primaryAlive)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    backgroundColor: primaryAlive ? '#fee2e2' : '#dcfce7',
                    border: primaryAlive ? '1px solid #f87171' : '1px solid #86efac',
                    color: primaryAlive ? '#991b1b' : '#166534'
                  }}
                >
                  {primaryAlive ? 'Simulate Primary Crash!' : 'Restore Primary Node'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Node A */}
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: primaryAlive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: primaryAlive ? '2px solid #10b981' : '2px dashed #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>Node A (Master)</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: primaryAlive ? '#166534' : '#991b1b', color: '#ffffff' }}>
                      {primaryAlive ? 'ONLINE / VIP HOLDER' : 'CRASHED / OFFLINE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginTop: '8px' }}>
                    <div>Physical MAC: <code>00:11:22:33:44:01</code></div>
                    <div>Virtual IP: {primaryAlive ? <strong style={{ color: '#166534' }}>192.168.1.1</strong> : <span style={{ color: '#94a3b8' }}>None</span>}</div>
                  </div>
                </div>

                {/* Node B */}
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: !primaryAlive ? 'rgba(245, 158, 11, 0.15)' : 'var(--ifm-background-color, #ffffff)', border: !primaryAlive ? '2px solid #f59e0b' : '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>Node B (Backup)</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: !primaryAlive ? '#d97706' : '#64748b', color: '#ffffff' }}>
                      {!primaryAlive ? 'PROMOTED TO MASTER' : 'STANDBY / LISTENING'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginTop: '8px' }}>
                    <div>Physical MAC: <code>00:11:22:33:44:02</code></div>
                    <div>Virtual IP: {!primaryAlive ? <strong style={{ color: '#d97706' }}>192.168.1.1 (Claimed via GARP!)</strong> : <span style={{ color: '#94a3b8' }}>Standby</span>}</div>
                  </div>
                </div>
              </div>

              {/* GARP Mechanics Explanation */}
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                <strong style={{ color: '#b45309' }}>Under the Hood: How GARP Heals Network CAM Tables in 1ms</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  When Node B detects missed VRRP heartbeats (after 3 lost advertisements), it assigns <code>192.168.1.1</code> to its NIC and transmits an unsolicited <strong>Gratuitous ARP</strong> packet where <code>Sender IP == Target IP == 192.168.1.1</code> and <code>Sender MAC == 00:11:22:33:44:02</code>. Upstream physical switches instantly update their CAM port maps, and gateway routers update their ARP tables without dropping ongoing TCP flows.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
