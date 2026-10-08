import React, { useState } from 'react';

type Category = 'All' | 'URL' | 'Query' | 'JSON' | 'Headers' | 'OpenAPI';

interface Rule {
  category: Exclude<Category, 'All'>;
  rule: string;
  good: string;
  bad: string;
  why: string;
}

const RULES: Rule[] = [
  { category: 'URL', rule: 'Plural nouns for collections', good: '/orders/{orderId}', bad: '/getOrder, /order/{id}', why: 'The HTTP method is the verb; collections are plural so /orders and /orders/42 are consistent.' },
  { category: 'URL', rule: 'kebab-case path segments', good: '/shipping-addresses', bad: '/shippingAddresses, /shipping_addresses', why: 'URLs are case-sensitive in the path; lowercase hyphenated is readable and SEO/CDN-safe.' },
  { category: 'URL', rule: 'Max two levels of nesting', good: '/orders/42/items, /items?orderId=42', bad: '/customers/1/orders/42/items/7/prices', why: 'Deep nesting couples URLs to hierarchy and breaks when ownership changes; expose sub-resources by top-level id.' },
  { category: 'URL', rule: 'No verbs, no file extensions, no trailing slash', good: '/invoices/42', bad: '/invoices/42.json/, /createInvoice', why: 'Use Accept for format and methods for actions.' },
  { category: 'URL', rule: 'Custom actions as sub-resource or colon verb', good: 'POST /orders/42:cancel  or  POST /orders/42/cancellation', bad: 'GET /cancelOrder?id=42', why: 'Non-CRUD state transitions need POST; the colon style follows Google AIP-136.' },
  { category: 'Query', rule: 'camelCase or snake_case, pick ONE', good: 'pageSize, sortBy', bad: 'page_size & sortBy mixed', why: 'Consistency matters more than the choice; enforce with a linter.' },
  { category: 'Query', rule: 'Pagination params', good: 'limit + cursor (or pageSize + pageToken)', bad: 'p, n, start, rows', why: 'Opaque cursor tokens let you change storage without breaking clients.' },
  { category: 'Query', rule: 'Sorting with a signed field list', good: 'sort=-createdAt,name', bad: 'orderBy=createdAt DESC', why: 'Leading minus = descending; never pass raw SQL fragments (injection risk).' },
  { category: 'Query', rule: 'Filtering uses explicit field names', good: 'status=PAID&createdAfter=2025-01-01T00:00:00Z', bad: 'filter=status eq paid (ad-hoc)', why: 'Use a documented grammar (RSQL/OData) only if you truly need it; otherwise simple fields.' },
  { category: 'JSON', rule: 'camelCase property names', good: 'firstName, createdAt', bad: 'first_name, FirstName', why: 'Matches JavaScript and most client SDKs; snake_case is acceptable if used everywhere (Stripe, GitHub).' },
  { category: 'JSON', rule: 'ISO-8601 / RFC 3339 timestamps in UTC', good: '"2025-03-01T10:15:30Z"', bad: '1709287530, "03/01/2025"', why: 'Unambiguous, sortable, timezone-safe. Date-only fields use YYYY-MM-DD.' },
  { category: 'JSON', rule: 'Money as string/integer minor units + currency', good: '{"amount":"1999","currency":"USD"}', bad: '{"price":19.99}', why: 'Binary floating point cannot represent decimals; JavaScript numbers lose precision above 2^53.' },
  { category: 'JSON', rule: 'Booleans are positive adjectives/verbs', good: 'isActive, hasChildren', bad: 'notDisabled, active_flag', why: 'Double negatives are error-prone.' },
  { category: 'JSON', rule: 'Enums UPPER_SNAKE_CASE strings', good: '"status":"PENDING_PAYMENT"', bad: '"status":2', why: 'Self-describing and stable; clients must tolerate unknown values (open enums).' },
  { category: 'JSON', rule: 'Collections are plural, ids are strings', good: '"items":[...], "id":"ord_8f3k"', bad: '"item":[...], "id":42 (leaks counts)', why: 'Opaque string ids prevent enumeration and allow migration to UUID/ULID.' },
  { category: 'Headers', rule: 'Standard headers over custom X- headers', good: 'Idempotency-Key, Retry-After, Sunset', bad: 'X-Idempotency, X-Retry', why: 'RFC 6648 deprecated the X- prefix; use registered names or an org prefix.' },
  { category: 'Headers', rule: 'Correlation / trace id', good: 'traceparent (W3C Trace Context)', bad: 'X-Req-Id invented per team', why: 'Interoperates with OpenTelemetry, gateways, and vendors.' },
  { category: 'OpenAPI', rule: 'operationId is unique camelCase verbNoun', good: 'listOrders, getOrderById, cancelOrder', bad: 'get_orders_orders_get (auto)', why: 'Becomes the method name in generated SDKs; instability renames client methods.' },
  { category: 'OpenAPI', rule: 'Schema names PascalCase, role-suffixed', good: 'Order, CreateOrderRequest, OrderResponse, ProblemDetail', bad: 'order_dto2, Order1', why: 'Generated class names; separate request/response to avoid readOnly/writeOnly confusion.' },
  { category: 'OpenAPI', rule: 'Tags group by resource, summary < 60 chars', good: 'tags: [Orders]  summary: "List orders"', bad: 'tags: [OrderController]', why: 'Tags drive navigation and SDK grouping, not Java class names.' },
  { category: 'OpenAPI', rule: 'Reuse via components + $ref', good: '$ref: "#/components/responses/NotFound"', bad: 'Copy/pasted inline error schemas', why: 'One definition = one change; prevents drift.' },
];

const CATEGORIES: Category[] = ['All', 'URL', 'Query', 'JSON', 'Headers', 'OpenAPI'];
const COLORS: Record<Category, string> = {
  All: '#94a3b8',
  URL: '#38bdf8',
  Query: '#34d399',
  JSON: '#fbbf24',
  Headers: '#a78bfa',
  OpenAPI: '#f97316',
};

export default function ApiNamingConventionsDiagram(): React.JSX.Element {
  const [cat, setCat] = useState<Category>('All');
  const [q, setQ] = useState<string>('');
  const needle = q.trim().toLowerCase();
  const rows = RULES.filter((r) => (cat === 'All' || r.category === cat) && (needle === '' || `${r.rule} ${r.good} ${r.bad} ${r.why}`.toLowerCase().includes(needle)));
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          API Naming Convention Lookup
        </h3>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rules (e.g. date, cursor, enum)"
          aria-label="Search naming rules"
          style={{ background: '#0c0e17', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#e2e8f0', padding: '4px 8px', fontSize: '0.78rem', minWidth: 220 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0.6rem 1rem 0' }}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} style={{ background: cat === c ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${cat === c ? COLORS[c] : 'rgba(255,255,255,0.1)'}`, borderRadius: 4, color: cat === c ? COLORS[c] : '#94a3b8', cursor: 'pointer', padding: '3px 10px', fontSize: '0.76rem', fontWeight: 600 }}>
            {c}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.74rem', alignSelf: 'center' }}>{rows.length} rules</span>
      </div>
      <div style={{ padding: '0.6rem 1rem 1rem', display: 'grid', gap: 8 }}>
        {rows.length === 0 && <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>No rules match your search.</p>}
        {rows.map((r) => (
          <div key={`${r.category}-${r.rule}`} style={{ background: '#0c0e17', border: `1px solid ${COLORS[r.category]}55`, borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: COLORS[r.category], border: `1px solid ${COLORS[r.category]}`, borderRadius: 3, padding: '0 5px' }}>{r.category}</span>
              <strong style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{r.rule}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: 8, fontSize: '0.74rem' }} className="api-naming-grid">
              <code style={{ color: '#34d399', background: 'rgba(52,211,153,0.08)', padding: '3px 6px', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{`✔ ${r.good}`}</code>
              <code style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', padding: '3px 6px', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{`✘ ${r.bad}`}</code>
            </div>
            <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>{r.why}</p>
          </div>
        ))}
      </div>
      <style>{`@media (max-width: 768px) { .api-naming-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
