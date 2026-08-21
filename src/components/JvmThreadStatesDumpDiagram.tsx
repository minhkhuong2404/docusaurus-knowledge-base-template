import React, { useState } from 'react';

type ThreadStateId = 'RUNNABLE' | 'BLOCKED' | 'WAITING' | 'TIMED_WAITING' | 'TERMINATED';

interface ThreadStateDetail {
  id: ThreadStateId;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  dumpSnippet: string;
  cpuBehavior: string;
  diagnosisTip: string;
  commonCauses: string[];
}

const THREAD_STATES: ThreadStateDetail[] = [
  {
    id: 'RUNNABLE',
    name: 'RUNNABLE',
    badge: 'ON CPU / READY',
    badgeColor: '#34d399',
    description: 'The thread is actively executing on a CPU core, waiting in the OS run queue, or blocked on an OS syscall (e.g., socket read / file I/O).',
    dumpSnippet: `"http-nio-8080-exec-1" #24 daemon prio=5 os_prio=0 cpu=99.2%
   tid=0x00007f3c8c001000 nid=0x4936 runnable [0x00007f3c7e9fe000]
   java.lang.Thread.State: RUNNABLE
        at com.example.service.OrderService.computePrice(OrderService.java:312)
        at com.example.service.OrderService.processOrder(OrderService.java:201)
        at java.lang.Thread.run(Thread.java:840)`,
    cpuBehavior: 'High CPU if in a tight loop or algorithm; Low CPU if blocked in socketRead0() syscall.',
    diagnosisTip: 'If seen at the exact same line across 3 consecutive thread dumps (5s apart) with high CPU ➔ Infinite loop or regex backtracking.',
    commonCauses: [
      'Active application calculation or JSON serialization',
      'Infinite loop or unbounded recursion',
      'Catastrophic regex backtracking (CPU pinned at 100%)',
      'Blocked on network socket read (OS syscall reported as RUNNABLE by JVM)'
    ]
  },
  {
    id: 'BLOCKED',
    name: 'BLOCKED',
    badge: 'MONITOR LOCK CONTENTION',
    badgeColor: '#f87171',
    description: 'The thread is suspended, waiting to acquire an intrinsic Java monitor lock (synchronized block/method) currently held by another thread.',
    dumpSnippet: `"http-nio-8080-exec-2" #25 daemon prio=5 os_prio=0
   tid=0x00007f3c8c002800 nid=0x4937 waiting for monitor entry [0x00007f3c7e8fd000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at com.example.service.InventoryService.reserveStock(InventoryService.java:85)
        - waiting to lock <0x000000076b8a3e10> (a java.lang.Object)
        at com.example.service.OrderService.processOrder(OrderService.java:205)`,
    cpuBehavior: 'Near 0% CPU consumption. Thread is unscheduled by OS scheduler.',
    diagnosisTip: 'Search the thread dump for the lock address (e.g. `0x000000076b8a3e10`) to find which thread is holding (`- locked <...>`) the monitor!',
    commonCauses: [
      'Synchronized block wrapping slow database call or HTTP request',
      'Deadlock (circular wait between two or more threads)',
      'Severe bottleneck on a shared synchronized singleton or cache'
    ]
  },
  {
    id: 'WAITING',
    name: 'WAITING',
    badge: 'PARKED INDEFINITELY',
    badgeColor: '#a78bfa',
    description: 'The thread is waiting indefinitely for another thread to perform a specific action (e.g., notify(), unpark(), or queue take()).',
    dumpSnippet: `"pool-1-thread-5" #32 prio=5 os_prio=0
   tid=0x00007f3c8c004000 nid=0x4938 waiting on condition [0x00007f3c7e7fc000]
   java.lang.Thread.State: WAITING (parking)
        at jdk.internal.misc.Unsafe.park(Native Method)
        - parking to wait for  <0x000000076c112230> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)
        at java.util.concurrent.locks.LockSupport.park(LockSupport.java:371)`,
    cpuBehavior: '0% CPU. Thread is sleeping in kernel wait queue.',
    diagnosisTip: 'Normal for idle worker threads in a ThreadPoolExecutor or HikariCP pool waiting for new tasks/connections.',
    commonCauses: [
      'Idle thread in thread pool waiting on BlockingQueue.take()',
      'Waiting on Object.wait() without timeout',
      'Parked on ReentrantLock / CompletableFuture.get()',
      'Thread pool exhaustion if all threads are waiting on downstream RPC'
    ]
  },
  {
    id: 'TIMED_WAITING',
    name: 'TIMED_WAITING',
    badge: 'PARKED WITH TIMEOUT',
    badgeColor: '#fbbf24',
    description: 'The thread is sleeping or waiting with a specified timeout limit (e.g., Thread.sleep(ms), Object.wait(timeout), LockSupport.parkNanos()).',
    dumpSnippet: `"HikariPool-1 housekeeper" #18 daemon prio=5 os_prio=0
   tid=0x00007f3c8c005800 nid=0x4939 waiting on condition [0x00007f3c7e6fb000]
   java.lang.Thread.State: TIMED_WAITING (sleeping)
        at java.lang.Thread.sleep(Native Method)
        at com.zaxxer.hikari.pool.HikariPool$HouseKeeper.run(HikariPool.java:620)`,
    cpuBehavior: '0% CPU while sleeping.',
    diagnosisTip: 'Look at the stack trace: Thread.sleep() indicates retry backoff or polling; parkNanos() indicates lock timeouts or queue poll(timeout).',
    commonCauses: [
      'Scheduled background timers and housekeeping threads',
      'Lock acquisition with timeout: lock.tryLock(5, TimeUnit.SECONDS)',
      'Socket connection timeouts: socket.connect(endpoint, timeout)',
      'Thread.sleep() in retry or polling loops'
    ]
  },
  {
    id: 'TERMINATED',
    name: 'TERMINATED',
    badge: 'EXITED',
    badgeColor: 'var(--ifm-color-content-secondary)',
    description: 'The thread has completed execution of its run() method or was terminated due to an uncaught exception.',
    dumpSnippet: `"task-finisher-1" #99 prio=5
   java.lang.Thread.State: TERMINATED
   (Thread object exists in heap but OS thread has been destroyed)`,
    cpuBehavior: '0% CPU. OS thread resource has been released.',
    diagnosisTip: 'Rarely visible in live dumps as the JVM reaps thread entries rapidly upon completion.',
    commonCauses: [
      'Task completed its execution cycle',
      'Uncaught RuntimeException terminated the thread without catching'
    ]
  }
];

export default function JvmThreadStatesDumpDiagram(): React.JSX.Element {
  const [selectedState, setSelectedState] = useState<ThreadStateId>('RUNNABLE');

  const current = THREAD_STATES.find((s) => s.id === selectedState) ?? THREAD_STATES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .jvm-thread-grid {
          display: grid;
          grid-template-columns: 32% 68%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .jvm-thread-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          JVM Thread States in Production Thread Dumps
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor, fontWeight: 600 }}>
          {current.badge}
        </span>
      </div>

      {/* Main Grid */}
      <div style={{ padding: '16px' }}>
        <div className="jvm-thread-grid">
          {/* Left Column: State Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {THREAD_STATES.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedState(st.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${selectedState === st.id ? st.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
                  background: selectedState === st.id ? `${st.badgeColor}15` : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: selectedState === st.id ? st.badgeColor : 'var(--ifm-color-content)' }}>
                    {st.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                    {st.badge}
                  </div>
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.badgeColor }} />
              </button>
            ))}

            {/* 3-Dump Rule Callout */}
            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '11px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>💡 Golden Rule: 3 Dumps</div>
              <div style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                Always take <strong>3 dumps at 5s intervals</strong>. A single BLOCKED thread may just be transient handoff; persistent BLOCKED across all 3 indicates real lock contention or deadlock.
              </div>
            </div>
          </div>

          {/* Right Column: Deep-Dive Dump Inspector */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', color: current.badgeColor }}>
                State: {current.name}
              </h4>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor }}>
                {current.badge}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.description}
            </p>

            {/* Thread Dump Snippet */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              Real-World Thread Dump Snippet:
            </div>
            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', fontSize: '11px', lineHeight: 1.4, overflowX: 'auto', border: '1px solid var(--ifm-color-emphasis-300)', marginBottom: '12px' }}>
              <code>{current.dumpSnippet}</code>
            </pre>

            {/* Diagnosis & Behavior */}
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '8px', marginBottom: '12px', fontSize: '11px' }}>
              <div style={{ padding: '8px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#fbbf24' }}>CPU Consumption:</strong>
                <div style={{ color: 'var(--ifm-color-content)', marginTop: '2px' }}>{current.cpuBehavior}</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#38bdf8' }}>Diagnostic Action:</strong>
                <div style={{ color: 'var(--ifm-color-content)', marginTop: '2px' }}>{current.diagnosisTip}</div>
              </div>
            </div>

            {/* Common Causes */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
              Common Causes & Scenarios:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {current.commonCauses.map((cause, i) => (
                <div key={i} style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: current.badgeColor }}>•</span> <span>{cause}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
