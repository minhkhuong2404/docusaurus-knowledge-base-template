---
id: card_iso8583
title: "Card Protocols: ISO 8583 & AS 2805 Wire Architecture"
sidebar_label: "ISO 8583 & AS 2805 Protocols"
sidebar_position: 3
description: Deep principal engineering guide to card messaging wire protocols — ISO 8583 versions, MTI anatomy, 64/128-bit bitmaps, data elements catalog, Australian AS 2805 standard, and production Java 21 authorization engine.
tags: [banking, cards, iso8583, as2805, mti, bitmaps, pin-block, dukpt, stan, authorization-engine, java21]
---

# 🔌 Card Protocols: ISO 8583 & AS 2805 Wire Architecture

While interbank wholesale payment systems have migrated to ISO 20022 XML, retail card networks (VisaNet, Mastercard BankNet, American Express, eftpos) operate almost exclusively over binary/ASCII variants of **ISO 8583** and Australia's domestic standard **AS 2805**.

These protocols are designed for sub-second, low-latency transaction processing over persistent TCP/IP sockets with minimal network serialization overhead.

---

## 1. Network Framing & Message Structure

An ISO 8583 packet transmitted over a raw TCP socket consists of three distinct segments:

```
┌─────────────────┬─────────────────┬──────────────────┬────────────────────────┐
│ 2-Byte Length   │ ISO Header      │ MTI (4 Digits)   │ Bitmap & Data Elements │
│ (TCP Framing)   │ (Routing Info)  │ (Message Type)   │ (DE 1 .. DE 128)       │
└─────────────────┴─────────────────┴──────────────────┴────────────────────────┘
```

1. **Length Header**: 2 or 4 bytes representing the total byte count of the payload (Big-Endian binary integer).
2. **ISO Header (Optional)**: 12-byte header containing network routing and station identifiers (e.g. Visa `ISO015000050`).
3. **Message Type Identifier (MTI)**: 4 numeric digits classifying the operational intent.
4. **Bitmaps**: Binary flags indicating which Data Elements (DE) are populated.
5. **Data Elements**: Fixed or variable-length fields carrying transaction details.

---

## 2. Message Type Identifier (MTI) Anatomy

The MTI is a 4-digit numeric code defining the function, class, and origin of the message:

```
  0   1   0   0
  │   │   │   │
  │   │   │   └─ Origin (0 = Acquirer, 1 = Repeat, 2 = Issuer, 3 = Reserve)
  │   │   └───── Sub-function (0 = Request, 1 = Response, 2 = Advice, 3 = Advice Response)
  │   └───────── Message Class (1 = Authorization, 2 = Financial, 4 = Reversal, 8 = Network)
  └───────────── ISO 8583 Version (0 = 1987, 1 = 1993, 2 = 2003)
```

### Core MTI Registry

| MTI Code | Description | Practical Usage |
|---|---|---|
| **`0100`** | Authorization Request | Real-time balance and fraud check; places a temporary hold on customer funds without posting. |
| **`0110`** | Authorization Response | Issuer approval (`00`) or decline (`51` Insufficient Funds, `05` Do Not Honor). |
| **`0200`** | Financial Transaction Request | Real-time debit and settlement at once (ATMs, PIN debit, single-message eftpos). |
| **`0210`** | Financial Transaction Response | Confirms customer account has been posted and debited. |
| **`0400` / `0420`** | Reversal Advice | Terminal timeout, printer jam, or communication loss; cancels preceding authorization hold. |
| **`0410` / `0430`** | Reversal Response | Acknowledges reversal has unlocked customer balance. |
| **`0800`** | Network Management Request | Echo test (heartbeat), key exchange (ZPK/TMK), sign-on/sign-off between switches. |
| **`0810`** | Network Management Response | Heartbeat acknowledgment. |

---

## 3. Bitmap Architecture: Primary & Secondary

ISO 8583 utilizes a compact binary indexing scheme known as a **Bitmap** to avoid transmitting empty or null fields.

```
Byte 1:  Bit 1 (Secondary Bitmap Flag) | Bit 2 (DE 2) | Bit 3 (DE 3) | ... | Bit 8 (DE 8)
Byte 2:  Bit 9 (DE 9)                  | Bit 10 (DE 10)| ...         | ... | Bit 16 (DE 16)
...
Byte 8:  Bit 57                        | Bit 58        | ...         | ... | Bit 64 (DE 64)
```

* **Primary Bitmap**: 8 bytes (64 bits). Bit 1 indicates whether a Secondary Bitmap is present.
  * If Bit 1 is `0`, only fields between `DE 1` and `DE 64` exist.
  * If Bit 1 is `1`, an additional 8 bytes (Secondary Bitmap) follow, expanding coverage up to `DE 128`.
* **Representation**: Transmitted either as raw binary (8 or 16 bytes) or hex-encoded ASCII characters (16 or 32 characters, e.g., `7238000000000000`).

---

## 4. Essential Data Elements (DE) Catalog

Data elements follow three structural types:
- **Fixed length (`n 6`, `an 12`)**: Exactly $N$ digits or characters.
- **Variable length LVAR / LLVAR (`LLVAR n..19`)**: Prefixed with a 2-digit length indicator (01 to 99), followed by the payload.
- **Variable length LLLVAR (`LLLVAR ans..999`)**: Prefixed with a 3-digit length indicator (001 to 999).

| Field | Name | Format | Specification & Architectural Purpose |
|---|---|---|---|
| **`DE 2`** | Primary Account Number (PAN) | `LLVAR n..19` | Customer card number (masked in logs for PCI-DSS compliance). |
| **`DE 3`** | Processing Code | `n 6` | 6-digit operational indicator (`000000` = Purchase, `010000` = Cash Advance, `200000` = Refund). |
| **`DE 4`** | Amount, Transaction | `n 12` | Amount in minor currency units (e.g. `000000050000` = $500.00). |
| **`DE 11`** | System Trace Audit Number (STAN) | `n 6` | Monotonically increasing sequence number generated by terminal to correlate requests and responses. |
| **`DE 12` / `13`** | Local Time & Date | `n 6` / `n 4` | Timestamp recorded at POS terminal initiation (`HHMMSS` and `MMDD`). |
| **`DE 14`** | Expiration Date | `n 4` | Card expiry formatted as `YYMM`. |
| **`DE 22`** | Point of Service Entry Mode | `n 3` | Ingress channel: `051` = Chip with PIN, `071` = Contactless NFC, `012` = E-commerce, `901` = Magstripe fallback. |
| **`DE 37`** | Retrieval Reference Number (RRN) | `an 12` | Globally unique transaction reference created by the acquirer for clearing reconciliation. |
| **`DE 38`** | Authorization Code | `an 6` | Approval approval code generated by issuer core banking (e.g. `A87192`). |
| **`DE 39`** | Action / Response Code | `an 2` | `00` = Approved, `05` = Do Not Honor, `51` = Insufficient Funds, `54` = Expired Card, `91` = System Error. |
| **`DE 48`** | Private Data Elements | `LLLVAR ans..999` | Custom acquirer/scheme telemetry, 3DS authentication flags, device fingerprint metadata. |
| **`DE 52`** | PIN Block | `b 64` | Encrypted 8-byte PIN block (ISO 9564-1 Format 0) enciphered under DUKPT. |
| **`DE 55`** | Integrated Circuit Card (ICC) Data | `LLLVAR b..999` | Ber-TLV encoded EMV chip cryptograms: Tag `9F26` (ARQC), `9F27` (CID), `9F10` (IAD), `9F36` (ATC), `9F37` (UN). |

---

## 5. Australian Domestic Standard: AS 2805

In Australia, the domestic interchange network connecting the major banks (CBA, Westpac, NAB, ANZ) and eftpos is governed by **AS 2805** (Australian Standard for Electronic Funds Transfer).

### Key Architectural Differences from Base ISO 8583:
1. **Binary Packing**: While international Visa/Mastercard links often use ASCII hex encoding, AS 2805 enforces dense **Binary Coded Decimal (BCD)** and pure binary representations to maximize throughput on legacy lines.
2. **AS 2805.6 Key Management**: Enforces node-to-node security using Terminal Master Keys (TMK) and Zone PIN Keys (ZPK) with automated rolling key rotation via `0800` network messages.
3. **Terminal Trace Identification**: Combines Terminal ID (`DE 41`), Merchant ID (`DE 42`), and System Trace Number (`DE 11`) to enforce absolute uniqueness across all domestic nodes.

---

## 6. Production Java 21 ISO 8583 Authorization Engine

Below is a production-grade, thread-safe Spring Boot service handling incoming ISO 8583 `0100` Authorization Requests with hardware security module (HSM) offloading:

```java
package com.bank.cards.iso8583;

import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class Iso8583AuthorizationEngine {

    private final CardTokenRepository cardRepository;
    private final CoreLedgerService ledgerService;
    private final FraudScoringEngine fraudEngine;
    private final HardwareSecurityModuleClient hsmClient;

    @Transactional
    public Iso8583Message handleAuthorizationRequest(Iso8583Message request) {
        String stan = request.getField(11);
        String posEntryMode = request.getField(22);
        String tokenizedPan = request.getField(2);
        BigDecimal amount = parseMinorUnits(request.getField(4));
        String encryptedPinBlock = request.getField(52);

        log.info("Processing ISO 8583 0100 Request. STAN={}, EntryMode={}, Amount={}", stan, posEntryMode, amount);

        // 1. Validate Card State
        CardRecord card = cardRepository.findByToken(tokenizedPan).orElse(null);
        if (card == null) {
            log.warn("Invalid card token: {}", tokenizedPan);
            return buildResponse(request, "14", null); // Response 14: Invalid Card Number
        }

        if (!card.isActive()) {
            log.warn("Card {} is inactive or blocked", tokenizedPan);
            return buildResponse(request, "05", null); // Response 05: Do Not Honor
        }

        // 2. Hardware Security Module (HSM) PIN Verification
        if (encryptedPinBlock != null && !encryptedPinBlock.isBlank()) {
            boolean pinValid = hsmClient.verifyPin(card.getPinOffset(), encryptedPinBlock, tokenizedPan);
            if (!pinValid) {
                log.warn("PIN verification failed for card: {}", tokenizedPan);
                return buildResponse(request, "55", null); // Response 55: Incorrect PIN
            }
        }

        // 3. Real-Time Fraud Assessment
        FraudAssessment assessment = fraudEngine.evaluate(card, request);
        if (assessment.isDeclined()) {
            log.warn("Fraud engine rejected transaction. Reason: {}", assessment.getReason());
            return buildResponse(request, "59", null); // Response 59: Suspected Fraud
        }

        // 4. Ledger Hold Reservation (Authorization Hold)
        boolean holdPlaced = ledgerService.reserveFunds(card.getAccountId(), amount, stan);
        if (!holdPlaced) {
            log.info("Insufficient funds on account: {}", card.getAccountId());
            return buildResponse(request, "51", null); // Response 51: Insufficient Funds
        }

        // 5. Generate 6-Character Approval Code & Respond with 0110
        String approvalCode = generateAuthCode();
        log.info("Authorization Approved. STAN={}, AuthCode={}", stan, approvalCode);

        return buildResponse(request, "00", approvalCode); // Response 00: Approved
    }

    private Iso8583Message buildResponse(Iso8583Message request, String responseCode, String authCode) {
        Iso8583Message response = new Iso8583Message();
        response.setMti("0110");
        response.setField(2, request.getField(2));
        response.setField(3, request.getField(3));
        response.setField(4, request.getField(4));
        response.setField(11, request.getField(11));
        response.setField(39, responseCode);
        if (authCode != null) {
            response.setField(38, authCode);
        }
        return response;
    }

    private BigDecimal parseMinorUnits(String minor) {
        if (minor == null || minor.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(minor).divide(BigDecimal.valueOf(100));
    }

    private String generateAuthCode() {
        return String.format("%06d", (int) (Math.random() * 999999));
    }
}
```

---

## 7. Production Failure Modes & Engineering Gotchas

### 1. The Reversal Race Condition (`0400` Before `0100`)
* **Scenario**: A network timeout occurs at the POS terminal. The terminal dispatches a `0400` reversal advice. Due to network routing latency or out-of-order delivery, the `0400` arrives at the bank switch *before* the original `0100` authorization request.
* **Gotcha**: If the switch processes the reversal first and discards it because no authorization exists, the late-arriving `0100` will then be processed, creating an orphan authorization hold on the customer's balance.
* **Resolution**: Maintain a 60-second sliding cache of un-matched reversals. When a late `0100` arrives, check the reversal cache; if a matching STAN/RRN exists, auto-void the authorization immediately.

### 2. Stand-In Processing (STIP)
* **Scenario**: If the issuing bank's core system suffers an outage or fails to reply within the timeout window (typically 2 to 3 seconds), the card scheme switch (VisaNet / BankNet) invokes **STIP**.
* **Engine Truth**: The scheme switch uses pre-configured risk parameters (e.g. max $200, offline risk score, velocity counters) to approve or decline on behalf of the issuer. When the bank reconnects, the scheme delivers a batch of `0220` advice notifications that the issuer must unconditionally honor.

### 3. Duplicate STAN Collisions
* **Scenario**: The STAN is only 6 digits long (`000000` to `999999`), meaning it wraps around after 1,000,000 transactions (frequently within hours at high-volume merchants).
* **Engineering Fix**: Never use STAN alone as a unique idempotency key. Always construct composite deduplication keys:
  $$\text{Key} = \text{TerminalID (DE 41)} + \text{STAN (DE 11)} + \text{Transmission Date (DE 13)} + \text{Acquirer ID}$$

---

## Related Documentation

- [Cards & Card Schemes Architecture Overview](./cards.md)
- [Card Anatomy & EMV Chip Cryptography](./card_anatomy_emv.md)
- [Processing Models, Clearing & Interchange Economics](./card_clearing_settlement.md)
- [Network Tokenization & EMV 3-D Secure](./card_tokenization_3ds.md)
- [Disputes, Chargebacks & Least-Cost Routing](./card_disputes_lcr.md)
