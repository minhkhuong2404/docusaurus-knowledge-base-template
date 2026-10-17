import React, { useState } from 'react';

export type OpenSearchDiagramMode =
  | 'architecture'
  | 'storage-engine'
  | 'spl-to-ppl'
  | 'tiered-ism';

interface Props {
  initialMode?: OpenSearchDiagramMode;
}

interface ModeMeta {
  id: OpenSearchDiagramMode;
  label: string;
  accent: string;
  subtitle: string;
}

const MODES: ModeMeta[] = [
  {
    id: 'architecture',
    label: 'Splunk → OpenSearch Topology',
    accent: '#38bdf8',
    subtitle: 'End-to-end architectural mapping from Splunk Forwarders/Indexers to OpenTelemetry, Data Prepper & OpenSearch',
  },
  {
    id: 'storage-engine',
    label: 'Lucene Write Path & Segment Replication',
    accent: '#34d399',
    subtitle: 'Schema-on-Write indexing buffer, Translog fsync, 1s/30s Refresh NRT segments, FSTs & DocValues',
  },
  {
    id: 'spl-to-ppl',
    label: 'SPL → OpenSearch PPL & DSL Translator',
    accent: '#fbbf24',
    subtitle: 'Interactive side-by-side translation of Splunk SPL pipes into OpenSearch PPL, DQL, and Query DSL',
  },
  {
    id: 'tiered-ism',
    label: 'ISM Hot / UltraWarm / Cold S3 Tiering',
    accent: '#a78bfa',
    subtitle: 'Index State Management rollover, S3 Searchable Snapshots & TCO storage economics',
  },
];

interface QueryComparison {
  id: string;
  title: string;
  useCase: string;
  splunkSpl: string;
  opensearchPpl: string;
  opensearchDql: string;
  opensearchDsl: string;
}

const QUERY_COMPARISONS: QueryComparison[] = [
  {
    id: 'filter-stats',
    title: '1. Error Rate & p99 Latency by Service',
    useCase: 'Filter 5xx errors in production and compute request count + 99th percentile latency per microservice.',
    splunkSpl: `index="prod_logs" status>=500
| stats count as error_cnt, perc99(duration_ms) as p99_ms by service
| sort - error_cnt`,
    opensearchPpl: `source = logs-prod-*
| where status >= 500
| stats count() as error_cnt, percentile(duration_ms, 99) as p99_ms by service
| sort - error_cnt`,
    opensearchDql: `status >= 500 and environment: "production"`,
    opensearchDsl: `{
  "size": 0,
  "query": { "range": { "status": { "gte": 500 } } },
  "aggs": {
    "by_service": {
      "terms": { "field": "service.keyword", "size": 20 },
      "aggs": {
        "p99_ms": { "percentiles": { "field": "duration_ms", "percents": [99] } }
      }
    }
  }
}`,
  },
  {
    id: 'timechart',
    title: '2. Time-Series Bucketing (timechart → span)',
    useCase: 'Bucket HTTP traffic into 5-minute windows grouped by status category to spot incident spikes.',
    splunkSpl: `index="prod_logs" service="payment-service"
| timechart span=5m count by status_family`,
    opensearchPpl: `source = logs-prod-*
| where service = 'payment-service'
| stats count() as req_count by span(@timestamp, 5m), status_family`,
    opensearchDql: `service.keyword: "payment-service"`,
    opensearchDsl: `{
  "size": 0,
  "query": { "term": { "service.keyword": "payment-service" } },
  "aggs": {
    "over_time": {
      "date_histogram": { "field": "@timestamp", "fixed_interval": "5m" },
      "aggs": {
        "by_status": { "terms": { "field": "status_family.keyword" } }
      }
    }
  }
}`,
  },
  {
    id: 'rex-parse',
    title: '3. Ad-Hoc Regex Extraction (rex → parse)',
    useCase: 'Extract an unindexed orderId or error code from an unstructured log message string at query time.',
    splunkSpl: `index="prod_logs" "Payment failed"
| rex field=message "orderId=(?<order_id>[A-Z0-9-]+) reason=(?<decline_reason>\\w+)"
| stats count by decline_reason`,
    opensearchPpl: `source = logs-prod-*
| where match(message, 'Payment failed')
| parse message '.*orderId=(?<order_id>[A-Z0-9-]+) reason=(?<decline_reason>\\w+).*'
| stats count() by decline_reason`,
    opensearchDql: `message: "Payment failed"`,
    opensearchDsl: `{
  "runtime_mappings": {
    "decline_reason": {
      "type": "keyword",
      "script": "Matcher m = /reason=(\\w+)/.matcher(doc['message.keyword'].value); if (m.find()) emit(m.group(1));"
    }
  },
  "aggs": { "reasons": { "terms": { "field": "decline_reason" } } }
}`,
  },
  {
    id: 'eval-dedup',
    title: '4. Calculated Fields & Deduplication (eval / dedup)',
    useCase: 'Compute SLA breach booleans dynamically and deduplicate repeated retry logs by traceId.',
    splunkSpl: `index="prod_logs" service="checkout"
| dedup traceId
| eval is_sla_breach = if(duration_ms > 1500, "BREACH", "OK")
| stats count by is_sla_breach`,
    opensearchPpl: `source = logs-prod-*
| where service = 'checkout'
| dedup traceId
| eval is_sla_breach = if(duration_ms > 1500, 'BREACH', 'OK')
| stats count() by is_sla_breach`,
    opensearchDql: `service.keyword: "checkout" and duration_ms > 1500`,
    opensearchDsl: `{
  "size": 0,
  "query": { "term": { "service.keyword": "checkout" } },
  "aggs": {
    "unique_traces": { "cardinality": { "field": "traceId.keyword" } },
    "sla_ranges": {
      "range": { "field": "duration_ms", "ranges": [{ "to": 1500 }, { "from": 1500 }] }
    }
  }
}`,
  },
];

export default function OpenSearchSplunkMigrationDiagram({
  initialMode = 'architecture',
}: Props): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<OpenSearchDiagramMode>(initialMode);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('filter-stats');

  const currentMeta = MODES.find((m) => m.id === activeMode) || MODES[0];
  const currentQuery =
    QUERY_COMPARISONS.find((q) => q.id === selectedQueryId) || QUERY_COMPARISONS[0];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.75rem 0' }}>
      <style>{`
        .os-split-grid {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 12px;
          align-items: start;
          padding: 14px;
        }
        .os-three-grid {
          display: grid;
          grid-template-columns: 33% 33% 33%;
          gap: 10px;
          padding: 0 14px 14px 14px;
        }
        @media (max-width: 768px) {
          .os-split-grid,
          .os-three-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(13, 15, 30, 0.92)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={currentMeta.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M8 11h6" />
            <path d="M11 8v6" />
          </svg>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
              OpenSearch Internals &amp; Splunk Migration Telemetry Explorer
            </div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
              {currentMeta.subtitle}
            </div>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {MODES.map((m) => {
            const isSelected = m.id === activeMode;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMode(m.id)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isSelected ? m.accent : 'rgba(255, 255, 255, 0.1)'}`,
                  color: isSelected ? m.accent : '#cbd5e1',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: Splunk -> OpenSearch Topology */}
      {activeMode === 'architecture' && (
        <div>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px' }}>
            <svg viewBox="0 0 800 250" className="interactive-diagram-svg" style={{ width: '100%', minWidth: '660px' }}>
              <defs>
                <marker id="os-arr-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#38bdf8' }} />
                </marker>
                <marker id="os-arr-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#fbbf24' }} />
                </marker>
                <marker id="os-arr-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#34d399' }} />
                </marker>
                <marker id="os-arr-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#a78bfa' }} />
                </marker>
              </defs>

              {/* Row 1 Label: Legacy Splunk Tier */}
              <text x="20" y="24" fill="#f87171" fontSize="9.5" fontWeight="700">
                SPLUNK LEGACY PIPELINE (Schema-on-Read • Per-GB Ingest License)
              </text>
              <rect x="20" y="32" width="155" height="44" rx="6" fill="#0d0f1e" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="1.3" />
              <text x="97" y="51" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">
                Universal Forwarder
              </text>
              <text x="97" y="65" textAnchor="middle" fill="#94a3b8" fontSize="8">
                inputs.conf / outputs.conf
              </text>

              <rect x="220" y="32" width="165" height="44" rx="6" fill="#0d0f1e" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="1.3" />
              <text x="302" y="51" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">
                Heavy Forwarder (HF)
              </text>
              <text x="302" y="65" textAnchor="middle" fill="#94a3b8" fontSize="8">
                props.conf / transforms.conf
              </text>

              <rect x="430" y="32" width="170" height="44" rx="6" fill="#0d0f1e" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="1.3" />
              <text x="515" y="51" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">
                Splunk Indexer Tier
              </text>
              <text x="515" y="65" textAnchor="middle" fill="#94a3b8" fontSize="8">
                rawdata journal + tsidx files
              </text>

              <rect x="640" y="32" width="140" height="44" rx="6" fill="#0d0f1e" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="1.3" />
              <text x="710" y="51" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">
                Search Head (SPL)
              </text>
              <text x="710" y="65" textAnchor="middle" fill="#94a3b8" fontSize="8">
                Regex parse at Query Time
              </text>

              {/* Vertical Mapping Arrows */}
              <path d="M 97 80 L 97 128" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="1.6" fill="none" markerEnd="url(#os-arr-cyan)" />
              <path d="M 302 80 L 302 128" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="1.6" fill="none" markerEnd="url(#os-arr-amber)" />
              <path d="M 515 80 L 515 128" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="1.6" fill="none" markerEnd="url(#os-arr-emerald)" />
              <path d="M 710 80 L 710 128" className="interactive-diagram-flowing-path" stroke="#a78bfa" strokeWidth="1.6" fill="none" markerEnd="url(#os-arr-purple)" />

              {/* Row 2 Label: Modern OpenSearch Architecture */}
              <text x="20" y="120" fill="#34d399" fontSize="9.5" fontWeight="700">
                OPENSEARCH CLOUD-NATIVE PIPELINE (Schema-on-Write • Apache 2.0 Open Source)
              </text>

              {/* Node 1: Fluent Bit / OTel Collector */}
              <rect x="20" y="135" width="155" height="78" rx="8" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1.7" />
              <text x="97" y="157" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">
                Fluent Bit / OTel
              </text>
              <text x="97" y="173" textAnchor="middle" fill="#e2e8f0" fontSize="8.3">
                K8s DaemonSet Shipper
              </text>
              <text x="97" y="188" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Tails container JSON stdout
              </text>
              <text x="97" y="202" textAnchor="middle" fill="#38bdf8" fontSize="7.8">
                Enriches K8s pod metadata
              </text>

              {/* Node 2: Kafka + Data Prepper */}
              <rect x="220" y="135" width="165" height="78" rx="8" fill="#0d0f1e" stroke="#fbbf24" strokeWidth="1.7" />
              <text x="302" y="157" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">
                Kafka + Data Prepper
              </text>
              <text x="302" y="173" textAnchor="middle" fill="#e2e8f0" fontSize="8.3">
                Backpressure Buffer + ETL
              </text>
              <text x="302" y="188" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Grok / JSON / PII Redaction
              </text>
              <text x="302" y="202" textAnchor="middle" fill="#fbbf24" fontSize="7.8">
                Trace &amp; Log OTel Correlation
              </text>

              {/* Node 3: OpenSearch Cluster */}
              <rect x="430" y="135" width="170" height="78" rx="8" fill="#0d0f1e" stroke="#34d399" strokeWidth="1.7" />
              <text x="515" y="157" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">
                OpenSearch Data Streams
              </text>
              <text x="515" y="173" textAnchor="middle" fill="#e2e8f0" fontSize="8.3">
                Primary &amp; Replica Shards
              </text>
              <text x="515" y="188" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Inverted Index + DocValues
              </text>
              <text x="515" y="202" textAnchor="middle" fill="#34d399" fontSize="7.8">
                Segment Replication (40% less CPU)
              </text>

              {/* Node 4: OpenSearch Dashboards */}
              <rect x="640" y="135" width="140" height="78" rx="8" fill="#0d0f1e" stroke="#a78bfa" strokeWidth="1.7" />
              <text x="710" y="157" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="700">
                Dashboards (PPL/DQL)
              </text>
              <text x="710" y="173" textAnchor="middle" fill="#e2e8f0" fontSize="8.3">
                Observability &amp; Trace UI
              </text>
              <text x="710" y="188" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Piped Processing (PPL)
              </text>
              <text x="710" y="202" textAnchor="middle" fill="#a78bfa" fontSize="7.8">
                Alerting Monitors &amp; Anomaly ML
              </text>

              {/* Horizontal Flowing Conduits */}
              <path d="M 179 174 L 212 174" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#os-arr-cyan)" />
              <path d="M 389 174 L 422 174" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="2" fill="none" markerEnd="url(#os-arr-amber)" />
              <path d="M 604 174 L 632 174" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2" fill="none" markerEnd="url(#os-arr-emerald)" />
            </svg>
          </div>

          <div className="os-three-grid">
            <div style={{ background: '#0c0e17', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                Why Kafka + Data Prepper?
              </div>
              <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                During a production outage, microservices can emit $10\times$ normal log volume. Kafka buffers the spike so OpenSearch Bulk queues never reject writes (<code>429 Too Many Requests</code>), while Data Prepper replaces Splunk Heavy Forwarders.
              </div>
            </div>
            <div style={{ background: '#0c0e17', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                Schema-on-Write Advantage
              </div>
              <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                Splunk parses raw text on every search (CPU-bound at read time). OpenSearch builds Lucene Posting Lists, BKD-Trees, and columnar <code>DocValues</code> at ingest time, making aggregations over billions of logs sub-second.
              </div>
            </div>
            <div style={{ background: '#0c0e17', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
                Zero-Friction SPL Transition
              </div>
              <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                OpenSearch includes native <strong>PPL (Piped Processing Language)</strong> (<code>source=logs-* | where ... | stats ...</code>) so engineers migrating from Splunk SPL can keep their exact pipe-based mental model.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Lucene Write Path & Segment Replication */}
      {activeMode === 'storage-engine' && (
        <div>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px' }}>
            <svg viewBox="0 0 800 240" className="interactive-diagram-svg" style={{ width: '100%', minWidth: '660px' }}>
              <defs>
                <marker id="se-arr-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#38bdf8' }} />
                </marker>
                <marker id="se-arr-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#34d399' }} />
                </marker>
                <marker id="se-arr-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#fbbf24' }} />
                </marker>
              </defs>

              {/* Step 1: Ingest & Buffer + Translog */}
              <rect x="20" y="35" width="170" height="165" rx="8" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1.6" />
              <text x="105" y="58" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">
                1. Primary Shard Write
              </text>
              <rect x="34" y="70" width="142" height="50" rx="5" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1" />
              <text x="105" y="90" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600">
                JVM Indexing Buffer
              </text>
              <text x="105" y="105" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Not yet searchable!
              </text>
              <rect x="34" y="132" width="142" height="52" rx="5" fill="rgba(251, 191, 36, 0.08)" stroke="#fbbf24" strokeWidth="1" />
              <text x="105" y="152" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="600">
                Translog (Disk WAL)
              </text>
              <text x="105" y="167" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Crash-safe fsync durability
              </text>

              {/* Step 2: Refresh -> OS Page Cache Lucene Segment */}
              <rect x="245" y="35" width="255" height="165" rx="8" fill="#0d0f1e" stroke="#34d399" strokeWidth="1.7" />
              <text x="372" y="58" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">
                2. Immutable Lucene Segment (OS Page Cache)
              </text>
              <text x="372" y="75" textAnchor="middle" fill="#cbd5e1" fontSize="8.2">
                Created on Refresh (1s default / 30s for log streams)
              </text>
              <rect x="260" y="86" width="108" height="46" rx="4" fill="#090b14" stroke="rgba(52, 211, 153, 0.4)" />
              <text x="314" y="104" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="700">
                Inverted Index
              </text>
              <text x="314" y="119" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                FST + Roaring Bitmaps
              </text>

              <rect x="378" y="86" width="108" height="46" rx="4" fill="#090b14" stroke="rgba(56, 189, 248, 0.4)" />
              <text x="432" y="104" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="700">
                DocValues (.dvd)
              </text>
              <text x="432" y="119" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                Columnar Store for Aggs
              </text>

              <rect x="260" y="140" width="108" height="46" rx="4" fill="#090b14" stroke="rgba(251, 191, 36, 0.4)" />
              <text x="314" y="158" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="700">
                BKD-Trees (.kdd)
              </text>
              <text x="314" y="173" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                Fast @timestamp / Range
              </text>

              <rect x="378" y="140" width="108" height="46" rx="4" fill="#090b14" stroke="rgba(167, 139, 250, 0.4)" />
              <text x="432" y="158" textAnchor="middle" fill="#a78bfa" fontSize="8.5" fontWeight="700">
                Stored _source
              </text>
              <text x="432" y="173" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                ZSTD Compressed JSON
              </text>

              {/* Step 3: Segment Replication to Replica Shards */}
              <rect x="555" y="35" width="225" height="165" rx="8" fill="#0d0f1e" stroke="#fbbf24" strokeWidth="1.6" />
              <text x="667" y="58" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">
                3. Segment Replication &amp; Merge
              </text>
              <text x="667" y="82" textAnchor="middle" fill="#e2e8f0" fontSize="8.5">
                Copies raw Lucene segment bytes
              </text>
              <text x="667" y="97" textAnchor="middle" fill="#34d399" fontSize="8.3" fontWeight="600">
                Replicas skip tokenization/indexing!
              </text>
              <rect x="572" y="112" width="190" height="72" rx="5" fill="#090b14" stroke="rgba(251, 191, 36, 0.35)" />
              <text x="667" y="132" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="700">
                Background Tiered Merge
              </text>
              <text x="667" y="148" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                Combines small segments into larger
              </text>
              <text x="667" y="162" textAnchor="middle" fill="#94a3b8" fontSize="7.8">
                ones &amp; purges .del tombstones
              </text>

              {/* Conduits */}
              <path d="M 196 95 L 237 95" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2.2" fill="none" markerEnd="url(#se-arr-emerald)" />
              <text x="216" y="85" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="700">
                Refresh
              </text>

              <path d="M 506 115 L 547 115" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="2.2" fill="none" markerEnd="url(#se-arr-amber)" />
              <text x="526" y="105" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="700">
                SegRep
              </text>
            </svg>
          </div>
          <div className="interactive-diagram-details-card" style={{ margin: '0 14px 14px 14px', borderLeftColor: '#34d399' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
              Why OS Page Cache + 31 GB JVM Heap Cap Is Non-Negotiable
            </div>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              OpenSearch stores only the compact FST (Finite State Transducer) term index prefix on the JVM Heap; the heavy Lucene Posting Lists (<code>.doc</code>) and columnar <code>DocValues</code> (<code>.dvd</code>) are accessed via OS kernel <code>mmap</code> directly from the <strong>Linux Page Cache</strong>. Always cap JVM Heap at <code>-Xms31g -Xmx31g</code> (preserving 32-bit Compressed OOPs) on a 64 GB RAM node so 33 GB of RAM stays dedicated to the OS Page Cache!
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Interactive SPL -> OpenSearch PPL / DQL / DSL Translator */}
      {activeMode === 'spl-to-ppl' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px 14px 0 14px' }}>
            {QUERY_COMPARISONS.map((q) => {
              const active = q.id === currentQuery.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQueryId(q.id)}
                  style={{
                    background: active ? 'rgba(251, 191, 36, 0.16)' : '#0c0e17',
                    border: `1px solid ${active ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: active ? '#fbbf24' : '#e2e8f0',
                    borderRadius: '6px',
                    padding: '6px 11px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {q.title}
                </button>
              );
            })}
          </div>

          <div style={{ padding: '10px 14px 0 14px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <strong style={{ color: '#e2e8f0' }}>Scenario:</strong> {currentQuery.useCase}
          </div>

          <div className="os-split-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#0c0e17', border: '1px solid rgba(248, 113, 113, 0.35)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                  Splunk SPL (Search Processing Language)
                </div>
                <pre style={{ margin: 0, fontSize: '0.72rem', color: '#f8fafc', background: '#090b14', padding: '8px', borderRadius: '6px', overflowX: 'auto' }}>
                  {currentQuery.splunkSpl}
                </pre>
              </div>

              <div style={{ background: '#0c0e17', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  OpenSearch PPL (Piped Processing Language — 1:1 SPL Equivalent)
                </div>
                <pre style={{ margin: 0, fontSize: '0.72rem', color: '#34d399', background: '#090b14', padding: '8px', borderRadius: '6px', overflowX: 'auto' }}>
                  {currentQuery.opensearchPpl}
                </pre>
              </div>

              <div style={{ background: '#0c0e17', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  OpenSearch Dashboards DQL (Discover Bar Filter)
                </div>
                <pre style={{ margin: 0, fontSize: '0.72rem', color: '#38bdf8', background: '#090b14', padding: '8px', borderRadius: '6px', overflowX: 'auto' }}>
                  {currentQuery.opensearchDql}
                </pre>
              </div>
            </div>

            <div style={{ background: '#0c0e17', border: '1px solid rgba(167, 139, 250, 0.35)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#a78bfa', marginBottom: '6px' }}>
                OpenSearch REST Query DSL (JSON API / Java Client)
              </div>
              <pre style={{ margin: 0, fontSize: '0.71rem', color: '#e2e8f0', background: '#090b14', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
                {currentQuery.opensearchDsl}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: ISM Hot / UltraWarm / Cold Storage Tiering */}
      {activeMode === 'tiered-ism' && (
        <div>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px' }}>
            <svg viewBox="0 0 800 215" className="interactive-diagram-svg" style={{ width: '100%', minWidth: '660px' }}>
              <defs>
                <marker id="ism-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-fill" stroke="context-stroke" style={{ fill: '#a78bfa' }} />
                </marker>
              </defs>

              {/* Hot Tier */}
              <rect x="20" y="35" width="170" height="135" rx="8" fill="#0d0f1e" stroke="#f87171" strokeWidth="1.7" />
              <text x="105" y="58" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">
                HOT Tier (Day 0–7)
              </text>
              <text x="105" y="76" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="600">
                Local NVMe SSD Nodes
              </text>
              <text x="105" y="94" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                Active Write Index + Rollover
              </text>
              <text x="105" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                max_primary_shard_size: 50gb
              </text>
              <text x="105" y="126" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="600">
                p99 Query: 20–150 ms
              </text>
              <text x="105" y="146" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                Splunk Equiv: Hot/Warm Bucket
              </text>

              {/* UltraWarm Tier */}
              <rect x="225" y="35" width="185" height="135" rx="8" fill="#0d0f1e" stroke="#fbbf24" strokeWidth="1.7" />
              <text x="317" y="58" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">
                ULTRAWARM (Day 7–30)
              </text>
              <text x="317" y="76" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="600">
                S3 + Local NVMe Prefetch Cache
              </text>
              <text x="317" y="94" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                force_merge (max_num_segments: 1)
              </text>
              <text x="317" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                Read-only Searchable Snapshots
              </text>
              <text x="317" y="126" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="600">
                ~70% Lower Storage Cost
              </text>
              <text x="317" y="146" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                Splunk Equiv: SmartStore Warm
              </text>

              {/* Cold Tier */}
              <rect x="445" y="35" width="170" height="135" rx="8" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1.7" />
              <text x="530" y="58" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">
                COLD Tier (Day 30–90)
              </text>
              <text x="530" y="76" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="600">
                Pure Object Storage (S3)
              </text>
              <text x="530" y="94" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                Detached from Compute RAM
              </text>
              <text x="530" y="110" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                On-demand attach for audits
              </text>
              <text x="530" y="126" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="600">
                ~$0.023 / GB / Month
              </text>
              <text x="530" y="146" textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                Splunk Equiv: Cold / Frozen
              </text>

              {/* Delete / Glacier */}
              <rect x="650" y="35" width="130" height="135" rx="8" fill="#0d0f1e" stroke="#a78bfa" strokeWidth="1.7" />
              <text x="715" y="58" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="700">
                EXPIRE (Day 90+)
              </text>
              <text x="715" y="82" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                ISM Delete Action
              </text>
              <text x="715" y="100" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                or S3 Glacier Deep
              </text>
              <text x="715" y="118" textAnchor="middle" fill="#a78bfa" fontSize="8" fontWeight="600">
                Zero Re-hydration Fee
              </text>

              {/* Flowing ISM Transitions */}
              <path d="M 194 102 L 219 102" className="interactive-diagram-flowing-path" stroke="#a78bfa" strokeWidth="2" fill="none" markerEnd="url(#ism-arr)" />
              <path d="M 414 102 L 439 102" className="interactive-diagram-flowing-path" stroke="#a78bfa" strokeWidth="2" fill="none" markerEnd="url(#ism-arr)" />
              <path d="M 619 102 L 644 102" className="interactive-diagram-flowing-path" stroke="#a78bfa" strokeWidth="2" fill="none" markerEnd="url(#ism-arr)" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
