---
id: card_anatomy_emv
title: "Card Anatomy & EMV Chip Cryptography"
sidebar_label: "Card Anatomy & EMV Cryptography"
sidebar_position: 2
description: Deep principal engineering guide to payment card physical/logical anatomy, ISO/IEC 7812 PAN structure, Luhn Mod 10 checksum, Track 1/2 magstripe, and EMV chip cryptography (ARQC, ARPC, TC, AAC, SDA, DDA, CDA).
tags: [banking, cards, pan, luhn, emv, arqc, arpc, cryptography, nfc, apdu, dda, cda]
---

# 💳 Card Anatomy & EMV Chip Cryptography

Payment cards bridge physical tokens and digital cryptography. A modern payment card combines physical specifications (**ISO/IEC 7810** ID-1 form factor), logical account structures (**ISO/IEC 7812**), magnetic storage (**ISO/IEC 7813**), contact smart card processing (**ISO/IEC 7816**), and wireless near-field communication (**ISO/IEC 14443**).

---

## 1. ISO/IEC 7812 Primary Account Number (PAN) Anatomy

A card's Primary Account Number (PAN) is not an arbitrary sequence of digits. It adheres to **ISO/IEC 7812** and ranges between 12 and 19 digits (standard across Visa, Mastercard, and eftpos is 16 digits; American Express is 15 digits):

```
 4  1  1  1  2  2  3  3  4  4  5  5  6  6  7  1
 │  └────────────┘  └─────────────────────┘  │
 │         │                   │             └─ Check Digit (Luhn Algorithm Mod 10)
 │         │                   └─────────────── Individual Account Identifier (Variable length)
 │         └─────────────────────────────────── Bank Identification Number (BIN) / IIN
 └───────────────────────────────────────────── Major Industry Identifier (MII)
```

### Breakdown of PAN Fields

| Component | Length | Specification & Purpose |
|---|---|---|
| **Major Industry Identifier (MII)** | 1 digit | Identifies the issuing category: `4` = Visa (Banking/Financial), `5` = Mastercard (Banking/Financial), `3` = American Express / JCB (Travel/Entertainment), `6` = Discover / China UnionPay (Merchandising/Banking). |
| **Issuer Identification Number (BIN/IIN)** | 6 or 8 digits | Uniquely identifies the card-issuing financial institution and card product tier (Classic, Platinum, Infinite, World Elite, Commercial Debit). |
| **Individual Account Identifier** | Up to 12 digits | Unique identifier assigned by the issuing bank's card management system (CMS) to the customer's card contract. |
| **Check Digit** | 1 digit | Calculated using the Luhn Algorithm (Modulus 10) to detect human data entry errors and transposition errors before dispatching authorization calls. |

### 8-Digit BIN Migration Mandate

In April 2022, the International Organization for Standardization (ISO) and global card schemes officially expanded the standard Bank Identification Number (BIN) from **6 digits to 8 digits**.
- **Motivation**: Rapid depletion of available 6-digit BIN ranges caused by the explosion of fintech issuers, neo-banks, and virtual prepaid cards.
- **Architectural Impact**: Reduces the length of the variable individual account number (from 9 digits down to 7 digits for a 16-digit PAN).
- **Core Banking Requirement**: Processing engines, routing tables, and fraud systems must support 8-digit BIN lookups while maintaining backward compatibility with legacy 6-digit BIN tables.

---

## 2. The Luhn Algorithm (Mod 10 Checksum)

The Luhn algorithm validates that a PAN was typed accurately before any network call is dispatched:

1. Starting from the rightmost digit (excluding the check digit) and moving leftward, double the value of every second digit.
2. If doubling a digit results in a number greater than 9, sum its individual digits (or subtract 9).
3. Sum all the resulting processed digits along with the original untouched digits.
4. If the final cumulative total modulo 10 equals 0, the card number is mathematically valid:

$$\sum_{i=1}^{n} d'_i \equiv 0 \pmod{10}$$

### Production Java 21 Luhn Implementation

```java
package com.bank.cards.validator;

public final class LuhnValidator {

    private LuhnValidator() {}

    /**
     * Validates a PAN using the Luhn (Mod 10) algorithm in O(n) time and O(1) space.
     *
     * @param pan The raw card number string (digits only)
     * @return true if the check digit satisfies Luhn Mod 10, false otherwise
     */
    public static boolean isValid(String pan) {
        if (pan == null || pan.length() < 13 || pan.length() > 19) {
            return false;
        }

        int sum = 0;
        boolean alternate = false;

        for (int i = pan.length() - 1; i >= 0; i--) {
            char c = pan.charAt(i);
            if (!Character.isDigit(c)) {
                return false;
            }
            int n = c - '0';
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n -= 9;
                }
            }
            sum += n;
            alternate = !alternate;
        }

        return (sum % 10 == 0);
    }
}
```

---

## 3. Storage & Transmission Mediums

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Magnetic Stripe (Legacy - Magstripe)                                     │
│    Track 1: Up to 79 alphanumeric characters (Cardholder Name, PAN, Expiry) │
│    Track 2: Up to 40 BCD numeric digits (PAN, Expiry, Service Code, CVV1)  │
│    ❌ Highly Vulnerable: Static data easily cloned via skimming devices.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Contact Chip (EMV - ISO/IEC 7816)                                        │
│    Contains secure tamper-resistant microcontroller and cryptographic engine│
│    Generates dynamic Application Cryptograms per transaction.               │
│    ✅ Cannot be cloned; requires physical contact with terminal pins.       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Contactless NFC (EMV - ISO/IEC 14443)                                    │
│    Radio Frequency (13.56 MHz) protocol. Employs qVSDC (Visa) or M/Chip.   │
│    Transmits dynamic cryptogram wirelessly for transactions under CVM limit │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Magnetic Stripe Track Formats

* **Track 1 (IATA format)**: 210 bits per inch (bpi), 79 alphanumeric characters:
  ```
  %B4111223344556671^DOE/JOHN^281210100000000000000000000?*
  ```
  `%` = Start Sentinel, `B` = Format Code, `^` = Field Separator, `DOE/JOHN` = Cardholder Name, `2812` = Expiration Date (YYMM), `101` = Service Code, `?` = End Sentinel.
* **Track 2 (ABA format)**: 75 bpi, 40 numeric BCD digits:
  ```
  ;4111223344556671=28121010000000000000?*
  ```
  `;` = Start Sentinel, `=` = Separator, `101` = Service Code, followed by CVV1 and discretionary data.

---

## 4. EMV Chip Architecture & APDU Exchange

When a chip card is inserted or tapped at a point-of-sale (POS) terminal, it executes an Application Protocol Data Unit (**APDU**) handshake governed by **EMVCo Book 1–4**:

```
[POS Terminal]                                                [EMV Chip Card]
      │                                                              │
      ├────────── 1. SELECT Application (e.g. Visa Debit AID) ──────►│
      │◄───────── File Control Information (FCI) + Supported AIDs ───┤
      │                                                              │
      ├────────── 2. GET PROCESSING OPTIONS (GPO) + Terminal Data ──►│
      │◄───────── Application Interchange Profile (AIP) + AFL ───────┤
      │                                                              │
      ├────────── 3. READ RECORD (Extracts Public Key Certificate) ──►│
      │◄───────── Issuer PKI Cert + Card Private Key Parameters ─────┤
      │                                                              │
      │   4. Offline Card Authentication (SDA / DDA / CDA Proof)     │
      │   5. Processing Restrictions & Terminal Risk Management       │
      │   6. Cardholder Verification (PIN / Biometric / None)         │
      │                                                              │
      ├────────── 7. GENERATE APPLICATION CRYPTOGRAM (ARQC) ────────►│
      │◄───────── Returns ARQC (AES/3DES Dynamic Session Hash) ──────┤
```

### Step-by-Step Transaction Phases

1. **Application Selection**:
   * Terminal queries the card's Payment Systems Environment (PSE / 1PAY.SYS.DDF01).
   * Card returns list of supported Application Identifiers (**AIDs**), such as `A0000000031010` (Visa Debit/Credit) or `A0000000041010` (Mastercard).
2. **Initiate Application Processing (GPO)**:
   * Terminal sends Processing Options Data Object List (**PDOL**) containing terminal capabilities, country code, and date.
   * Card replies with Application Interchange Profile (**AIP**) indicating supported authentication methods (DDA, CDA) and Application File Locator (**AFL**).
3. **Read Application Data**:
   * Terminal reads records specified in AFL (Cardholder name, PAN, Expiry, Issuer Public Key Certificate).
4. **Offline Card Authentication**:
   * Proves card is authentic without calling issuer network (see Section 5 below).
5. **Processing Restrictions**:
   * Checks expiration date, effective date, application usage control (domestic only, ATM only).
6. **Cardholder Verification Method (CVM)**:
   * Offline Enciphered PIN, Online PIN, or Consumer Device Cardholder Verification Method (CDCVM).
7. **Action Analysis & Cryptogram Generation**:
   * Terminal requests an online authorization cryptogram (**ARQC**) or offline approval (**TC**).

---

## 5. Offline Card Authentication: SDA vs. DDA vs. CDA

To detect counterfeit cards without placing an expensive or slow online network call, EMV supports three tiers of asymmetric public key cryptography:

```
                      [Payment Scheme Root CA]
                                 │
                   (Signs Issuer Certificate)
                                 ▼
                    [Issuing Bank Public Key]
                                 │
                    (Signs ICC Public Key)
                                 ▼
                     [Card Chip Private Key]
```

### Comparison Matrix

| Mechanism | Full Name | Cryptographic Mechanics | Security Level |
|---|---|---|---|
| **SDA** | Static Data Authentication | Terminal verifies issuer signature over static card data. Card does not perform dynamic cryptographic calculations. | ❌ Deprecated. Vulnerable to card cloning if static data is extracted. |
| **DDA** | Dynamic Data Authentication | Card possesses an internal RSA private key. Generates a dynamic digital signature over a random terminal number (Unpredictable Number). | ✅ Secure against cloning; verifies card authenticity dynamically. |
| **CDA** | Combined DDA / Generate AC | Combines DDA signature with the Application Cryptogram generation step into a single atomic operation. | 🔒 Highest security; prevents "man-in-the-middle" wedge device attacks. |

---

## 6. EMV Application Cryptograms

During online authorization, the chip card computes a dynamic cryptographic message authentication code (MAC):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ARQC DERIVATION FORMULA                                                     │
│                                                                             │
│ Session Key (SK) = 3DES / AES (Master Key MK, ATC)                          │
│ ARQC = MAC (SK, Amount || Currency || Terminal UN || ATC || TVR || CVR)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **ARQC (Authorization Request Cryptogram)**:
   * Generated by the card chip using a unique session key derived from the Master Key (MK), Application Transaction Counter (ATC), and an unpredictable terminal random number (UN).
   * Sent to the issuing bank in ISO 8583 Field 55. Proves to the issuing bank that the card is genuine and the transaction payload was not tampered with.
2. **ARPC (Authorization Response Cryptogram)**:
   * Computed by the issuing bank's Host Security Module (HSM) using the ARQC and the issuer response code (`00` Approved or `05` Declined).
   * Sent back to the card chip in the `0110` authorization response. Proves to the chip that the response genuinely came from the issuer, preventing terminal spoofing.
3. **TC (Transaction Certificate)**:
   * Generated by the card chip upon receiving a valid ARPC approving the transaction.
   * Stored by the terminal and forwarded during clearing as non-repudiation proof of approval.
4. **AAC (Application Authentication Cryptogram)**:
   * Generated by the card chip if the transaction is declined by the issuer or terminated offline.

---

## 7. Cardholder Verification Methods (CVM)

The card chip stores a prioritized **CVM List** that instructs the terminal how to verify the cardholder's identity:

```
CVM Code Rule: If Amount > Floor Limit AND Terminal supports Online PIN ➔ Perform Online PIN
CVM Code Rule: If Terminal does not support Online PIN ➔ Perform Signature
CVM Code Rule: If Transaction is Under Limit ➔ No CVM Required
```

1. **Offline Plaintext PIN**: PIN entered at terminal is sent directly to the chip in plaintext. Restricted to older unattended terminals; deprecated in most modern regions.
2. **Offline Enciphered PIN**: Terminal encrypts the entered PIN using the card's RSA public key before sending it across the physical contacts. The chip decrypts and validates it internally.
3. **Online PIN**: Terminal encrypts the PIN using a Derived Unique Key Per Transaction (**DUKPT**) algorithm into an encrypted PIN Block (ISO 9564-1 Format 0). Sent inside ISO 8583 **DE 52** to the bank's HSM.
4. **Consumer Device Cardholder Verification Method (CDCVM)**: Used in Apple Pay and Google Wallet where the smartphone biometric (Face ID, Touch ID, passcode) verifies the user on-device before the NFC tap.

---

## 8. Production Vulnerabilities & Engineering Defenses

### 1. Application Transaction Counter (ATC) Replay Attacks
* **Vulnerability**: If an attacker intercepts an ARQC and the issuer does not check the ATC sequence, the attacker could attempt to replay the transaction.
* **Defense**: The issuer core banking engine must track the monotonically increasing `ATC` for every card. If an incoming `ATC <= LastRecordedATC`, reject immediately as fraud.

### 2. Magstripe Fallback Exploits
* **Vulnerability**: Fraudsters damage the physical chip so the POS terminal falls back to reading the magnetic stripe (which can be cloned).
* **Defense**: Modern acquiring rules enforce "Strict EMV Liability Shift". If a terminal allows a fallback transaction on an EMV-capable card, the acquirer/merchant assumes 100% fraud liability.

### 3. Contactless NFC Relay Attacks
* **Vulnerability**: Attacker places a transmitter near a victim's wallet in a crowded area and relays the NFC signal to an accomplice terminal at a checkout.
* **Defense**: Terminal timing bounds. EMV Contactless specifications enforce strict round-trip response time thresholds (&lt;100ms) for APDU exchanges, preventing long-distance relay hops.

---

## Related Documentation

- [Cards & Card Schemes Architecture Overview](./cards.md)
- [Card Wire Protocols: ISO 8583 & AS 2805](./card_iso8583.md)
- [Processing Models, Clearing & Interchange Economics](./card_clearing_settlement.md)
- [Network Tokenization & EMV 3-D Secure](./card_tokenization_3ds.md)
- [Disputes, Chargebacks & Least-Cost Routing](./card_disputes_lcr.md)
