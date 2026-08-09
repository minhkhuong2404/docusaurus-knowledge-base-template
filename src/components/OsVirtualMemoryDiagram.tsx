import React, { useState } from 'react';

const TABS = [
  {
    id: 'demand', label: 'Demand Paging', color: '#38bdf8',
    overview: 'Demand paging loads pages from disk only when first accessed — not at process load time. This enables processes to use more virtual memory than physical RAM, and starts programs faster (only the needed code pages are loaded).',
    steps: [
      { n: 1, label: 'Process accesses virtual page P', detail: 'CPU fetches instruction that references virtual address 0x7fff1000. MMU begins translation.' },
      { n: 2, label: 'PTE Present bit = 0 → Page Fault', detail: 'MMU finds PTE with Present=0. Triggers hardware #PF exception. Control transfers to kernel page fault handler (do_page_fault on Linux).' },
      { n: 3, label: 'Kernel checks VMA', detail: 'Kernel checks if the faulted address is within a valid Virtual Memory Area (VMA). Valid → continue. Invalid → SIGSEGV sent to process (segfault).' },
      { n: 4, label: 'Allocate physical frame', detail: 'Kernel calls alloc_page() to get a free physical frame from buddy allocator. If no free frames → page replacement algorithm runs to evict a victim page.' },
      { n: 5, label: 'Read page from disk / zero-fill', detail: 'For anonymous pages (heap/stack): zero-fill the new frame (security). For file-backed pages: issue a block I/O read from the backing file. Process sleeps until I/O completes (major fault: ~1–10ms).' },
      { n: 6, label: 'Update PTE, resume process', detail: 'Kernel updates the PTE: set physical frame number, Present=1, Dirty=0. The faulting instruction is re-executed. Process resumes transparently.' },
    ],
  },
  {
    id: 'cow', label: 'Copy-on-Write (fork)', color: '#34d399',
    overview: 'When fork() creates a child process, the OS does NOT copy the parent\'s entire address space. Instead, both processes share the same physical pages with Copy-on-Write (COW) semantics — pages are only duplicated when actually modified.',
    steps: [
      { n: 1, label: 'fork() called', detail: 'fork() creates a new process (child). The child\'s page table entries initially point to the SAME physical pages as the parent. Both PTEs are marked read-only.' },
      { n: 2, label: 'Parent/child read shared pages', detail: 'Both processes can read shared pages freely — no copy needed. This makes fork() extremely fast: only page table structures are copied, not physical memory.' },
      { n: 3, label: 'Process writes to shared page', detail: 'When either process writes to a shared page, the MMU detects the read-only violation and triggers a COW page fault.' },
      { n: 4, label: 'COW fault handler runs', detail: 'Kernel checks PTE flags — sees COW bit set. Allocates a new physical frame. Copies the shared page content into the new frame.' },
      { n: 5, label: 'PTE updated for writer', detail: 'The writing process\'s PTE is updated to point to the new frame (read-write). The other process\'s PTE continues pointing to the original frame.' },
      { n: 6, label: 'exec() replaces address space', detail: 'If child calls exec(), the entire virtual address space is replaced with the new program. COW pages are released. This is why fork()+exec() is efficient — no parent pages copied.' },
    ],
  },
  {
    id: 'swap', label: 'Swap & Eviction', color: '#fbbf24',
    overview: 'When physical RAM is exhausted, the OS evicts least-recently-used pages to swap space (disk). Swap allows the system to continue operating under memory pressure at the cost of latency (disk I/O is thousands of times slower than RAM).',
    steps: [
      { n: 1, label: 'Memory pressure detected', detail: 'kswapd (kernel swap daemon) runs when free pages drop below low watermark. On Linux: vm.swappiness=60 controls eagerness to swap vs reclaim file cache.' },
      { n: 2, label: 'Page replacement selection', detail: 'Linux uses a clock/LRU approximation with two lists: active (recently accessed) and inactive (candidate for eviction). Pages move from active → inactive → evicted.' },
      { n: 3, label: 'Dirty pages written to swap', detail: 'Modified anonymous pages (heap, stack) are written to the swap partition or swapfile. File-backed pages are just dropped (can be re-read from disk).' },
      { n: 4, label: 'PTE marked not-present', detail: 'After swap write completes, the PTE is marked Present=0 and includes the swap offset so the page can be located on disk when needed again.' },
      { n: 5, label: 'Process accesses swapped page', detail: 'Process accesses evicted page → major page fault → kernel locates swap entry → issues disk read → frame allocated → page restored → PTE updated → major fault latency: ~5–10ms.' },
      { n: 6, label: 'Java heap and swap', detail: 'WARNING: JVM GC pause times skyrocket if any heap pages are swapped out — GC must touch all live objects. For Java: set vm.swappiness=1 on production JVM hosts, or disable swap entirely with swapoff -a.' },
    ],
  },
  {
    id: 'hugepages', label: 'Huge Pages', color: '#a78bfa',
    overview: 'Normal pages are 4KB. Huge pages (2MB or 1GB on x86_64) dramatically reduce TLB pressure for large memory workloads — the same TLB entries cover 512× or 262144× more memory.',
    steps: [
      { n: 1, label: 'TLB pressure with 4KB pages', detail: 'With 4KB pages, a 2MB working set needs 512 TLB entries. An 8GB JVM heap needs 2 million PTEs. TLB misses cause expensive page table walks (~400ns each).' },
      { n: 2, label: 'Transparent Huge Pages (THP)', detail: 'Linux THP automatically promotes 4KB pages to 2MB huge pages when contiguous physical frames are available. Enabled by default (/sys/kernel/mm/transparent_hugepage/enabled=madvise).' },
      { n: 3, label: 'JVM and huge pages', detail: 'JVM option: -XX:+UseHugePages (Linux). For JVM heap: -XX:+UseLargePages -XX:LargePageSizeInBytes=2m. Reduces GC pause times on large heap JVMs by reducing TLB miss rate during heap scan.' },
      { n: 4, label: 'Huge page limitations', detail: 'Huge pages must be physically contiguous — kernel cannot always allocate them under memory fragmentation. THP compaction runs asynchronously to consolidate pages.' },
      { n: 5, label: 'Redis and huge pages', detail: 'Redis disables THP by default. During BGSAVE (fork+copy), THP causes massive COW amplification — a 2MB write copies a 2MB huge page instead of 4KB. Causes latency spikes.' },
      { n: 6, label: 'Configure huge pages', detail: 'echo 2048 > /proc/sys/vm/nr_hugepages (allocate 4GB of 2MB huge pages). Check with: grep HugePages /proc/meminfo. Also available via libhugetlbfs or mmap(MAP_HUGETLB).' },
    ],
  },
];

export default function OsVirtualMemoryDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('demand');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const tab = TABS.find(t => t.id === activeTab)!;

  const handleTabChange = (id: string) => { setActiveTab(id); setExpandedStep(null); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Virtual Memory Deep Dive</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '7px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{tab.overview}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tab.steps.map((s, i) => {
            const isExp = expandedStep === i;
            return (
              <div key={i} onClick={() => setExpandedStep(isExp ? null : i)}
                style={{ background: isExp ? `${tab.color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isExp ? tab.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: '8px', padding: '9px 12px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: tab.color, background: `${tab.color}18`, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>{s.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--ifm-color-content-secondary)', fontSize: '11px' }}>{isExp ? '▲' : '▼'}</span>
                </div>
                {isExp && <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '8px 0 0 32px', lineHeight: 1.65 }}>{s.detail}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}