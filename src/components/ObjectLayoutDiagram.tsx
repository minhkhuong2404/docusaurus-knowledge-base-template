import React, { useState } from 'react';
import styles from './ObjectLayoutDiagram.module.css';

type SegmentKey = 'MARK_WORD' | 'CLASS_POINTER' | 'INSTANCE_DATA' | 'PADDING';

interface SegmentDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'gray';
  size: string;
  shortDesc: string;
  fields: string[];
  jvmOptimization: string[];
}

const SEGMENT_DATA: Record<SegmentKey, SegmentDetails> = {
  MARK_WORD: {
    title: 'Mark Word (Object Header)',
    type: 'purple',
    size: '8 Bytes (64-bit JVM) | 4 Bytes (32-bit JVM)',
    shortDesc: 'Contains essential runtime identity and synchronization metadata for the object instance.',
    fields: [
      'Identity Hashcode: Lazy computed hash value of the object (never changed after compute).',
      'GC Age: Tracks how many Minor GC cycles this object survived (4 bits, limits age limit to 15).',
      'Biased Lock Flag & Lock State Bits: Indicates if lock is Unlocked (001), Biased (101), Lightweight (00), Heavyweight (10), or Marked for GC (11).'
    ],
    jvmOptimization: [
      'Biased Locking (-XX:+UseBiasedLocking) - legacy optimization (deprecated in Java 15).',
      'Lock Inflation - automatically escalates stack-based lightweight locks to native heavyweight monitor mutexes under heavy thread contention.'
    ]
  },
  CLASS_POINTER: {
    title: 'Class Pointer / Klass Word (Object Header)',
    type: 'purple',
    size: '4 Bytes (Compressed OOPs) | 8 Bytes (Native 64-bit)',
    shortDesc: 'A native pointer directing the JVM to the loaded class metadata structure in Metaspace (C++ Klass instance).',
    fields: [
      'Points directly to instance representation in Metaspace.',
      'Allows dynamic method dispatch (resolving virtual method tables - vtables at runtime).',
      'Stores type boundaries used in instanceof and type checks.'
    ],
    jvmOptimization: [
      'Compressed Class Pointers (+XX:+UseCompressedClassPointers): Compresses native 64-bit pointers to 32-bit offsets by utilizing 8-byte alignment addressing.',
      'Saves 4 bytes per object instance, reducing cache miss ratios.'
    ]
  },
  INSTANCE_DATA: {
    title: 'Instance Data (Payload)',
    type: 'green',
    size: 'Variable (Depends on field definitions)',
    shortDesc: 'Stores the actual values of all instance variables, fields declared in the class, and those inherited from parent hierarchies.',
    fields: [
      'Primitive fields: byte/boolean (1 byte), char/short (2 bytes), int/float (4 bytes), long/double (8 bytes).',
      'Reference fields (OOPs): pointers to other objects in Heap (4 or 8 bytes depending on compressed OOPs flag).'
    ],
    jvmOptimization: [
      'Field Reordering: The JVM automatically reorders fields in memory to minimize padding and maximize alignment (e.g. packing longs first, then ints, shorts, bytes, and references last).',
      'Contended fields optimization (@Contended annotation) - adds padding between fields to avoid CPU cache L1/L2 cache line false sharing.'
    ]
  },
  PADDING: {
    title: 'Padding (Alignment Buffer)',
    type: 'gray',
    size: '0 to 7 Bytes',
    shortDesc: 'A blank alignment buffer used to ensure that the total size of the object in memory is a multiple of 8 bytes.',
    fields: [
      'Contains empty offset data bytes.',
      'Required by CPU hardware architectures which perform memory reads on aligned 8-byte boundaries.',
      'Reduces the number of CPU memory cycles required to fetch an object from RAM.'
    ],
    jvmOptimization: [
      'Object Alignment (-XX:ObjectAlignmentInBytes=8): Defaults to 8-byte boundaries.',
      'Increasing to 16 bytes allows addressing larger heaps with 32-bit compressed OOPs, but increases memory overhead per object.'
    ]
  }
};

export default function ObjectLayoutDiagram(): React.JSX.Element {
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('MARK_WORD');

  const selectedData = SEGMENT_DATA[activeSegment];

  const handleSegmentClick = (key: SegmentKey) => {
    setActiveSegment(key);
  };

  const getStroke = (key: SegmentKey) => {
    if (activeSegment === key) {
      return SEGMENT_DATA[key].type === 'purple' ? '#a855f7' : SEGMENT_DATA[key].type === 'green' ? '#4ade80' : '#94a3b8';
    }
    return SEGMENT_DATA[key].type === 'purple' ? '#6b21a8' : SEGMENT_DATA[key].type === 'green' ? '#15803d' : '#475569';
  };

  const getFill = (key: SegmentKey) => {
    if (activeSegment === key) {
      return SEGMENT_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : SEGMENT_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(148, 163, 184, 0.15)';
    }
    return SEGMENT_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : SEGMENT_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : 'rgba(30, 41, 59, 0.05)';
  };

  return (
    <div className={"interactive-diagram-container"}>
      <div className={`${"interactive-diagram-svg-wrapper"} ${"interactive-diagram-grid-bg"}`}>
        <svg viewBox="0 0 700 320" className={"interactive-diagram-svg"}>
          <defs>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowGray" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <marker
              id="arrow-down"
              viewBox="0 0 10 10"
              refX="5"
              refY="6"
              markerWidth="6"
              markerHeight="6"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
            <marker
              id="arrow-down-green"
              viewBox="0 0 10 10"
              refX="5"
              refY="6"
              markerWidth="6"
              markerHeight="6"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
            <marker
              id="arrow-down-gray"
              viewBox="0 0 10 10"
              refX="5"
              refY="6"
              markerWidth="6"
              markerHeight="6"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Main Object Layout Box */}
          <rect x="10" y="10" width="680" height="300" className={`${styles.subgraphBox} ${styles.onHeapBox}`} />
          <text x="25" y="32" className={styles.subgraphTitle} fill="#2dd4bf">
            Object Memory Layout (Aligned to 8-Byte Boundaries)
          </text>

          {/* Header Box Group */}
          <rect x="30" y="55" width="640" height="90" className={styles.headerBox} />
          <text x="40" y="74" className={styles.subgraphTitle} fill="#a855f7" fontSize="10">
            Object Header (8 / 16 Bytes)
          </text>

          {/* Mark Word Node */}
          <g
            className={`${styles.node} ${activeSegment === 'MARK_WORD' ? "node-active-purple" : ''}`}
            onClick={() => handleSegmentClick('MARK_WORD')}
          >
            <rect
              x="40"
              y="85"
              width="290"
              height="50"
              rx="6"
              ry="6"
              fill={getFill('MARK_WORD')}
              stroke={getStroke('MARK_WORD')}
              strokeWidth={activeSegment === 'MARK_WORD' ? '2.5' : '1.5'}
            />
            {activeSegment === 'MARK_WORD' && (
              <circle cx="318" cy="97" r="4.5" fill="#a855f7" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="185" y="107" className={styles.nodeTitle}>Mark Word (8 Bytes)</text>
            <text x="185" y="121" className={styles.nodeDesc}>Hashcode | GC Age | Locks</text>
          </g>

          {/* Class Pointer Node */}
          <g
            className={`${styles.node} ${activeSegment === 'CLASS_POINTER' ? "node-active-purple" : ''}`}
            onClick={() => handleSegmentClick('CLASS_POINTER')}
          >
            <rect
              x="360"
              y="85"
              width="290"
              height="50"
              rx="6"
              ry="6"
              fill={getFill('CLASS_POINTER')}
              stroke={getStroke('CLASS_POINTER')}
              strokeWidth={activeSegment === 'CLASS_POINTER' ? '2.5' : '1.5'}
            />
            {activeSegment === 'CLASS_POINTER' && (
              <circle cx="638" cy="97" r="4.5" fill="#a855f7" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="505" y="107" className={styles.nodeTitle}>Class Pointer (4 / 8 Bytes)</text>
            <text x="505" y="121" className={styles.nodeDesc}>Metaspace pointer (Compressed OOPs)</text>
          </g>

          {/* Instance Data Node */}
          <g
            className={`${styles.node} ${activeSegment === 'INSTANCE_DATA' ? "node-active-green" : ''}`}
            onClick={() => handleSegmentClick('INSTANCE_DATA')}
          >
            <rect
              x="30"
              y="170"
              width="640"
              height="55"
              rx="6"
              ry="6"
              fill={getFill('INSTANCE_DATA')}
              stroke={getStroke('INSTANCE_DATA')}
              strokeWidth={activeSegment === 'INSTANCE_DATA' ? '2.5' : '1.5'}
            />
            {activeSegment === 'INSTANCE_DATA' && (
              <circle cx="658" cy="182" r="4.5" fill="#4ade80" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="350" y="195" className={styles.nodeTitle}>Instance Data (Payload)</text>
            <text x="350" y="210" className={styles.nodeDesc}>Member fields, primitives, and parent class fields</text>
          </g>

          {/* Padding Node */}
          <g
            className={`${styles.node} ${activeSegment === 'PADDING' ? "node-active-gray" : ''}`}
            onClick={() => handleSegmentClick('PADDING')}
          >
            <rect
              x="30"
              y="250"
              width="640"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('PADDING')}
              stroke={getStroke('PADDING')}
              strokeWidth={activeSegment === 'PADDING' ? '2.5' : '1.5'}
              strokeDasharray="4 4"
            />
            {activeSegment === 'PADDING' && (
              <circle cx="658" cy="262" r="4.5" fill="#94a3b8" className={"interactive-diagram-pulse-dot"} />
            )}
            <text x="350" y="272" className={styles.nodeTitle} fill="#cbd5e1">Padding (0 to 7 Bytes)</text>
            <text x="350" y="285" className={styles.nodeDesc} fill="#94a3b8">Alignment buffer to multiple of 8 bytes</text>
          </g>

          {/* Downward flow arrows */}
          {/* Header -> Instance Data */}
          <g>
            <path
              id="path-hdr-data"
              d="M 350 145 L 350 170"
              fill="none"
              stroke={activeSegment === 'MARK_WORD' || activeSegment === 'CLASS_POINTER' || activeSegment === 'INSTANCE_DATA' ? '#a855f7' : '#2e354f'}
              strokeWidth="2"
              markerEnd={activeSegment === 'MARK_WORD' || activeSegment === 'CLASS_POINTER' || activeSegment === 'INSTANCE_DATA' ? 'url(#arrow-down)' : 'url(#arrow-down-gray)'}
              className={`${styles.transitionPath} ${activeSegment === 'MARK_WORD' || activeSegment === 'CLASS_POINTER' || activeSegment === 'INSTANCE_DATA' ? 'interactive-diagram-flowing-path' : ''}`}
            />
            {(activeSegment === 'MARK_WORD' || activeSegment === 'CLASS_POINTER' || activeSegment === 'INSTANCE_DATA') && (
              <circle r="3" fill="#a855f7" filter="url(#glowPurple)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-hdr-data" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Instance Data -> Padding */}
          <g>
            <path
              id="path-data-pad"
              d="M 350 225 L 350 250"
              fill="none"
              stroke={activeSegment === 'INSTANCE_DATA' || activeSegment === 'PADDING' ? '#4ade80' : '#2e354f'}
              strokeWidth="2"
              markerEnd={activeSegment === 'INSTANCE_DATA' || activeSegment === 'PADDING' ? 'url(#arrow-down-green)' : 'url(#arrow-down-gray)'}
              className={`${styles.transitionPath} ${activeSegment === 'INSTANCE_DATA' || activeSegment === 'PADDING' ? 'interactive-diagram-flowing-path' : ''}`}
            />
            {(activeSegment === 'INSTANCE_DATA' || activeSegment === 'PADDING') && (
              <circle r="3" fill="#4ade80" filter="url(#glowGreen)" className={"interactive-diagram-flowing-dot"}>
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-data-pad" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Display Card */}
      <div className={`${"interactive-diagram-details-card"} ${
        selectedData.type === 'green' ? "details-green" : selectedData.type === 'purple' ? "details-purple" : "details-gray"
      }`}>
        <div className={"interactive-diagram-card-header"}>
          <span className={`${"interactive-diagram-indicator-dot"} ${
            selectedData.type === 'green' ? "card-indicator-green" : selectedData.type === 'purple' ? "card-indicator-purple" : "card-indicator-gray"
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Size:</strong> {selectedData.size}</p>
        <p><strong>Overview:</strong> {selectedData.shortDesc}</p>
        
        <ul>
          <li><strong>Internal Structure:</strong>
            <ul>
              {selectedData.fields.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </li>
          <li><strong>JVM Optimization Features:</strong>
            <ul>
              {selectedData.jvmOptimization.map((opt, i) => (
                <li key={i}>{opt}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className={"interactive-diagram-helper-text"}>
        💡 Click on any partition (Mark Word, Class Pointer, Instance Data, or Padding) in the diagram to inspect its binary footprint.
      </p>
    </div>
  );
}
