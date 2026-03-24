---
id: wiremock
title: WireMock
sidebar_label: 🔌 WireMock
---

# WireMock Overview

**WireMock** is a popular library for stubbing and mocking web services. It creates an actual HTTP server that your application can talk to, allowing you to test HTTP client code (like `RestTemplate`, `WebClient`, or Feign clients) without hitting the real external API.

## Why use WireMock?
- External services may be unreliable or unavailable in your CI/CD environment.
- External APIs may have rate limits or charge per usage.
- You want to reliably simulate edge cases like network timeouts, 500 internal server errors, or malformed JSON responses.

## Basic Usage

### Setup in JUnit 5
You can use the `WireMockExtension` to easily start and stop a WireMock server around your tests.

```java
@SpringBootTest
@AutoConfigureWireMock(port = 0) // Starts WireMock on a random available port
class PaymentClientIntegrationTest {

    @Autowired
    private PaymentClient paymentClient;

    @Test
    void shouldReturnPaymentDetails() {
        // Stub the external service
        stubFor(get(urlEqualTo("/api/payments/123"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("{ \"id\": \"123\", \"status\": \"SUCCESS\" }")));

        // Execute your client method
        Payment payment = paymentClient.getPayment("123");

        // Assert
        assertEquals("SUCCESS", payment.getStatus());
        
        // Verify that the request was actually made (optional, WireMock does this)
        verify(getRequestedFor(urlEqualTo("/api/payments/123")));
    }
}
```

## Advanced Stubs

WireMock allows you to heavily customize responses to simulate real-world API behavior.

### Simulating Faults and Delays
```java
// Simulating a delay
stubFor(post("/api/login")
    .willReturn(ok().withFixedDelay(2000)));

// Simulating an empty response or connection reset
stubFor(get("/api/unstable")
    .willReturn(aResponse().withFault(Fault.CONNECTION_RESET_BY_PEER)));
```

### Pattern Matching
Instead of exact URL matches, you can use regex or match specific query parameters and headers:
```java
stubFor(get(urlPathMatching("/api/users/.*"))
    .withQueryParam("active", equalTo("true"))
    .withHeader("Authorization", containing("Bearer"))
    .willReturn(okJson("{ \"users\": [] }")));
```

## WireMock with Testcontainers
For complex setups or entirely declarative testing architectures without `@AutoConfigureWireMock`, WireMock can also be run inside a Docker container using **Testcontainers**. This completely isolates the mock server and guarantees consistency across local testing and CI pipelines.
