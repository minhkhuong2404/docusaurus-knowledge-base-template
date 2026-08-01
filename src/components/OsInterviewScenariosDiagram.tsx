import React, { useState } from 'react';

const SCENARIOS = [
  {
    id: 'proc-thread', label: 'Process vs Thread', color: '#38bdf8',
    question: '"What is the difference between a process and a thread?"',
    points: [
      { title: 'Process — isolated unit', detail: 'A process has its own virtual address space, file descriptor table, signal handlers, and PID. Processes cannot access each other\'s memory without explicit IPC (pipes, sockets, shmem). Creation: fork() clones the parent. exec() loads a new program. Isolation makes processes crash-safe — a buggy child cannot corrupt the parent.', badge: 'fork() + exec()' },
      { title: 'Thread — shared execution within a process', detail: 'Threads share the same virtual address space, file descriptors, and heap as all other threads in the process. Each thread has its own stack, CPU registers, and program counter. Creation: pthread_create() (Linux), Thread() (Java). Much cheaper than fork() — no address space clone. Race conditions on shared memory require synchronization.', badge: 'pthread_create() / Thread()' },
      { title: 'Context switch cost', detail: 'Thread context switch: ~2–5μs (save/restore registers, switch stack). Process context switch: ~10–20μs (all thread costs + flush TLB for address space change). Virtual threads (Java 21): continuation-based park/resume — no kernel thread switch for blocking I/O.', badge: 'Thread: 2-5μs, Process: 10-20μs' },
      { title: 'Java model', detail: 'Java platform thread = 1:1 OS thread. Java 21 virtual threads: M:N — many virtual threads multiplexed over few OS carrier threads. JVM uses fork() only at OS level. Prefer virtual threads for I/O-bound work, platform threads for CPU-bound compute.', badge: 'Java 21: Virtual Thread (Loom)' },
    ],
  },
  {
    id: 'pagefault', label: 'Page Fault', color: '#34d399',
    question: '"Explain what happens when a program accesses an unmapped memory address."',
    points: [
      { title: 'CPU generates virtual address', detail: 'The CPU fetches an instruction that references a virtual address. The MMU tries to translate it via the TLB. TLB miss → page table walk. If the PTE has Present=0 → hardware triggers #PF exception (interrupt vector 14 on x86_64).', badge: 'MMU #PF exception' },
      { title: 'Kernel page fault handler (do_page_fault)', detail: 'The kernel exception handler runs. It reads the faulting address from CR2 register. Checks: is the address within a valid VMA of the process? If NO → send SIGSEGV (segfault) to process. If YES → determine fault type and handle.', badge: 'CR2 register = faulting address' },
      { title: 'Minor fault (no disk I/O)', detail: 'Anonymous page (heap/stack) accessed for first time → allocate physical frame, zero-fill, update PTE to Present=1. COW fault (fork() shared page write) → allocate new frame, copy page, update child PTE. Completion: ~1μs. Process resumes.', badge: 'Minor: ~1μs' },
      { title: 'Major fault (swap I/O required)', detail: 'Page was evicted to swap disk → kernel locates swap entry in PTE, issues block I/O to read 4KB page from swap → process sleeps in D state (uninterruptible) → on I/O completion: page placed in physical frame, PTE updated → process woken up. Cost: ~5–10ms.', badge: 'Major: ~5-10ms (disk I/O)' },
    ],
  },
  {
    id: 'mutex-sem', label: 'Mutex vs Semaphore', color: '#a78bfa',
    question: '"When would you use a mutex vs a semaphore?"',
    points: [
      { title: 'Mutex — ownership, mutual exclusion', detail: 'A mutex (binary lock) can only be released by the thread that acquired it. This ownership semantic prevents priority inversion bugs. Use mutex for protecting a shared data structure where only one thread should read/write at a time. Java: synchronized block or ReentrantLock.', badge: 'Binary · Ownership required' },
      { title: 'Semaphore — signaling, counting', detail: 'A semaphore has NO ownership. Any thread can acquire or release it. A counting semaphore(N) allows up to N concurrent accesses. Use for: connection pool of N slots, producer-consumer signaling (producer sem.release(), consumer sem.acquire()), rate limiting. Java: Semaphore(N).', badge: 'Counting · No ownership' },
      { title: 'Classic use case: producer-consumer', detail: 'Producer: sem_post(&full_slots) after producing. Consumer: sem_wait(&full_slots) before consuming. A mutex guards the shared queue; the semaphore signals "items available." Separating locking (mutex) from signaling (semaphore) is cleaner than using one primitive for both.', badge: 'Producer-Consumer pattern' },
      { title: 'ReentrantLock vs synchronized', detail: 'ReentrantLock: same thread can re-acquire (no deadlock on recursion), tryLock(timeout), interruptible lock. synchronized: simpler, JVM-optimized (biased locking, thin lock), monitor-based wait/notify. Prefer synchronized for simple cases, ReentrantLock for advanced control.', badge: 'Java: ReentrantLock / synchronized' },
    ],
  },
  {
    id: 'fork', label: 'How fork() Works', color: '#fbbf24',
    question: '"Walk me through what happens when a process calls fork()."',
    points: [
      { title: 'fork() creates a child process', detail: 'sys_fork() → copy_process(): creates a new task_struct (process descriptor) with a new PID. Duplicates the parent\'s page table (but NOT physical memory — COW). Copies file descriptor table, signal handlers, and CPU registers. Child gets return value 0; parent gets child\'s PID.', badge: 'child gets pid=0 return' },
      { title: 'Copy-on-Write address space', detail: 'Parent and child initially share all physical pages (all PTEs marked read-only + COW bit). First write to any shared page triggers a COW fault → kernel allocates new frame, copies page, updates the writer\'s PTE. fork() is O(page_table_size), not O(address_space_size).', badge: 'COW: pages shared until write' },
      { title: 'fork()+exec() pattern', detail: 'Child immediately calls exec() → replaces its address space entirely (new ELF loaded). COW pages never copied (they\'re discarded by exec()). This makes fork()+exec() efficient for launching new programs. Shell commands work this way: bash fork() → child exec("ls").', badge: 'exec() discards COW pages' },
      { title: 'vfork() and posix_spawn()', detail: 'vfork(): child borrows parent\'s address space (no copy at all). Parent is suspended until child calls exec() or exit(). Used by musl libc for high-performance process creation. posix_spawn(): atomic fork+exec without race conditions. Java\'s ProcessBuilder uses vfork/posix_spawn on modern Linux.', badge: 'Java: ProcessBuilder → posix_spawn' },
    ],
  },
];

export default function OsInterviewScenariosDiagram(): React.JSX.Element {
  const [activeScenario, setActiveScenario] = useState<string>('proc-thread');
  const [expanded, setExpanded] = useState<number | null>(null);
  const scenario = SCENARIOS.find(s => s.id === activeScenario)!;

  const handleChange = (id: string) => { setActiveScenario(id); setExpanded(null); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>OS Interview Scenarios — Senior Level</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => handleChange(s.id)}
              style={{ flex: 1, padding: '8px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: activeScenario === s.id ? `${s.color}18` : 'rgba(255,255,255,0.04)', color: activeScenario === s.id ? s.color : 'var(--ifm-color-content-secondary)', boxShadow: activeScenario === s.id ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ background: `${scenario.color}0d`, border: `1px solid ${scenario.color}30`, borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: scenario.color }}>{scenario.question}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {scenario.points.map((p, i) => {
            const isExp = expanded === i;
            return (
              <div key={i} onClick={() => setExpanded(isExp ? null : i)}
                style={{ background: isExp ? `${scenario.color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isExp ? scenario.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: '9px', padding: '10px 14px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: scenario.color, background: `${scenario.color}18`, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ifm-color-content)', flex: 1 }}>{p.title}</span>
                  <code style={{ fontSize: '9.5px', color: scenario.color, background: `${scenario.color}15`, border: `1px solid ${scenario.color}30`, borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>{p.badge}</code>
                </div>
                {isExp && <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '10px 0 0 32px', lineHeight: 1.65 }}>{p.detail}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}