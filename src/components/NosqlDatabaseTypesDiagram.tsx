import React, { useState } from 'react';

interface NoSqlCategory {
  id: string;
  name: string;
  badge: string;
  color: string;
  dataModel: string;
  queryStyle: string;
  scalingStrategy: string;
  bestFor: string;
  popularTech: string;
}

const NOSQL_TYPES: NoSqlCategory[] = [
  {
    id: 'document',
    name: '1. Document Store',
    badge: 'JSON / BSON Documents',
    color: '#34d399',
    dataModel: 'Hierarchical nested JSON/BSON documents containing nested objects and arrays.',
    queryStyle: 'Rich field indexing, aggregation pipelines (`$match`, `$group`), geospatial queries.',
    scalingStrategy: 'Horizontal Sharding by shard key.',
    bestFor: 'E-commerce product catalogs, content management, flexible user profiles.',
    popularTech: 'MongoDB, Couchbase, Amazon DocumentDB',
  },
  {
    id: 'key-value',
    name: '2. Key-Value Store',
    badge: 'Ultra Fast O(1) Lookup',
    color: '#38bdf8',
    dataModel: 'Opaque byte string value mapped to a unique string key.',
    queryStyle: 'Key-based lookup (`GET`, `SET`, `DEL`). No join support across keys.',
    scalingStrategy: 'Hash slots / Partition sharding across nodes.',
    bestFor: 'Caching, session management, real-time rate limiting, leaderboards.',
    popularTech: 'Redis, Memcached, Amazon DynamoDB (Key-Value mode)',
  },
  {
    id: 'wide-column',
    name: '3. Wide-Column / Column-Family',
    badge: 'High Scale Write Engine',
    color: '#fbbf24',
    dataModel: 'Sparse multi-dimensional map indexed by Row Key, Column Family, and Column Qualifier.',
    queryStyle: 'Primary Key & Clustering Column range queries.',
    scalingStrategy: 'LSM-Tree write engine + Consistent Hash Ring sharding.',
    bestFor: 'Time-series metrics, IoT sensor data, high-volume event logging.',
    popularTech: 'Apache Cassandra, ScyllaDB, Google Cloud Bigtable',
  },
  {
    id: 'graph',
    name: '4. Graph Database',
    badge: 'Relationship Traversals',
    color: '#c084fc',
    dataModel: 'Nodes (entities), Edges (relationships), and Properties.',
    queryStyle: 'Cypher / Gremlin pattern matching for deep multi-hop traversals (`O(1)` index-free adjacency).',
    scalingStrategy: 'Fabric sharding / Partitioned graph partitioning.',
    bestFor: 'Social networks, fraud detection networks, recommendation engines, knowledge graphs.',
    popularTech: 'Neo4j, AWS Neptune, ArangoDB',
  },
];

export default function NosqlDatabaseTypesDiagram(): React.JSX.Element {
  const [selectedType, setSelectedType] = useState<NoSqlCategory>(NOSQL_TYPES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          NoSQL Database Paradigms & Data Model Architecture Explorer
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {NOSQL_TYPES.map((t) => {
            const isSelected = t.id === selectedType.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${t.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${t.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Selected Category Details */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedType.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedType.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedType.color}22`, color: selectedType.color, fontWeight: 700 }}>
              {selectedType.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedType.dataModel}
          </p>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Querying & Indexing Style
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '10px', lineHeight: 1.4 }}>
              {selectedType.queryStyle}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Scaling Architecture
            </div>
            <div style={{ fontSize: '12.5px', color: selectedType.color, fontWeight: 600 }}>
              {selectedType.scalingStrategy}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Industry Leading Technologies
            </div>
            <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700, marginBottom: '10px' }}>
              {selectedType.popularTech}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Optimal Use Cases
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedType.bestFor}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
