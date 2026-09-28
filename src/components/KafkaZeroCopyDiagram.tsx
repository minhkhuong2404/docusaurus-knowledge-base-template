import React, { useState, useEffect } from 'react';

type IoMode = 'traditional' | 'zerocopy' | 'ktls';

export default function KafkaZeroCopyDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<IoMode>('zerocopy');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const modeData = {
    traditional: {
      title: 'Standard Java I/O (read() + write())',
      copies: 4,
      contextSwitches: 4,
      cpuLoad: 'High (CPU Memory Copy)',
      heapAlloc: 'Double buffering in JVM heap',
      desc: 'Requires 4 data copies and 4 user/kernel context switches. Data moves from Disk into OS Page Cache, gets copied across the kernel boundary into JVM Heap memory, copied back into Kernel Socket Buffer, and finally to NIC hardware.',
      steps: [
        { label: '1. read() Syscall', detail: 'Application makes read() syscall. CPU switches from User Mode to Kernel Mode (Context Switch 1).' },
        { label: '2. DMA Read to Page Cache', detail: 'DMA engine reads file bytes from NVMe/SSD Disk into Kernel OS Page Cache (Copy 1: DMA).' },
        { label: '3. Kernel to User Space Copy', detail: 'CPU copies data from OS Page Cache into JVM Heap byte array. Returns to User Mode (Copy 2: CPU, Context Switch 2).' },
        { label: '4. write() Syscall & Copy', detail: 'Application calls socket.write(). CPU switches to Kernel Mode and copies bytes into Kernel Socket Buffer (Copy 3: CPU, Context Switch 3).' },
        { label: '5. DMA Write to NIC', detail: 'DMA engine copies data from Socket Buffer to NIC Network Buffer. Returns to User Mode (Copy 4: DMA, Context Switch 4).' }
      ]
    },
    zerocopy: {
      title: 'Linux sendfile() / Java FileChannel.transferTo()',
      copies: 0,
      contextSwitches: 2,
      cpuLoad: 'Near Zero (Pure DMA)',
      heapAlloc: '0 MB (Bypasses JVM Heap)',
      desc: 'Kafka uses FileChannel.transferTo() which delegates to the Linux sendfile() syscall with Scatter-Gather DMA. Data is transferred directly from OS Page Cache to NIC hardware with ZERO CPU copies and ZERO JVM heap overhead.',
      steps: [
        { label: '1. sendfile() Syscall', detail: 'Kafka broker executes FileChannel.transferTo(). CPU switches from User Mode to Kernel Mode (Context Switch 1).' },
        { label: '2. DMA Read to Page Cache', detail: 'DMA copies data from Disk into OS Page Cache (or reads existing cached RAM directly). No CPU copy needed.' },
        { label: '3. File Descriptor Append', detail: 'Only small descriptor metadata (pointer + length) is passed to the socket buffer. No payload data is copied!' },
        { label: '4. Scatter-Gather DMA to NIC', detail: 'NIC hardware directly gathers payload bytes from OS Page Cache memory via DMA. CPU switches back to User Mode (Context Switch 2).' }
      ]
    },
    ktls: {
      title: 'TLS / SSL Encryption & Kernel TLS (kTLS)',
      copies: 2,
      contextSwitches: 4,
      cpuLoad: 'Moderate (Crypto Encryption)',
      heapAlloc: 'TLS Record Buffers in User/Kernel space',
      desc: 'When TLS encryption is enabled, standard sendfile() cannot be used because payload bytes must be encrypted before reaching the NIC. User-space TLS (Java SSLEngine / OpenSSL) re-introduces user-space copies unless Linux Kernel TLS (kTLS) is configured.',
      steps: [
        { label: '1. Page Cache Read', detail: 'Data read into OS Page Cache from disk or memory.' },
        { label: '2. User-Space Decrypt/Encrypt', detail: 'Java SSLEngine pulls plaintext bytes into JVM memory to perform AES-GCM encryption (breaks classic sendfile).' },
        { label: '3. Encrypted Socket Write', detail: 'Encrypted ciphertext is written to Kernel Socket Buffer.' },
        { label: '4. kTLS Acceleration (Linux 4.17+)', detail: 'With kTLS enabled, the Linux kernel performs AES crypto directly in-kernel, restoring zero-copy pipeline benefits.' }
      ]
    }
  };

  const current = modeData[mode];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= current.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, current.steps.length]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kzero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Zero-Copy: sendfile(), Page Cache & DMA Engine Deep Dive
        </span>
        <button
          onClick={() => {
            setActiveStep(0);
            setIsPlaying(!isPlaying);
          }}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            background: isPlaying ? '#f87171' : '#38bdf8',
            color: '#090b14',
            transition: 'all 0.15s ease'
          }}
        >
          {isPlaying ? '⏸ Pause Step' : '▶ Animate Flow'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'zerocopy', label: '⚡ Zero-Copy sendfile() (Kafka Default)', color: '#34d399' },
            { id: 'traditional', label: '🐢 Standard Java I/O (4 Copies, 4 Switches)', color: '#f87171' },
            { id: 'ktls', label: '🔒 TLS Encryption & kTLS Trade-offs', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setMode(t.id as IoMode);
                setActiveStep(0);
                setIsPlaying(false);
              }}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: mode === t.id ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                color: mode === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: mode === t.id ? `0 0 0 1.5px ${t.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Animated SVG Flow Visualizer */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 720 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="zarr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="zarr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="zarr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
              </marker>
              <marker id="zarr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Boundary Regions: User Space vs Kernel Space vs Hardware */}
            {/* User Space Region */}
            <rect x="20" y="10" width="680" height="55" rx="6" fill="rgba(56,189,248,0.04)" stroke="rgba(56,189,248,0.2)" strokeDasharray="4 4" />
            <text x="35" y="26" fill="#38bdf8" fontSize="10" fontWeight="700">USER SPACE (Ring 3: JVM Process / Kafka Broker)</text>

            {/* Kernel Space Region */}
            <rect x="20" y="75" width="680" height="85" rx="6" fill="rgba(52,211,153,0.04)" stroke="rgba(52,211,153,0.2)" strokeDasharray="4 4" />
            <text x="35" y="90" fill="#34d399" fontSize="10" fontWeight="700">KERNEL SPACE (Ring 0: Linux OS Page Cache & Sockets)</text>

            {/* Hardware Region */}
            <rect x="20" y="170" width="680" height="42" rx="6" fill="rgba(251,191,36,0.04)" stroke="rgba(251,191,36,0.2)" strokeDasharray="4 4" />
            <text x="35" y="185" fill="#fbbf24" fontSize="10" fontWeight="700">HARDWARE CONTROLLERS (DMA & NIC)</text>

            {/* Node 1: NVMe/SSD Storage */}
            <rect x="40" y="125" width="100" height="40" rx="6" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="90" y="145" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">NVMe / Disk</text>
            <text x="90" y="157" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Partition .log</text>

            {/* Node 2: OS Page Cache */}
            <rect x="190" y="100" width="130" height="50" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5" />
            <text x="255" y="122" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">OS Page Cache</text>
            <text x="255" y="138" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Kernel RAM</text>

            {/* Path 1: Disk -> Page Cache DMA */}
            <line x1="140" y1="135" x2="185" y2="125" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
            <line x1="140" y1="135" x2="185" y2="125" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-green)" />

            {mode === 'traditional' && (
              <g>
                {/* Node 3: JVM Heap Buffer */}
                <rect x="290" y="20" width="140" height="40" rx="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.5" />
                <text x="360" y="38" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">JVM Heap Buffer</text>
                <text x="360" y="50" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">byte[] memory array</text>

                {/* Path 2: Page Cache -> JVM (CPU Copy 1) */}
                <path d="M 270 100 Q 285 65 310 60" fill="none" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />
                <path d="M 270 100 Q 285 65 310 60" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-red)" />

                {/* Node 4: Socket Buffer */}
                <rect x="440" y="100" width="120" height="50" rx="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.5" />
                <text x="500" y="122" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">Socket Buffer</text>
                <text x="500" y="138" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Kernel Socket</text>

                {/* Path 3: JVM -> Socket Buffer (CPU Copy 2) */}
                <path d="M 410 60 Q 435 65 455 100" fill="none" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />
                <path d="M 410 60 Q 435 65 455 100" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-red)" />

                {/* Node 5: NIC Network Interface */}
                <rect x="580" y="125" width="110" height="40" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="635" y="145" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">NIC Buffer</text>
                <text x="635" y="157" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Network Output</text>

                {/* Path 4: Socket -> NIC (DMA Copy) */}
                <line x1="560" y1="135" x2="575" y2="140" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                <line x1="560" y1="135" x2="575" y2="140" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-blue)" />
              </g>
            )}

            {mode === 'zerocopy' && (
              <g>
                {/* File Descriptor Socket Node */}
                <rect x="420" y="90" width="130" height="35" rx="6" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1" />
                <text x="485" y="106" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="700">Socket Descriptor</text>
                <text x="485" y="118" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Offset & Length pointer only</text>

                {/* Direct Scatter-Gather DMA Highway */}
                <path d="M 320 125 C 440 160 520 160 580 145" fill="none" stroke="rgba(52,211,153,0.3)" strokeWidth="3" />
                <path d="M 320 125 C 440 160 520 160 580 145" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray="8 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-green)" />

                <text x="450" y="168" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="800">
                  ⚡ Direct Scatter-Gather DMA Highway (0 CPU Memory Copies!)
                </text>

                {/* NIC Buffer */}
                <rect x="585" y="125" width="105" height="40" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="637" y="145" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">NIC Buffer</text>
                <text x="637" y="157" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Consumer Network</text>
              </g>
            )}

            {mode === 'ktls' && (
              <g>
                {/* Node 3: OpenSSL / Java SSLEngine */}
                <rect x="300" y="20" width="150" height="40" rx="6" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="375" y="38" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="700">SSLEngine / OpenSSL</text>
                <text x="375" y="50" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">AES-GCM Encryption</text>

                <path d="M 285 100 Q 300 65 330 60" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="2" />
                <path d="M 285 100 Q 300 65 330 60" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-purple)" />

                {/* Node 4: Encrypted Socket */}
                <rect x="460" y="100" width="115" height="50" rx="6" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="517" y="122" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="700">Encrypted Socket</text>
                <text x="517" y="138" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">TLS Ciphertext</text>

                <path d="M 430 60 Q 455 65 475 100" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="2" />
                <path d="M 430 60 Q 455 65 475 100" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-purple)" />

                {/* NIC Buffer */}
                <rect x="590" y="125" width="100" height="40" rx="6" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="640" y="145" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="700">NIC Buffer</text>
                <text x="640" y="157" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">TLS Wire Packet</text>

                <line x1="575" y1="135" x2="585" y2="140" stroke="rgba(167,139,250,0.3)" strokeWidth="2" />
                <line x1="575" y1="135" x2="585" y2="140" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#zarr-purple)" />
              </g>
            )}
          </svg>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>CPU Memory Copies</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: current.copies === 0 ? '#34d399' : '#f87171' }}>
              {current.copies} Copies
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Context Switches</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: current.contextSwitches === 2 ? '#34d399' : '#fbbf24' }}>
              {current.contextSwitches} Switches
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>CPU Overhead</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: mode === 'zerocopy' ? '#34d399' : '#f97316' }}>
              {current.cpuLoad}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>JVM Heap Footprint</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: mode === 'zerocopy' ? '#34d399' : '#38bdf8' }}>
              {current.heapAlloc}
            </div>
          </div>
        </div>

        {/* Step Breakdown & Deep-Dive Notes */}
        <div className="kzero-grid" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '14px', alignItems: 'start' }}>
          {/* Step Sequencer */}
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
              LIFECYCLE STEPS: {current.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {current.steps.map((st, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: activeStep === idx ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
                    border: activeStep === idx ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: activeStep === idx ? '#38bdf8' : 'var(--ifm-color-content)' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                    {st.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Senior Deep-Dive Panel */}
          <div className="interactive-diagram-details-card details-green" style={{ minHeight: '260px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              SENIOR ARCHITECTURE INSIGHT
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
              Why Page Cache + sendfile() Beats In-Process Caching
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
              {mode === 'zerocopy' && (
                <>
                  By delegating caching entirely to the Linux <strong>OS Page Cache</strong>, Kafka avoids object serialization overhead, GC pauses, and memory fragmentation inside the JVM. When multiple consumers read the same partition (e.g. 10 consumers in different groups), Linux serves all 10 consumers directly from Page Cache RAM via DMA with <strong>0 CPU memory copies</strong>.
                </>
              )}
              {mode === 'traditional' && (
                <>
                  In standard I/O, the CPU must physically copy every single payload byte twice through userspace memory buffers. On a 10 Gbps network connection, traditional I/O consumes up to <strong>100% of a CPU core</strong> just copying bytes between memory locations!
                </>
              )}
              {mode === 'ktls' && (
                <>
                  Enabling standard TLS requires Java to decrypt/encrypt payload bytes in userspace, breaking pure zero-copy. To regain hardware-line-rate speeds with TLS, production high-throughput clusters use <strong>Kernel TLS (kTLS)</strong> with hardware offload NICs (e.g. Mellanox/NVIDIA ConnectX).
                </>
              )}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontSize: '11px', color: 'var(--ifm-color-content)' }}>
              <strong>JVM Heap Sizing Rule:</strong> Keep broker heap small (<code>-Xms6g -Xmx6g</code>). Leave 75%+ of physical host RAM free for the Linux Page Cache to saturate 100GbE NICs effortlessly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
