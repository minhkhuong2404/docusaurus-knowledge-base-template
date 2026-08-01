import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'User code calls glibc wrapper', color: '#38bdf8', note: 'Your C/Java code calls a standard library function: write(fd, buf, n). The glibc function is a thin wrapper that prepares syscall arguments in specific CPU registers (x86_64: RAX=syscall number, RDI/RSI/RDX/R10/R8/R9 = args).' },
  { id: 2, label: 'SYSCALL instruction executed', color: '#38bdf8', note: 'The SYSCALL instruction (x86_64) atomically: saves RIP (instruction pointer) and RSP (stack pointer), loads kernel entry point from MSR_LSTAR register, switches to kernel stack, enters Ring 0 privilege level. Total transition: ~200ns.' },
  { id: 3, label: 'Kernel entry: entry_SYSCALL_64', color: '#a78bfa', note: 'The kernel entry point saves all userspace registers (PUSH_AND_CLEAR_REGS macro). Reads syscall number from RAX. Validates number < NR_syscalls. Calls do_syscall_64().' },
  { id: 4, label: 'sys_call_table lookup', color: '#a78bfa', note: 'do_syscall_64 looks up the function pointer in sys_call_table[syscall_number]. x86_64 Linux has ~448 system calls. The table is read-only (protected from modification). Kernel security: SMEP/SMAP prevent kernel from executing/accessing user memory.' },
  { id: 5, label: 'Kernel handler executes', color: '#34d399', note: 'The specific kernel handler runs with full Ring 0 privileges: e.g., sys_write() → checks fd validity → copies data from userspace to kernel buffer → calls filesystem write path → returns bytes written. Kernel accesses hardware directly.' },
  { id: 6, label: 'SYSRET returns to user space', color: '#34d399', note: 'SYSRET instruction: restores userspace registers, switches back to Ring 3, resumes execution at the instruction after SYSCALL. Return value in RAX (negative errno on error). glibc wrapper checks RAX, sets errno if negative, returns to caller.' },
];

const COMMON_SYSCALLS = [
  { nr: 0, name: 'read(fd, buf, count)', color: '#38bdf8', layer: 'VFS' },
  { nr: 1, name: 'write(fd, buf, count)', color: '#38bdf8', layer: 'VFS' },
  { nr: 2, name: 'open(path, flags)', color: '#38bdf8', layer: 'VFS' },
  { nr: 3, name: 'close(fd)', color: '#38bdf8', layer: 'VFS' },
  { nr: 57, name: 'fork()', color: '#34d399', layer: 'Process' },
  { nr: 59, name: 'execve(path, argv)', color: '#34d399', layer: 'Process' },
  { nr: 60, name: 'exit(status)', color: '#34d399', layer: 'Process' },
  { nr: 9, name: 'mmap(addr, len, …)', color: '#fbbf24', layer: 'Memory' },
  { nr: 11, name: 'munmap(addr, len)', color: '#fbbf24', layer: 'Memory' },
  { nr: 41, name: 'socket(domain, type)', color: '#a78bfa', layer: 'Network' },
  { nr: 42, name: 'connect(fd, addr)', color: '#a78bfa', layer: 'Network' },
  { nr: 45, name: 'recvfrom(fd, buf, …)', color: '#a78bfa', layer: 'Network' },
];

export default function OsLinuxSyscallsDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [layerFilter, setLayerFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };
  const layers = [...new Set(COMMON_SYSCALLS.map(s => s.layer))];
  const filtered = layerFilter ? COMMON_SYSCALLS.filter(s => s.layer === layerFilter) : COMMON_SYSCALLS;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .os-syscall-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Linux System Call Internals</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#a78bfa', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(167,139,250,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="os-syscall-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Syscall flow */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>System Call Lifecycle (SYSCALL / SYSRET)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {STEPS.map((step, i) => {
                const isActive = activeStep !== null && i <= activeStep;
                const isCurrent = activeStep === i;
                const isKernel = i >= 2 && i <= 4;
                return (
                  <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', opacity: isActive ? 1 : activeStep !== null ? 0.22 : 0.7, transition: 'opacity 0.4s ease' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: step.color, background: `${step.color}18`, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.id}</span>
                      {isKernel && <div style={{ width: '2px', height: '8px', background: `${step.color}30` }} />}
                    </div>
                    <div style={{ flex: 1, background: isActive ? `${step.color}0d` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? step.color + '35' : 'rgba(255,255,255,0.07)'}`, borderRadius: '7px', padding: '7px 10px', transition: 'all 0.3s ease', borderLeft: isKernel ? `3px solid ${step.color}40` : undefined }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: isActive ? step.color : 'var(--ifm-color-content)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {step.label}
                        {isKernel && <span style={{ fontSize: '9px', color: step.color, background: `${step.color}15`, borderRadius: '3px', padding: '1px 4px' }}>Ring 0</span>}
                      </div>
                      {isCurrent && <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>{step.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Common syscalls reference */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Common Syscalls Reference</div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setLayerFilter(null)}
                style={{ padding: '4px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, background: layerFilter === null ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)', color: layerFilter === null ? 'var(--ifm-color-content)' : 'var(--ifm-color-content-secondary)', transition: 'all 0.2s ease' }}>All</button>
              {layers.map(l => {
                const c = COMMON_SYSCALLS.find(s => s.layer === l)!.color;
                return (
                  <button key={l} onClick={() => setLayerFilter(layerFilter === l ? null : l)}
                    style={{ padding: '4px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, background: layerFilter === l ? `${c}20` : 'rgba(255,255,255,0.04)', color: layerFilter === l ? c : 'var(--ifm-color-content-secondary)', boxShadow: layerFilter === l ? `0 0 0 1px ${c}50` : 'none', transition: 'all 0.2s ease' }}>{l}</button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
              {filtered.map(s => (
                <div key={s.nr} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px 9px' }}>
                  <span style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', minWidth: '28px', textAlign: 'right', fontFamily: 'monospace' }}>{s.nr}</span>
                  <code style={{ fontSize: '10.5px', color: s.color, flex: 1 }}>{s.name}</code>
                  <span style={{ fontSize: '9px', color: s.color, background: `${s.color}15`, borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>{s.layer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}