---
id: inflight-testing
title: Inflight Testing
sidebar_label: Inflight Testing
---

# Inflight Testing

## What is Inflight Testing?

**Inflight testing** (also called **production smoke testing** or **synthetic monitoring**) is the practice of running automated tests against a live production or staging environment using real or synthetic traffic — *while the system is running and serving users*.

Unlike pre-deployment tests that validate the build, inflight tests validate the **deployed, running system** in its actual environment.

---

## When Inflight Testing Occurs

```
Deployment starts
      ↓
New version receives 5% traffic (canary)
      ↓
  ┌─────────────────────────────────┐
  │     INFLIGHT TESTS RUN NOW      │
  │  - Synthetic API calls          │
  │  - Health endpoint polling      │
  │  - Business metric validation   │
  └─────────────────────────────────┘
      ↓
Pass? → Increase traffic to 25% → 50% → 100%
Fail? → Automatic rollback triggered
```

---

## Types of Inflight Tests

### 1. Synthetic Monitoring
Automated scripts simulate real user actions on production:
- Login and session management
- Core transactional workflows
- Search and read operations

Runs every 1–5 minutes continuously (not just at deployment).

### 2. Health Probe Checks
Verify Spring Boot Actuator endpoints after deployment:

```bash
#!/bin/bash
# inflight-health-check.sh
BASE_URL=$1
MAX_RETRIES=30
RETRY_INTERVAL=10

echo "Checking health of $BASE_URL"

for i in $(seq 1 $MAX_RETRIES); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
             "$BASE_URL/actuator/health/readiness")
    
    if [ "$STATUS" -eq 200 ]; then
        echo "✅ Health check passed (attempt $i)"
        
        # Verify business-critical downstream checks
        curl -sf "$BASE_URL/actuator/health" | \
            python3 -c "
import sys, json
health = json.load(sys.stdin)
components = health.get('components', {})
for name, comp in components.items():
    status = comp.get('status')
    if status != 'UP':
        print(f'❌ Component {name} is {status}', file=sys.stderr)
        sys.exit(1)
print('✅ All components healthy')
"
        exit 0
    fi
    
    echo "⏳ Attempt $i/$MAX_RETRIES: status=$STATUS, retrying in ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
```

### 3. Business Metric Validation
Verify key metrics return to baseline within expected time after deployment:

| Metric | Acceptable Range | Rollback Trigger |
|---|---|---|
| HTTP 5xx rate | < 0.1% | > 1% for > 2 minutes |
| API p99 latency | < 500ms | > 1500ms for > 5 minutes |
| Transaction success rate | > 99.5% | < 98% for > 3 minutes |
| Kafka consumer lag | < 5 min behind | > 30 min behind |
| Active DB connections | < 80% pool | > 95% for > 1 minute |

### 4. Canary Analysis
Automated statistical comparison between canary (new) and baseline (old) versions:

- Uses tools like **Kayenta** (Netflix), **Spinnaker Canary Analysis**, or custom Grafana alerts
- Compares latency percentiles, error rates, and business metrics between old and new pods
- Automatically promotes or rolls back based on configured thresholds

---

## Implementing Inflight Tests in Java/Spring

### Dedicated Smoke Test Profile

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("inflight")
@Tag("inflight")
class InflightSmokeTest {

    @Value("${inflight.base-url}")
    private String baseUrl;

    @Value("${inflight.api-key}")
    private String apiKey;

    @Test
    @DisplayName("Health endpoint returns UP")
    void healthEndpoint_returnsUp() {
        given()
            .baseUri(baseUrl)
        .when()
            .get("/actuator/health")
        .then()
            .statusCode(200)
            .body("status", equalTo("UP"));
    }

    @Test
    @DisplayName("Transaction list API is responsive")
    void transactionListApi_isResponsive() {
        long start = System.currentTimeMillis();

        given()
            .baseUri(baseUrl)
            .header("X-API-Key", apiKey)
        .when()
            .get("/api/v1/transactions?page=0&size=1")
        .then()
            .statusCode(200)
            .time(lessThan(500L), TimeUnit.MILLISECONDS);

        long elapsed = System.currentTimeMillis() - start;
        assertThat(elapsed).isLessThan(500);
    }

    @Test
    @DisplayName("Unauthenticated requests return 401")
    void unauthenticatedRequest_returns401() {
        given()
            .baseUri(baseUrl)
        .when()
            .get("/api/v1/transactions")
        .then()
            .statusCode(401);
    }
}
```

```yaml
# application-inflight.yml
inflight:
  base-url: ${INFLIGHT_BASE_URL:https://production.yourapp.com}
  api-key: ${INFLIGHT_API_KEY}
```

---

## Automated Rollback Integration

Integrate inflight test results with deployment orchestration:

```yaml
# .github/workflows/deploy.yml (excerpt)
- name: Run inflight smoke tests
  id: inflight
  run: |
    mvn test -Dgroups="inflight" \
      -Dinflight.base-url=${{ env.PROD_URL }} \
      -Dinflight.api-key=${{ secrets.INFLIGHT_API_KEY }}

- name: Rollback on inflight failure
  if: failure() && steps.inflight.outcome == 'failure'
  run: |
    echo "🔴 Inflight tests failed — triggering rollback"
    kubectl rollout undo deployment/transaction-service
    ./scripts/notify-slack.sh "Deployment rolled back: inflight tests failed"
```

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Non-destructive** | Inflight tests must not create or modify real production data — use dedicated test accounts or read-only operations |
| **Idempotent** | Safe to re-run without side effects |
| **Fast** | Each test < 5 seconds; full suite < 2 minutes |
| **Alert on failure** | Failed inflight tests page the on-call engineer immediately |
| **Run continuously** | Synthetic monitoring runs every 5 minutes, not just at deployment |

---

:::danger Critical Rule
Inflight tests run against **production**. They must **never** create, modify, or delete real user data. Always use a dedicated synthetic test account with clearly marked test data.
:::
