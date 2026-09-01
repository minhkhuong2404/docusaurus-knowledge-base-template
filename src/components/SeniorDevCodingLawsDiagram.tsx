import React, { useState } from 'react';

interface LawData {
  id: string;
  number: number;
  title: string;
  tagline: string;
  accentColor: string;
  juniorConcept: string;
  seniorConcept: string;
  diagramType: 'pipeline' | 'boundary' | 'core_shell' | 'state_machine' | 'error_flow' | 'pr_size' | 'naming';
  juniorCode: string;
  seniorCode: string;
  rationale: string;
  mentalModel: string;
}

const LAWS: LawData[] = [
  {
    id: 'law-1',
    number: 1,
    title: 'Keep the Main Path Easy to Follow',
    tagline: 'Flatten nested control flow with guard clauses and early exits',
    accentColor: '#38bdf8',
    juniorConcept: 'Pyramid of Doom (Deep Nesting)',
    seniorConcept: 'Bouncer Pattern (Linear Guard Pipeline)',
    diagramType: 'pipeline',
    juniorCode: `public OrderResult processOrder(OrderRequest request) {
    if (request != null) {
        if (request.isValid()) {
            User user = userRepository.findById(request.getUserId());
            if (user != null) {
                if (user.isActive()) {
                    if (paymentGateway.charge(user, request.getAmount())) {
                        return OrderResult.success(createOrder(user, request));
                    } else {
                        return OrderResult.error("Payment failed");
                    }
                } else {
                    return OrderResult.error("User inactive");
                }
            } else {
                return OrderResult.error("User not found");
            }
        } else {
            return OrderResult.error("Invalid request");
        }
    }
    return OrderResult.error("Null request");
}`,
    seniorCode: `public OrderResult processOrder(OrderRequest request) {
    // 1. Guard clauses & early returns: reject invalid inputs upfront
    if (request == null || !request.isValid()) {
        return OrderResult.error("INVALID_REQUEST", "Request payload is missing or invalid");
    }

    User user = userRepository.findById(request.getUserId())
        .orElseThrow(() -> new UserNotFoundException(request.getUserId()));

    if (!user.isActive()) {
        return OrderResult.error("USER_INACTIVE", "Account is suspended or deactivated");
    }

    // 2. Happy path flows linearly at 0 indentation
    paymentGateway.charge(user, request.getAmount());
    Order order = createOrder(user, request);
    
    return OrderResult.success(order);
}`,
    rationale: 'Deep indentation forces reviewers to maintain a growing mental stack of conditions. Early returns act as "bouncers" at the door, clearing invalid branches and letting the happy path read like a clear checklist.',
    mentalModel: 'The Bouncer Rule: Check ID at the door and turn people away immediately, rather than letting everyone in and checking credentials at every room.'
  },
  {
    id: 'law-2',
    number: 2,
    title: 'Name Things by Meaning',
    tagline: 'Reflect business intent, positive predicates, and units of measurement',
    accentColor: '#34d399',
    juniorConcept: 'Generic Placeholders & Ambiguous Flags',
    seniorConcept: 'Domain Semantics & Self-Documenting Types',
    diagramType: 'naming',
    juniorCode: `// ❌ Junior: vague names, unclear units, double negatives
int d = 60000;
boolean isNotDisabled = true;
List<Order> data = fetchOrders();

void handle(Order obj) {
    if (isNotDisabled && obj.getStatus() == 1) {
        process(obj);
    }
}`,
    seniorCode: `// ✅ Senior: explicit intent, unit encoded, positive predicate
Duration connectionTimeoutMs = Duration.ofMillis(60_000);
boolean isAccountActive = true;
List<Order> pendingCheckoutOrders = fetchPendingOrders();

void fulfillPendingOrder(Order orderToFulfill) {
    if (isAccountActive && orderToFulfill.isAwaitingFulfillment()) {
        warehouseService.dispatchOrder(orderToFulfill);
    }
}`,
    rationale: 'Code is read 10x more than it is written. Variable names like `data`, `item`, or `flag` require cognitive translation every time. Explicit domain vocabulary eliminates ambiguity and reduces comments.',
    mentalModel: 'Domain Mirror: If a business analyst reading your variable names cannot understand what entity or state is being manipulated, the naming is too technical or vague.'
  },
  {
    id: 'law-3',
    number: 3,
    title: 'Keep External Systems Behind a Boundary',
    tagline: 'Isolate third-party APIs, vendor SDKs, and raw DB formats behind an Anti-Corruption Layer',
    accentColor: '#fbbf24',
    juniorConcept: 'Vendor DTO Leakage Across Entire Codebase',
    seniorConcept: 'Anti-Corruption Layer (Ports & Adapters)',
    diagramType: 'boundary',
    juniorCode: `// ❌ Junior: Passing Stripe's raw JSON/SDK object deep into domain logic
@Service
public class BillingService {
    public void recordPayment(com.stripe.model.Charge stripeCharge) {
        // Business logic tightly coupled to external Stripe SDK model
        if ("succeeded".equals(stripeCharge.getStatus())) {
            emailService.sendReceipt(stripeCharge.getBillingDetails().getEmail(), stripeCharge.getAmount() / 100.0);
        }
    }
}`,
    seniorCode: `// ✅ Senior: Adapter translates 3rd-party vendor model to Internal Domain Model
public record PaymentConfirmation(
    PaymentId paymentId, 
    CustomerEmail customerEmail, 
    Money amount, 
    PaymentStatus status
) {}

// Adapter at the boundary
@Component
public class StripePaymentAdapter implements PaymentGatewayPort {
    @Override
    public PaymentConfirmation parseWebhook(String payload) {
        com.stripe.model.Charge charge = parseStripe(payload);
        return new PaymentConfirmation(
            new PaymentId(charge.getId()),
            new CustomerEmail(charge.getBillingDetails().getEmail()),
            Money.ofCents(charge.getAmount()),
            PaymentStatus.COMPLETED
        );
    }
}`,
    rationale: 'When third-party SDKs or schemas change, a leak causes breaking edits across dozens of files. An Anti-Corruption Layer (ACL) confines vendor changes to a single adapter class.',
    mentalModel: 'Customs & Border Control: External payloads must pass through an inspection checkpoint and be issued an internal passport (domain model) before entering the country (core logic).'
  },
  {
    id: 'law-4',
    number: 4,
    title: 'Make Invalid States Impossible to Reach',
    tagline: 'Model business rules into algebraic types and sealed domain states',
    accentColor: '#f97316',
    juniorConcept: 'Loose Primitive Obsession & Inconsistent Flags',
    seniorConcept: 'Sealed Types & Validated Value Objects',
    diagramType: 'state_machine',
    juniorCode: `// ❌ Junior: Primitive fields can represent impossible combinations
public class Order {
    private String status;         // "CREATED", "PAID", "REFUNDED"
    private boolean isPaid;
    private Instant paidAt;        // What if isPaid=false but paidAt != null?
    private Instant refundedAt;    // What if status="CREATED" but refundedAt != null?
    private String refundReason;
}`,
    seniorCode: `// ✅ Senior: Sealed hierarchy makes invalid states non-representable
public sealed interface OrderState permits 
    OrderState.Created, 
    OrderState.Paid, 
    OrderState.Refunded {

    record Created(Instant createdAt) implements OrderState {}
    
    record Paid(
        Instant paidAt, 
        TransactionId txId, 
        Money amountPaid
    ) implements OrderState {}
    
    record Refunded(
        Instant refundedAt, 
        RefundReason reason, 
        Money amountRefunded
    ) implements OrderState {}
}`,
    rationale: 'When state is represented by loose booleans and strings, bugs occur from invalid combinations. Modeling states as closed type hierarchies enables exhaustive compiler checks.',
    mentalModel: 'Parse, Don\'t Validate: Transform unvalidated input into a strictly typed data structure once at instantiation. If an object exists, it is mathematically guaranteed to be valid.'
  },
  {
    id: 'law-5',
    number: 5,
    title: 'Separate Decisions from Side Effects',
    tagline: 'Functional Core, Imperative Shell: Pure business logic without I/O dependencies',
    accentColor: '#a78bfa',
    juniorConcept: 'Tangled Logic Interleaved with Database & Network I/O',
    seniorConcept: 'Pure Decision Engine + Thin Orchestration Shell',
    diagramType: 'core_shell',
    juniorCode: `// ❌ Junior: Decision logic interleaved with DB calls and email sending
public void applyDiscount(String orderId, String promoCode) {
    Order order = db.findOrder(orderId);
    if (order.getItems().size() > 5 && promoCode.equals("SUMMER")) {
        double discount = order.getTotal() * 0.15;
        db.saveDiscount(orderId, discount);
        emailService.sendDiscountEmail(order.getCustomerEmail(), discount);
    }
    // Unit testing requires mocking db, emailService, etc.!
}`,
    seniorCode: `// ✅ Senior: Pure decision logic (zero I/O, 100% unit testable)
public final class DiscountEngine {
    public static DiscountResult calculateDiscount(OrderSnapshot order, PromoCode promo) {
        if (order.itemCount() > 5 && promo.isSummerPromo()) {
            return DiscountResult.applied(order.total().multiply(0.15));
        }
        return DiscountResult.none();
    }
}

// Imperative Shell handles I/O
@Service
public class OrderApplicationService {
    public void applyPromo(OrderId id, PromoCode promo) {
        Order order = orderRepo.load(id);
        DiscountResult result = DiscountEngine.calculateDiscount(order.snapshot(), promo);
        if (result.isApplied()) {
            order.applyDiscount(result.amount());
            orderRepo.save(order);
            notifier.publishDiscountApplied(order, result);
        }
    }
}`,
    rationale: 'Interleaving business decisions with database transactions and network calls leads to brittle code and bloated mock setups. Pure functions can be tested with zero mocks and blazing speed.',
    mentalModel: 'Functional Core / Imperative Shell: The brain (pure logic) does the thinking; the hands (imperative shell) fetch inputs from I/O and execute the side effects.'
  },
  {
    id: 'law-6',
    number: 6,
    title: 'Use Machine-Actionable Error Codes',
    tagline: 'Pair standardized error codes with localized, contextual debugging payloads',
    accentColor: '#f472b6',
    juniorConcept: 'Generic Strings & Unhandled Runtime Exceptions',
    seniorConcept: 'Structured Error Contract with Machine Codes & Metadata',
    diagramType: 'error_flow',
    juniorCode: `// ❌ Junior: Generic error message string
if (account.getBalance() < withdrawalAmount) {
    throw new RuntimeException("Error: You do not have enough money!");
}
// Caller has to parse string regex to figure out what happened!`,
    seniorCode: `// ✅ Senior: Standardized machine error code + metadata + developer diagnostic
public record ApiErrorResponse(
    String errorCode,           // e.g. "INSUFFICIENT_FUNDS"
    String message,             // Human-readable summary
    String incidentId,          // Distributed tracing UUID
    boolean retryable,          // Should client backoff and retry?
    Map<String, Object> context // e.g. { "currentBalance": 45.00, "requested": 100.00 }
) {}

// Thrown as domain error
throw new InsufficientFundsException(
    ErrorCode.INSUFFICIENT_FUNDS,
    "Requested withdrawal exceeds available balance",
    Map.of("currentBalance", account.getBalance(), "requested", withdrawalAmount),
    /* retryable */ false
);`,
    rationale: 'Frontend clients and downstream services cannot reliably branch on freeform English strings. Machine-readable error codes allow automated UI state changes and retry logic.',
    mentalModel: 'HTTP / POSIX Standard: Just as HTTP gives you 404 vs 503 vs 429 so clients know whether to retry or fail, your business domain must provide distinct machine codes.'
  },
  {
    id: 'law-7',
    number: 7,
    title: 'Keep Pull Requests Small & Atomic',
    tagline: 'Minimize cognitive load on reviewers via stacked diffs and single responsibilities',
    accentColor: '#2dd4bf',
    juniorConcept: 'Monolithic Mega-PR (+1,500 Lines across 30 Files)',
    seniorConcept: 'Stacked Micro-PRs (<200 Lines, Atomic Scope)',
    diagramType: 'pr_size',
    juniorCode: `// ❌ Junior Mega-PR: PR #104 (1,850 lines changed, 34 files)
// Description: "Refactored user service, added Stripe billing, updated DB schema,
//               fixed navbar CSS, and added unit tests."
// Result: Reviewers skim with "LGTM 👍", subtle bugs slip straight into production.`,
    seniorCode: `// ✅ Senior Stacked PR Series (Each < 200 lines, focused context):
// PR #105: [Schema] Add payment_audit_log table and Liquibase migration (45 lines)
// PR #106: [Domain] PaymentConfirmation domain model & pure validation engine (120 lines)
// PR #107: [Adapter] StripePaymentAdapter webhook handler (85 lines)
// PR #108: [API] Expose /api/v1/billing/checkout endpoint + integration test (90 lines)
// Result: 100% deep review, zero cognitive fatigue, easy 1-click rollback.`,
    rationale: 'Reviewer effectiveness drops exponentially after 200 lines of code. Small PRs get reviewed in minutes, generate thorough feedback, and are trivial to bisect and revert during outages.',
    mentalModel: 'The 10 vs 1000 Rule: 10 lines of code = 10 thoughtful comments; 1,000 lines of code = "LGTM 👍".'
  }
];

export default function SeniorDevCodingLawsDiagram(): React.JSX.Element {
  const [selectedLawIndex, setSelectedLawIndex] = useState<number>(0);
  const [codeView, setCodeView] = useState<'senior' | 'junior'>('senior');

  const law = LAWS[selectedLawIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={law.accentColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Senior Developer Coding Laws & Architecture Explorer
        </span>
        <span style={{ 
          marginLeft: 'auto', 
          fontSize: '12px', 
          color: law.accentColor, 
          border: `1px solid ${law.accentColor}44`,
          padding: '2px 8px',
          borderRadius: '12px',
          background: `${law.accentColor}11`,
          fontWeight: 600
        }}>
          Law {law.number} of 7
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Law selection buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {LAWS.map((l, index) => {
            const isSelected = index === selectedLawIndex;
            return (
              <button
                key={l.id}
                onClick={() => {
                  setSelectedLawIndex(index);
                  setCodeView('senior');
                }}
                style={{
                  background: isSelected ? `${l.accentColor}22` : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isSelected ? l.accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  padding: '8px 14px',
                  color: isSelected ? l.accentColor : 'var(--ifm-color-content-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isSelected ? l.accentColor : 'rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#000' : 'var(--ifm-color-content)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  {l.number}
                </span>
                <span>Law {l.number}: {l.title.split(' ')[0]} {l.title.split(' ')[1] || ''}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Law Overview */}
        <div style={{ 
          margin: '16px 0', 
          padding: '12px 16px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          borderLeft: `4px solid ${law.accentColor}`,
          borderRadius: '0 8px 8px 0'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
            Law #{law.number}: {law.title}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
            {law.tagline}
          </div>
        </div>

        {/* Visual Architectural Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ marginBottom: '16px', borderRadius: '10px', overflow: 'hidden' }}>
          <svg viewBox="0 0 800 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              {/* Dynamic colored marker for arrowheads */}
              <marker
                id={`arrow-${law.id}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 Z" fill={law.accentColor} />
              </marker>
              <marker
                id="arrow-red"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f87171" />
              </marker>
              <marker
                id="arrow-green"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
              </marker>
            </defs>

            {/* Left side: Junior Anti-Pattern */}
            <g transform="translate(10, 10)">
              <rect x="0" y="0" width="370" height="220" rx="8" fill="rgba(248, 113, 113, 0.05)" stroke="rgba(248, 113, 113, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="15" y="24" fill="#f87171" fontSize="12" fontWeight="700" letterSpacing="0.5">
                ❌ JUNIOR ANTI-PATTERN: {law.juniorConcept}
              </text>

              {law.diagramType === 'pipeline' && (
                <g transform="translate(15, 45)">
                  {/* Nested boxes */}
                  <rect x="0" y="0" width="340" height="150" rx="4" fill="rgba(248, 113, 113, 0.1)" stroke="#f87171" strokeWidth="1" />
                  <text x="10" y="18" fill="#fca5a5" fontSize="10">if (request != null) &#123;</text>
                  <rect x="20" y="25" width="300" height="115" rx="4" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="30" y="42" fill="#fca5a5" fontSize="10">if (isValid) &#123;</text>
                  <rect x="40" y="50" width="260" height="80" rx="4" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" strokeWidth="1" />
                  <text x="50" y="68" fill="#fca5a5" fontSize="10">if (user != null && isActive) &#123;</text>
                  <rect x="60" y="75" width="220" height="45" rx="4" fill="rgba(248, 113, 113, 0.3)" stroke="#f87171" strokeWidth="1" />
                  <text x="70" y="98" fill="#ffffff" fontSize="11" fontWeight="700">⚡ Nested Deep Execution</text>
                </g>
              )}

              {law.diagramType === 'boundary' && (
                <g transform="translate(15, 45)">
                  <rect x="0" y="15" width="100" height="50" rx="6" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="15" y="45" fill="#fbbf24" fontSize="11" fontWeight="600">Stripe SDK</text>
                  
                  {/* Leaking line straight into deep domain */}
                  <path d="M 105 40 L 220 40 L 220 110 L 320 110" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-red)" />
                  <text x="120" y="32" fill="#f87171" fontSize="9" fontWeight="700">⚠️ Direct SDK Leak</text>

                  <rect x="220" y="95" width="120" height="50" rx="6" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" strokeWidth="1" />
                  <text x="230" y="125" fill="#fca5a5" fontSize="11">Domain Core</text>
                </g>
              )}

              {law.diagramType === 'naming' && (
                <g transform="translate(25, 55)">
                  <rect x="0" y="0" width="320" height="40" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="15" y="24" fill="#fca5a5" fontSize="12" fontFamily="monospace">int d = 60000; // ms or sec?</text>
                  <rect x="0" y="55" width="320" height="40" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="15" y="80" fill="#fca5a5" fontSize="12" fontFamily="monospace">Object data = process(temp);</text>
                  <text x="15" y="125" fill="#f87171" fontSize="11">❓ High cognitive fatigue during review</text>
                </g>
              )}

              {law.diagramType === 'state_machine' && (
                <g transform="translate(20, 50)">
                  <rect x="0" y="0" width="330" height="130" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="15" y="30" fill="#fca5a5" fontSize="11">status = "CREATED"</text>
                  <text x="15" y="55" fill="#fca5a5" fontSize="11">isPaid = false</text>
                  <text x="15" y="80" fill="#fca5a5" fontSize="11">paidAt = 2026-09-01T10:00:00Z</text>
                  <text x="15" y="110" fill="#f87171" fontSize="11" fontWeight="700">⚠️ Impossible Invalid State Combination!</text>
                </g>
              )}

              {law.diagramType === 'core_shell' && (
                <g transform="translate(20, 45)">
                  <rect x="0" y="0" width="330" height="130" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="15" y="30" fill="#fca5a5" fontSize="11">Order order = db.load()</text>
                  <text x="15" y="55" fill="#f87171" fontSize="11" fontWeight="700">💥 Discount Logic + Email + DB Save Mixed</text>
                  <text x="15" y="80" fill="#fca5a5" fontSize="11">emailService.send()</text>
                  <text x="15" y="110" fill="#fca5a5" fontSize="10">Requires 10+ mocks to unit test single if-statement</text>
                </g>
              )}

              {law.diagramType === 'error_flow' && (
                <g transform="translate(20, 50)">
                  <rect x="0" y="0" width="330" height="120" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="15" y="35" fill="#fca5a5" fontSize="12" fontFamily="monospace">throw new Error("Failed")</text>
                  <text x="15" y="70" fill="#f87171" fontSize="11">❌ Client must parse freeform English string</text>
                  <text x="15" y="95" fill="#f87171" fontSize="11">❌ No error codes, no retry flags, no context</text>
                </g>
              )}

              {law.diagramType === 'pr_size' && (
                <g transform="translate(20, 45)">
                  <rect x="0" y="0" width="330" height="130" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="15" y="30" fill="#fca5a5" fontSize="12" fontWeight="700">📦 Mega PR #104 (+1,850 lines, 34 files)</text>
                  <text x="15" y="60" fill="#fca5a5" fontSize="11">Reviewer: "Too big to understand... LGTM 👍"</text>
                  <text x="15" y="90" fill="#f87171" fontSize="11" fontWeight="700">💣 2 AM Outage & Impossible Revert</text>
                </g>
              )}
            </g>

            {/* Right side: Senior Architecture */}
            <g transform="translate(410, 10)">
              <rect x="0" y="0" width="380" height="220" rx="8" fill="rgba(52, 211, 153, 0.05)" stroke={law.accentColor} strokeWidth="1.5" />
              <text x="15" y="24" fill={law.accentColor} fontSize="12" fontWeight="700" letterSpacing="0.5">
                ✅ SENIOR SOLUTION: {law.seniorConcept}
              </text>

              {law.diagramType === 'pipeline' && (
                <g transform="translate(15, 45)">
                  {/* Guard 1 */}
                  <rect x="0" y="0" width="100" height="40" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="12" y="24" fill="#e0f2fe" fontSize="10">Guard: Valid?</text>
                  <path d="M 50 42 L 50 65" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="2 2" markerEnd="url(#arrow-red)" />
                  <text x="55" y="58" fill="#f87171" fontSize="8">Exit</text>

                  {/* Flow to Guard 2 */}
                  <path d="M 105 20 L 135 20" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-law-1)" className="interactive-diagram-flowing-path" />

                  {/* Guard 2 */}
                  <rect x="140" y="0" width="100" height="40" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="152" y="24" fill="#e0f2fe" fontSize="10">Guard: Active?</text>
                  <path d="M 190 42 L 190 65" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="2 2" markerEnd="url(#arrow-red)" />
                  <text x="195" y="58" fill="#f87171" fontSize="8">Exit</text>

                  {/* Flow to Happy Path */}
                  <path d="M 245 20 L 275 20" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-law-1)" className="interactive-diagram-flowing-path" />

                  {/* Happy Path */}
                  <rect x="280" y="0" width="65" height="110" rx="6" fill="rgba(52, 211, 153, 0.25)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="290" y="35" fill="#34d399" fontSize="10" fontWeight="700">Happy</text>
                  <text x="292" y="52" fill="#34d399" fontSize="10" fontWeight="700">Path</text>
                  <text x="288" y="85" fill="#e2e8f0" fontSize="9">Linear 0-indent</text>
                </g>
              )}

              {law.diagramType === 'boundary' && (
                <g transform="translate(15, 45)">
                  <rect x="0" y="25" width="85" height="50" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="8" y="54" fill="#fbbf24" fontSize="10" fontWeight="600">Stripe SDK</text>

                  {/* Flow to Adapter */}
                  <path d="M 88 50 L 120 50" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-law-3)" className="interactive-diagram-flowing-path" />

                  {/* Anti-Corruption Layer Adapter */}
                  <rect x="125" y="10" width="105" height="80" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="135" y="35" fill="#34d399" fontSize="11" fontWeight="700">🛡️ Adapter / ACL</text>
                  <text x="135" y="55" fill="#e2e8f0" fontSize="9">Transforms DTO</text>
                  <text x="135" y="70" fill="#e2e8f0" fontSize="9">➔ Domain Model</text>

                  {/* Flow to Domain Core */}
                  <path d="M 233 50 L 265 50" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-law-3)" className="interactive-diagram-flowing-path" />

                  {/* Pure Domain */}
                  <rect x="270" y="25" width="80" height="50" rx="6" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="276" y="54" fill="#38bdf8" fontSize="10" fontWeight="700">Domain Core</text>
                </g>
              )}

              {law.diagramType === 'naming' && (
                <g transform="translate(15, 45)">
                  <rect x="0" y="0" width="345" height="40" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1" />
                  <text x="15" y="24" fill="#6ee7b7" fontSize="12" fontFamily="monospace">Duration timeoutMs = ofMillis(60000);</text>
                  
                  <rect x="0" y="55" width="345" height="40" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1" />
                  <text x="15" y="80" fill="#6ee7b7" fontSize="12" fontFamily="monospace">List&lt;Order&gt; pendingOrders = fetch();</text>
                  <text x="15" y="125" fill="#34d399" fontSize="11">✨ Instant comprehension & zero ambiguous cognitive load</text>
                </g>
              )}

              {law.diagramType === 'state_machine' && (
                <g transform="translate(15, 35)">
                  <rect x="0" y="0" width="100" height="45" rx="6" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" strokeWidth="1" />
                  <text x="20" y="28" fill="#fdba74" fontSize="11" fontWeight="700">Created</text>

                  <path d="M 105 22 L 135 22" fill="none" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow-law-4)" className="interactive-diagram-flowing-path" />

                  <rect x="140" y="0" width="100" height="45" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="152" y="22" fill="#34d399" fontSize="11" fontWeight="700">Paid</text>
                  <text x="146" y="38" fill="#e2e8f0" fontSize="9">(txId, paidAt)</text>

                  <path d="M 245 22 L 275 22" fill="none" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow-law-4)" className="interactive-diagram-flowing-path" />

                  <rect x="280" y="0" width="65" height="100" rx="6" fill="rgba(167, 139, 250, 0.2)" stroke="#a78bfa" strokeWidth="1" />
                  <text x="285" y="25" fill="#c4b5fd" fontSize="10" fontWeight="700">Refunded</text>
                  <text x="285" y="45" fill="#e2e8f0" fontSize="8">(reason)</text>

                  <text x="10" y="85" fill="#34d399" fontSize="11" fontWeight="600">🔒 Compiler prevents illegal transitions & states</text>
                </g>
              )}

              {law.diagramType === 'core_shell' && (
                <g transform="translate(15, 30)">
                  {/* Imperative Shell */}
                  <rect x="0" y="0" width="345" height="135" rx="8" fill="rgba(167, 139, 250, 0.1)" stroke="#a78bfa" strokeWidth="1" />
                  <text x="12" y="20" fill="#c4b5fd" fontSize="10" fontWeight="700">SHELL: I/O, DB, Network Orchestration</text>

                  {/* Pure Functional Core */}
                  <rect x="25" y="30" width="295" height="65" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="40" y="55" fill="#34d399" fontSize="12" fontWeight="700">🧠 Pure Decision Core (Zero I/O)</text>
                  <text x="40" y="75" fill="#e2e8f0" fontSize="10">calculateDiscount(order, promo) ➔ 100% Mockless Tests</text>

                  <text x="15" y="120" fill="#38bdf8" fontSize="10">Data flows into Pure Core ➔ Shell saves result to DB</text>
                </g>
              )}

              {law.diagramType === 'error_flow' && (
                <g transform="translate(15, 35)">
                  <rect x="0" y="0" width="345" height="120" rx="6" fill="rgba(244, 114, 182, 0.15)" stroke="#f472b6" strokeWidth="1" />
                  <text x="15" y="25" fill="#f472b6" fontSize="11" fontWeight="700">Structured Error Contract</text>
                  <text x="15" y="50" fill="#fbcfe8" fontSize="10" fontFamily="monospace">errorCode: "INSUFFICIENT_FUNDS"</text>
                  <text x="15" y="70" fill="#fbcfe8" fontSize="10" fontFamily="monospace">retryable: false, context: &#123; balance: 45.0 &#125;</text>
                  <text x="15" y="98" fill="#34d399" fontSize="11">✨ UI branches reliably; telemetry captures trace ID</text>
                </g>
              )}

              {law.diagramType === 'pr_size' && (
                <g transform="translate(15, 30)">
                  <rect x="0" y="0" width="80" height="40" rx="4" fill="rgba(45, 212, 191, 0.2)" stroke="#2dd4bf" strokeWidth="1" />
                  <text x="8" y="24" fill="#5eead4" fontSize="9" fontWeight="700">PR #1 (Schema)</text>

                  <path d="M 85 20 L 105 20" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-green)" />

                  <rect x="110" y="0" width="80" height="40" rx="4" fill="rgba(45, 212, 191, 0.2)" stroke="#2dd4bf" strokeWidth="1" />
                  <text x="118" y="24" fill="#5eead4" fontSize="9" fontWeight="700">PR #2 (Domain)</text>

                  <path d="M 195 20 L 215 20" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-green)" />

                  <rect x="220" y="0" width="125" height="40" rx="4" fill="rgba(45, 212, 191, 0.2)" stroke="#2dd4bf" strokeWidth="1" />
                  <text x="228" y="24" fill="#5eead4" fontSize="9" fontWeight="700">PR #3 (API Endpoint)</text>

                  <text x="10" y="70" fill="#34d399" fontSize="11" fontWeight="600">⚡ Fast 5-minute reviews + 0-risk isolated rollbacks</text>
                  <text x="10" y="95" fill="#e2e8f0" fontSize="10">Reviewers catch 99% of edge cases; zero merge conflicts</text>
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Code Comparison Toggle & Box */}
        <div style={{ 
          background: '#090b14', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          {/* Toggle Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCodeView('senior')}
                style={{
                  background: codeView === 'senior' ? `${law.accentColor}22` : 'transparent',
                  border: `1px solid ${codeView === 'senior' ? law.accentColor : 'transparent'}`,
                  borderRadius: '6px',
                  padding: '4px 12px',
                  color: codeView === 'senior' ? law.accentColor : 'var(--ifm-color-content-secondary)',
                  fontWeight: codeView === 'senior' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✅ Senior Implementation
              </button>
              <button
                onClick={() => setCodeView('junior')}
                style={{
                  background: codeView === 'junior' ? 'rgba(248, 113, 113, 0.2)' : 'transparent',
                  border: `1px solid ${codeView === 'junior' ? '#f87171' : 'transparent'}`,
                  borderRadius: '6px',
                  padding: '4px 12px',
                  color: codeView === 'junior' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  fontWeight: codeView === 'junior' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ❌ Junior Anti-Pattern
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>
              {codeView === 'senior' ? 'Clean, Resilient, Testable' : 'Brittle, Nested, Ambiguous'}
            </span>
          </div>

          {/* Code Body */}
          <pre style={{ 
            margin: 0, 
            padding: '16px', 
            background: 'transparent', 
            color: codeView === 'senior' ? '#e2e8f0' : '#fca5a5',
            fontSize: '12px', 
            lineHeight: 1.5,
            overflowX: 'auto'
          }}>
            <code>{codeView === 'senior' ? law.seniorCode : law.juniorCode}</code>
          </pre>
        </div>

        {/* Rationale & Mental Model Split Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '12px' 
        }}>
          <div style={{ 
            padding: '12px 16px', 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: law.accentColor, marginBottom: '4px' }}>
              💡 Why This Matters in Production
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
              {law.rationale}
            </div>
          </div>

          <div style={{ 
            padding: '12px 16px', 
            background: `${law.accentColor}08`, 
            border: `1px solid ${law.accentColor}33`,
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: law.accentColor, marginBottom: '4px' }}>
              🧠 Senior Mental Model
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{law.mentalModel}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
