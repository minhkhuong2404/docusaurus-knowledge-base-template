import React, { useState } from 'react';
import styles from './JVMMemoryDiagram.module.css';

type SectionKey =
  | 'EDEN'
  | 'SURVIVOR'
  | 'OLD_GEN'
  | 'METASPACE'
  | 'CODE_CACHE'
  | 'THREAD_STACKS'
  | 'DIRECT_MEMORY'
  | 'GC_OVERHEAD'
  | 'JVM_INTERNAL';

interface SectionDetails {
  title: string;
  type: 'green' | 'purple' | 'cyan';
  shortDesc: string;
  tuningFlags: string[];
  gcMode: string;
  oomRisks: string[];
  details: string[];
}

const SECTION_DATA: Record<SectionKey, SectionDetails> = {
  EDEN: {
    title: 'Eden Space (Young Generation)',
    type: 'green',
    shortDesc: 'The entry point for newly created objects allocated by the application threads.',
    tuningFlags: ['-Xms / -Xmx (Heap size bounds)', '-XX:NewRatio (Young to Old ratio)', '-XX:SurvivorRatio (Eden to Survivor size ratio)'],
    gcMode: 'Extremely fast Minor GCs. Garbage collection runs frequently, evacuating surviving objects to Survivor spaces and reclaiming dead objects instantly (pointer-bump reset).',
    oomRisks: ['Causes frequent Minor GCs if sized too small, leading to high CPU latency.', 'Contributes to OutOfMemoryError: Java heap space if Old Gen is also full.'],
    details: [
      'Objects are allocated using Thread Local Allocation Buffers (TLABs) to avoid thread synchronization overhead.',
      'A pointer-bumping allocator is used: allocating an object simply moves the allocation pointer forward, which is extremely cheap.',
      'Sizing Eden correctly is critical: too small causes excessive GC frequency; too large increases GC pause durations.'
    ]
  },
  SURVIVOR: {
    title: 'Survivor Spaces (S0 / S1 - Young Gen)',
    type: 'green',
    shortDesc: 'Two identical copy spaces (From/To) used to age objects before they are promoted to the Old Generation.',
    tuningFlags: ['-XX:SurvivorRatio (ratio of Eden to one Survivor space)', '-XX:MaxTenuringThreshold (cycles before promotion, default 15)'],
    gcMode: 'Copying collector scheme. Active survivor space (From) copies survivors of Eden and itself to the inactive survivor space (To), then swaps their roles (From <-> To).',
    oomRisks: ['Survivor space overflow causes premature promotion: young objects bypass aging and go straight to Old Gen, causing premature Major GCs.'],
    details: [
      'Only one survivor space (S0 or S1) is active (From) at any point; the other is empty (To).',
      'Each minor GC survival increments the object age metadata in its header.',
      'If objects reach the age threshold (MaxTenuringThreshold), they are promoted (evacuated) to Old Gen.'
    ]
  },
  OLD_GEN: {
    title: 'Old Generation (Tenured Space)',
    type: 'green',
    shortDesc: 'Holds long-lived objects, large allocations that bypass the Young Gen, and promoted survivor objects.',
    tuningFlags: ['-Xmx (Maximum total heap size)', '-XX:CMSInitiatingOccupancyFraction (for legacy CMS)', '-XX:G1ReservePercent (GC reserve pool)'],
    gcMode: 'Major GCs (Full GC / Old Gen sweeps). Reclaimed via G1 mixed GC phases or Full GC pauses depending on the active GC algorithm.',
    oomRisks: ['java.lang.OutOfMemoryError: Java heap space occurred when the Old Generation is full and cannot be compressed further.'],
    details: [
      'Objects are structured sequentially in regions (G1/ZGC) or single blocks (Parallel).',
      'Typically collected via compacting/marking algorithms to avoid memory fragmentation over time.',
      'Large arrays or buffers may bypass the Young Gen completely and allocate directly in the Old Gen.'
    ]
  },
  METASPACE: {
    title: 'Metaspace (Off-Heap / Native)',
    type: 'purple',
    shortDesc: 'Contains class metadata loaded by ClassLoaders, constant pools, method bytecodes, annotations, and JVM internals.',
    tuningFlags: ['-XX:MetaspaceSize (Initial threshold before GC)', '-XX:MaxMetaspaceSize (Upper limit, default is unlimited)'],
    gcMode: 'Collected only during Full GCs when ClassLoaders are garbage collected and unloaded from memory.',
    oomRisks: ['java.lang.OutOfMemoryError: Metaspace. Triggered by dynamic class generation libraries (e.g., Spring AOP proxies, reflection, CGLIB leaks) without unloading.'],
    details: [
      'Replaced PermGen in Java 8. Moves class metadata from Java Heap to Native OS virtual memory.',
      'Divided into MetadataSpace (for structures) and ClassSpace (when compressed class pointers are enabled).',
      'Grows dynamically up to MaxMetaspaceSize, bound only by physical OS virtual memory limits by default.'
    ]
  },
  CODE_CACHE: {
    title: 'Code Cache (Off-Heap / Native)',
    type: 'purple',
    shortDesc: 'Stores native machine code compiled by the Just-In-Time (JIT) compilers (C1 and C2 compiler tiers).',
    tuningFlags: ['-XX:InitialCodeCacheSize', '-XX:ReservedCodeCacheSize (Max limit, default ~240MB on 64-bit VM)'],
    gcMode: 'Swept by the JIT compiler thread to discard cold/unused compiled methods when cache reaches threshold limits.',
    oomRisks: ['If Code Cache is full, JIT compilation is disabled. The JVM falls back to purely interpreting bytecode, causing application performance to drop significantly.'],
    details: [
      'Divided into segmented heaps: non-nmethods (JVM internal), profiled nmethods (C1 compiled), and non-profiled nmethods (C2 optimized).',
      'Contains compiled methods, native wrapper frames (JNI adapters), and runtime stubs.',
      'Monitored via JMX or native logging (`-XX:+PrintCodeCache`).'
    ]
  },
  THREAD_STACKS: {
    title: 'Thread Stacks (Off-Heap / Native)',
    type: 'purple',
    shortDesc: 'Dedicated thread stacks storing local variables, operand frames, method call states, and return addresses.',
    tuningFlags: ['-Xss (Stack size per thread, default 1MB on modern 64-bit systems)'],
    gcMode: 'Memory is allocated immediately upon thread start and reclaimed automatically by the OS when the thread terminates. No GC pauses.',
    oomRisks: ['java.lang.StackOverflowError (deep/infinite recursion).', 'OutOfMemoryError: unable to create new native thread (OS thread limit or RAM limit reached).'],
    details: [
      'Every thread gets its own physical stack frame layout.',
      'Sizing too high (e.g., `-Xss2m`) limits total possible threads on a server; sizing too low (e.g., `-Xss256k`) triggers early StackOverflowError.',
      'Includes native thread mapping overhead and OS-level scheduler structures.'
    ]
  },
  DIRECT_MEMORY: {
    title: 'Direct Memory (Off-Heap / Native)',
    type: 'purple',
    shortDesc: 'Allocated directly in OS native memory via ByteBuffer.allocateDirect() or unsafe, bypassing JVM heap copy overhead.',
    tuningFlags: ['-XX:MaxDirectMemorySize (Defaults to maximum Heap size if not explicitly set)'],
    gcMode: 'Reclaimed via Cleaner phantom references tied to Java references. Can also trigger manual System.gc() calls to force cleanup.',
    oomRisks: ['java.lang.OutOfMemoryError: Direct buffer memory. Common in high-throughput network engines (Netty, gRPC, WebFlux) due to buffer leaks.'],
    details: [
      'Enables Zero-Copy I/O: the OS kernel can read/write data directly to/from the buffer via DMA (Direct Memory Access).',
      'Avoiding copying byte arrays between native kernel buffers and JVM heap memory pools.',
      'Very expensive to allocate but extremely fast for I/O operations.'
    ]
  },
  GC_OVERHEAD: {
    title: 'GC Internal Metadata (Off-Heap / Native)',
    type: 'purple',
    shortDesc: 'JVM internal bookkeeping structures, card tables, remembered sets (RSets), and marking bitmaps used by garbage collectors.',
    tuningFlags: ['-XX:G1RSetUpdatingQueueLength', '-XX:ParallelGCThreads', '-XX:ConcGCThreads'],
    gcMode: 'Managed internally by the JVM GC subsystem. Reclaimed and updated dynamically as memory region states change.',
    oomRisks: ['Process crash or virtual memory exhaustion if metadata structures grow out of proportion (typically in systems with huge Heaps and highly fragmented regions).'],
    details: [
      'G1 GC uses Remembered Sets (RSets) to track cross-region references, which can consume up to 10% of total memory.',
      'Card tables divide the heap into 512-byte segments to check for Old-to-Young gen references.',
      'Marking bitmaps are used to record object liveness states during concurrent cycles.'
    ]
  },
  JVM_INTERNAL: {
    title: 'JVM Internal Structures (Off-Heap / Native)',
    type: 'purple',
    shortDesc: 'Underlying C++ heap allocations for the JVM process itself, including thread structures, TLS, and JNI bridges.',
    tuningFlags: ['No direct JVM flags; managed via native memory tracking (-XX:NativeMemoryTracking=summary)'],
    gcMode: 'Standard C++ memory management (malloc/free) inside the JVM executable layer. Lives until the process exits.',
    oomRisks: ['Native memory exhaustion leading to process termination by the OS Out-of-Memory (OOM) Killer.'],
    details: [
      'Contains JVM symbol table (names, descriptors) and internal class definitions.',
      'JNI (Java Native Interface) allocations by native shared libraries (.so, .dll) live here.',
      'Can be analyzed using Native Memory Tracking (NMT) and tools like jemalloc or valgrind.'
    ]
  }
};

export default function JVMMemoryDiagram(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<SectionKey>('EDEN');

  const selectedData = SECTION_DATA[activeSection];

  const handleNodeClick = (key: SectionKey) => {
    setActiveSection(key);
  };

  const getStrokeColor = (key: SectionKey) => {
    if (activeSection === key) {
      return SECTION_DATA[key].type === 'green' ? '#4ade80' : '#818cf8';
    }
    return SECTION_DATA[key].type === 'green' ? '#15803d' : '#4f46e5';
  };

  const getFillColor = (key: SectionKey) => {
    if (activeSection === key) {
      return SECTION_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(129, 140, 248, 0.15)';
    }
    return SECTION_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : 'rgba(30, 27, 75, 0.05)';
  };

  const isGreenActive = activeSection === 'EDEN' || activeSection === 'SURVIVOR' || activeSection === 'OLD_GEN';
  const isPurpleActive = activeSection === 'METASPACE' || activeSection === 'CODE_CACHE' || activeSection === 'THREAD_STACKS' || activeSection === 'GC_OVERHEAD' || activeSection === 'JVM_INTERNAL';

  return (
    <div className={"interactive-diagram-container"}>
      <div className={`${"interactive-diagram-svg-wrapper"} ${"interactive-diagram-grid-bg"}`}>
        <svg viewBox="0 0 760 480" className={"interactive-diagram-svg"}>
          <defs>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#818cf8" />
            </marker>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
            </marker>
            <marker
              id="arrow-gray"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2e354f" />
            </marker>
          </defs>

          {/* OS Memory Box */}
          <rect x="10" y="10" width="740" height="460" className={styles.subgraphBox} />
          <text x="25" y="32" className={styles.subgraphTitle}>
            OS Memory (Total JVM Process Memory)
          </text>

          {/* On-Heap Memory Box */}
          <rect x="30" y="60" width="330" height="390" className={`${styles.subgraphBox} ${styles.onHeapBox}`} />
          <text x="45" y="82" className={styles.subgraphTitle} fill="#4ade80">
            On-Heap Memory (-Xms / -Xmx)
          </text>

          {/* Young Generation */}
          <rect
            x="45"
            y="105"
            width="300"
            height="155"
            rx="8"
            ry="8"
            fill="rgba(28, 45, 66, 0.2)"
            stroke="rgba(168, 85, 247, 0.15)"
            strokeWidth="1"
          />
          <text x="55" y="122" className={styles.subgraphTitle} fill="#c084fc" fontSize="10">
            Young Generation (-Xmn)
          </text>

          {/* Eden Node */}
          <g
            className={`${styles.node} ${activeSection === 'EDEN' ? "node-active-green" : ''}`}
            onClick={() => handleNodeClick('EDEN')}
            transform="translate(0, 0)"
          >
            <rect
              x="55"
              y="135"
              width="105"
              height="110"
              rx="6"
              ry="6"
              fill={getFillColor('EDEN')}
              stroke={getStrokeColor('EDEN')}
              strokeWidth={activeSection === 'EDEN' ? '2' : '1.5'}
            />
            {activeSection === 'EDEN' && (
              <circle cx="148" cy="147" r="4.5" fill="#4ade80" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="107" y="180" className={styles.nodeTitle}>Eden Space</text>
            <text x="107" y="200" className={styles.nodeDesc}>New Allocation</text>
          </g>

          {/* Survivor 0 (S0) */}
          <g
            className={`${styles.node} ${activeSection === 'SURVIVOR' ? "node-active-green" : ''}`}
            onClick={() => handleNodeClick('SURVIVOR')}
          >
            <rect
              x="180"
              y="135"
              width="150"
              height="50"
              rx="6"
              ry="6"
              fill={getFillColor('SURVIVOR')}
              stroke={getStrokeColor('SURVIVOR')}
              strokeWidth={activeSection === 'SURVIVOR' ? '2' : '1.5'}
            />
            {activeSection === 'SURVIVOR' && (
              <circle cx="318" cy="147" r="4.5" fill="#4ade80" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="255" y="160" className={styles.nodeTitle}>Survivor 0 (S0)</text>
            <text x="255" y="174" className={styles.nodeDesc}>GC Copy Space</text>
          </g>

          {/* Survivor 1 (S1) */}
          <g
            className={`${styles.node} ${activeSection === 'SURVIVOR' ? "node-active-green" : ''}`}
            onClick={() => handleNodeClick('SURVIVOR')}
          >
            <rect
              x="180"
              y="195"
              width="150"
              height="50"
              rx="6"
              ry="6"
              fill={getFillColor('SURVIVOR')}
              stroke={getStrokeColor('SURVIVOR')}
              strokeWidth={activeSection === 'SURVIVOR' ? '2' : '1.5'}
            />
            <text x="255" y="220" className={styles.nodeTitle}>Survivor 1 (S1)</text>
            <text x="255" y="234" className={styles.nodeDesc}>GC Copy Space</text>
          </g>

          {/* Old Generation */}
          <rect
            x="45"
            y="275"
            width="300"
            height="160"
            rx="8"
            ry="8"
            fill="rgba(28, 45, 66, 0.2)"
            stroke="rgba(168, 85, 247, 0.15)"
            strokeWidth="1"
          />
          <text x="55" y="292" className={styles.subgraphTitle} fill="#c084fc" fontSize="10">
            Old Generation (Tenured)
          </text>

          {/* Old Space Node */}
          <g
            className={`${styles.node} ${activeSection === 'OLD_GEN' ? "node-active-green" : ''}`}
            onClick={() => handleNodeClick('OLD_GEN')}
          >
            <rect
              x="55"
              y="305"
              width="280"
              height="115"
              rx="6"
              ry="6"
              fill={getFillColor('OLD_GEN')}
              stroke={getStrokeColor('OLD_GEN')}
              strokeWidth={activeSection === 'OLD_GEN' ? '2' : '1.5'}
            />
            {activeSection === 'OLD_GEN' && (
              <circle cx="323" cy="317" r="4.5" fill="#4ade80" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="195" y="358" className={styles.nodeTitle}>Old Space</text>
            <text x="195" y="378" className={styles.nodeDesc}>Long-lived Objects & Promoted survivors</text>
          </g>

          {/* Off-Heap Memory Box */}
          <rect x="390" y="60" width="340" height="390" className={`${styles.subgraphBox} ${styles.offHeapBox}`} />
          <text x="405" y="82" className={styles.subgraphTitle} fill="#818cf8">
            Off-Heap / Native Memory
          </text>

          {/* Metaspace Node */}
          <g
            className={`${styles.node} ${activeSection === 'METASPACE' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('METASPACE')}
          >
            <rect
              x="405"
              y="105"
              width="145"
              height="100"
              rx="6"
              ry="6"
              fill={getFillColor('METASPACE')}
              stroke={getStrokeColor('METASPACE')}
              strokeWidth={activeSection === 'METASPACE' ? '2' : '1.5'}
            />
            {activeSection === 'METASPACE' && (
              <circle cx="538" cy="117" r="4.5" fill="#818cf8" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="477" y="142" className={styles.nodeTitle}>Metaspace</text>
            <text x="477" y="162" className={styles.nodeDesc}>Class Metadata & Pools</text>
            <text x="477" y="177" className={styles.nodeDesc} fill="#818cf8">-XX:MaxMetaspaceSize</text>
          </g>

          {/* Code Cache Node */}
          <g
            className={`${styles.node} ${activeSection === 'CODE_CACHE' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('CODE_CACHE')}
          >
            <rect
              x="570"
              y="105"
              width="145"
              height="100"
              rx="6"
              ry="6"
              fill={getFillColor('CODE_CACHE')}
              stroke={getStrokeColor('CODE_CACHE')}
              strokeWidth={activeSection === 'CODE_CACHE' ? '2' : '1.5'}
            />
            {activeSection === 'CODE_CACHE' && (
              <circle cx="703" cy="117" r="4.5" fill="#818cf8" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="642" y="142" className={styles.nodeTitle}>Code Cache</text>
            <text x="642" y="162" className={styles.nodeDesc}>JIT Compiled Native Code</text>
            <text x="642" y="177" className={styles.nodeDesc} fill="#818cf8">-XX:ReservedCodeCacheSize</text>
          </g>

          {/* Thread Stacks Node */}
          <g
            className={`${styles.node} ${activeSection === 'THREAD_STACKS' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('THREAD_STACKS')}
          >
            <rect
              x="405"
              y="217"
              width="145"
              height="100"
              rx="6"
              ry="6"
              fill={getFillColor('THREAD_STACKS')}
              stroke={getStrokeColor('THREAD_STACKS')}
              strokeWidth={activeSection === 'THREAD_STACKS' ? '2' : '1.5'}
            />
            {activeSection === 'THREAD_STACKS' && (
              <circle cx="538" cy="229" r="4.5" fill="#818cf8" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="477" y="254" className={styles.nodeTitle}>Thread Stacks</text>
            <text x="477" y="274" className={styles.nodeDesc}>Frames & Local Variables</text>
            <text x="477" y="289" className={styles.nodeDesc} fill="#818cf8">-Xss per thread</text>
          </g>

          {/* Direct Memory Node */}
          <g
            className={`${styles.node} ${activeSection === 'DIRECT_MEMORY' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('DIRECT_MEMORY')}
          >
            <rect
              x="570"
              y="217"
              width="145"
              height="100"
              rx="6"
              ry="6"
              fill={getFillColor('DIRECT_MEMORY')}
              stroke={getStrokeColor('DIRECT_MEMORY')}
              strokeWidth={activeSection === 'DIRECT_MEMORY' ? '2' : '1.5'}
            />
            {activeSection === 'DIRECT_MEMORY' && (
              <circle cx="703" cy="229" r="4.5" fill="#818cf8" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="642" y="254" className={styles.nodeTitle}>Direct Memory</text>
            <text x="642" y="274" className={styles.nodeDesc}>Zero-copy Direct Buffers</text>
            <text x="642" y="289" className={styles.nodeDesc} fill="#818cf8">-XX:MaxDirectMemorySize</text>
          </g>

          {/* GC Internal Metadata Node */}
          <g
            className={`${styles.node} ${activeSection === 'GC_OVERHEAD' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('GC_OVERHEAD')}
          >
            <rect
              x="405"
              y="330"
              width="145"
              height="100"
              rx="6"
              ry="6"
              fill={getFillColor('GC_OVERHEAD')}
              stroke={getStrokeColor('GC_OVERHEAD')}
              strokeWidth={activeSection === 'GC_OVERHEAD' ? '2' : '1.5'}
            />
            {activeSection === 'GC_OVERHEAD' && (
              <circle cx="538" cy="342" r="4.5" fill="#818cf8" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="477" y="367" className={styles.nodeTitle}>GC Internal Metadata</text>
            <text x="477" y="387" className={styles.nodeDesc}>Card Tables & RSets</text>
            <text x="477" y="402" className={styles.nodeDesc} fill="#818cf8">Bitmaps & Marks</text>
          </g>

          {/* JVM Internal Structures Node */}
          <g
            className={`${styles.node} ${activeSection === 'JVM_INTERNAL' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('JVM_INTERNAL')}
          >
            <rect
              x="570"
              y="330"
              width="145"
              height="100"
              rx="6"
              ry="6"
              fill={getFillColor('JVM_INTERNAL')}
              stroke={getStrokeColor('JVM_INTERNAL')}
              strokeWidth={activeSection === 'JVM_INTERNAL' ? '2' : '1.5'}
            />
            {activeSection === 'JVM_INTERNAL' && (
              <circle cx="703" cy="342" r="4.5" fill="#818cf8" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="642" y="367" className={styles.nodeTitle}>JVM Internals</text>
            <text x="642" y="387" className={styles.nodeDesc}>C++ VM Heap & TLS</text>
            <text x="642" y="402" className={styles.nodeDesc} fill="#818cf8">Thread Structures</text>
          </g>

          {/* CONNECTOR PATHS WITH FLOWING ARROWS */}
          {/* Eden -> Survivor 0 */}
          <g>
            <path
              id="path-eden-s0"
              d="M 160 160 L 174 160"
              fill="none"
              stroke={activeSection === 'EDEN' || activeSection === 'SURVIVOR' ? '#4ade80' : '#2e354f'}
              strokeWidth={activeSection === 'EDEN' || activeSection === 'SURVIVOR' ? '2.5' : '1.5'}
              markerEnd={activeSection === 'EDEN' || activeSection === 'SURVIVOR' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`${styles.transitionPath} ${activeSection === 'EDEN' || activeSection === 'SURVIVOR' ? 'interactive-diagram-flowing-path' : ''}`}
            />
            {(activeSection === 'EDEN' || activeSection === 'SURVIVOR') && (
              <circle r="3.5" fill="#4ade80" filter="url(#glowGreen)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="1.8s" repeatCount="indefinite">
                  <mpath href="#path-eden-s0" />
                </animateMotion>
              </circle>
            )}
          </g>
          
          {/* Survivor 0 <-> Survivor 1 Curved Bridge */}
          <g>
            <path
              id="path-s0-s1"
              d="M 320 160 Q 350 190 320 220"
              fill="none"
              stroke={activeSection === 'SURVIVOR' ? '#4ade80' : '#2e354f'}
              strokeWidth={activeSection === 'SURVIVOR' ? '2.5' : '1.5'}
              markerEnd={activeSection === 'SURVIVOR' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              markerStart={activeSection === 'SURVIVOR' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={styles.transitionPath}
            />
            {activeSection === 'SURVIVOR' && (
              <circle r="3.5" fill="#4ade80" filter="url(#glowGreen)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="2.2s" repeatCount="indefinite">
                  <mpath href="#path-s0-s1" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Survivor 1 -> Old Generation Promotion */}
          <g>
            <path
              id="path-s1-old"
              d="M 255 245 L 255 300"
              fill="none"
              stroke={activeSection === 'SURVIVOR' || activeSection === 'OLD_GEN' ? '#4ade80' : '#2e354f'}
              strokeWidth={activeSection === 'SURVIVOR' || activeSection === 'OLD_GEN' ? '2.5' : '1.5'}
              markerEnd={activeSection === 'SURVIVOR' || activeSection === 'OLD_GEN' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`${styles.transitionPath} ${activeSection === 'SURVIVOR' || activeSection === 'OLD_GEN' ? 'interactive-diagram-flowing-path' : ''}`}
            />
            {(activeSection === 'SURVIVOR' || activeSection === 'OLD_GEN') && (
              <circle r="3.5" fill="#4ade80" filter="url(#glowGreen)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="2s" repeatCount="indefinite">
                  <mpath href="#path-s1-old" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Direct Memory <-> On-Heap Zero Copy JNI */}
          <g>
            <path
              id="path-dm-heap"
              d="M 570 267 L 360 267"
              fill="none"
              stroke={activeSection === 'DIRECT_MEMORY' || isGreenActive ? '#2dd4bf' : '#2e354f'}
              strokeWidth={activeSection === 'DIRECT_MEMORY' || isGreenActive ? '2.5' : '1.5'}
              strokeDasharray="4 4"
              markerEnd={activeSection === 'DIRECT_MEMORY' || isGreenActive ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              markerStart={activeSection === 'DIRECT_MEMORY' || isGreenActive ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={styles.transitionPath}
            />
            {(activeSection === 'DIRECT_MEMORY' || isGreenActive) && (
              <circle r="3.5" fill="#2dd4bf" filter="url(#glowCyan)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="2.5s" repeatCount="indefinite">
                  <mpath href="#path-dm-heap" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Metaspace -> On-Heap reference pointers */}
          <g>
            <path
              id="path-meta-heap"
              d="M 405 155 Q 380 155 360 180"
              fill="none"
              stroke={activeSection === 'METASPACE' || isGreenActive ? '#818cf8' : '#2e354f'}
              strokeWidth={activeSection === 'METASPACE' || isGreenActive ? '2.5' : '1.5'}
              markerEnd={activeSection === 'METASPACE' || isGreenActive ? 'url(#arrow-purple)' : 'url(#arrow-gray)'}
              className={styles.transitionPath}
            />
            {(activeSection === 'METASPACE' || isGreenActive) && (
              <circle r="3.5" fill="#818cf8" filter="url(#glowPurple)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="2.2s" repeatCount="indefinite">
                  <mpath href="#path-meta-heap" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Thread Stacks -> On-Heap Object references */}
          <g>
            <path
              id="path-stacks-heap"
              d="M 405 267 Q 380 267 360 330"
              fill="none"
              stroke={activeSection === 'THREAD_STACKS' || isGreenActive ? '#818cf8' : '#2e354f'}
              strokeWidth={activeSection === 'THREAD_STACKS' || isGreenActive ? '2.5' : '1.5'}
              markerEnd={activeSection === 'THREAD_STACKS' || isGreenActive ? 'url(#arrow-purple)' : 'url(#arrow-gray)'}
              className={styles.transitionPath}
            />
            {(activeSection === 'THREAD_STACKS' || isGreenActive) && (
              <circle r="3.5" fill="#818cf8" filter="url(#glowPurple)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="2.4s" repeatCount="indefinite">
                  <mpath href="#path-stacks-heap" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Display Card */}
      <div className={`${"interactive-diagram-details-card"} ${
        selectedData.type === 'green' ? "details-green" : selectedData.type === 'purple' ? "details-purple" : "details-cyan"
      }`}>
        <div className={"interactive-diagram-card-header"}>
          <span className={`${"interactive-diagram-indicator-dot"} ${
            selectedData.type === 'green' ? "card-indicator-green" : selectedData.type === 'purple' ? "card-indicator-purple" : "card-indicator-cyan"
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overview:</strong> {selectedData.shortDesc}</p>
        
        <ul>
          <li><strong>Tuning flags:</strong> {selectedData.tuningFlags.join(' | ')}</li>
          <li><strong>GC Management:</strong> {selectedData.gcMode}</li>
          <li><strong>OOM Risks & Failure modes:</strong>
            <ul>
              {selectedData.oomRisks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </li>
          <li><strong>Under the Hood Details:</strong>
            <ul>
              {selectedData.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className={"interactive-diagram-helper-text"}>
        💡 Click on any partition (Eden, Survivor, Old Space, Metaspace, Stacks, Direct Memory, etc.) in the diagram to inspect its parameters.
      </p>
    </div>
  );
}
