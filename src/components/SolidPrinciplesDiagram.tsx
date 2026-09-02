import React, { useState } from 'react';

type SolidPrincipleKey = 'overview' | 'SRP' | 'OCP' | 'LSP' | 'ISP' | 'DIP';

interface SolidData {
  letter: string;
  name: string;
  oneLiner: string;
  color: string;
  smell: string;
  fix: string;
  springMapping: string;
  badCode: string;
  goodCode: string;
}

const SOLID_PRINCIPLES: Record<'SRP' | 'OCP' | 'LSP' | 'ISP' | 'DIP', SolidData> = {
  SRP: {
    letter: 'S',
    name: 'Single Responsibility Principle',
    oneLiner: 'A class should have one, and only one, reason to change.',
    color: '#34d399',
    smell: 'The class description contains the word "AND", or developers from 3 different teams touch it every sprint (God Class).',
    fix: 'Extract each responsibility into its own dedicated, focused class.',
    springMapping: 'Separation of concerns: `@RestController` (HTTP), `@Service` (Business logic), `@Repository` (DB persistence).',
    badCode: `// ❌ God Class: 4 reasons to change
public class OrderService {
    public void createOrder(Order order) {
        validate(order);           // Reason 1: Validation rules change
        calculateDiscount(order);  // Reason 2: Pricing rules change
        orderRepo.save(order);      // Reason 3: DB schema changes
        emailService.send(order);  // Reason 4: Email template changes
        pdfGenerator.create(order);// Reason 5: PDF format changes
    }
}`,
    goodCode: `// ✅ Clean SRP: Each class has 1 reason to change
public class OrderService {
    private final OrderValidator validator;
    private final PricingCalculator pricingCalculator;
    private final OrderRepository repository;
    private final OrderNotifier notifier;

    public void createOrder(Order order) {
        validator.validate(order);
        pricingCalculator.applyDiscounts(order);
        repository.save(order);
        notifier.notifyCustomer(order);
    }
}`
  },
  OCP: {
    letter: 'O',
    name: 'Open/Closed Principle',
    oneLiner: 'Software entities should be open for extension, but closed for modification.',
    color: '#38bdf8',
    smell: 'Adding a new business case requires adding another if/else or switch branch to an existing class.',
    fix: 'Introduce an interface or abstract base class and implement the Strategy / Plugin pattern.',
    springMapping: 'Map injection of strategy beans: `Map<String, PaymentStrategy>` automatically wired by Spring IoC.',
    badCode: `// ❌ Violates OCP: Modifying class for every new payment method
public class PaymentProcessor {
    public void process(PaymentType type, double amount) {
        if (type == PaymentType.CREDIT_CARD) { payWithCard(amount); }
        else if (type == PaymentType.PAYPAL) { payWithPaypal(amount); }
        else if (type == PaymentType.CRYPTO) { payWithCrypto(amount); }
        // Adding ApplePay requires editing & testing THIS class!
    }
}`,
    goodCode: `// ✅ Clean OCP: Open for new methods without touching existing code
public interface PaymentStrategy {
    void process(double amount);
}

@Service
public class PaymentProcessor {
    private final Map<String, PaymentStrategy> strategies;

    public void process(String method, double amount) {
        PaymentStrategy strategy = strategies.get(method);
        strategy.process(amount); // Polymorphic execution!
    }
}`
  },
  LSP: {
    letter: 'L',
    name: 'Liskov Substitution Principle',
    oneLiner: 'Subtypes must be substitutable for their base types without breaking application correctness.',
    color: '#fbbf24',
    smell: 'Subclass overrides a parent method with `throw new UnsupportedOperationException()`, or returns null/unexpected defaults.',
    fix: 'Segregate parent interfaces or use composition instead of forced inheritance.',
    springMapping: '`AuthenticationProvider` implementations in Spring Security must honor the authenticate() contract.',
    badCode: `// ❌ Violates LSP: Square breaks Rectangle expectations
public class Rectangle {
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int getArea() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w) { this.width = w; this.height = w; } // Unexpected side-effect!
}`,
    goodCode: `// ✅ Clean LSP: Shared Shape interface with invariant contracts
public interface Shape {
    int getArea();
}

public class Rectangle implements Shape {
    private final int width, height;
    public int getArea() { return width * height; }
}

public class Square implements Shape {
    private final int side;
    public int getArea() { return side * side; }
}`
  },
  ISP: {
    letter: 'I',
    name: 'Interface Segregation Principle',
    oneLiner: 'Clients should not be forced to depend upon interfaces that they do not use.',
    color: '#a78bfa',
    smell: 'A "fat" interface with 15 methods where implementing classes leave half of them empty or throwing exceptions.',
    fix: 'Break monolithic interfaces into small, cohesive, role-specific interfaces.',
    springMapping: 'Spring Data repository hierarchy (`CrudRepository`, `PagingAndSortingRepository`, `JpaRepository`).',
    badCode: `// ❌ Violates ISP: Fat interface forces dummy implementations
public interface Worker {
    void work();
    void eatLunch();
    void chargeBattery();
}

public class RobotWorker implements Worker {
    public void work() { assembleCar(); }
    public void eatLunch() { /* Robot cannot eat! Throws exception */ }
    public void chargeBattery() { plugIn(); }
}`,
    goodCode: `// ✅ Clean ISP: Role-based segregated interfaces
public interface Workable { void work(); }
public interface Feedable { void eatLunch(); }
public interface Rechargeable { void chargeBattery(); }

public class HumanWorker implements Workable, Feedable { ... }
public class RobotWorker implements Workable, Rechargeable { ... }`
  },
  DIP: {
    letter: 'D',
    name: 'Dependency Inversion Principle',
    oneLiner: 'High-level modules should not depend on low-level modules. Both should depend on abstractions.',
    color: '#f472b6',
    smell: 'High-level business service creates low-level database or notification clients using `new MySqlDatabase()`.',
    fix: 'High-level service depends on an interface; dependency is injected from outside (Dependency Injection).',
    springMapping: 'Spring IoC Container + Constructor Injection (`@Autowired` / Lombok `@RequiredArgsConstructor`).',
    badCode: `// ❌ Violates DIP: High-level OrderService hard-couples to MySQL
public class OrderService {
    private final MySqlOrderRepository repository; // Concrete!

    public OrderService() {
        this.repository = new MySqlOrderRepository(); // Direct instantiation
    }
}`,
    goodCode: `// ✅ Clean DIP: Depends on abstraction, wired via Dependency Injection
public interface OrderRepository {
    void save(Order order);
}

@Service
public class OrderService {
    private final OrderRepository repository; // Inverted dependency!

    public OrderService(OrderRepository repository) {
        this.repository = repository; // Injected by Spring IoC
    }
}`
  }
};

export default function SolidPrinciplesDiagram({ initialPrinciple = 'overview' }: { initialPrinciple?: SolidPrincipleKey }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SolidPrincipleKey>(initialPrinciple);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          SOLID Design Principles Architecture & Code Patterns Explorer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '🗺️ Overview', color: '#38bdf8' },
            { id: 'SRP', label: 'S — Single Resp.', color: '#34d399' },
            { id: 'OCP', label: 'O — Open/Closed', color: '#38bdf8' },
            { id: 'LSP', label: 'L — Liskov Sub.', color: '#fbbf24' },
            { id: 'ISP', label: 'I — Interface Seg.', color: '#a78bfa' },
            { id: 'DIP', label: 'D — Dep. Inversion', color: '#f472b6' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SolidPrincipleKey)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              {(['SRP', 'OCP', 'LSP', 'ISP', 'DIP'] as const).map(key => {
                const item = SOLID_PRINCIPLES[key];
                return (
                  <div
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      padding: '14px',
                      background: `${item.color}08`,
                      border: `1px solid ${item.color}30`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: item.color,
                        color: '#000000',
                        fontWeight: 800,
                        fontSize: '12px'
                      }}>
                        {item.letter}
                      </span>
                      <strong style={{ color: item.color, fontSize: '13px' }}>{item.name.split(' ')[0]}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                      {item.oneLiner}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SVG Interactive Blueprint */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="solid-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="solid-arrow-pink" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f472b6" />
                  </marker>
                  <marker id="solid-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                </defs>

                {/* High-Level Controller */}
                <g transform="translate(20, 45)">
                  <rect x="0" y="0" width="160" height="90" rx="8" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="15" y="26" fill="#38bdf8" fontSize="11" fontWeight="700">1. @RestController</text>
                  <text x="15" y="46" fill="#e2e8f0" fontSize="9">Single Resp: HTTP routing</text>
                  <text x="15" y="66" fill="#94a3b8" fontSize="8">Delegates to Service</text>
                </g>

                <path d="M 185 90 L 255 90" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#solid-arrow-blue)" className="interactive-diagram-flowing-path" />

                {/* Service Interface Boundary (DIP + OCP) */}
                <g transform="translate(260, 25)">
                  <rect x="0" y="0" width="280" height="130" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="15" y="24" fill="#a78bfa" fontSize="11" fontWeight="700">2. Business Domain Seam</text>

                  <rect x="15" y="36" width="250" height="34" rx="4" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" />
                  <text x="25" y="56" fill="#ffffff" fontSize="9" fontWeight="700">«interface» OrderService (ISP + DIP)</text>

                  <rect x="15" y="78" width="250" height="34" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="25" y="98" fill="#34d399" fontSize="9" fontWeight="700">OrderServiceImpl (SRP: Core logic only)</text>
                </g>

                <path d="M 545 90 L 615 90" fill="none" stroke="#f472b6" strokeWidth="2" markerEnd="url(#solid-arrow-pink)" className="interactive-diagram-flowing-path" />

                {/* Repository Abstraction (DIP) */}
                <g transform="translate(620, 45)">
                  <rect x="0" y="0" width="180" height="90" rx="8" fill="rgba(244, 114, 182, 0.15)" stroke="#f472b6" strokeWidth="1.5" />
                  <text x="15" y="26" fill="#f472b6" fontSize="11" fontWeight="700">3. «interface» OrderRepo</text>
                  <text x="15" y="46" fill="#e2e8f0" fontSize="9">DIP: Inverted Dependency</text>
                  <text x="15" y="66" fill="#94a3b8" fontSize="8">JpaRepository / PostgreSQL</text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* TAB: SPECIFIC PRINCIPLE (SRP, OCP, LSP, ISP, DIP) */}
        {activeTab !== 'overview' && (
          <div>
            {(() => {
              const item = SOLID_PRINCIPLES[activeTab];
              return (
                <div>
                  <div style={{
                    padding: '12px 16px',
                    background: `${item.color}08`,
                    borderLeft: `4px solid ${item.color}`,
                    borderRadius: '0 8px 8px 0',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: item.color, marginBottom: '4px' }}>
                      {item.letter} — {item.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', fontWeight: 600, marginBottom: '6px' }}>
                      "{item.oneLiner}"
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                      <strong>🌱 Spring Boot Mapping:</strong> {item.springMapping}
                    </div>
                  </div>

                  {/* Smell vs Fix Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ padding: '12px', background: 'rgba(248, 113, 113, 0.06)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>🚩 Code Smell to Spot:</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{item.smell}</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>💡 Clean Architecture Fix:</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{item.fix}</div>
                    </div>
                  </div>

                  {/* Code Comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#090b14', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>❌ Violation Pattern:</div>
                      <pre style={{ margin: 0, fontSize: '11px', color: '#fca5a5', fontFamily: 'monospace', background: 'transparent', padding: 0 }}>
                        <code>{item.badCode}</code>
                      </pre>
                    </div>
                    <div style={{ background: '#090b14', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>✅ Clean Refactored Pattern:</div>
                      <pre style={{ margin: 0, fontSize: '11px', color: '#86efac', fontFamily: 'monospace', background: 'transparent', padding: 0 }}>
                        <code>{item.goodCode}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
