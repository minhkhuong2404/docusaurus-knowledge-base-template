import React, { useState } from 'react';

export type OomTab = 'four_avenues' | 'redos_explosion' | 'sensory_metrics' | 'incident_playbook';

interface ProductionOomDebuggingDiagramProps {
  initialTab?: OomTab;
}

export default function ProductionOomDebuggingDiagram({
  initialTab = 'four_avenues',
}: ProductionOomDebuggingDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<OomTab>(initialTab);
  const [redosLength, setRedosLength] = useState<number>(25);

  // Calculate exponential states for ReDoS
  const redosStates = Math.pow(2, Math.min(28, redosLength));

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .oom-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Production Memory Exhaustion: ReDoS Backtracking, 4 Leak Avenues & 2 AM Triage
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'four_avenues', label: '🌊 1. The 4 Avenues of Memory Exhaustion', color: '#38bdf8' },
            { id: 'redos_explosion', label: '💥 2. ReDoS State Explosion in Logs', color: '#f87171' },
            { id: 'sensory_metrics', label: '📡 3. RSS vs Heap vs Cgroup Metrics', color: '#fbbf24' },
            { id: 'incident_playbook', label: '🚑 4. The 2 AM Emergency Playbook', color: '#34d399' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as OomTab)}
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
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: The 4 Avenues */}
        {activeTab === 'four_avenues' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                1. Unbounded Streaming & Buffers
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <strong>Vulnerability:</strong> Buffering multipart uploads or file downloads into memory via <code>ByteArrayOutputStream</code> or <code>Files.readAllBytes()</code>.
                <br /><br />
                A single 200MB file uploaded concurrently by 10 users allocates 2GB of heap immediately, triggering instant Stop-the-World GC thrashing.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                2. Regex Backtracking & Strings
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <strong>Vulnerability:</strong> Masking sensitive tokens or credentials in log filters using naive regular expressions with nested quantifiers.
                <br /><br />
                Catastrophic backtracking pushes millions of activation stack frames and generates huge arrays of substring allocations, killing pods in seconds.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                3. Off-Heap & ThreadLocal Leaks
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <strong>Vulnerability:</strong> <code>DirectByteBuffer</code> allocations in Netty or gRPC where reference count buffers (<code>ReferenceCounted.release()</code>) are omitted on error paths.
                <br /><br />
                Also: <code>ThreadLocal</code> values stored without <code>remove()</code> in thread pools, anchoring massive user context objects for the process lifetime.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                4. Metaspace & ClassLoader Leaks
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <strong>Vulnerability:</strong> Dynamic bytecode generation frameworks (CGLIB, Spring AOP proxies, runtime Groovy script compilation, ObjectMapper re-creation).
                <br /><br />
                Each generated class creates a ClassLoader instance. If referenced by a static registry, the entire ClassLoader and Metaspace memory cannot be garbage collected.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ReDoS Simulator */}
        {activeTab === 'redos_explosion' && (
          <div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                  Input String Length: {redosLength} characters (e.g. &quot;aaaaaaaaaaaaaaaaaaaaaaaa!&quot;)
                </span>
                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800 }}>
                  Backtracking Steps: ~{redosStates.toLocaleString()} operations!
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="28"
                value={redosLength}
                onChange={(e) => setRedosLength(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div className="oom-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                  The Inocuous Token Masking Filter
                </div>
                <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`// Masking Bearer tokens in incoming HTTP headers for logging:
Pattern p = Pattern.compile(".*(bearer|token)\\s*=\\s*(.*)");

// When evaluating a header of ${redosLength} non-matching characters:
// The NFA backtracking tree explores O(2^N) state paths:
// 10 chars: ~1,024 steps (instant)
// 25 chars: ~33,554,432 steps (CPU 100%, 15s freeze)
// 35 chars: ~34,359,738,368 steps (POD TERMINATED BY WATCHDOG/OOM)`}
                </pre>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                  The Production Fix: Atomic Grouping & RE2/J
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>1. <strong>Use Possessive Quantifiers / Atomic Groups:</strong> Change <code>.*</code> to possessive <code>.*+</code> or <code>(?&gt;.*)</code> to forbid backtracking once matched.</p>
                  <p>2. <strong>Linear Regex Engines (RE2/J):</strong> Use Google&apos;s RE2/J library which uses a DFA (Deterministic Finite Automaton) guaranteeing strict $O(N)$ execution time regardless of input.</p>
                  <p>3. <strong>Substring Search instead of Regex:</strong> If searching for <code>bearer=</code>, simple <code>indexOf()</code> is 100x faster and memory-safe.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Sensory Metrics */}
        {activeTab === 'sensory_metrics' && (
          <div className="oom-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                The Trap of Looking ONLY at JVM Heap
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Often, your APM (Datadog, Prometheus) shows <strong>JVM Heap at only 45%</strong>, yet Kubernetes abruptly terminates the container with <code>Exit Code 137 (OOMKilled)</code>.</p>
                <p><strong>Total Container Memory =</strong>
                <br />• JVM Heap (<code>-Xmx</code>)
                <br />• Metaspace (Class metadata)
                <br />• Thread Stacks (<code>-Xss1m</code> × Thread Count)
                <br />• DirectByteBuffer & Netty Off-heap pools
                <br />• JIT CodeCache & Native JVM memory
                <br />• OS glibc malloc overhead & fragmentation</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Required Observability Sensors
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p><strong>1. Linux cgroup:</strong> Monitor <code>container_memory_working_set_bytes</code> vs <code>container_spec_memory_limit_bytes</code>. The OOMKiller fires when working set exceeds limit, ignoring heap size.</p>
                <p><strong>2. Native Memory Tracking (NMT):</strong> Launch with <code>-XX:NativeMemoryTracking=summary</code> and query with <code>jcmd &lt;pid&gt; VM.native_memory baseline / detail</code>.</p>
                <p><strong>3. Continuous Profilers:</strong> Deploy <em>async-profiler</em> in <code>alloc</code> mode to track exact byte allocation rates per method without Stop-the-World overhead.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Emergency Playbook */}
        {activeTab === 'incident_playbook' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '12px' }}>
              The 2:00 AM Emergency Triage Runbook (Step-by-Step)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { step: '1', title: 'Verify Exit Code 137', desc: 'Run `kubectl describe pod <pod-name>` or inspect `dmesg -T | grep -i oom`. Look for `oom-kill:constraint=CONSTRAINT_MEMCG`. Confirms container cgroup memory breach.' },
                { step: '2', title: 'Preserve the Heap Dump', desc: 'Ensure JVM flags `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dumps` are present on a persistent volume. If missing, capture live dump before crash: `jcmd <pid> GC.heap_dump /data/dump.hprof`.' },
                { step: '3', title: 'Check Native vs Heap Split', desc: 'If Heap Dump shows only 500MB used out of 2GB, the leak is off-heap or thread-count explosion. Check active threads: `jcmd <pid> Thread.print | grep "java.lang.Thread.State" | wc -l`.' },
                { step: '4', title: 'Immediate Stabilization', desc: 'Scale deployment horizontally to distribute traffic. If a single endpoint is triggering ReDoS, enable an API Gateway WAF rule or temporarily drop the offending header filter.' },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#34d399', color: '#0f172a', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px' }}>{item.title}</div>
                    <div style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
