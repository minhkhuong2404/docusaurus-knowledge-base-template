import React, { useState } from 'react';

type TabType = 'pipeline' | 'factory' | 'jvm_indy';

interface PipelineNode {
  id: string;
  name: string;
  signature: string;
  role: string;
  color: string;
  description: string;
  composition: string;
  sampleCode: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    id: 'supplier',
    name: 'Supplier<T>',
    signature: '() -> T',
    role: 'Source / Factory',
    color: '#38bdf8',
    description: 'Produces a value of type T without accepting any input arguments. Ideal for lazy generation, deferred execution, and factory decoupling.',
    composition: 'No default chaining methods; often acts as the root origin of functional stream pipelines.',
    sampleCode: 'Supplier<UUID> idGen = UUID::randomUUID;\nUUID id = idGen.get();',
  },
  {
    id: 'predicate',
    name: 'Predicate<T>',
    signature: 'T -> boolean',
    role: 'Filter / Gate',
    color: '#fbbf24',
    description: 'Evaluates an input of type T and returns a boolean flag. Used for filtering, business rule assertions, and conditional routing.',
    composition: '.and(other), .or(other), .negate(), Predicate.isEqual(target)',
    sampleCode: 'Predicate<Order> isHighValue = o -> o.amount() > 1000;\nPredicate<Order> isPriority = isHighValue.and(Order::isVip);',
  },
  {
    id: 'function',
    name: 'Function<T, R>',
    signature: 'T -> R',
    role: 'Transformer / Mapper',
    color: '#a78bfa',
    description: 'Accepts an argument of type T and transforms it into a result of type R. Powers data mapping, DTO conversion, and calculations.',
    composition: '.andThen(afterFunction), .compose(beforeFunction), Function.identity()',
    sampleCode: 'Function<Order, Invoice> toInvoice = o -> new Invoice(o.id(), o.amount());\nFunction<Order, String> render = toInvoice.andThen(Invoice::renderPdf);',
  },
  {
    id: 'consumer',
    name: 'Consumer<T>',
    signature: 'T -> void',
    role: 'Sink / Terminal Action',
    color: '#34d399',
    description: 'Accepts an argument of type T and performs side effects (I/O, database writes, logging) without returning any result.',
    composition: '.andThen(afterConsumer) for sequencing side effects',
    sampleCode: 'Consumer<Invoice> logAndPersist = inv -> log.info("Saving {}", inv.id());\nlogAndPersist = logAndPersist.andThen(dbRepository::save);',
  },
];

interface FactoryNode {
  id: string;
  title: string;
  paradigm: string;
  color: string;
  structure: string;
  pros: string[];
  cons: string[];
  sampleCode: string;
}

const FACTORY_MODES: FactoryNode[] = [
  {
    id: 'gof',
    title: 'GoF Factory Pattern',
    paradigm: 'Object-Oriented Subtyping (Static / Inheritance)',
    color: '#f97316',
    structure: 'Abstract Creator + Concrete Creators for each Product subclass.',
    pros: [
      'Encapsulates complex multi-step construction logic',
      'Follows classic OOP hierarchy conventions familiar to legacy frameworks',
      'Allows stateful initialization tied to creator lifecycle',
    ],
    cons: [
      'Class explosion: requires a new Creator class for every new Product type',
      'High boilerplate: rigid compile-time inheritance tree',
      'Difficult to dynamically register new types at runtime without modifying code or reflection',
    ],
    sampleCode: `// Heavy subclass hierarchy
interface PaymentGateway { void process(); }
abstract class PaymentGatewayFactory {
  public abstract PaymentGateway create();
}
class StripeFactory extends PaymentGatewayFactory {
  @Override public PaymentGateway create() { return new StripeGateway(); }
}`,
  },
  {
    id: 'functional',
    title: 'Functional Supplier Registry',
    paradigm: 'Functional Delegation (Map<K, Supplier<V>>)',
    color: '#34d399',
    structure: 'Dynamic ConcurrentMap registry indexed by key holding constructor method references (Class::new).',
    pros: [
      'Zero boilerplate: eliminates all ConcreteCreator subclass files',
      'Runtime Open-Closed Principle (OCP): register new products on-the-fly without modifying factory',
      'Lazy evaluation: constructor is only executed when supplier.get() is explicitly invoked',
      'Lightweight memory footprint: method references leverage JVM invokedynamic',
    ],
    cons: [
      'Parameters must be captured via closures or adapted to Function<Context, Product>',
      'Complex initialization pipelines require custom builder composition rather than simple Supplier',
    ],
    sampleCode: `// Lightweight functional registry
public class PaymentRegistry {
  private final Map<String, Supplier<PaymentGateway>> registry = new ConcurrentHashMap<>();

  public void register(String type, Supplier<PaymentGateway> supplier) {
    registry.put(type.toUpperCase(), supplier);
  }

  public PaymentGateway create(String type) {
    Supplier<PaymentGateway> supplier = registry.get(type.toUpperCase());
    if (supplier == null) throw new IllegalArgumentException("Unknown: " + type);
    return supplier.get();
  }
}
// Registration: registry.register("STRIPE", StripeGateway::new);`,
  },
];

export default function FunctionalInterfacesFactoryDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [selectedNode, setSelectedNode] = useState<string>('supplier');
  const [selectedFactoryMode, setSelectedFactoryMode] = useState<string>('functional');

  const currPipeline = PIPELINE_NODES.find((n) => n.id === selectedNode) ?? PIPELINE_NODES[0];
  const currFactory = FACTORY_MODES.find((f) => f.id === selectedFactoryMode) ?? FACTORY_MODES[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .func-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Java Functional Interfaces & Functional Factory Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '1. Functional Pipeline Flow', color: '#38bdf8' },
            { id: 'factory', label: '2. GoF Factory vs Supplier Registry', color: '#34d399' },
            { id: 'jvm_indy', label: '3. JVM invokedynamic & Allocation Truth', color: '#fbbf24' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FUNCTIONAL PIPELINE FLOW */}
        {activeTab === 'pipeline' && (
          <div className="func-split-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            {/* SVG Visual Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
              <svg viewBox="0 0 460 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arr-func-cyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                  </marker>
                  <marker id="arr-func-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
                  </marker>
                  <marker id="arr-func-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
                  </marker>
                  <marker id="arr-func-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
                  </marker>
                </defs>

                {/* Flowing Conduits */}
                {/* 1. Supplier to Predicate */}
                <line x1="95" y1="80" x2="165" y2="80" stroke="rgba(56,189,248,0.25)" strokeWidth="2" />
                <line
                  x1="95"
                  y1="80"
                  x2="165"
                  y2="80"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  className="interactive-diagram-flowing-path"
                  markerEnd="url(#arr-func-cyan)"
                />
                <text x="130" y="70" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">emit T</text>

                {/* 2. Predicate to Function */}
                <line x1="285" y1="80" x2="355" y2="80" stroke="rgba(251,191,36,0.25)" strokeWidth="2" />
                <line
                  x1="285"
                  y1="80"
                  x2="355"
                  y2="80"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  className="interactive-diagram-flowing-path"
                  markerEnd="url(#arr-func-amber)"
                />
                <text x="320" y="70" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">if true (T)</text>

                {/* 3. Function down to Consumer */}
                <path
                  d="M 405 110 L 405 180 L 290 180"
                  fill="none"
                  stroke="rgba(167,139,250,0.25)"
                  strokeWidth="2"
                />
                <path
                  d="M 405 110 L 405 180 L 290 180"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  className="interactive-diagram-flowing-path"
                  markerEnd="url(#arr-func-purple)"
                />
                <text x="365" y="172" textAnchor="middle" fill="#a78bfa" fontSize="9" fontFamily="monospace">map T -> R</text>

                {/* 4. Consumer Sink Final */}
                <line x1="170" y1="180" x2="85" y2="180" stroke="rgba(52,211,153,0.25)" strokeWidth="2" />
                <line
                  x1="170"
                  y1="180"
                  x2="85"
                  y2="180"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  className="interactive-diagram-flowing-path"
                  markerEnd="url(#arr-func-green)"
                />
                <text x="127" y="172" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace">consume R</text>

                {/* Node 1: Supplier */}
                <g onClick={() => setSelectedNode('supplier')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="15"
                    y="50"
                    width="80"
                    height="60"
                    rx="8"
                    fill={selectedNode === 'supplier' ? 'rgba(56,189,248,0.25)' : 'rgba(56,189,248,0.10)'}
                    stroke="#38bdf8"
                    strokeWidth={selectedNode === 'supplier' ? 2 : 1.5}
                  />
                  <text x="55" y="75" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Supplier</text>
                  <text x="55" y="93" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9" fontFamily="monospace">() -&gt; T</text>
                </g>

                {/* Node 2: Predicate */}
                <g onClick={() => setSelectedNode('predicate')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="170"
                    y="50"
                    width="115"
                    height="60"
                    rx="8"
                    fill={selectedNode === 'predicate' ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.10)'}
                    stroke="#fbbf24"
                    strokeWidth={selectedNode === 'predicate' ? 2 : 1.5}
                  />
                  <text x="227" y="75" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Predicate</text>
                  <text x="227" y="93" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9" fontFamily="monospace">T -&gt; boolean</text>
                </g>

                {/* Node 3: Function */}
                <g onClick={() => setSelectedNode('function')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="360"
                    y="50"
                    width="90"
                    height="60"
                    rx="8"
                    fill={selectedNode === 'function' ? 'rgba(167,139,250,0.25)' : 'rgba(167,139,250,0.10)'}
                    stroke="#a78bfa"
                    strokeWidth={selectedNode === 'function' ? 2 : 1.5}
                  />
                  <text x="405" y="75" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Function</text>
                  <text x="405" y="93" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9" fontFamily="monospace">T -&gt; R</text>
                </g>

                {/* Node 4: Consumer */}
                <g onClick={() => setSelectedNode('consumer')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="175"
                    y="150"
                    width="110"
                    height="60"
                    rx="8"
                    fill={selectedNode === 'consumer' ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.10)'}
                    stroke="#34d399"
                    strokeWidth={selectedNode === 'consumer' ? 2 : 1.5}
                  />
                  <text x="230" y="175" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Consumer</text>
                  <text x="230" y="193" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9" fontFamily="monospace">R -&gt; void</text>
                </g>

                {/* Terminal Sink Node */}
                <rect x="15" y="150" width="70" height="60" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                <text x="50" y="176" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10" fontWeight="600">Terminal</text>
                <text x="50" y="192" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Side Effect</text>

                {/* Pipeline Legend info box */}
                <rect x="15" y="240" width="430" height="46" rx="6" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.06)" />
                <text x="25" y="258" fill="var(--ifm-color-content)" fontSize="10" fontWeight="600">
                  Data Stream Topology: Lazy Emitter -&gt; Predicate Gate -&gt; Pure Map -&gt; Sink Execution
                </text>
                <text x="25" y="274" fill="var(--ifm-color-content-secondary)" fontSize="9">
                  Click on any node above to inspect method signatures, composition semantics, and compilable examples.
                </text>
              </svg>
            </div>

            {/* Details Panel */}
            <div className="interactive-diagram-details-card" style={{ padding: '16px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: currPipeline.color }}>
                  {currPipeline.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${currPipeline.color}20`,
                    color: currPipeline.color,
                    border: `1px solid ${currPipeline.color}40`,
                  }}
                >
                  {currPipeline.signature}
                </span>
              </div>

              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                Role: <span style={{ color: 'var(--ifm-color-content)' }}>{currPipeline.role}</span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                {currPipeline.description}
              </p>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: currPipeline.color, marginBottom: '4px' }}>
                  Composition &amp; Chaining:
                </div>
                <code style={{ fontSize: '11px', display: 'block', padding: '6px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', color: 'var(--ifm-color-content)' }}>
                  {currPipeline.composition}
                </code>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                  Production Snippet:
                </div>
                <pre
                  style={{
                    fontSize: '10.5px',
                    padding: '8px',
                    borderRadius: '6px',
                    background: '#040711',
                    border: '1px solid rgba(255,255,255,0.08)',
                    margin: 0,
                    overflowX: 'auto',
                    lineHeight: 1.4,
                  }}
                >
                  <code style={{ color: '#38bdf8' }}>{currPipeline.sampleCode}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOF FACTORY VS SUPPLIER REGISTRY */}
        {activeTab === 'factory' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setSelectedFactoryMode('functional')}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: selectedFactoryMode === 'functional' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                  color: selectedFactoryMode === 'functional' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  boxShadow: selectedFactoryMode === 'functional' ? '0 0 0 1px #34d39960' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                Functional Supplier Registry (Modern Java)
              </button>
              <button
                onClick={() => setSelectedFactoryMode('gof')}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: selectedFactoryMode === 'gof' ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)',
                  color: selectedFactoryMode === 'gof' ? '#f97316' : 'var(--ifm-color-content-secondary)',
                  boxShadow: selectedFactoryMode === 'gof' ? '0 0 0 1px #f9731660' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                GoF Factory Pattern (Classic OOP Subtyping)
              </button>
            </div>

            <div className="func-split-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
              {/* Visual Architecture Representation */}
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <svg viewBox="0 0 450 280" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="arr-fac-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
                    </marker>
                    <marker id="arr-fac-orange" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#f97316" />
                    </marker>
                  </defs>

                  {selectedFactoryMode === 'functional' ? (
                    /* Functional Registry Diagram */
                    <g>
                      {/* Client Caller */}
                      <rect x="20" y="100" width="100" height="60" rx="8" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                      <text x="70" y="126" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Client Code</text>
                      <text x="70" y="144" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">create("STRIPE")</text>

                      {/* Line to Registry */}
                      <line x1="120" y1="130" x2="175" y2="130" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                      <line
                        x1="120"
                        y1="130"
                        x2="175"
                        y2="130"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                        className="interactive-diagram-flowing-path"
                        markerEnd="url(#arr-fac-green)"
                      />
                      <text x="148" y="120" textAnchor="middle" fill="#34d399" fontSize="9">lookup</text>

                      {/* Map Registry */}
                      <rect x="180" y="50" width="130" height="160" rx="8" fill="rgba(52,211,153,0.10)" stroke="#34d399" strokeWidth="2" />
                      <text x="245" y="75" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">Supplier Registry</text>
                      <text x="245" y="93" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Map&lt;String, Supplier&gt;</text>

                      {/* Map Slots */}
                      <rect x="190" y="105" width="110" height="26" rx="4" fill="rgba(0,0,0,0.4)" stroke="rgba(52,211,153,0.3)" />
                      <text x="245" y="122" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace">"STRIPE" : Stripe::new</text>

                      <rect x="190" y="137" width="110" height="26" rx="4" fill="rgba(0,0,0,0.4)" stroke="rgba(52,211,153,0.3)" />
                      <text x="245" y="154" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace">"PAYPAL" : PayPal::new</text>

                      <rect x="190" y="169" width="110" height="26" rx="4" fill="rgba(0,0,0,0.4)" stroke="rgba(52,211,153,0.3)" />
                      <text x="245" y="186" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace">"CRYPTO" : Crypto::new</text>

                      {/* Line to Product */}
                      <line x1="310" y1="130" x2="350" y2="130" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                      <line
                        x1="310"
                        y1="130"
                        x2="350"
                        y2="130"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                        className="interactive-diagram-flowing-path"
                        markerEnd="url(#arr-fac-green)"
                      />
                      <text x="330" y="120" textAnchor="middle" fill="#34d399" fontSize="9">get()</text>

                      {/* Created Instance */}
                      <rect x="355" y="100" width="85" height="60" rx="8" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                      <text x="397" y="126" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="700">Payment</text>
                      <text x="397" y="144" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Instance</text>

                      {/* Bottom Banner */}
                      <rect x="20" y="230" width="410" height="35" rx="6" fill="rgba(52,211,153,0.06)" stroke="rgba(52,211,153,0.2)" />
                      <text x="225" y="252" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">
                        Zero Boilerplate Classes: Dynamic runtime registration without modifying code
                      </text>
                    </g>
                  ) : (
                    /* GoF Subclass Hierarchy Diagram */
                    <g>
                      {/* Creator Hierarchy */}
                      <rect x="30" y="30" width="160" height="45" rx="6" fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth="1.5" />
                      <text x="110" y="50" textAnchor="middle" fill="#f97316" fontSize="10.5" fontWeight="700">&lt;&lt;abstract&gt;&gt;</text>
                      <text x="110" y="65" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">PaymentFactory</text>

                      {/* Sub-factories */}
                      <rect x="20" y="115" width="100" height="40" rx="6" fill="rgba(249,115,22,0.08)" stroke="#f97316" strokeWidth="1" />
                      <text x="70" y="139" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9.5">StripeFactory</text>

                      <rect x="135" y="115" width="100" height="40" rx="6" fill="rgba(249,115,22,0.08)" stroke="#f97316" strokeWidth="1" />
                      <text x="185" y="139" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9.5">PayPalFactory</text>

                      {/* Generalization lines */}
                      <line x1="70" y1="115" x2="100" y2="75" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="185" y1="115" x2="120" y2="75" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" />

                      {/* Product Hierarchy */}
                      <rect x="270" y="30" width="150" height="45" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                      <text x="345" y="50" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">&lt;&lt;interface&gt;&gt;</text>
                      <text x="345" y="65" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">PaymentGateway</text>

                      {/* Concrete Products */}
                      <rect x="260" y="115" width="95" height="40" rx="6" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1" />
                      <text x="307" y="139" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9.5">StripeGateway</text>

                      <rect x="365" y="115" width="80" height="40" rx="6" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1" />
                      <text x="405" y="139" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9.5">PayPalGw</text>

                      {/* Generalization to product */}
                      <line x1="307" y1="115" x2="330" y2="75" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="405" y1="115" x2="360" y2="75" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

                      {/* Instantiation arrows */}
                      <line x1="120" y1="135" x2="255" y2="135" stroke="rgba(249,115,22,0.3)" strokeWidth="2" />
                      <line
                        x1="120"
                        y1="135"
                        x2="255"
                        y2="135"
                        stroke="#f97316"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                        className="interactive-diagram-flowing-path"
                        markerEnd="url(#arr-fac-orange)"
                      />
                      <text x="190" y="130" textAnchor="middle" fill="#f97316" fontSize="9">creates</text>

                      {/* Bottom Banner */}
                      <rect x="20" y="210" width="410" height="55" rx="6" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.25)" />
                      <text x="225" y="230" textAnchor="middle" fill="#f97316" fontSize="10.5" fontWeight="700">
                        Class Explosion Trap
                      </text>
                      <text x="225" y="250" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                        Adding 1 product requires writing 2 new classes (Product + Creator subclass)
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Mode Details Card */}
              <div className="interactive-diagram-details-card" style={{ padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: currFactory.color, marginBottom: '4px' }}>
                  {currFactory.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
                  Paradigm: <span style={{ color: 'var(--ifm-color-content)' }}>{currFactory.paradigm}</span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                    Strengths:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    {currFactory.pros.map((p, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                    Architectural Drawbacks:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    {currFactory.cons.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                    Architecture Code:
                  </div>
                  <pre
                    style={{
                      fontSize: '10px',
                      padding: '8px',
                      borderRadius: '6px',
                      background: '#040711',
                      border: '1px solid rgba(255,255,255,0.08)',
                      margin: 0,
                      overflowX: 'auto',
                      lineHeight: 1.35,
                    }}
                  >
                    <code style={{ color: currFactory.color }}>{currFactory.sampleCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: JVM INVOKEDYNAMIC & ALLOCATION TRUTH */}
        {activeTab === 'jvm_indy' && (
          <div>
            <div className="func-split-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
              {/* SVG Canvas for Bytecode & Runtime Flow */}
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <svg viewBox="0 0 450 310" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="arr-jvm-yellow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
                    </marker>
                    <marker id="arr-jvm-cyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                    </marker>
                  </defs>

                  {/* Bytecode Box */}
                  <rect x="20" y="20" width="180" height="75" rx="6" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="110" y="40" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Class Bytecode (.class)</text>
                  <text x="35" y="58" fill="var(--ifm-color-content-secondary)" fontSize="9" fontFamily="monospace">invokedynamic #2 &lt;get&gt;</text>
                  <text x="35" y="73" fill="var(--ifm-color-content-secondary)" fontSize="9" fontFamily="monospace">BSM: LambdaMetafactory</text>
                  <text x="35" y="87" fill="#34d399" fontSize="8.5" fontFamily="monospace">static synth lambda$0()</text>

                  {/* Arrow to BSM */}
                  <line x1="200" y1="57" x2="255" y2="57" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                  <line
                    x1="200"
                    y1="57"
                    x2="255"
                    y2="57"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    className="interactive-diagram-flowing-path"
                    markerEnd="url(#arr-jvm-cyan)"
                  />
                  <text x="228" y="50" textAnchor="middle" fill="#38bdf8" fontSize="8.5">1st exec</text>

                  {/* LambdaMetafactory Runtime Node */}
                  <rect x="260" y="20" width="170" height="75" rx="6" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="345" y="40" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">LambdaMetafactory</text>
                  <text x="275" y="58" fill="var(--ifm-color-content-secondary)" fontSize="8.5">InnerClassLambdaMetafactory</text>
                  <text x="275" y="73" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Generates hidden class in RAM</text>
                  <text x="275" y="87" fill="#fbbf24" fontSize="8.5">Returns CallSite (MethodHandle)</text>

                  {/* Branching: Stateless vs Capturing */}
                  <path d="M 345 95 L 345 130" stroke="rgba(251,191,36,0.3)" strokeWidth="2" />
                  <line x1="345" y1="130" x2="130" y2="130" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                  <line x1="345" y1="130" x2="345" y2="155" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />

                  {/* Flow to Stateless */}
                  <line
                    x1="220"
                    y1="130"
                    x2="130"
                    y2="130"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    className="interactive-diagram-flowing-path"
                    markerEnd="url(#arr-jvm-cyan)"
                  />

                  {/* Stateless Box */}
                  <rect x="20" y="160" width="190" height="95" rx="6" fill="rgba(52,211,153,0.10)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="115" y="180" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Non-Capturing (Stateless)</text>
                  <text x="30" y="200" fill="var(--ifm-color-content)" fontSize="9">e.g., String::length, x -&gt; x * 2</text>
                  <text x="30" y="217" fill="#34d399" fontSize="9" fontWeight="600">Zero Heap Allocation!</text>
                  <text x="30" y="233" fill="var(--ifm-color-content-secondary)" fontSize="8.5">JVM caches singleton instance in</text>
                  <text x="30" y="247" fill="var(--ifm-color-content-secondary)" fontSize="8.5">ConstantCallSite across all calls.</text>

                  {/* Capturing Box */}
                  <rect x="240" y="160" width="190" height="95" rx="6" fill="rgba(248,113,113,0.10)" stroke="#f87171" strokeWidth="1.5" />
                  <text x="335" y="180" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Capturing (Stateful Closure)</text>
                  <text x="250" y="200" fill="var(--ifm-color-content)" fontSize="9">e.g., x -&gt; x + localOffset, this::call</text>
                  <text x="250" y="217" fill="#f87171" fontSize="9" fontWeight="600">Heap Churn: New object per call</text>
                  <text x="250" y="233" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Instantiates new synthetic class</text>
                  <text x="250" y="247" fill="var(--ifm-color-content-secondary)" fontSize="8.5">passing captured reference to &lt;init&gt;.</text>

                  {/* Primitive Warning Line */}
                  <rect x="20" y="270" width="410" height="30" rx="4" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.25)" />
                  <text x="225" y="289" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="600">
                    Autoboxing Alert: Use IntPredicate / LongFunction to avoid boxing/unboxing GC pressure
                  </text>
                </svg>
              </div>

              {/* Explanatory Details Card */}
              <div className="interactive-diagram-details-card" style={{ padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fbbf24', marginBottom: '8px' }}>
                  JVM Execution Mechanics Under the Hood
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '3px' }}>
                    1. invokedynamic &amp; LambdaMetafactory:
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45, margin: 0 }}>
                    Unlike anonymous inner classes in Java 7 which generated disk <code>.class</code> files (e.g. <code>MyClass$1.class</code>), modern lambdas translate to a single <code>invokedynamic</code> bytecode instruction. The bootstrap method generates a lightweight hidden class dynamically at runtime.
                  </p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '3px' }}>
                    2. Singleton Optimization (Non-Capturing):
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45, margin: 0 }}>
                    When a lambda does not reference local variables or <code>this</code>, the JVM instantiates the generated class once and links it via a <code>ConstantCallSite</code>. All subsequent invocations reuse the exact same singleton instance with <strong>zero allocation overhead</strong>.
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '3px' }}>
                    3. Closure Heap Churn (Capturing):
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45, margin: 0 }}>
                    If a lambda captures external variables (e.g. <code>o -&gt; o.price() + localTax</code>) or instance methods (<code>this::process</code>), a new object instance must be allocated on the heap on <strong>every execution</strong> to pass captured references into the constructor. In hot loops, this causes massive GC allocation stalls.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
