import React, { useState } from 'react';
import styles from './JVMArchitectureDiagram.module.css';

type ElementKey =
  | 'CLASS_LOADER'
  | 'METHOD_AREA'
  | 'HEAP_AREA'
  | 'VM_STACK'
  | 'PC_REGISTER'
  | 'NATIVE_STACK'
  | 'INTERPRETER'
  | 'JIT_COMPILER'
  | 'GARBAGE_COLLECTOR';

interface ElementDetails {
  title: string;
  type: 'green' | 'purple' | 'cyan';
  description: string;
  keyResponsibilities: string[];
  jvmSettings: string[];
  commonFailures: string[];
}

const ELEMENT_DATA: Record<ElementKey, ElementDetails> = {
  CLASS_LOADER: {
    title: 'ClassLoader Subsystem',
    type: 'purple',
    description: 'Responsible for dynamically loading, linking, and initializing Java class files (.class) at runtime.',
    keyResponsibilities: [
      'Loading: Reads binary bytecode data and creates a Class object.',
      'Linking: Verifies bytecode safety, prepares static fields with default values, and resolves symbolic references.',
      'Initialization: Executes class initializers (<clinit>) and assigns static variables to actual values.'
    ],
    jvmSettings: ['-verbose:class (prints loaded classes)', '-Xbootclasspath (modifies bootstrap loader path)'],
    commonFailures: ['java.lang.ClassNotFoundException', 'java.lang.NoClassDefFoundError']
  },
  METHOD_AREA: {
    title: 'Method Area (Shared Runtime Data Area)',
    type: 'green',
    description: 'A logical area shared by all threads that stores class metadata structures, constant pools, fields, method data, and method bytecodes.',
    keyResponsibilities: [
      'Stores class templates (fields, methods, constructor logic).',
      'Holds the Run-Time Constant Pool (literals, method/field references).',
      'Physically resides inside Metaspace off-heap since Java 8.'
    ],
    jvmSettings: ['-XX:MetaspaceSize', '-XX:MaxMetaspaceSize'],
    commonFailures: ['OutOfMemoryError: Metaspace (usually from dynamic class proxies / reflection leaks)']
  },
  HEAP_AREA: {
    title: 'Heap Area (Shared Runtime Data Area)',
    type: 'green',
    description: 'The core data memory area where all Java class instances and arrays are allocated. Managed entirely by the Garbage Collector.',
    keyResponsibilities: [
      'Stores runtime object instances, arrays, and their corresponding field variables.',
      'Divided logically into Young Generation (Eden + Survivor spaces) and Old Generation.',
      'Shared across all active application threads.'
    ],
    jvmSettings: ['-Xms (Initial Heap Size)', '-Xmx (Maximum Heap Size)', '-XX:+UseG1GC / -XX:+UseZGC'],
    commonFailures: ['OutOfMemoryError: Java heap space']
  },
  VM_STACK: {
    title: 'Java Virtual Machine Stack (Per-Thread)',
    type: 'cyan',
    description: 'Stores private local variables, intermediate calculations, and execution frames for each active Java thread.',
    keyResponsibilities: [
      'Pushes a new Frame onto the stack when a method is invoked, popping it upon completion.',
      'Frames hold: Local Variable Array, Operand Stack, and Frame Data (constant pool resolution, exception dispatch).',
      'Private memory area — never shared across thread boundaries.'
    ],
    jvmSettings: ['-Xss (Stack size per thread, default 1MB on x64 systems)'],
    commonFailures: ['java.lang.StackOverflowError (deep/infinite recursion)', 'OutOfMemoryError: unable to create new native thread']
  },
  PC_REGISTER: {
    title: 'Program Counter (PC) Register (Per-Thread)',
    type: 'cyan',
    description: 'Each active thread has its own PC Register which contains the memory address of the current JVM instruction being executed.',
    keyResponsibilities: [
      'Points to the next bytecode instruction instruction index if the method is not native.',
      'Saves return frame states and program pointers when thread context-switching occurs.',
      'No allocation overhead or GC overhead. Under-the-hood mapped directly to CPU registers.'
    ],
    jvmSettings: ['Managed internally by the JVM execution pipeline.'],
    commonFailures: ['None (cannot run out of memory or stack space).']
  },
  NATIVE_STACK: {
    title: 'Native Method Stack (Per-Thread)',
    type: 'cyan',
    description: 'Allocated for threads executing native methods (written in C/C++ or assembly) called via JNI.',
    keyResponsibilities: [
      'Maintains native system stack frames for non-Java system code invocations.',
      'Bridges Java logic with low-level kernel routines or external compiled library runtimes.',
      'Reclaimed by the operating system kernel when the host thread exits.'
    ],
    jvmSettings: ['Intertwined with the primary -Xss thread stack limit on most modern OS configurations.'],
    commonFailures: ['OutOfMemoryError: native memory depletion or system stack crash']
  },
  INTERPRETER: {
    title: 'Bytecode Interpreter',
    type: 'purple',
    description: 'Sequentially reads and executes JVM bytecode instructions line-by-line, converting them to native hardware instructions.',
    keyResponsibilities: [
      'Starts executing code immediately without compilation overhead.',
      'Decodes bytecode instructions and runs their standard equivalent C++ machine code routines.',
      'Slower for hot methods that run repeatedly (triggers compilation by JIT).'
    ],
    jvmSettings: ['-Xint (forces execution to run in interpreted mode only, no JIT)'],
    commonFailures: ['None (adds CPU cycle overhead but holds no state)']
  },
  JIT_COMPILER: {
    title: 'Just-In-Time (JIT) Compiler',
    type: 'purple',
    description: 'Monitors bytecode execution, detects "hot spots" (frequently executed code), and compiles those paths into optimized native machine code.',
    keyResponsibilities: [
      'C1 (Client) compiler: Compiles code quickly with simple profiling optimizations.',
      'C2 (Server) compiler: Performs deep profiling optimizations (loop unrolling, method inlining, escape analysis).',
      'Saves native compiled routines in the Code Cache region.'
    ],
    jvmSettings: ['-XX:ReservedCodeCacheSize', '-XX:+TieredCompilation (Enabled by default)'],
    commonFailures: ['Degraded performance if Code Cache fills and JIT is disabled.']
  },
  GARBAGE_COLLECTOR: {
    title: 'Garbage Collector (GC)',
    type: 'purple',
    description: 'Scans heap memory and automatically reclaims memory occupied by objects that are no longer reachable in the application code.',
    keyResponsibilities: [
      'Identifies GC Roots (thread stack variables, static classes, JNI references).',
      'Marks reachable objects and sweeps or compacts unreachable memory segments.',
      'Triggers stop-the-world pauses (or concurrent sweeps) to avoid fragmentation.'
    ],
    jvmSettings: ['-XX:+UseG1GC', '-XX:+UseZGC', '-XX:MaxGCPauseMillis'],
    commonFailures: ['java.lang.OutOfMemoryError: GC overhead limit exceeded']
  }
};

export default function JVMArchitectureDiagram(): React.JSX.Element {
  const [activeEl, setActiveEl] = useState<ElementKey>('CLASS_LOADER');

  const selectedData = ELEMENT_DATA[activeEl];

  const handleNodeClick = (key: ElementKey) => {
    setActiveEl(key);
  };

  const getStroke = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'green' ? '#4ade80' : ELEMENT_DATA[key].type === 'purple' ? '#a855f7' : '#2dd4bf';
    }
    return ELEMENT_DATA[key].type === 'green' ? '#15803d' : ELEMENT_DATA[key].type === 'purple' ? '#6b21a8' : '#0891b2';
  };

  const getFill = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : ELEMENT_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(45, 212, 191, 0.15)';
    }
    return ELEMENT_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : ELEMENT_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : 'rgba(8, 51, 68, 0.05)';
  };

  return (
    <div className={"interactive-diagram-container"}>
      <div className={`${"interactive-diagram-svg-wrapper"} ${"interactive-diagram-grid-bg"}`}>
        <svg viewBox="0 0 740 360" className={"interactive-diagram-svg"}>
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
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
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

          {/* JVM Main Box */}
          <rect x="10" y="10" width="720" height="340" className={styles.subgraphBox} stroke="#4ade80" strokeWidth="1.5" />
          <text x="25" y="32" className={styles.subgraphTitle} fill="#4ade80">
            JVM (Java Virtual Machine) Internals
          </text>

          {/* ClassLoader Subsystem Box */}
          <g
            className={`${styles.node} ${activeEl === 'CLASS_LOADER' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('CLASS_LOADER')}
          >
            <rect
              x="30"
              y="60"
              width="180"
              height="260"
              rx="10"
              ry="10"
              fill={getFill('CLASS_LOADER')}
              stroke={getStroke('CLASS_LOADER')}
              strokeWidth={activeEl === 'CLASS_LOADER' ? '2.5' : '1.5'}
            />
            {activeEl === 'CLASS_LOADER' && (
              <circle cx="200" cy="72" r="4.5" fill="#a855f7" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="120" y="150" className={styles.nodeTitle}>ClassLoader Subsystem</text>
            <text x="120" y="175" className={styles.nodeDesc}>Loads class bytecode</text>
            <text x="120" y="195" className={styles.nodeDesc}>Verifies, Links, Initializes</text>
          </g>

          {/* Runtime Data Areas Box */}
          <rect x="240" y="60" width="280" height="260" className={styles.subgraphBox} stroke="#cbd5e1" strokeWidth="1" />
          <text x="250" y="78" className={styles.subgraphTitle} fill="#cbd5e1" fontSize="10">
            Runtime Data Areas
          </text>

          {/* Shared Memory Group */}
          <rect
            x="250"
            y="95"
            width="120"
            height="210"
            rx="8"
            ry="8"
            fill="rgba(28, 45, 66, 0.2)"
            stroke="rgba(74, 222, 128, 0.2)"
            strokeWidth="1"
          />
          <text x="310" y="112" className={styles.subgraphTitle} fill="#4ade80" fontSize="9" textAnchor="middle">
            Shared (All Threads)
          </text>

          {/* Method Area Node */}
          <g
            className={`${styles.node} ${activeEl === 'METHOD_AREA' ? "node-active-green" : ''}`}
            onClick={() => handleNodeClick('METHOD_AREA')}
          >
            <rect
              x="260"
              y="125"
              width="100"
              height="70"
              rx="6"
              ry="6"
              fill={getFill('METHOD_AREA')}
              stroke={getStroke('METHOD_AREA')}
              strokeWidth={activeEl === 'METHOD_AREA' ? '2' : '1.5'}
            />
            <text x="310" y="155" className={styles.nodeTitle}>Method Area</text>
            <text x="310" y="172" className={styles.nodeDesc}>Class Metadata</text>
          </g>

          {/* Heap Area Node */}
          <g
            className={`${styles.node} ${activeEl === 'HEAP_AREA' ? "node-active-green" : ''}`}
            onClick={() => handleNodeClick('HEAP_AREA')}
          >
            <rect
              x="260"
              y="215"
              width="100"
              height="75"
              rx="6"
              ry="6"
              fill={getFill('HEAP_AREA')}
              stroke={getStroke('HEAP_AREA')}
              strokeWidth={activeEl === 'HEAP_AREA' ? '2' : '1.5'}
            />
            <text x="310" y="248" className={styles.nodeTitle}>Heap Area</text>
            <text x="310" y="265" className={styles.nodeDesc}>Object Allocations</text>
          </g>

          {/* Private Memory Group */}
          <rect
            x="385"
            y="95"
            width="125"
            height="210"
            rx="8"
            ry="8"
            fill="rgba(28, 45, 66, 0.2)"
            stroke="rgba(45, 212, 191, 0.2)"
            strokeWidth="1"
          />
          <text x="447" y="112" className={styles.subgraphTitle} fill="#2dd4bf" fontSize="9" textAnchor="middle">
            Private (Per-Thread)
          </text>

          {/* VM Stack Node */}
          <g
            className={`${styles.node} ${activeEl === 'VM_STACK' ? "node-active-cyan" : ''}`}
            onClick={() => handleNodeClick('VM_STACK')}
          >
            <rect
              x="395"
              y="125"
              width="105"
              height="48"
              rx="6"
              ry="6"
              fill={getFill('VM_STACK')}
              stroke={getStroke('VM_STACK')}
              strokeWidth={activeEl === 'VM_STACK' ? '2' : '1.5'}
            />
            <text x="447" y="148" className={styles.nodeTitle}>VM Stack</text>
            <text x="447" y="161" className={styles.nodeDesc}>Frames & Locals</text>
          </g>

          {/* PC Register Node */}
          <g
            className={`${styles.node} ${activeEl === 'PC_REGISTER' ? "node-active-cyan" : ''}`}
            onClick={() => handleNodeClick('PC_REGISTER')}
          >
            <rect
              x="395"
              y="183"
              width="105"
              height="48"
              rx="6"
              ry="6"
              fill={getFill('PC_REGISTER')}
              stroke={getStroke('PC_REGISTER')}
              strokeWidth={activeEl === 'PC_REGISTER' ? '2' : '1.5'}
            />
            <text x="447" y="206" className={styles.nodeTitle}>PC Register</text>
            <text x="447" y="219" className={styles.nodeDesc}>Next Instruction</text>
          </g>

          {/* Native Stack Node */}
          <g
            className={`${styles.node} ${activeEl === 'NATIVE_STACK' ? "node-active-cyan" : ''}`}
            onClick={() => handleNodeClick('NATIVE_STACK')}
          >
            <rect
              x="395"
              y="241"
              width="105"
              height="49"
              rx="6"
              ry="6"
              fill={getFill('NATIVE_STACK')}
              stroke={getStroke('NATIVE_STACK')}
              strokeWidth={activeEl === 'NATIVE_STACK' ? '2' : '1.5'}
            />
            <text x="447" y="264" className={styles.nodeTitle}>Native Stack</text>
            <text x="447" y="277" className={styles.nodeDesc}>C/C++ Methods</text>
          </g>

          {/* Execution Engine Box */}
          <rect x="540" y="60" width="170" height="260" className={styles.subgraphBox} stroke="#a855f7" strokeWidth="1" />
          <text x="550" y="78" className={styles.subgraphTitle} fill="#a855f7" fontSize="10">
            Execution Engine
          </text>

          {/* Interpreter Node */}
          <g
            className={`${styles.node} ${activeEl === 'INTERPRETER' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('INTERPRETER')}
          >
            <rect
              x="550"
              y="95"
              width="150"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('INTERPRETER')}
              stroke={getStroke('INTERPRETER')}
              strokeWidth={activeEl === 'INTERPRETER' ? '2' : '1.5'}
            />
            <text x="625" y="123" className={styles.nodeTitle}>Interpreter</text>
            <text x="625" y="140" className={styles.nodeDesc}>Bytecode decoding</text>
          </g>

          {/* JIT Compiler Node */}
          <g
            className={`${styles.node} ${activeEl === 'JIT_COMPILER' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('JIT_COMPILER')}
          >
            <rect
              x="550"
              y="165"
              width="150"
              height="65"
              rx="6"
              ry="6"
              fill={getFill('JIT_COMPILER')}
              stroke={getStroke('JIT_COMPILER')}
              strokeWidth={activeEl === 'JIT_COMPILER' ? '2' : '1.5'}
            />
            <text x="625" y="195" className={styles.nodeTitle}>JIT Compiler</text>
            <text x="625" y="212" className={styles.nodeDesc}>Hot Spot Optimization</text>
          </g>

          {/* Garbage Collector Node */}
          <g
            className={`${styles.node} ${activeEl === 'GARBAGE_COLLECTOR' ? "node-active-purple" : ''}`}
            onClick={() => handleNodeClick('GARBAGE_COLLECTOR')}
          >
            <rect
              x="550"
              y="240"
              width="150"
              height="65"
              rx="6"
              ry="6"
              fill={getFill('GARBAGE_COLLECTOR')}
              stroke={getStroke('GARBAGE_COLLECTOR')}
              strokeWidth={activeEl === 'GARBAGE_COLLECTOR' ? '2' : '1.5'}
            />
            <text x="625" y="270" className={styles.nodeTitle}>Garbage Collector</text>
            <text x="625" y="287" className={styles.nodeDesc}>Memory Reclamation</text>
          </g>

          {/* FLOW CONDUITS */}
          {/* ClassLoader -> RuntimeDataAreas */}
          <g>
            <path
              id="path-cl-rta"
              d="M 210 190 L 234 190"
              fill="none"
              stroke={activeEl === 'CLASS_LOADER' || selectedData.type === 'green' || selectedData.type === 'cyan' ? '#a855f7' : '#2e354f'}
              strokeWidth={activeEl === 'CLASS_LOADER' || selectedData.type === 'green' || selectedData.type === 'cyan' ? '2.5' : '1.5'}
              markerEnd={activeEl === 'CLASS_LOADER' || selectedData.type === 'green' || selectedData.type === 'cyan' ? 'url(#arrow-purple)' : 'url(#arrow-gray)'}
              className={`${styles.transitionPath} ${activeEl === 'CLASS_LOADER' || selectedData.type === 'green' || selectedData.type === 'cyan' ? 'interactive-diagram-flowing-path' : ''}`}
            />
            {(activeEl === 'CLASS_LOADER' || selectedData.type === 'green' || selectedData.type === 'cyan') && (
              <circle r="3.5" fill="#a855f7" filter="url(#glowPurple)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="2.0s" repeatCount="indefinite">
                  <mpath href="#path-cl-rta" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* RuntimeDataAreas -> ExecEngine */}
          <g>
            <path
              id="path-rta-ee"
              d="M 520 190 L 534 190"
              fill="none"
              stroke={selectedData.type === 'green' || selectedData.type === 'cyan' || activeEl === 'INTERPRETER' || activeEl === 'JIT_COMPILER' || activeEl === 'GARBAGE_COLLECTOR' ? '#4ade80' : '#2e354f'}
              strokeWidth={selectedData.type === 'green' || selectedData.type === 'cyan' || activeEl === 'INTERPRETER' || activeEl === 'JIT_COMPILER' || activeEl === 'GARBAGE_COLLECTOR' ? '2.5' : '1.5'}
              markerEnd={selectedData.type === 'green' || selectedData.type === 'cyan' || activeEl === 'INTERPRETER' || activeEl === 'JIT_COMPILER' || activeEl === 'GARBAGE_COLLECTOR' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`${styles.transitionPath} ${selectedData.type === 'green' || selectedData.type === 'cyan' || activeEl === 'INTERPRETER' || activeEl === 'JIT_COMPILER' || activeEl === 'GARBAGE_COLLECTOR' ? 'interactive-diagram-flowing-path' : ''}`}
            />
            {(selectedData.type === 'green' || selectedData.type === 'cyan' || activeEl === 'INTERPRETER' || activeEl === 'JIT_COMPILER' || activeEl === 'GARBAGE_COLLECTOR') && (
              <circle r="3.5" fill="#4ade80" filter="url(#glowGreen)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="1.8s" repeatCount="indefinite">
                  <mpath href="#path-rta-ee" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`${"interactive-diagram-details-card"} ${
        selectedData.type === 'green' ? "details-green" : selectedData.type === 'purple' ? "details-purple" : "details-cyan"
      }`}>
        <div className={"interactive-diagram-card-header"}>
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overview:</strong> {selectedData.description}</p>
        
        <ul>
          <li><strong>Key Responsibilities:</strong>
            <ul>
              {selectedData.keyResponsibilities.map((resp, i) => (
                <li key={i}>{resp}</li>
              ))}
            </ul>
          </li>
          <li><strong>JVM configuration flags:</strong> {selectedData.jvmSettings.join(' | ')}</li>
          <li><strong>Failure modes:</strong>
            <ul>
              {selectedData.commonFailures.map((fail, i) => (
                <li key={i}>{fail}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className={"interactive-diagram-helper-text"}>
        💡 Click on any component (ClassLoader, Heap, JIT Compiler, VM Stack, etc.) in the diagram to inspect its execution parameters.
      </p>
    </div>
  );
}
