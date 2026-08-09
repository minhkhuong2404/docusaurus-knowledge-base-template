import React, { useState } from 'react';

const NODES = [
  {
    id: 'app', label: 'Application Thread', subtitle: 'producer.send(record)', x: 30, y: 140, w: 140, h: 56, color: '#38bdf8',
    detail: { title: 'Application Thread', body: 'The thread calling producer.send(). This call is non-blocking — it appends the ProducerRecord to the RecordAccumulator and returns a Future<RecordMetadata>. The application thread is never blocked waiting for broker I/O.', tags: ['Non-blocking send()', 'Returns Future<RecordMetadata>', 'Callback on I/O thread'] }
  },
  {
    id: 'serializer', label: 'Serializer', subtitle: 'key.serializer + value.serializer', x: 230, y: 60, w: 140, h: 56, color: '#fbbf24',
    detail: { title: 'Serializer', body: 'Converts Java objects to byte[]. The key serializer and value serializer are configured independently. Common choices: StringSerializer, ByteArraySerializer, AvroSerializer (Schema Registry), JsonSerializer. Runs on the application thread before accumulation.', tags: ['key.serializer=StringSerializer', 'value.serializer=JsonSerializer', 'Schemas validated here with Avro'] }
  },
  {
    id: 'partitioner', label: 'Partitioner', subtitle: 'murmur2(key) % N', x: 230, y: 160, w: 140, h: 56, color: '#a78bfa',
    detail: { title: 'Partitioner', body: 'Determines which partition index receives the record. DefaultPartitioner: hash(key) % numPartitions for keyed records, Sticky for null-key records. Custom partitioners implement the Partitioner interface.', tags: ['DefaultPartitioner (key-hash)', 'StickyPartitioner (null-key)', 'partitioner.class config'] }
  },
  {
    id: 'accumulator', label: 'RecordAccumulator', subtitle: 'In-memory batch buffer', x: 430, y: 110, w: 150, h: 80, color: '#f97316',
    detail: { title: 'RecordAccumulator', body: 'In-memory deque of ProducerBatch objects, one deque per target partition. Records are appended to the current open batch for the partition. A batch is "ready" when it hits batch.size (16KB default) or linger.ms elapses. Uses a ByteBuffer pool (BufferPool) to avoid GC pressure from batch allocation.', tags: ['buffer.memory=32MB', 'batch.size=16384 bytes', 'linger.ms=0 (default)', 'BufferPool for zero-copy GC'] }
  },
  {
    id: 'sender', label: 'Sender Thread', subtitle: 'Background I/O thread', x: 640, y: 60, w: 140, h: 56, color: '#f97316',
    detail: { title: 'Sender Thread (I/O Thread)', body: 'Single background thread that polls the RecordAccumulator for ready batches, groups them by broker leader, and sends ProduceRequests via the NetworkClient (NIO). Tracks in-flight requests per broker (max.in.flight.requests.per.connection=5). Handles retries and callback invocation.', tags: ['1 Sender thread per producer', 'NIO NetworkClient', 'max.in.flight=5 (default)', 'Retry with backoff'] }
  },
  {
    id: 'broker', label: 'Broker Leader', subtitle: 'Partition Leader', x: 640, y: 200, w: 140, h: 56, color: '#34d399',
    detail: { title: 'Broker — Partition Leader', body: 'Receives ProduceRequests, appends RecordBatches to the local partition .log segment, and — if acks=all — waits for ISR followers to replicate before sending the ProduceResponse with the assigned offset and timestamp.', tags: ['Appends to .log segment', 'Tracks LEO per partition', 'acks=0/1/all determines response timing'] }
  },
];

const EDGES = [
  { from: 'app', to: 'serializer', label: 'ProducerRecord', color: '#38bdf8' },
  { from: 'app', to: 'partitioner', label: 'key bytes', color: '#38bdf8' },
  { from: 'serializer', to: 'accumulator', label: 'key+value bytes', color: '#fbbf24' },
  { from: 'partitioner', to: 'accumulator', label: 'partition index', color: '#a78bfa' },
  { from: 'accumulator', to: 'sender', label: 'drain ready batches', color: '#f97316' },
  { from: 'sender', to: 'broker', label: 'ProduceRequest', color: '#34d399' },
  { from: 'broker', to: 'sender', label: 'ProduceResponse', color: '#34d399', reverse: true },
];

export default function KafkaProducerInternalsDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .producer-internals-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka Producer — Internal Pipeline Architecture</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click component to inspect</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="producer-internals-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* SVG Canvas */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto' }}>
              <defs>
                {['#38bdf8', '#fbbf24', '#a78bfa', '#f97316', '#34d399'].map(c => (
                  <marker key={c} id={`pi-arr-${c.slice(1)}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill={c} />
                  </marker>
                ))}
              </defs>

              {/* Static arrows (simplified) */}
              {/* app → serializer */}
              <path d="M 170 162 L 230 88" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#pi-arr-38bdf8)" opacity="0.55" />
              {/* app → partitioner */}
              <path d="M 170 168 L 230 188" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#pi-arr-38bdf8)" opacity="0.55" />
              {/* serializer → accumulator */}
              <path d="M 370 88 L 430 140" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#pi-arr-fbbf24)" opacity="0.55" />
              {/* partitioner → accumulator */}
              <path d="M 370 188 L 430 168" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#pi-arr-a78bfa)" opacity="0.55" />
              {/* accumulator → sender */}
              <path d="M 580 130 L 640 88" fill="none" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#pi-arr-f97316)" opacity="0.55" />
              {/* sender → broker */}
              <path d="M 710 116 L 710 200" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#pi-arr-34d399)" opacity="0.55" />
              {/* broker → sender (response) */}
              <path d="M 690 200 L 660 116" fill="none" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#pi-arr-34d399)" opacity="0.4" strokeDasharray="4 2" />

              {/* Labels */}
              <text x="188" y="112" fill="#38bdf8" fontSize="8.5" transform="rotate(-30, 188, 112)">serialized bytes</text>
              <text x="385" y="145" fill="#fbbf24" fontSize="8.5" transform="rotate(30, 385, 145)">appended to batch</text>
              <text x="598" y="100" fill="#f97316" fontSize="8.5" transform="rotate(-20, 598, 100)">drain batches</text>
              <text x="720" y="165" fill="#34d399" fontSize="8.5">ProduceReq</text>
              <text x="650" y="188" fill="#34d399" fontSize="8" opacity="0.6">Response</text>

              {/* Nodes */}
              {NODES.map(node => {
                const isActive = selected === node.id;
                return (
                  <g key={node.id} onClick={() => setSelected(selected === node.id ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
                      fill={isActive ? `${node.color}28` : `${node.color}12`}
                      stroke={node.color} strokeWidth={isActive ? 2 : 1.5}
                      opacity={selected && !isActive ? 0.3 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    <text x={node.x + node.w / 2} y={node.y + 22} textAnchor="middle" fill={node.color} fontSize="11" fontWeight="700"
                      opacity={selected && !isActive ? 0.3 : 1} style={{ transition: 'opacity 0.25s ease' }}>
                      {node.label}
                    </text>
                    <text x={node.x + node.w / 2} y={node.y + 38} textAnchor="middle" fill={node.color} fontSize="8.5" opacity={(selected && !isActive) ? 0.3 : 0.65}>
                      {node.subtitle}
                    </text>
                  </g>
                );
              })}

              {/* Thread boundary lines */}
              <line x1="420" y1="20" x2="420" y2="300" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="5 3" />
              <text x="310" y="295" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9">Application Thread</text>
              <text x="625" y="295" textAnchor="middle" fill="rgba(249,115,22,0.4)" fontSize="9">Sender Thread (Background I/O)</text>
            </svg>
          </div>

          {/* Detail panel */}
          <div className={`interactive-diagram-details-card ${selNode ? 'details-yellow' : 'details-gray'}`}
            style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {selNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color, marginBottom: '10px' }}>{selNode.detail.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  {selNode.detail.body}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selNode.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${selNode.color}18`, color: selNode.color, border: `1px solid ${selNode.color}40`, borderRadius: '5px', padding: '2px 7px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <div>Click any pipeline stage to inspect internals</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}