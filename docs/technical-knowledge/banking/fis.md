---
id: fis
title: FIS — Banking Platform Integration
sidebar_label: FIS Platform
sidebar_position: 18
description: Guide to FIS (Fidelity Information Services) banking platforms used in Australian banks — Profile, Systematics, WorldPay, integration patterns (API vs MQ), batch file handling, and engineering notes.
tags: [banking, fis, core-banking, systematics, profile, integration, mq, api]
---

# 🖥️ FIS — Banking Platform Integration

**FIS** (Fidelity Information Services, formerly Metavante and EDS) is one of the world's largest providers of banking technology. Several major Australian banks run FIS platforms for core banking, card processing, and payment operations.

---

## Key FIS Products in Australian Banking

| Product | Purpose | Common AU Users |
|---------|---------|----------------|
| **FIS Profile** | Core banking system — accounts, transactions, customers | Major retail banks |
| **FIS Systematics (IBS)** | Core banking — originated in US, widely exported | Some AU/NZ banks |
| **FIS Horizon** | Community/regional bank core banking | Smaller institutions |
| **FIS WorldPay (Issuer)** | Card issuing processing | Card issuing banks |
| **FIS WorldPay (Acquirer)** | Merchant acquiring | Acquiring institutions |
| **FIS Payments One** | Payment hub / processing | Banks modernising payments |
| **FIS Recon Plus** | Reconciliation and exception management | Operations teams |

---

## FIS Profile — Core Banking Overview

**Profile** is FIS's flagship core banking system for large banks. It manages:

- **Customer Information Files (CIF)**: Customer identity, relationships, KYC status
- **Account Management**: Current, savings, term deposits, loans
- **Transaction Processing**: Debit/credit postings, interest calculations
- **General Ledger**: Financial accounting, branch/cost centre allocation
- **Regulatory Reporting**: AML flags, customer risk ratings

### Profile Architecture (Simplified)

```
External Systems
    │ MQ/API
    ▼
FIS Profile Message Gateway
    │
    ├── CIF Module (Customer Records)
    ├── Account Module (Account Management)
    ├── Transaction Module (Debit/Credit Posting)
    ├── Batch Processing Module
    └── Reporting Module
         │
         ▼
    Oracle DB (Profile data)
    │
    ▼
Downstream consumers (reporting, analytics, risk)
```

---

## Integration Patterns

### 1. IBM MQ (Message Queue) — Most Common Legacy Pattern

FIS systems (particularly older Profile and Systematics deployments) use **IBM MQ** as the primary integration protocol:

```
Payment System → IBM MQ Queue → FIS Profile → IBM MQ Response Queue → Payment System
```

**Message format:** XML or fixed-width proprietary format.

```java
// Send a posting request to FIS Profile via IBM MQ
@Service
public class FisPostingGateway {

    private static final String POST_QUEUE = "FIS.POSTING.REQUEST";
    private static final String RESPONSE_QUEUE = "FIS.POSTING.RESPONSE";

    public PostingResponse sendCreditPosting(CreditPostingRequest request) {
        String xml = marshalToXml(request);

        // Send request via MQ
        jmsTemplate.convertAndSend(POST_QUEUE, xml, message -> {
            message.setStringProperty("CorrelationId", request.getCorrelationId());
            message.setStringProperty("MessageType", "CREDIT_POST");
            return message;
        });

        // Wait for response (synchronous request-reply pattern)
        Message response = (Message) jmsTemplate.receiveAndConvert(
            RESPONSE_QUEUE + "." + request.getCorrelationId()
        );

        return unmarshal(response);
    }
}
```

### 2. REST API — Modern FIS Profile Deployments

Newer FIS deployments expose REST APIs:

```java
@Service
public class FisRestClient {

    private final WebClient webClient;

    public AccountBalance getBalance(String accountId) {
        return webClient.get()
            .uri("/api/v1/accounts/{id}/balance", accountId)
            .header("Authorization", "Bearer " + tokenService.getToken())
            .retrieve()
            .bodyToMono(AccountBalance.class)
            .timeout(Duration.ofSeconds(5))
            .block();
    }

    public PostingResult postTransaction(PostingRequest request) {
        return webClient.post()
            .uri("/api/v1/transactions")
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatus::is4xxClientError,
                response -> Mono.error(new FisBusinessException(response)))
            .bodyToMono(PostingResult.class)
            .retryWhen(Retry.fixedDelay(3, Duration.ofMillis(500))
                .filter(this::isRetryable))
            .block();
    }
}
```

### 3. Batch File Exchange

Many FIS integrations use **file-based batch processing** — particularly for:
- End-of-day statement generation
- BECS DE file processing
- Nightly reconciliation extracts
- Card transaction feeds

```java
// SFTP-based batch file delivery to FIS
@Scheduled(cron = "0 30 20 * * MON-FRI")  // 8:30 PM weekdays
public void sendNightlyBatch() {
    List<Transaction> transactions = ledgerService.getDayTransactions(LocalDate.now());
    String becsFile = becsFileGenerator.generate(transactions);

    // Upload to FIS SFTP drop zone
    sftpService.upload(
        becsFile.getBytes(StandardCharsets.US_ASCII),
        "/fis/inbound/becs/" + LocalDate.now() + "_transactions.de"
    );

    log.info("Nightly BECS batch sent to FIS: {} transactions", transactions.size());
}
```

---

## FIS Profile — Key Message Types

When integrating with FIS Profile via MQ:

| Message Type | Purpose |
|-------------|---------|
| `GET_ACCOUNT` | Retrieve account details and balance |
| `DEBIT_POST` | Post a debit to a customer account |
| `CREDIT_POST` | Post a credit to a customer account |
| `BALANCE_INQUIRY` | Real-time balance check (before payment) |
| `ACCOUNT_FREEZE` | Apply a hold/freeze on an account |
| `ACCOUNT_UNFREEZE` | Release a hold |
| `CIF_INQUIRY` | Retrieve customer information |
| `STATEMENT_REQUEST` | Generate account statement extract |
| `INTEREST_CALCULATION` | Trigger interest calculation |

---

## FIS Systematics (IBS)

**Systematics** (now branded as IBS — Integrated Banking Solution) is an older FIS core banking product with a longer history in US banking, with some Australian deployments.

Key differences from Profile:
- Originally mainframe-based (IBM z/OS)
- Uses fixed-length record formats in batch files
- COBOL-era architecture; heavily customised over decades
- JCL (Job Control Language) batch jobs still common in older deployments
- Modern interfaces added via middleware (IBM DataPower, MQ, REST API layer)

```java
// Fixed-length record parsing (Systematics batch extract)
public AccountRecord parseAccountRecord(String line) {
    // Systematics uses fixed-width columns — no delimiters
    return AccountRecord.builder()
        .accountId(line.substring(0, 12).trim())
        .accountType(line.substring(12, 14).trim())
        .balance(parseCents(line.substring(14, 23)))
        .currency(line.substring(23, 26).trim())
        .status(line.substring(26, 27).trim())
        .customerName(line.substring(27, 57).trim())
        .build();
}

private BigDecimal parseCents(String rawAmount) {
    // Systematics stores amounts as right-justified zero-padded integer cents
    long cents = Long.parseLong(rawAmount.trim());
    return BigDecimal.valueOf(cents).movePointLeft(2);
}
```

---

## FIS WorldPay — Card Processing

For banks using FIS WorldPay for card issuing:

| Component | Function |
|-----------|---------|
| **Authorisation** | Real-time card transaction authorisation |
| **Settlement** | Batch settlement processing (VISA/MC nets) |
| **Dispute Management** | Chargeback workflows |
| **Fraud** | FIS Risk Shield fraud scoring |
| **Loyalty** | Points/rewards engine |

Integration: primarily via ISO 8583 (authorisation) and batch files (settlement).

---

## Common FIS Integration Challenges

| Challenge | Mitigation |
|-----------|-----------|
| **Synchronous MQ blocking** | Use async MQ with correlation ID and callback; set timeouts |
| **Fixed-length format parsing** | Use builder pattern with explicit position offsets; extensive unit tests |
| **FIS downtime windows** | Implement circuit breakers; queue payments during planned maintenance |
| **Response timeouts** | Set explicit timeout + DLQ; trigger manual investigation |
| **Encoding issues** | FIS batch files are often EBCDIC (mainframe) → convert to ASCII |
| **Date formats** | FIS uses YYYYMMDD or MMDDYYYY — always specify and test |
| **Amount precision** | FIS often stores as integer cents — never use floating point |

---

## Circuit Breaker Pattern for FIS Calls

```java
@Service
public class FisAccountService {

    private final CircuitBreaker circuitBreaker;
    private final FisClient fisClient;

    public AccountBalance getBalance(String accountId) {
        return circuitBreaker.executeSupplier(() -> {
            AccountBalance balance = fisClient.getBalance(accountId);
            if (balance == null) {
                throw new FisUnavailableException("Null balance response");
            }
            return balance;
        });
    }
}

// Circuit breaker config
@Bean
public CircuitBreaker fisCircuitBreaker(CircuitBreakerRegistry registry) {
    return registry.circuitBreaker("fis", CircuitBreakerConfig.custom()
        .failureRateThreshold(50)         // Open if 50% of calls fail
        .waitDurationInOpenState(Duration.ofSeconds(30))
        .slidingWindowSize(10)
        .build()
    );
}
```

---

## Interview Questions

**Q: Why do banks still use IBM MQ to integrate with FIS instead of REST APIs?**
> Many FIS core banking deployments were built in the 1990s–2000s around IBM MQ as the enterprise messaging backbone. These systems are mission-critical, deeply customised, and carry enormous regulatory and operational risk if changed. REST APIs require a middleware layer in front of FIS. Banks often add an API gateway that speaks REST externally and translates to MQ internally, allowing modern consumers without touching the core system.

**Q: How do you handle a payment when FIS is unavailable?**
> Use a circuit breaker to fail fast after a defined error threshold. Queue the payment instruction (Kafka/MQ dead letter / hold table) and retry when FIS recovers. For critical RTGS payments, have a fallback manual process. Monitor FIS availability independently (health check endpoint) and alert operations before the circuit opens. Never lose a payment instruction — always store in durable storage before calling FIS.

:::info[Context]
FIS is a vendor platform, not open-source. Integration details vary significantly by version, deployment, and bank-specific customisation. Always refer to the bank's own FIS integration specification documents and test thoroughly in non-production environments before any changes.
:::

---

## Related Concepts

- [Core Banking System](./core_banking)
- [Debit Posting](./debit_post)
- [Credit Posting](./credit_post)
- [Reconciliation](./reconciliation)
- [Idempotency in Payments](./idempotency)
- [Payment Hub Architecture](./payment_hub)
