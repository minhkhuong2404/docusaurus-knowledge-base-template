---
id: retry-pattern
title: Retry Pattern
sidebar_label: Retry
description: Guide to the Retry pattern in microservices, detailing transient vs. persistent errors, exponential backoff, randomized jitter, and configuration using Resilience4j.
tags: [system-design, microservices, resilience, spring-boot, retry]
---

# Retry Pattern

The **Retry** pattern automates re-executing failed network operations. It is designed to handle **transient errors** (short-lived failures like brief database lockups, TCP packet drops, or momentary rate limits) that are likely to self-correct on a subsequent attempt.

---

## The Thundering Herd Problem & Jitter

If a downstream service goes offline due to overload, and 1,000 caller instances immediately retry calls at exact 1-second intervals, the retries will hammer the struggling service with a massive wave of synchronized requests, preventing it from recovering.

To prevent this **Thundering Herd** problem:
1. **Exponential Backoff**: Multiply the delay period between each successive retry attempt (e.g., attempt 1 = 100ms, attempt 2 = 200ms, attempt 3 = 400ms).
2. **Randomized Jitter**: Introduce random variance to the backoff delays so callers scatter their retries over time:

```text
Without Jitter (Synchronized storms):
Time: 1s ─────► [ 1000 requests retry ]
Time: 2s ─────► [ 1000 requests retry ]

With Jitter (Scattered, smooth distribution):
Time: 1.1s ──► [ 200 requests ]
Time: 1.3s ──► [ 300 requests ]
Time: 1.6s ──► [ 250 requests ]
```

---

## Setup & Implementation

### Resilience4j Config with Spring Boot

Configure retry behaviors to include exponential backoff and jitter:

```yaml
# application.yml
resilience4j:
  retry:
    instances:
      userService:
        maxAttempts: 3                     # Try up to 3 times
        waitDuration: 200ms                # Initial backoff delay
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2.0  # Double delay each time (200ms -> 400ms)
        enableRandomizedWait: true         # Add randomized jitter to delay
        # Specify what exceptions to retry on
        retryExceptions:
          - java.io.IOException
          - java.net.ConnectException
          - org.springframework.web.client.ResourceAccessException
        # Do not retry client/business errors
        ignoreExceptions:
          - org.springframework.web.client.HttpClientErrorException
```

### Java Code Example

```java
@Service
@Slf4j
public class UserClient {

    private final RestTemplate restTemplate;

    public UserClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Retry(name = "userService", fallbackMethod = "getUserFallback")
    public UserResponse getUserProfile(String userId) {
        log.info("Fetching profile for user: {}", userId);
        return restTemplate.getForObject("http://user-service/users/" + userId, UserResponse.class);
    }

    // Fallback executes only if all retry attempts are exhausted
    public UserResponse getUserFallback(String userId, Exception ex) {
        log.error("Failed to fetch user profile after retries. Error: {}", ex.getMessage());
        return UserResponse.empty(userId);
    }
}
```

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Resolves Transient Glitches**: Silently absorbs temporary network drops without bubbling up errors to the user. | **Adds Latency**: Every retry adds wait duration to the main request thread, making the API call feel slow. |
| **Highly Customizable**: Easy to target specific HTTP codes (e.g., `503`) or Exceptions while avoiding business exceptions. | **Risk of Overload (Thundering Herd)**: If retry jitter is configured incorrectly, retries can completely crash downstream. |
| **Zero Code Changes**: Declarative configuration templates via annotations. | **Debugging Complexity**: Logging statements can become cluttered, making it hard to see if a call completed on try 1 or try 3. |

---

## Common Gotchas & Anti-Patterns

1. **Retrying Non-Idempotent Operations**: Retrying a payment creation call (`POST /payments/charge`). If the original request succeeded in the payment processor but the response timed out, retrying it will bill the customer a second time.
   - *Rule*: Only retry idempotent operations (`GET`, `PUT`, `DELETE`, or `POST` requests protected by unique idempotency keys).
2. **Infinite Retries**: Configuring `maxAttempts: 50` or disabling timeouts during retry execution. This blocks caller threads indefinitely and exhausts resource pools. Keep max attempts around `3` to `5`.
3. **Mismatched Exceptions**: Configuring retry on generic `Exception.class`. This retries `NullPointerException`, parsing errors, or validation issues (`400 Bad Request`), which will never succeed regardless of retry counts. Target network exceptions.
