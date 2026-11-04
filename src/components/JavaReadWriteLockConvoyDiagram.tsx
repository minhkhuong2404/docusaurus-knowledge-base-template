import React, { useState, useEffect } from 'react';

export type LockConvoyTab = 'reentrancy' | 'convoy' | 'stamped';

interface JavaReadWriteLockConvoyDiagramProps {
  initialTab?: LockConvoyTab;
}

export default function JavaReadWriteLockConvoyDiagram({
  initialTab = 'convoy',
}: JavaReadWriteLockConvoyDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<LockConvoyTab>(initialTab);
  const [convoyStep, setConvoyStep] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lockType, setLockType] = useState<'reentrant' | 'stamped' | 'go_rw'>('reentrant');
  const [stampedScenario, setStampedScenario] = useState<'clean' | 'interleaved'>('clean');

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setConvoyStep((prev) => {
        if (prev >= 4) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const CONVOY_STEPS = [
    {
      time: 't = 0 ms',
      title: 'Step 1: Reader R1 Acquires ReadLock & Starts Slow Socket Write',
      desc: 'Background sync thread R1 acquires readLock() on ConfigCache (5,000 entries, 5MB) and writes directly to a backup region TCP socket. Network congestion throttles bandwidth to 250 KB/s (20s duration). Other readers still pass freely.',
      poolUsed: 5,
      r1State: 'HOLDING READ LOCK (Socket Write 0/20s)',
      wState: 'IDLE',
      newReadersState: 'PASSING FREELY (Shared)',
      color: '#34d399',
    },
    {
      time: 't = 100 ms',
      title: 'Step 2: Writer W Requests WriteLock & Parks at Head of AQS Queue',
      desc: 'Scheduled reload job W calls writeLock().lock(). Because R1 still holds a read lock, W cannot proceed and parks at the HEAD of the AQS wait queue.',
      poolUsed: 12,
      r1State: 'HOLDING READ LOCK (Blocked on TCP Send Buffer)',
      wState: 'QUEUED AT HEAD (Waiting for R1)',
      newReadersState: 'ABOUT TO BLOCK',
      color: '#fbbf24',
    },
    {
      time: 't = 150 ms',
      title: 'Step 3: Anti-Writer-Starvation Blocks All New Readers (CONVOY)',
      desc: 'ReentrantReadWriteLock checks seemingly innocent new HTTP readers (R2..R200): because the head of the AQS queue is an exclusive Writer W, all new non-reentrant readers are forced to queue BEHIND W!',
      poolUsed: 200,
      r1State: 'STUCK IN SOCKET WRITE0 (No Write Timeout!)',
      wState: 'BLOCKED AT QUEUE HEAD',
      newReadersState: '200 TOMCAT THREADS PARKED BEHIND W!',
      color: '#f87171',
    },
    {
      time: 't = 170 ms → 20,000 ms',
      title: 'Step 4: Total Service Outage (Tomcat Pool Exhausted in 20ms)',
      desc: 'At 10,000 req/s, all 200 Tomcat worker threads park on readLock() within 20ms! Even health-check and unrelated endpoints time out because zero worker threads remain.',
      poolUsed: 200,
      r1State: 'STILL WRITING SOCKET (t = 15s / 20s)',
      wState: 'WAITING FOR R1',
      newReadersState: 'SERVICE DEAD (0 Free Threads)',
      color: '#f87171',
    },
    {
      time: 't = 20,005 ms',
      title: 'Step 5: R1 Finishes, Writer Flushes in 5ms, Convoy Drains',
      desc: 'R1 finally finishes socket I/O and unlocks. Writer W acquires writeLock, swaps map in 5ms, and unlocks. All 200 queued readers wake up simultaneously.',
      poolUsed: 18,
      r1State: 'UNLOCKED',
      wState: 'COMPLETED (5ms)',
      newReadersState: 'UNBLOCKED & DRAINING',
      color: '#38bdf8',
    },
  ];

  const curStep = CONVOY_STEPS[convoyStep];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .lock-convoy-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: '#38bdf8', fontWeight: 700 }}>
          Java Lock Internals: Ownership, ReadWriteLock Convoy &amp; StampedLock
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'convoy', label: '1. ReadWriteLock Convoy Outage', color: '#f87171' },
            { id: 'reentrancy', label: '2. Ownership & Hold Count Mechanics', color: '#38bdf8' },
            { id: 'stamped', label: '3. StampedLock Optimistic Read', color: '#34d399' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as LockConvoyTab)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : '#94a3b8',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CONVOY */}
        {activeTab === 'convoy' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {CONVOY_STEPS.map((s, idx) => (
                <button
                  key={s.time}
                  onClick={() => { setIsPlaying(false); setConvoyStep(idx); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: convoyStep === idx ? `${s.color}25` : 'rgba(255,255,255,0.04)',
                    color: convoyStep === idx ? s.color : '#94a3b8',
                    boxShadow: convoyStep === idx ? `0 0 0 1px ${s.color}` : 'none',
                  }}
                >
                  {s.time}
                </button>
              ))}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #38bdf8',
                  background: isPlaying ? 'rgba(248,113,113,0.2)' : 'rgba(56,189,248,0.15)',
                  color: isPlaying ? '#f87171' : '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isPlaying ? 'Pause Timeline' : 'Auto-Play Incident'}
              </button>
            </div>

            <div className="lock-convoy-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg viewBox="0 0 560 280" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="lc-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#34d399" />
                    </marker>
                    <marker id="lc-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#f87171" />
                    </marker>
                    <marker id="lc-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#fbbf24" />
                    </marker>
                  </defs>

                  {/* Lock Box */}
                  <rect x="360" y="30" width="175" height="90" rx="8" fill="rgba(15,23,42,0.9)" stroke={curStep.color} strokeWidth="2" />
                  <text x="447" y="52" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">ReentrantReadWriteLock</text>
                  <text x="447" y="72" fill="#34d399" fontSize="10" textAnchor="middle">
                    ReadLock Count: {convoyStep < 4 ? '1 (Thread R1)' : '200'}
                  </text>
                  <text x="447" y="90" fill="#fbbf24" fontSize="9.5" textAnchor="middle">
                    Owner in jstack: NONE (Shared)
                  </text>
                  <text x="447" y="108" fill="#f87171" fontSize="9.5" fontWeight="600" textAnchor="middle">
                    AQS Queue Length: {convoyStep === 0 ? 0 : convoyStep === 1 ? 1 : convoyStep < 4 ? 201 : 0}
                  </text>

                  {/* Reader R1 (Slow Socket) */}
                  <rect x="25" y="35" width="195" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke={convoyStep < 4 ? '#f97316' : '#34d399'} strokeWidth="1.5" />
                  <text x="122" y="55" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">Thread R1 (config-sync)</text>
                  <text x="122" y="73" fill="#f97316" fontSize="9.5" textAnchor="middle">SocketDispatcher.write0()</text>
                  <text x="122" y="89" fill="#94a3b8" fontSize="9" textAnchor="middle">5MB TCP Write @ 250KB/s = 20s</text>

                  {/* Flowing path R1 -> Lock */}
                  <path
                    d="M 226 67 L 348 67"
                    fill="none"
                    stroke={convoyStep < 4 ? '#f87171' : '#34d399'}
                    strokeWidth="2"
                    className="interactive-diagram-flowing-path"
                    markerEnd={convoyStep < 4 ? 'url(#lc-arr-red)' : 'url(#lc-arr-green)'}
                  />
                  <text x="287" y="59" fill={convoyStep < 4 ? '#f87171' : '#34d399'} fontSize="9" fontWeight="700" textAnchor="middle">
                    {convoyStep < 4 ? 'Holds ReadLock 20s' : 'Released'}
                  </text>

                  {/* AQS FIFO Wait Queue */}
                  <rect x="25" y="140" width="510" height="115" rx="8" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />
                  <text x="40" y="160" fill="#94a3b8" fontSize="10" fontWeight="700">
                    AQS CLH Wait Queue (Anti-Writer-Starvation Rule: apparentFirstQueuedIsExclusive())
                  </text>

                  {/* Writer W */}
                  <rect
                    x="45"
                    y="175"
                    width="135"
                    height="60"
                    rx="6"
                    fill={convoyStep >= 1 && convoyStep < 4 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)'}
                    stroke={convoyStep >= 1 && convoyStep < 4 ? '#fbbf24' : '#475569'}
                    strokeWidth="1.5"
                  />
                  <text x="112" y="196" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">HEAD: Writer W</text>
                  <text x="112" y="212" fill="#e2e8f0" fontSize="9" textAnchor="middle">config-reload (WriteLock)</text>
                  <text x="112" y="226" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                    {convoyStep === 0 ? 'Not arrived' : convoyStep < 4 ? 'WAITING (parking)' : 'Done (5ms)'}
                  </text>

                  {/* Arrow from W to New Readers */}
                  <path
                    d="M 240 205 L 192 205"
                    fill="none"
                    stroke={convoyStep >= 2 && convoyStep < 4 ? '#f87171' : '#34d399'}
                    strokeWidth="2"
                    className="interactive-diagram-flowing-path"
                    markerEnd={convoyStep >= 2 && convoyStep < 4 ? 'url(#lc-arr-red)' : 'url(#lc-arr-green)'}
                  />

                  {/* New Readers R2..R200 */}
                  <rect
                    x="248"
                    y="175"
                    width="270"
                    height="60"
                    rx="6"
                    fill={convoyStep >= 2 && convoyStep < 4 ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.1)'}
                    stroke={convoyStep >= 2 && convoyStep < 4 ? '#f87171' : '#34d399'}
                    strokeWidth="1.5"
                  />
                  <text x="383" y="196" fill={convoyStep >= 2 && convoyStep < 4 ? '#f87171' : '#34d399'} fontSize="10" fontWeight="700" textAnchor="middle">
                    Incoming Readers R2 .. R200 (http-exec-*)
                  </text>
                  <text x="383" y="212" fill="#e2e8f0" fontSize="9" textAnchor="middle">
                    {convoyStep >= 2 && convoyStep < 4
                      ? 'BLOCKED BEHIND WRITER W! (Convoy Effect)'
                      : 'Acquire Shared ReadLock Immediately'}
                  </text>
                  <text x="383" y="226" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                    Tomcat Pool: {curStep.poolUsed} / 200 Threads Occupied
                  </text>
                </svg>
              </div>

              {/* Detail Card */}
              <div style={{ background: '#0c0e17', padding: '14px', borderRadius: '10px', border: `1px solid ${curStep.color}50` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: curStep.color, marginBottom: '4px' }}>
                  {curStep.time}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {curStep.title}
                </div>
                <p style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55, marginBottom: '12px' }}>
                  {curStep.desc}
                </p>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', fontSize: '11px' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '4px' }}>
                    <strong style={{ color: '#38bdf8' }}>R1 Status:</strong> {curStep.r1State}
                  </div>
                  <div style={{ color: '#94a3b8', marginBottom: '4px' }}>
                    <strong style={{ color: '#fbbf24' }}>Writer W:</strong> {curStep.wState}
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    <strong style={{ color: '#f87171' }}>HTTP Readers:</strong> {curStep.newReadersState}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OWNERSHIP & REENTRANCY */}
        {activeTab === 'reentrancy' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'reentrant', label: 'Java ReentrantLock / synchronized (Owner + HoldCount)', color: '#34d399' },
                { id: 'stamped', label: 'Java StampedLock / Semaphore(1) (No Owner, Non-Reentrant)', color: '#f87171' },
                { id: 'go_rw', label: 'Go sync.RWMutex (No Owner, Recursive RLock Deadlocks)', color: '#fbbf24' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLockType(m.id as 'reentrant' | 'stamped' | 'go_rw')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: lockType === m.id ? `${m.color}25` : 'rgba(255,255,255,0.04)',
                    color: lockType === m.id ? m.color : '#94a3b8',
                    boxShadow: lockType === m.id ? `0 0 0 1px ${m.color}` : 'none',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="lock-convoy-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg viewBox="0 0 540 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="own-arr-ok" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#34d399" />
                    </marker>
                    <marker id="own-arr-err" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#f87171" />
                    </marker>
                  </defs>

                  {/* Step 1: outer() */}
                  <rect x="20" y="35" width="135" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="87" y="58" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">1. outer() Lock</text>
                  <text x="87" y="75" fill="#38bdf8" fontSize="9.5" textAnchor="middle">Thread-1 Acquires</text>
                  <text x="87" y="90" fill="#94a3b8" fontSize="8.5" textAnchor="middle">holdCount = 1</text>

                  <path d="M 161 67 L 198 67" fill="none" stroke="#34d399" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#own-arr-ok)" />

                  {/* Step 2: inner() nested call */}
                  <rect x="206" y="35" width="145" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke={lockType === 'reentrant' ? '#34d399' : '#f87171'} strokeWidth="1.5" />
                  <text x="278" y="58" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">2. inner() Re-Lock</text>
                  <text x="278" y="75" fill={lockType === 'reentrant' ? '#34d399' : '#f87171'} fontSize="9.5" textAnchor="middle">
                    {lockType === 'reentrant' ? 'current == owner (OK)' : 'No Owner Check!'}
                  </text>
                  <text x="278" y="90" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                    {lockType === 'reentrant' ? 'holdCount = 2' : 'SELF-DEADLOCK!'}
                  </text>

                  <path
                    d="M 357 67 L 392 67"
                    fill="none"
                    stroke={lockType === 'reentrant' ? '#34d399' : '#f87171'}
                    strokeWidth="2"
                    className="interactive-diagram-flowing-path"
                    markerEnd={lockType === 'reentrant' ? 'url(#own-arr-ok)' : 'url(#own-arr-err)'}
                  />

                  {/* Step 3: Diagnostics */}
                  <rect x="400" y="35" width="120" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="460" y="58" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">3. jstack Dump</text>
                  <text x="460" y="75" fill="#a78bfa" fontSize="9" textAnchor="middle">
                    {lockType === 'reentrant' ? 'Shows Owner Thread' : 'Owner: - None'}
                  </text>
                  <text x="460" y="90" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                    {lockType === 'reentrant' ? 'Auto Cycle Detect' : 'Blind Hang'}
                  </text>

                  {/* Bottom summary box */}
                  <rect x="20" y="130" width="500" height="90" rx="8" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.1)" />
                  <text x="35" y="152" fill="#38bdf8" fontSize="10.5" fontWeight="700">
                    The 4 Architectural Capabilities Enabled by Lock Ownership (exclusiveOwnerThread):
                  </text>
                  <text x="35" y="172" fill="#e2e8f0" fontSize="9.5">
                    1. Reentrancy (Thread checks if it is already the owner and increments holdCount).
                  </text>
                  <text x="35" y="188" fill="#e2e8f0" fontSize="9.5">
                    2. Thread Dump Blame (jstack -l prints exact owner thread &amp; stack line holding the lock).
                  </text>
                  <text x="35" y="204" fill="#e2e8f0" fontSize="9.5">
                    3. Automatic JVM Deadlock Detection &amp; Condition.await() full holdCount save/restore.
                  </text>
                </svg>
              </div>

              <div style={{ background: '#0c0e17', padding: '14px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.3)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {lockType === 'reentrant' && 'Java ReentrantLock & synchronized'}
                  {lockType === 'stamped' && 'StampedLock & Semaphore(1): Non-Reentrant'}
                  {lockType === 'go_rw' && 'Go sync.RWMutex: Forbidden Recursive RLock'}
                </div>
                <p style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55, marginBottom: '10px' }}>
                  {lockType === 'reentrant' &&
                    'Stores exclusiveOwnerThread and holdCount. Calling lock() twice on the same thread increments holdCount to 2; unlock() must be called twice to reach 0. Calling unlock() from another thread (e.g. inside a CompletableFuture callback) throws IllegalMonitorStateException.'}
                  {lockType === 'stamped' &&
                    'StampedLock and Semaphore do NOT track an owning thread. If a thread holding writeLock() calls writeLock() again in a helper method, it blocks waiting for itself forever, and jstack reports Locked ownable synchronizers: None.'}
                  {lockType === 'go_rw' &&
                    'To prevent writer starvation without tracking per-goroutine read hold counts, Go blocks new RLock() calls when a writer is waiting. If a goroutine holding RLock() calls RLock() again while a writer waits, both deadlock permanently!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STAMPED LOCK */}
        {activeTab === 'stamped' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => setStampedScenario('clean')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: stampedScenario === 'clean' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                  color: stampedScenario === 'clean' ? '#34d399' : '#94a3b8',
                }}
              >
                Scenario A: No Concurrent Writer (validate == true)
              </button>
              <button
                onClick={() => setStampedScenario('interleaved')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: stampedScenario === 'interleaved' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
                  color: stampedScenario === 'interleaved' ? '#fbbf24' : '#94a3b8',
                }}
              >
                Scenario B: Writer Interleaves (validate == false → Fallback)
              </button>
            </div>

            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg viewBox="0 0 680 170" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="sl-arr-c" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#38bdf8" />
                  </marker>
                  <marker id="sl-arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#34d399" />
                  </marker>
                  <marker id="sl-arr-w" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#fbbf24" />
                  </marker>
                </defs>

                <rect x="20" y="45" width="140" height="70" rx="8" fill="rgba(15,23,42,0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="90" y="68" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">1. tryOptimisticRead()</text>
                <text x="90" y="85" fill="#38bdf8" fontSize="9.5" textAnchor="middle">Reads stamp (e.g. v=256)</text>
                <text x="90" y="101" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Zero CAS / Zero Cache Bouncing</text>

                <path d="M 166 80 L 204 80" fill="none" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#sl-arr-c)" />

                <rect x="212" y="45" width="140" height="70" rx="8" fill="rgba(15,23,42,0.9)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="282" y="68" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">2. Copy Primitives</text>
                <text x="282" y="85" fill="#a78bfa" fontSize="9.5" textAnchor="middle">b = bid; a = ask;</text>
                <text x="282" y="101" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Local stack vars only!</text>

                <path d="M 358 80 L 396 80" fill="none" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#sl-arr-c)" />

                <rect x="404" y="45" width="125" height="70" rx="8" fill="rgba(15,23,42,0.9)" stroke={stampedScenario === 'clean' ? '#34d399' : '#fbbf24'} strokeWidth="1.5" />
                <text x="466" y="68" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">3. validate(stamp)</text>
                <text x="466" y="85" fill={stampedScenario === 'clean' ? '#34d399' : '#fbbf24'} fontSize="9.5" textAnchor="middle">
                  {stampedScenario === 'clean' ? 'stamp == 256 (TRUE)' : 'stamp != 258 (FALSE)'}
                </text>
                <text x="466" y="101" fill="#94a3b8" fontSize="8.5" textAnchor="middle">LoadFence + Version Check</text>

                <path
                  d="M 535 80 L 568 80"
                  fill="none"
                  stroke={stampedScenario === 'clean' ? '#34d399' : '#fbbf24'}
                  strokeWidth="2"
                  className="interactive-diagram-flowing-path"
                  markerEnd={stampedScenario === 'clean' ? 'url(#sl-arr-g)' : 'url(#sl-arr-w)'}
                />

                <rect x="576" y="45" width="90" height="70" rx="8" fill="rgba(15,23,42,0.9)" stroke={stampedScenario === 'clean' ? '#34d399' : '#fbbf24'} strokeWidth="1.5" />
                <text x="621" y="68" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">
                  {stampedScenario === 'clean' ? '4. Return Fast' : '4. Fallback'}
                </text>
                <text x="621" y="85" fill={stampedScenario === 'clean' ? '#34d399' : '#fbbf24'} fontSize="9" textAnchor="middle">
                  {stampedScenario === 'clean' ? 'return a - b' : 'sl.readLock()'}
                </text>
                <text x="621" y="101" fill="#94a3b8" fontSize="8" textAnchor="middle">
                  {stampedScenario === 'clean' ? 'No Lock Acquired' : 'Pessimistic Retry'}
                </text>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
