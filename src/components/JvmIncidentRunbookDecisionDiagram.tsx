import React, { useState } from 'react';

type IncidentCategory = 'oom-killer' | 'heap-oom' | 'metaspace-oom' | 'thread-oom' | 'cpu-single' | 'cpu-gc' | 'high-latency';

interface IncidentTriage {
  id: IncidentCategory;
  title: string;
  badge: string;
  badgeColor: string;
  symptom: string;
  rootCause: string;
  commands: string[];
  actionSteps: string[];
}

const TRIAGE_PATHS: IncidentTriage[] = [
  {
    id: 'oom-killer',
    title: 'Container OOMKilled (Exit Code 137, No Java OOM)',
    badge: 'NATIVE / OFF-HEAP LEAK',
    badgeColor: '#f87171',
    symptom: 'Kubernetes pod or Docker container terminated abruptly (Exit 137 / dmesg "Killed process"). No OutOfMemoryError in application logs.',
    rootCause: 'Resident Set Size (RSS) exceeded cgroup memory limit due to Off-Heap allocations (DirectByteBuffers, JNI native memory, zlib, or thread stacks).',
    commands: [
      '# 1. Enable Native Memory Tracking (NMT) on startup:',
      '-XX:NativeMemoryTracking=detail -XX:+UnlockDiagnosticVMOptions',
      '# 2. Baseline and diff native memory in production:',
      'jcmd <pid> VM.native_memory baseline',
      'jcmd <pid> VM.native_memory detail.diff',
      '# 3. Check DirectByteBuffer buffer pool via JMX:',
      'jcmd <pid> GC.run'
    ],
    actionSteps: [
      'Compare NMT diff output to identify which native category grew (Internal, Direct Memory, Threads, or Symbol).',
      'Inspect Netty / gRPC byte buffer pooling and ensure ByteBuf.release() is called.',
      'Check container memory limits vs JVM MaxRAMPercentage (leave at least 25-30% buffer for off-heap).'
    ]
  },
  {
    id: 'heap-oom',
    title: 'OutOfMemoryError: Java heap space / GC overhead limit',
    badge: 'HEAP MEMORY LEAK',
    badgeColor: '#fbbf24',
    symptom: 'Application throws `java.lang.OutOfMemoryError: Java heap space` or `GC overhead limit exceeded`. Throughput drops to 0.',
    rootCause: 'Strong reference chain prevents Garbage Collector from reclaiming unreachable or unbounded memory (e.g. static HashMaps, unevicted caches).',
    commands: [
      '# 1. Capture class histogram on live JVM:',
      'jcmd <pid> GC.class_histogram | head -30',
      '# 2. Capture complete HPROF heap dump:',
      'jcmd <pid> GC.heap_dump /tmp/heap.hprof',
      '# 3. Recommended automated startup flag:',
      '-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/heap.hprof'
    ],
    actionSteps: [
      'Open `/tmp/heap.hprof` in Eclipse MAT or JProfiler.',
      'Run "Leak Suspects Report" and inspect the Dominator Tree sorted by Retained Heap.',
      'Find "Path to GC Roots" excluding weak/soft references to locate the leaking static field or cache.'
    ]
  },
  {
    id: 'metaspace-oom',
    title: 'OutOfMemoryError: Metaspace',
    badge: 'CLASSLOADER LEAK',
    badgeColor: '#a78bfa',
    symptom: 'Application crashes with `java.lang.OutOfMemoryError: Metaspace`.',
    rootCause: 'Dynamic proxies (CGLIB, ByteBuddy, Spring AOP) or custom classloaders are generating classes repeatedly without unloading.',
    commands: [
      '# 1. Inspect classloader statistics:',
      'jcmd <pid> VM.classloaders',
      '# 2. Inspect Metaspace memory chunks:',
      'jcmd <pid> VM.metaspace',
      '# 3. Enable class unloading logging:',
      '-Xlog:class+unload=info'
    ],
    actionSteps: [
      'Identify if class definitions are continuously being created without being garbage-collected.',
      'Cap Metaspace growth to prevent memory exhaustion: `-XX:MaxMetaspaceSize=512m`.',
      'Fix dynamic proxy generation libraries reusing existing class definitions.'
    ]
  },
  {
    id: 'thread-oom',
    title: 'OutOfMemoryError: unable to create new native thread',
    badge: 'THREAD LEAK',
    badgeColor: '#f97316',
    symptom: '`java.lang.OutOfMemoryError: unable to create new native thread` thrown during request handling.',
    rootCause: 'Thread count exceeded OS `max user processes` (`ulimit -u`) or OS virtual memory address space is exhausted by thread stacks (`-Xss`).',
    commands: [
      '# 1. Count threads by state:',
      'jcmd <pid> Thread.print > /tmp/threads.txt',
      'grep "java.lang.Thread.State" /tmp/threads.txt | sort | uniq -c',
      '# 2. Check OS process limit:',
      'ulimit -u',
      'cat /proc/sys/kernel/threads-max'
    ],
    actionSteps: [
      'Inspect thread dump for unbounded `new Thread()` or `Executors.newCachedThreadPool()` invocations.',
      'Enforce bounded thread pool sizes in Spring / Tomcat (`server.tomcat.threads.max=200`).',
      'Increase OS process limits in `/etc/security/limits.conf` if legitimately needed.'
    ]
  },
  {
    id: 'cpu-single',
    title: 'CPU 100%: Single Hot Thread (Infinite Loop / Regex)',
    badge: 'HOT APPLICATION PATH',
    badgeColor: '#34d399',
    symptom: 'Total CPU pegged at 100% (or single core 100%), application unresponsive on specific API endpoints.',
    rootCause: 'Infinite loop, catastrophic regex backtracking, or hash collisions in legacy collection loops.',
    commands: [
      '# 1. Find hot OS thread ID:',
      'top -H -p <pid>',
      '# 2. Convert decimal TID (e.g. 18742) to hex:',
      'printf "%x\\n" 18742  # ➔ 0x4936',
      '# 3. Capture thread dump and grep for nid:',
      'jcmd <pid> Thread.print > /tmp/threads.txt',
      'grep -A 20 "nid=0x4936" /tmp/threads.txt'
    ],
    actionSteps: [
      'Examine the top stack frame in the thread dump corresponding to `nid=0x4936`.',
      'Look for while loops with missing exit criteria, complex regexes, or unbounded recursion.',
      'Deploy code patch or hotfix regex pattern.'
    ]
  },
  {
    id: 'cpu-gc',
    title: 'CPU 100%: Multiple Threads High (GC Death Spiral)',
    badge: 'GC STORM',
    badgeColor: '#f87171',
    symptom: '`top -H` shows many GC threads (e.g. `GC Thread#0`, `G1 Conc#0`) all consuming CPU simultaneously.',
    rootCause: 'Heap is near 100% capacity; JVM spends >98% of CPU time running Full GCs trying to free memory.',
    commands: [
      '# 1. Check GC frequency and pause times:',
      'jstat -gcutil <pid> 1000 10',
      '# Look for Old Gen (O) > 98% and FGC incrementing every second',
      '# 2. Capture immediate heap dump before JVM crashes:',
      'jcmd <pid> GC.heap_dump /tmp/gc_spiral.hprof'
    ],
    actionSteps: [
      'Verify if Old Gen is permanently filled (Memory Leak) or allocation rate is too high (Memory Churn).',
      'Temporarily increase JVM heap size (`-Xmx`) to buy headroom.',
      'Analyze heap dump in MAT to eliminate the leak source.'
    ]
  },
  {
    id: 'high-latency',
    title: 'High Latency but CPU is Low/Normal',
    badge: 'I/O / LOCK STARVATION',
    badgeColor: '#38bdf8',
    symptom: 'API response times increase to 10s+, but CPU usage is low (10–20%).',
    rootCause: 'Threads blocked on database connection pool (HikariCP exhaustion), external HTTP calls, or distributed locks.',
    commands: [
      '# 1. Run async-profiler in wall-clock mode (captures I/O + off-CPU locks):',
      './asprof -e wall -d 30 -f /tmp/wall_profile.html <pid>',
      '# 2. Count blocked threads in thread dump:',
      'jcmd <pid> Thread.print | grep "java.lang.Thread.State: BLOCKED" | wc -l',
      '# 3. Check HikariCP active vs idle connections via Actuator metrics'
    ],
    actionSteps: [
      'Inspect wall-clock flame graph for long socketRead0() or database query executions.',
      'Add HTTP client timeouts (e.g. 2s connect / 5s read) to prevent downstream hanging.',
      'Tune connection pool size and slow SQL queries.'
    ]
  }
];

export default function JvmIncidentRunbookDecisionDiagram(): React.JSX.Element {
  const [selectedPath, setSelectedPath] = useState<IncidentCategory>('oom-killer');

  const current = TRIAGE_PATHS.find((p) => p.id === selectedPath) ?? TRIAGE_PATHS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .triage-grid {
          display: grid;
          grid-template-columns: 36% 64%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .triage-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          JVM Production Incident Triage & Runbook Decision Tree
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor, fontWeight: 600 }}>
          {current.badge}
        </span>
      </div>

      {/* Main Grid */}
      <div style={{ padding: '16px' }}>
        <div className="triage-grid">
          {/* Left Column: Symptom List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              Select Observed Production Symptom:
            </div>
            {TRIAGE_PATHS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPath(p.id)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${selectedPath === p.id ? p.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
                  background: selectedPath === p.id ? `${p.badgeColor}15` : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '12px', color: selectedPath === p.id ? p.badgeColor : 'var(--ifm-color-content)' }}>
                  {p.title.split(':')[0]}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  {p.badge}
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Diagnostic Playbook */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor }}>
                DIAGNOSTIC PATH
              </span>
              <h4 style={{ margin: 0, fontSize: '14px', color: current.badgeColor }}>
                {current.title}
              </h4>
            </div>

            {/* Symptom & Root Cause Box */}
            <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderLeft: `3px solid ${current.badgeColor}`, fontSize: '11px', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '2px' }}>Symptom: {current.symptom}</div>
              <div style={{ color: 'var(--ifm-color-content-secondary)' }}><strong>Root Cause:</strong> {current.rootCause}</div>
            </div>

            {/* CLI Commands */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              Runbook Diagnostic Commands:
            </div>
            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', fontSize: '11px', lineHeight: 1.4, overflowX: 'auto', border: '1px solid var(--ifm-color-emphasis-300)', marginBottom: '12px' }}>
              <code>{current.commands.join('\n')}</code>
            </pre>

            {/* Action Steps */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
              Recommended Resolution Steps:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {current.actionSteps.map((step, i) => (
                <div key={i} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', display: 'flex', alignItems: 'start', gap: '6px' }}>
                  <span style={{ color: current.badgeColor, fontWeight: 700 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
