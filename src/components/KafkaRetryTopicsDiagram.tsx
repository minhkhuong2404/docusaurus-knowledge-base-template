import React, { useState, useEffect } from 'react';

interface RetryStep {
  id: number;
  title: string;
  source: string;
  target: string;
  status: 'fail' | 'reroute' | 'commit' | 'dlq' | 'success';
  badgeColor: string;
  description: string;
  codeSnippet: string;
}

const RETRY_STEPS: RetryStep[] = [
  {
    id: 1,
    title: 'Main Topic Processing Failure',
    source: 'orders (P0)',
    target: 'Main Consumer',
    status: 'fail',
    badgeColor: '#f87171',
    description: 'Main consumer polls Record #42 (Order Payment). Downstream payment gateway returns 503 Service Unavailable or transient DB lock. Instead of sleeping in-place, the failure is caught.',
    codeSnippet: '// Main Consumer Loop: catch transient exception\ntry {\n  processPayment(record);\n  consumer.commitSync();\n} catch (TransientException ex) {\n  publishToRetryTopic(record, "orders-retry-10s", 1);\n  consumer.commitSync(); // Commit immediately to unblock P0!\n}'
  },
  {
    id: 2,
    title: 'Forward to Retry Topic 1 & Unblock Offset',
    source: 'Main Consumer',
    target: 'orders-retry-10s',
    status: 'reroute',
    badgeColor: '#fbbf24',
    description: 'The failed record is published to `orders-retry-10s` with metadata headers (x-retry-count: 1, x-original-offset: 42). The main consumer commits offset #42 immediately, proceeding to #43 without Head-of-Line blocking.',
    codeSnippet: 'Headers headers = record.headers();\nheaders.add("x-retry-count", "1".getBytes());\nheaders.add("x-first-failed-at", Instant.now().toString().getBytes());\nproducer.send(new ProducerRecord<>("orders-retry-10s", record.key(), record.value()));'
  },
  {
    id: 3,
    title: 'Delayed Processing in Retry Topic 1',
    source: 'orders-retry-10s',
    target: 'Retry-1 Consumer',
    status: 'fail',
    badgeColor: '#fbbf24',
    description: 'A dedicated consumer group monitors `orders-retry-10s`. If the 10-second backoff window has not elapsed, it pauses partition consumption. Upon retry, downstream payment gateway fails again.',
    codeSnippet: 'long elapsed = System.currentTimeMillis() - extractTimestamp(record);\nif (elapsed < 10_000) {\n  consumer.pause(Set.of(partition)); // Sleep/pause poll until delay expires\n}\n// Attempt retry; if still failing:\npublishToRetryTopic(record, "orders-retry-1m", 2);'
  },
  {
    id: 4,
    title: 'Forward to Retry Topic 2 (Exponential Backoff)',
    source: 'Retry-1 Consumer',
    target: 'orders-retry-1m',
    status: 'reroute',
    badgeColor: '#f97316',
    description: 'Record is escalated to `orders-retry-1m` with x-retry-count: 2. Retry-1 consumer commits its offset. Retry-2 workers enforce a 60-second backoff window, giving downstream dependencies time to recover.',
    codeSnippet: 'headers.add("x-retry-count", "2".getBytes());\nproducer.send(new ProducerRecord<>("orders-retry-1m", record.key(), record.value()));\nretry1Consumer.commitSync();'
  },
  {
    id: 5,
    title: 'Max Retries Exceeded → Route to Dead Letter Queue (DLQ)',
    source: 'orders-retry-1m',
    target: 'orders-dlq',
    status: 'dlq',
    badgeColor: '#f87171',
    description: 'Retry attempt #2 fails. Maximum allowed retry budget exhausted. The record is permanently published to `orders-dlq` (Dead Letter Topic) alongside the full root cause stack trace.',
    codeSnippet: 'headers.add("x-exception-message", ex.getMessage().getBytes());\nheaders.add("x-exception-stacktrace", getStackTrace(ex).getBytes());\nproducer.send(new ProducerRecord<>("orders-dlq", record.key(), record.value()));\nretry2Consumer.commitSync();'
  },
  {
    id: 6,
    title: 'SRE Triage & Redrive Dashboard',
    source: 'orders-dlq',
    target: 'Operations / SRE',
    status: 'success',
    badgeColor: '#34d399',
    description: 'Alert fires in Datadog/PagerDuty on `kafka_topic_dlq_records_total`. SRE engineers inspect the poison payload in an internal admin portal, fix downstream bug or data schema, and click "Redrive to Main".',
    codeSnippet: '// Redrive API Endpoint in SRE Portal\n@PostMapping("/api/dlq/redrive")\npublic ResponseEntity<Void> redrive(@RequestBody RedriveRequest req) {\n  ConsumerRecord<String, byte[]> poison = dlqStorage.fetch(req.getMessageId());\n  producer.send(new ProducerRecord<>("orders", poison.key(), poison.value()));\n  return ResponseEntity.ok().build();\n}'
  }
];

export default function KafkaRetryTopicsDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'non-blocking' | 'hol-blocking'>('non-blocking');

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= RETRY_STEPS.length) {
          setIsPlaying(false);
          return 1;
        }
        return prev + 1;
      });
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const step = RETRY_STEPS.find((s) => s.id === activeStep) || RETRY_STEPS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .retry-grid-layout { grid-template-columns: 1fr !important; }
          .retry-topics-svg-wrap { overflow-x: auto; }
        }
        .retry-flowing-arrow {
          stroke-dasharray: 6 4;
          animation: retryDashFlow 1.2s linear infinite;
        }
        @keyframes retryDashFlow {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Non-Blocking Retry Topics &amp; Dead Letter Queue (DLQ) Architecture
        </span>
        <button
          onClick={() => {
            setIsPlaying(!isPlaying);
            if (!isPlaying && activeStep === RETRY_STEPS.length) setActiveStep(1);
          }}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid #34d399',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            background: isPlaying ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.08)',
            color: '#15803d',
            transition: 'all 0.2s ease'
          }}
        >
          {isPlaying ? '⏸ Pause Flow' : '▶ Animate Flow'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Architecture Mode Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setActiveMode('non-blocking')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: activeMode === 'non-blocking' ? '1.5px solid #34d399' : '1px solid #D9D9D9',
              background: activeMode === 'non-blocking' ? '#dcfce7' : '#F2F2F2',
              color: activeMode === 'non-blocking' ? '#15803d' : '#334155',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            ✓ Non-Blocking Retry Topics (Production Standard)
          </button>
          <button
            onClick={() => setActiveMode('hol-blocking')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: activeMode === 'hol-blocking' ? '1.5px solid #f87171' : '1px solid #D9D9D9',
              background: activeMode === 'hol-blocking' ? '#fee2e2' : '#F2F2F2',
              color: activeMode === 'hol-blocking' ? '#991b1b' : '#334155',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            ⚠ Naive Local Retry (Head-of-Line Blocking Trap)
          </button>
        </div>

        {activeMode === 'hol-blocking' ? (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
              Why Naive `Thread.sleep()` In-Place Crashes Production:
            </div>
            <p style={{ fontSize: '12px', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
              In Kafka, partition offsets are sequential. If consumer thread sleeps to retry Record #42, the partition is completely blocked.
              Records #43 through #10,000 cannot be consumed. If the sleep exceeds <code>max.poll.interval.ms</code>, the Group Coordinator
              declares the consumer dead, triggering a violent rebalance storm across all other consumers.
            </p>
          </div>
        ) : (
          <div style={{ background: '#F7FDF9', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
              Enterprise Decoupling Rule:
            </div>
            <p style={{ fontSize: '11.5px', color: '#14532d', margin: 0, lineHeight: 1.5 }}>
              Commit the main partition offset immediately upon republishing to the retry topic. This frees the main consumer to process succeeding records at full wire speed while dedicated workers handle exponential backoffs.
            </p>
          </div>
        )}

        {/* Visual SVG Flow Diagram */}
        <div className="retry-topics-svg-wrap" style={{ background: '#F2F4F7', border: '1px solid #98A2B3', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
          <svg viewBox="0 0 780 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-orange" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
              </marker>
            </defs>

            {/* Node 1: Main Topic */}
            <rect x="20" y="30" width="130" height="75" rx="8" fill="#ffffff" stroke={activeStep === 1 || activeStep === 2 ? '#34d399' : '#98A2B3'} strokeWidth={activeStep === 1 || activeStep === 2 ? '2.5' : '1.5'} />
            <text x="85" y="55" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">Topic: orders</text>
            <text x="85" y="73" textAnchor="middle" fill="#475569" fontSize="10">Offset: #42 Fail</text>
            <text x="85" y="89" textAnchor="middle" fill="#15803d" fontSize="9.5" fontWeight="600">Commit #42 ✓</text>

            {/* Arrow: Main Topic to Consumer */}
            <line x1="150" y1="67" x2="200" y2="67" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />

            {/* Node 2: Main Consumer */}
            <rect x="206" y="30" width="140" height="75" rx="8" fill="#ffffff" stroke={activeStep === 1 ? '#ef4444' : '#98A2B3'} strokeWidth={activeStep === 1 ? '2.5' : '1.5'} />
            <text x="276" y="55" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">Main Consumer</text>
            <text x="276" y="73" textAnchor="middle" fill="#dc2626" fontSize="10">503 Payment Timeout</text>
            <text x="276" y="89" textAnchor="middle" fill="#0284c7" fontSize="9.5">Proceed to #43 ➔</text>

            {/* Arrow: Main Consumer down to Retry-1 */}
            <path d="M 276 105 L 276 145 L 340 145" fill="none" stroke="#f59e0b" strokeWidth="2" className={activeStep === 2 ? "retry-flowing-arrow" : ""} markerEnd="url(#arrow-amber)" />
            <text x="282" y="135" fill="#b45309" fontSize="9.5" fontWeight="700">+10s Delay</text>

            {/* Node 3: Retry Topic 1 */}
            <rect x="346" y="115" width="145" height="75" rx="8" fill="#ffffff" stroke={activeStep === 2 || activeStep === 3 ? '#f59e0b' : '#98A2B3'} strokeWidth={activeStep === 2 || activeStep === 3 ? '2.5' : '1.5'} />
            <text x="418" y="140" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">orders-retry-10s</text>
            <text x="418" y="157" textAnchor="middle" fill="#475569" fontSize="9.5">x-retry-count: 1</text>
            <text x="418" y="173" textAnchor="middle" fill="#b45309" fontSize="9">Backoff: 10s Window</text>

            {/* Arrow: Retry 1 to Retry 2 */}
            <line x1="491" y1="152" x2="525" y2="152" stroke="#f97316" strokeWidth="2" className={activeStep === 4 ? "retry-flowing-arrow" : ""} markerEnd="url(#arrow-orange)" />

            {/* Node 4: Retry Topic 2 */}
            <rect x="531" y="115" width="140" height="75" rx="8" fill="#ffffff" stroke={activeStep === 4 ? '#f97316' : '#98A2B3'} strokeWidth={activeStep === 4 ? '2.5' : '1.5'} />
            <text x="601" y="140" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">orders-retry-1m</text>
            <text x="601" y="157" textAnchor="middle" fill="#475569" fontSize="9.5">x-retry-count: 2</text>
            <text x="601" y="173" textAnchor="middle" fill="#c2410c" fontSize="9">Backoff: 60s Window</text>

            {/* Arrow: Retry 2 to DLQ */}
            <path d="M 601 115 L 601 75 L 640 75" fill="none" stroke="#ef4444" strokeWidth="2" className={activeStep === 5 ? "retry-flowing-arrow" : ""} markerEnd="url(#arrow-red)" />
            <text x="606" y="95" fill="#dc2626" fontSize="9" fontWeight="700">Max Retries</text>

            {/* Node 5: Dead Letter Topic (DLQ) */}
            <rect x="646" y="30" width="120" height="75" rx="8" fill="#ffffff" stroke={activeStep === 5 || activeStep === 6 ? '#ef4444' : '#98A2B3'} strokeWidth={activeStep === 5 || activeStep === 6 ? '2.5' : '1.5'} />
            <text x="706" y="55" textAnchor="middle" fill="#0f172a" fontSize="11.5" fontWeight="700">orders-dlq</text>
            <text x="706" y="73" textAnchor="middle" fill="#dc2626" fontSize="9.5" fontWeight="600">Poison Records</text>
            <text x="706" y="89" textAnchor="middle" fill="#475569" fontSize="9">Alert &amp; Triage</text>

            {/* Redrive Loop from DLQ back to Main Topic */}
            <path d="M 706 30 L 706 12 L 85 12 L 85 24" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="5 3" markerEnd="url(#arrow-blue)" />
            <text x="390" y="22" textAnchor="middle" fill="#0369a1" fontSize="9.5" fontWeight="700">SRE Redrive to Main Topic (After Code/Data Fix)</text>
          </svg>
        </div>

        {/* Step Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '14px' }}>
          {RETRY_STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveStep(s.id);
                setIsPlaying(false);
              }}
              style={{
                padding: '6px 4px',
                borderRadius: '6px',
                border: activeStep === s.id ? `2px solid ${s.badgeColor}` : '1px solid #D9D9D9',
                background: activeStep === s.id ? '#ffffff' : '#F2F2F2',
                color: activeStep === s.id ? '#0f172a' : '#475569',
                cursor: 'pointer',
                fontWeight: activeStep === s.id ? 700 : 500,
                fontSize: '11px',
                textAlign: 'center',
                boxShadow: activeStep === s.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Step {s.id}
            </button>
          ))}
        </div>

        {/* Selected Step Detail Panel */}
        <div className="retry-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          {/* Explanation */}
          <div style={{ background: '#F7FDF9', border: '1px solid #98A2B3', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  background: step.badgeColor,
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                Step {step.id}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                {step.title}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '6px' }}>
              <strong>From:</strong> <code>{step.source}</code> ➔ <strong>To:</strong> <code>{step.target}</code>
            </div>
            <p style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
              {step.description}
            </p>
          </div>

          {/* Code Implementation */}
          <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px', overflowX: 'auto' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Production Java / Kafka API
            </div>
            <pre style={{ margin: 0, background: 'transparent', padding: 0, fontSize: '11px', color: '#e2e8f0', lineHeight: 1.45, fontFamily: 'monospace' }}>
              {step.codeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
