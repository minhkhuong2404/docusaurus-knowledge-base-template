import React, { useState } from 'react';

export default function KubernetesGracefulShutdownDiagram({ initialTab = 'race' }: { initialTab?: 'race' | 'lifecycle' | 'pid1' | 'calculator' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'race' | 'lifecycle' | 'pid1' | 'calculator'>(initialTab);
  const [raceStep, setRaceStep] = useState<number>(1);
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(0);
  const [dockerForm, setDockerForm] = useState<'shell' | 'exec'>('shell');
  
  // Calculator state
  const [preStopSleep, setPreStopSleep] = useState<number>(10);
  const [springTimeout, setSpringTimeout] = useState<number>(30);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(5);

  const calculatedGracePeriod = preStopSleep + springTimeout + safetyBuffer;
  const isGracePeriodValid = calculatedGracePeriod > (preStopSleep + springTimeout);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .k8s-graceful-grid {
            grid-template-columns: 1fr !important;
          }
          .k8s-calc-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes k8sPulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.98); }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
          <path d="M4.93 4.93l4.24 4.24" />
          <path d="M14.83 9.17l4.24-4.24" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kubernetes + Spring Boot 3.x: Zero-Downtime Graceful Shutdown Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'race', label: '⚡ 1. The Race Condition (502 Root Cause)', color: '#f87171' },
            { id: 'lifecycle', label: '🛡️ 2. The 2-Layer Solution (preStop + Graceful)', color: '#38bdf8' },
            { id: 'pid1', label: '⚠️ 3. Docker PID 1 Shell Form Trap', color: '#fbbf24' },
            { id: 'calculator', label: '🧮 4. Timeout Calculator & Async/Kafka', color: '#34d399' }
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

        {/* TAB 1: THE RACE CONDITION */}
        {activeTab === 'race' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                Step through the Pod deletion event to see why default deployments drop active requests:
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4].map(step => (
                  <button
                    key={step}
                    onClick={() => setRaceStep(step)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: raceStep === step ? '#f87171' : 'rgba(255,255,255,0.06)',
                      color: raceStep === step ? '#0f172a' : 'var(--ifm-color-content-secondary)'
                    }}
                  >
                    Step {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Flow SVG */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 280" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="k8s-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                  </marker>
                  <marker id="k8s-arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                  <marker id="k8s-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Event Source */}
                <rect x="20" y="105" width="160" height="70" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="100" y="132" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">kubectl delete / HPA</text>
                <text x="100" y="152" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Rolling Update Trigger</text>

                {/* Branch 1: Network Propagation (Slow: 2-5s) */}
                <path d="M 180 125 C 240 125, 250 50, 310 50" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#k8s-arrow-amber)" />
                <rect x="310" y="20" width="200" height="60" rx="6" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.2" />
                <text x="410" y="42" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Branch 1: Network Fabric</text>
                <text x="410" y="60" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">Endpoints removal ➔ iptables/IPVS sync</text>

                <path d="M 510 50 L 590 50" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#k8s-arrow-amber)" />
                <rect x="590" y="20" width="190" height="60" rx="6" fill={raceStep >= 4 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)'} stroke={raceStep >= 4 ? '#34d399' : '#fbbf24'} strokeWidth="1.2" />
                <text x="685" y="42" textAnchor="middle" fill={raceStep >= 4 ? '#34d399' : '#fbbf24'} fontSize="11" fontWeight="700">Ingress / Kube-Proxy</text>
                <text x="685" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">{raceStep >= 4 ? 'IP Drained (After 2-5s)' : 'Lagging (Stale IP active!)'}</text>

                {/* Branch 2: Pod Termination (Fast: <300ms) */}
                <path d="M 180 155 C 240 155, 250 220, 310 220" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#k8s-arrow-red)" />
                <rect x="310" y="190" width="200" height="60" rx="6" fill="rgba(248,113,113,0.1)" stroke="#f87171" strokeWidth="1.2" />
                <text x="410" y="212" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Branch 2: Pod Process</text>
                <text x="410" y="230" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">Instant SIGTERM to Container</text>

                <path d="M 510 220 L 590 220" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#k8s-arrow-red)" />
                <rect x="590" y="190" width="190" height="60" rx="6" fill={raceStep >= 2 ? 'rgba(248,113,113,0.25)' : 'rgba(56,189,248,0.1)'} stroke={raceStep >= 2 ? '#f87171' : '#38bdf8'} strokeWidth="1.2" />
                <text x="685" y="212" textAnchor="middle" fill={raceStep >= 2 ? '#f87171' : '#38bdf8'} fontSize="11" fontWeight="700">Embedded Tomcat Socket</text>
                <text x="685" y="230" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">{raceStep >= 2 ? 'CLOSED in ~100ms (RST)' : 'Accepting Connections'}</text>

                {/* Race Collision Zone */}
                {raceStep === 3 && (
                  <g>
                    <rect x="440" y="105" width="290" height="60" rx="8" fill="rgba(248,113,113,0.2)" stroke="#f87171" strokeWidth="2" />
                    <text x="585" y="128" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="800">💥 502 BAD GATEWAY WINDOW</text>
                    <text x="585" y="148" textAnchor="middle" fill="#fbbf24" fontSize="10">Ingress sends HTTP traffic to closed socket!</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Explanation card based on current step */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '4px', fontSize: '13px' }}>
                {raceStep === 1 && 'Step 1: Pod Marked Terminating'}
                {raceStep === 2 && 'Step 2: SIGTERM Sent Immediately to Container (<100ms)'}
                {raceStep === 3 && 'Step 3: The Fatal Race Condition & 502 Bad Gateway Window (1-5s)'}
                {raceStep === 4 && 'Step 4: Network Endpoints Finally Updated (Too Late!)'}
              </div>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'var(--ifm-color-content-secondary)' }}>
                {raceStep === 1 && 'Kube-apiserver sets deletionTimestamp and marks Pod as Terminating. Two completely independent distributed workflows trigger asynchronously: Node Kubelet begins container destruction, while Controller Manager initiates Endpoints removal.'}
                {raceStep === 2 && 'Without a preStop hook, Kubelet immediately sends SIGTERM to PID 1. Embedded Tomcat catches SIGTERM and shuts down its server socket within a few milliseconds, refusing any new connections and cutting off TCP handshakes.'}
                {raceStep === 3 && 'Meanwhile, updating the Kubernetes distributed data plane (Endpoints ➔ Ingress Controller / Envoy ➔ kube-proxy iptables or IPVS on all nodes) takes 2 to 5 seconds. During this 5-second delta, Ingress continues forwarding live client requests to the dead Pod socket, resulting in HTTP 502 Bad Gateway or TCP Connection Reset!'}
                {raceStep === 4 && 'After 5 seconds, all routing tables have removed the Pod IP. But the damage is done: clients have already received 502 errors during rolling deployment or HPA scale-down.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: THE 2-LAYER FIX */}
        {activeTab === 'lifecycle' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                The 2-Layer architecture introduces a deliberate <code>preStop</code> sleep barrier to synchronize the network and application planes:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { title: '0s: Pod Terminating + preStop sleep 10s begins', color: '#38bdf8' },
                  { title: '3s: Ingress & iptables successfully drop Pod IP', color: '#fbbf24' },
                  { title: '10s: preStop ends ➔ Kubelet sends SIGTERM', color: '#a78bfa' },
                  { title: '10-25s: Spring Tomcat drains in-flight requests', color: '#34d399' },
                  { title: '25s: Clean exit (Code 0), no SIGKILL needed', color: '#2dd4bf' }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTimelineStep(idx)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: activeTimelineStep === idx ? `${s.color}25` : 'rgba(255,255,255,0.05)',
                      color: activeTimelineStep === idx ? s.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: activeTimelineStep === idx ? `0 0 0 1px ${s.color}` : 'none'
                    }}
                  >
                    Phase {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Sequence Timeline */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Timeline axis */}
                <line x1="60" y1="200" x2="750" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                
                {/* Time markers */}
                {[
                  { x: 80, label: '0s (Terminating)' },
                  { x: 260, label: '3s (Endpoints Drained)' },
                  { x: 420, label: '10s (SIGTERM Sent)' },
                  { x: 620, label: '25s (Tomcat Drained)' },
                  { x: 740, label: '45s (SIGKILL limit)' }
                ].map((m, i) => (
                  <g key={i}>
                    <line x1={m.x} y1="195" x2={m.x} y2="205" stroke="#38bdf8" strokeWidth="2" />
                    <text x={m.x} y="222" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">{m.label}</text>
                  </g>
                ))}

                {/* Layer 2: preStop Hook Bar (0s to 10s) */}
                <rect x="80" y="40" width="340" height="42" rx="6" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="250" y="65" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Layer 2: preStop Hook [sleep 10s]</text>
                
                {/* Network propagation window */}
                <rect x="80" y="95" width="180" height="30" rx="4" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" />
                <text x="170" y="115" textAnchor="middle" fill="#fbbf24" fontSize="10">Endpoints Removed (2-3s)</text>

                {/* Safe buffer window */}
                <rect x="260" y="95" width="160" height="30" rx="4" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1" />
                <text x="340" y="115" textAnchor="middle" fill="#34d399" fontSize="10">Traffic Drain Buffer (No 502!)</text>

                {/* Layer 1: Spring Graceful Shutdown Bar (10s to 25s) */}
                <rect x="420" y="40" width="200" height="42" rx="6" fill="rgba(52,211,153,0.25)" stroke="#34d399" strokeWidth="1.5" />
                <text x="520" y="65" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">Layer 1: Spring Graceful</text>

                {/* Safety headroom */}
                <rect x="620" y="40" width="120" height="42" rx="6" fill="rgba(167,139,250,0.1)" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 4" />
                <text x="680" y="65" textAnchor="middle" fill="#a78bfa" fontSize="10">Safety Headroom (20s)</text>

                {/* Highlight marker */}
                <circle
                  cx={activeTimelineStep === 0 ? 80 : activeTimelineStep === 1 ? 260 : activeTimelineStep === 2 ? 420 : activeTimelineStep === 3 ? 520 : 620}
                  cy="160"
                  r="7"
                  fill="#f87171"
                  stroke="#fff"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Configuration snippet comparison */}
            <div className="k8s-graceful-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  Kubernetes Deployment Spec (`preStop` Hook)
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`spec:
  # Must be > preStop sleep + Spring timeout
  terminationGracePeriodSeconds: 45
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 10"]`}
                </pre>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  Spring Boot 3.x (`application.yml`)
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`server:
  shutdown: graceful # Closes socket, allows in-flight

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s # Max in-flight wait`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCKER PID 1 TRAP */}
        {activeTab === 'pid1' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDockerForm('shell')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: dockerForm === 'shell' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
                  color: dockerForm === 'shell' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  boxShadow: dockerForm === 'shell' ? '0 0 0 1px #f87171' : 'none'
                }}
              >
                ❌ Shell Form (The PID 1 Drop Trap)
              </button>
              <button
                onClick={() => setDockerForm('exec')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: dockerForm === 'exec' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                  color: dockerForm === 'exec' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  boxShadow: dockerForm === 'exec' ? '0 0 0 1px #34d399' : 'none'
                }}
              >
                ✅ Exec Form (Proper Signal Propagation)
              </button>
            </div>

            {/* Process Hierarchy Diagram */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {dockerForm === 'shell' ? (
                  <g>
                    {/* Shell Form Tree */}
                    <rect x="40" y="30" width="160" height="50" rx="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.5" />
                    <text x="120" y="55" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">Kubelet Signal</text>
                    <text x="120" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">SIGTERM</text>

                    <path d="M 200 55 L 280 55" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#k8s-arrow-red)" />

                    <rect x="280" y="25" width="210" height="60" rx="6" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="385" y="48" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700">PID 1: /bin/sh</text>
                    <text x="385" y="66" textAnchor="middle" fill="#f87171" fontSize="10">⚠️ DROPS SIGTERM by default!</text>

                    {/* Blocked line to Java */}
                    <path d="M 385 85 L 385 130" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="375" y1="105" x2="395" y2="115" stroke="#f87171" strokeWidth="3" />
                    <line x1="395" y1="105" x2="375" y2="115" stroke="#f87171" strokeWidth="3" />

                    <rect x="280" y="130" width="210" height="60" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <text x="385" y="153" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">PID 7: java -jar app.jar</text>
                    <text x="385" y="171" textAnchor="middle" fill="#f87171" fontSize="10">Unaware of shutdown!</text>

                    <rect x="540" y="75" width="220" height="70" rx="8" fill="rgba(248,113,113,0.2)" stroke="#f87171" strokeWidth="1.5" />
                    <text x="650" y="103" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">Result: Hard SIGKILL (kill -9)</text>
                    <text x="650" y="123" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">After 45s, K8s forcibly murders Java</text>
                  </g>
                ) : (
                  <g>
                    {/* Exec Form Direct Tree */}
                    <rect x="40" y="75" width="160" height="50" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="120" y="100" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">Kubelet Signal</text>
                    <text x="120" y="115" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">SIGTERM</text>

                    <path d="M 200 100 L 290 100" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#k8s-arrow-blue)" />

                    <rect x="290" y="65" width="230" height="70" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="405" y="93" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">PID 1: java -jar app.jar</text>
                    <text x="405" y="111" textAnchor="middle" fill="#34d399" fontSize="10">✅ Directly receives SIGTERM</text>

                    <path d="M 520 100 L 590 100" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#k8s-arrow-blue)" />

                    <rect x="590" y="65" width="190" height="70" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="685" y="93" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">Spring Boot Lifecycle</text>
                    <text x="685" y="111" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">Exit Code 0 (Clean finish)</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Dockerfile Syntax Comparison */}
            <div className="k8s-graceful-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  ❌ Dangerous: Shell Form (Spawns /bin/sh as PID 1)
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#fca5a5' }}>
{`# Docker runs: /bin/sh -c "java -jar app.jar"
ENTRYPOINT java -jar /app.jar

# Or CMD:
CMD java -jar /app.jar`}
                </pre>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                  In Linux, PID 1 has special signal-ignoring defaults. <code>/bin/sh</code> does not forward SIGTERM to child processes unless explicitly trapped.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  ✅ Recommended: Exec Form (Java is PID 1)
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#86efac' }}>
{`# Exec Form passes args directly to kernel
ENTRYPOINT ["java", "-jar", "/app.jar"]

# Alternative if shell scripting is required:
ENTRYPOINT ["/bin/sh", "-c", "exec java -jar /app.jar"]`}
                </pre>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                  Using JSON array syntax executes the JVM binary directly as PID 1, or <code>exec</code> replaces the shell process image in-place.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CALCULATOR & ASYNC/KAFKA */}
        {activeTab === 'calculator' && (
          <div>
            <div className="k8s-calc-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', marginBottom: '14px' }}>
              {/* Sliders panel */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
                  Grace Period Sizing Formula
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--ifm-color-content)' }}>1. preStop Sleep Duration:</span>
                    <strong style={{ color: '#38bdf8' }}>{preStopSleep}s</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={preStopSleep}
                    onChange={e => setPreStopSleep(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Time required for Ingress, Envoy, and Kube-proxy iptables to purge Pod IP (recommended 10-15s).
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--ifm-color-content)' }}>2. Spring timeout-per-shutdown-phase:</span>
                    <strong style={{ color: '#34d399' }}>{springTimeout}s</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={springTimeout}
                    onChange={e => setSpringTimeout(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#34d399' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Max wait time for in-flight HTTP requests and database queries to finish execution.
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--ifm-color-content)' }}>3. Kernel / Context Buffer:</span>
                    <strong style={{ color: '#fbbf24' }}>{safetyBuffer}s</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={safetyBuffer}
                    onChange={e => setSafetyBuffer(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#fbbf24' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Buffer for HikariCP pool close, Kafka commit flush, and JVM exit cleanup.
                  </div>
                </div>

                <div style={{ background: isGracePeriodValid ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${isGracePeriodValid ? '#34d399' : '#f87171'}`, borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Computed Recommendation:</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: isGracePeriodValid ? '#34d399' : '#f87171', marginTop: '2px' }}>
                    terminationGracePeriodSeconds: {calculatedGracePeriod}s
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                    Formula: {preStopSleep}s (sleep) + {springTimeout}s (Spring timeout) + {safetyBuffer}s (buffer)
                  </div>
                </div>
              </div>

              {/* Dynamic Manifest Snippet */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  Generated Kubernetes Deployment Manifest
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    spec:
      # Computed terminationGracePeriodSeconds
      terminationGracePeriodSeconds: ${calculatedGracePeriod}
      containers:
        - name: app
          image: order-service:latest
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep ${preStopSleep}"]
          ports:
            - containerPort: 8080`}
                </pre>
              </div>
            </div>

            {/* Async Workers & Kafka checklist */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                Senior Checklist: Async Workers & Kafka Consumers Graceful Draining
              </div>
              <div className="k8s-graceful-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                    1. ThreadPoolTaskExecutor (Async Threads)
                  </div>
                  <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '10px', margin: 0, color: '#e2e8f0' }}>
{`@Bean
public ThreadPoolTaskExecutor taskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setAwaitTerminationSeconds(20);
    return executor;
}`}
                  </pre>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                    2. Kafka Listener Containers (Offset Commit)
                  </div>
                  <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '10px', margin: 0, color: '#e2e8f0' }}>
{`@Bean
public ConcurrentKafkaListenerContainerFactory<String, Object>
       kafkaListenerContainerFactory() {
    var factory = new ConcurrentKafkaListenerContainerFactory<String, Object>();
    factory.getContainerProperties()
           .setShutdownTimeout(15000); // 15s to commit offsets
    return factory;
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
