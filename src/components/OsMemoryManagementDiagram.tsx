import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'CPU issues virtual address', color: '#38bdf8', detail: 'The CPU generates a virtual address from the executing instruction (e.g., MOV RAX, [0x7fff1234]). The virtual address is sent to the MMU (Memory Management Unit) hardware on every memory access.' },
  { id: 2, label: 'TLB Lookup (Translation Lookaside Buffer)', color: '#34d399', detail: 'The MMU first checks the TLB — a small, fast hardware cache of recent virtual→physical page translations. TLB has ~64–2048 entries. If the translation is cached → TLB HIT: return physical address immediately (~1 cycle).' },
  { id: 3, label: 'TLB HIT → Physical Address', color: '#34d399', detail: 'TLB hit: physical address is formed by combining the physical page frame number from TLB with the byte offset from the virtual address. Memory access completes in ~4–5 cycles total. TLB hit rate > 99% for most workloads due to spatial/temporal locality.' },
  { id: 4, label: 'TLB MISS → Walk Page Table', color: '#fbbf24', detail: 'TLB miss: MMU hardware walks the multi-level page table (x86_64: 4 levels — PML4 → PDPT → PD → PT) in physical memory. Each level is a separate memory read (~100ns each). Total: ~400ns for a full 4-level walk. Costly — avoid large working sets that exceed TLB capacity.' },
  { id: 5, label: 'Page Table Entry (PTE) checked', color: '#a78bfa', detail: 'The PTE contains: physical frame number (PFN), Present bit, Dirty bit, Accessed bit, User/Supervisor bit, NX (no-execute) bit. If Present=0 → page fault! The OS page fault handler runs.' },
  { id: 6, label: 'Page Fault Handler', color: '#f97316', detail: 'Minor fault: page exists in process VMA but no physical frame allocated (demand paging) → allocate frame, zero-fill, update PTE, resume. Major fault: page evicted to swap disk → read from swap (milliseconds!). Copy-on-Write fault: fork() shared page written → allocate new frame, copy, update PTE.' },
  { id: 7, label: 'Physical Memory Access', color: '#34d399', detail: 'Physical address is used to access DRAM. Cache hierarchy checked first: L1 (~4 cycles) → L2 (~12 cycles) → L3 (~40 cycles) → DRAM (~200 cycles). Translation result added to TLB for future fast lookups.' },
];

const PAGE_ALGOS = [
  { id: 'fifo', label: 'FIFO', color: '#f87171', desc: 'Evict oldest page loaded. Simple but suffers Bélády\'s anomaly: more frames can cause more faults.' },
  { id: 'lru', label: 'LRU', color: '#38bdf8', desc: 'Evict least recently used page. Approximates optimal. Linux uses clock/active+inactive list approximation.' },
  { id: 'clock', label: 'Clock (Second Chance)', color: '#34d399', desc: 'Circular buffer with reference bit. If bit=1: clear and skip. If bit=0: evict. Linux clock algorithm.' },
  { id: 'optimal', label: 'Optimal (Theoretical)', color: '#a78bfa', desc: 'Evict page used furthest in the future. Impossible in practice (requires future knowledge). Benchmark baseline.' },
];

export default function OsMemoryManagementDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number | null>(null);
  const [pageAlgo, setPageAlgo] = useState('lru');
  const [playing, setPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setStep(animStep); setAnimStep(s => s + 1); }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setStep(null); setAnimStep(0); setPlaying(true); };
  const algo = PAGE_ALGOS.find(a => a.id === pageAlgo)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Memory Management — Virtual→Physical Translation</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#34d399', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(52,211,153,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Address translation steps */}
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Address Translation Flow (click any step)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {STEPS.map((s, i) => {
            const isActive = step !== null && i <= step;
            const isCurrent = step === i;
            return (
              <div key={s.id} onClick={() => setStep(step === i ? null : i)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', opacity: isActive ? 1 : step !== null ? 0.25 : 0.7, transition: 'opacity 0.4s ease' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: s.color, background: `${s.color}18`, borderRadius: '50%', minWidth: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.id}</span>
                <div style={{ flex: 1, background: isActive ? `${s.color}0d` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? s.color + '35' : 'rgba(255,255,255,0.07)'}`, borderRadius: '7px', padding: '7px 10px', transition: 'all 0.3s ease' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: isActive ? s.color : 'var(--ifm-color-content)', marginBottom: isCurrent ? '5px' : 0 }}>{s.label}</div>
                  {isCurrent && <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>{s.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Page replacement */}
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Page Replacement Algorithms</div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {PAGE_ALGOS.map(a => (
            <button key={a.id} onClick={() => setPageAlgo(a.id)}
              style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: pageAlgo === a.id ? `${a.color}18` : 'rgba(255,255,255,0.04)', color: pageAlgo === a.id ? a.color : 'var(--ifm-color-content-secondary)', boxShadow: pageAlgo === a.id ? `0 0 0 1.5px ${a.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {a.label}
            </button>
          ))}
        </div>
        <div style={{ background: `${algo.color}0d`, border: `1px solid ${algo.color}30`, borderRadius: '8px', padding: '10px 12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{algo.desc}</p>
        </div>
      </div>
    </div>
  );
}