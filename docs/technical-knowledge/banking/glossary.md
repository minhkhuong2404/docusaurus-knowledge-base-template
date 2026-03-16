---
id: glossary
title: Banking & Payments Glossary
sidebar_label: Glossary
sidebar_position: 99
---

# Banking & Payments Glossary

A comprehensive A–Z reference of terms used in banking and payments. Essential reading for anyone joining the industry.

---

## A

**ACH (Automated Clearing House)**
A batch electronic payment network used in the US. The Australian equivalent is BECS (Bulk Electronic Clearing System).

**ADI (Authorised Deposit-taking Institution)**
An organisation licensed by APRA to accept deposits from the public. Includes banks, credit unions, and building societies.

**ALM (Asset/Liability Management)**
The practice of managing a bank's balance sheet to optimise the return while managing risk (interest rate, liquidity, FX).

**AML (Anti-Money Laundering)**
Policies, procedures, and controls to detect and prevent financial crime. See [AML & KYC](./aml_kyc.md).

**APRA (Australian Prudential Regulation Authority)**
The regulator responsible for licensing and supervising banks, insurers, and superannuation funds.

**ASIC (Australian Securities and Investments Commission)**
The conduct and market integrity regulator for financial services in Australia.

**AUSTRAC (Australian Transaction Reports and Analysis Centre)**
Australia's financial intelligence unit and AML/CTF regulator. Receives TTR, IFTI, and SMR reports.

**Authorisation**
In card payments: the real-time approval from the issuing bank that funds are available and the card is valid. A hold is placed; settlement follows later.

---

## B

**BECS (Bulk Electronic Clearing System)**
Australia's batch payment clearing system. Used for Direct Entry (payroll, direct debits). Operated by AusPayNet.

**Beneficiary**
The recipient of a payment. Also called the creditor or payee.

**BIC (Bank Identifier Code)**
A standardised code (also called SWIFT code) that uniquely identifies a financial institution. Format: 8 or 11 characters (e.g., ANZBAU3M).

**BPAY**
Australia's bill payment service using Biller Codes and Customer Reference Numbers (CRN). See [BPAY](./bpay.md).

**BSB (Bank-State-Branch)**
A 6-digit code in Australia identifying a bank and branch (e.g., 062-000 = ANZ, Sydney). Used in BECS and NPP.

**BankID / Bank Transaction Code**
A code attached to a ledger entry identifying the nature of the transaction (e.g., PMNT/RCDT/VCOM = received credit transfer).

---

## C

**camt (Cash Management)**
The ISO 20022 message family for bank-to-customer communications. Examples: camt.053 (statement), camt.054 (notification).

**CDR (Consumer Data Right)**
Australia's open data framework giving consumers the right to share their data with accredited third parties. See [Open Banking & CDR](./open_banking.md).

**CBS (Core Banking System)**
The central banking platform managing accounts, balances, and transactions. See [Core Banking System](./core_banking.md).

**Chargeback**
A card payment dispute initiated by the cardholder through their issuing bank, potentially reversing a transaction.

**ChrgBr (Charge Bearer)**
ISO 20022 field specifying who pays transaction fees: DEBT (sender), CRED (receiver), SHAR (shared), SLEV (service level).

**Clearing**
The process of exchanging and reconciling payment information between banks before settlement. See [Clearing & Settlement](./clearing.md).

**CoP (Confirmation of Payee)**
A service that verifies the payee's name matches the account before a payment is sent. Reduces misdirected payments and APP fraud.

**Correspondent Bank**
A bank that provides services (holding accounts, facilitating payments) to another bank, particularly for cross-border payments.

**CRN (Customer Reference Number)**
In BPAY: a unique number identifying the customer/invoice at the biller. Contains a check digit.

**CTF (Counter-Terrorism Financing)**
The complement to AML — preventing the financial system from being used to fund terrorism.

**Cut-Off Time**
The deadline by which a payment instruction must be received to be processed in the current business day's clearing cycle.

---

## D

**DE (Direct Entry)**
The colloquial term for BECS transactions — both credit (payroll) and debit (direct debit) entries.

**Debtor**
The party whose account is debited — the payer. See [Debtor & Creditor](./debtor.md).

**DNS (Deferred Net Settlement)**
A settlement method where obligations are netted and settled at the end of a cycle, rather than in real time. Used by BECS.

**Dormant Account**
An account with no customer-initiated transactions for a defined period (typically 7 years in Australia). Unclaimed money may be transferred to ASIC.

---

## E

**EDD (Enhanced Due Diligence)**
More intensive customer verification for high-risk customers (PEPs, high-risk jurisdictions). See [AML & KYC](./aml_kyc.md).

**EMV**
Europay, Mastercard, Visa — the global standard for chip-based payment cards. More secure than magnetic stripe.

**EndToEndId**
An ISO 20022 payment ID set by the originating customer that is preserved and carried unchanged through the entire payment chain.

**ESA (Exchange Settlement Account)**
A bank's settlement account held at the Reserve Bank of Australia. All interbank settlement flows through ESA credits/debits.

**eftpos**
Australia's domestic debit card network. Lower interchange than Visa/Mastercard. Supports cashout at POS.

---

## F

**FATF (Financial Action Task Force)**
The international body that sets AML/CTF standards. Countries not on FATF's compliant list face enhanced scrutiny.

**FCS (Financial Claims Scheme)**
The Australian Government guarantee of deposits up to AUD $250,000 per person per ADI.

**FI (Financial Institution)**
Any organisation involved in managing and processing financial transactions — banks, credit unions, payment institutions.

**FX (Foreign Exchange)**
The conversion of one currency to another. See [FX in Payments](./fx.md).

**Finality**
The point at which a payment is irrevocable and legally final. RTGS provides intraday finality; DNS provides end-of-day finality.

**FSS (Fast Settlement Service)**
The RBA's real-time settlement infrastructure used by the NPP to settle each payment gross.

---

## G

**gpi (Global Payments Innovation)**
SWIFT's payment tracking service. Provides real-time end-to-end visibility via UETR. See [SWIFT](./swift.md).

---

## H

**Hold**
A reservation of funds in a customer's account pending final debit. Reduces available balance without yet posting a final entry.

**HVCS (High Value Clearing System)**
Australia's RTGS-adjacent system for large domestic payments. Uses ISO 20022 pacs.008.

---

## I

**IBAN (International Bank Account Number)**
A standardised account number used internationally (up to 34 characters). Mandatory in SEPA; used in SWIFT.

**IFTI (International Funds Transfer Instruction)**
An AUSTRAC-mandated report for every international payment — regardless of amount.

**Interchange Fee**
The fee paid by the acquiring bank to the issuing bank for processing a card transaction. Funded by the merchant discount rate.

**ISO 20022**
The international standard for financial messaging. Defines XML-based messages for payments, securities, and cash management.

---

## K

**KYC (Know Your Customer)**
The process of verifying a customer's identity before opening an account or providing services. See [AML & KYC](./aml_kyc.md).

---

## L

**LCR (Liquidity Coverage Ratio)**
An APRA regulatory metric requiring banks to hold sufficient High-Quality Liquid Assets (HQLA) to cover 30 days of net cash outflows.

**LEI (Legal Entity Identifier)**
A 20-character globally unique code identifying a legal entity. Mandatory in derivatives reporting; increasingly used in ISO 20022.

---

## M

**MDR (Merchant Discount Rate)**
The total fee percentage a merchant pays on card transactions = interchange + scheme fee + acquirer margin.

**MLRO (Money Laundering Reporting Officer)**
A statutory role at every reporting entity. Responsible for receiving internal reports of suspicious activity and filing SMRs with AUSTRAC.

**MsgId**
ISO 20022 field — a unique identifier for a message. Different from transaction IDs and end-to-end IDs.

---

## N

**Nostro Account**
"Our" account held at a correspondent bank (Latin: "ours"). E.g., ANZ's USD account at JPMorgan is ANZ's nostro.

**NPP (New Payments Platform)**
Australia's real-time payment infrastructure. 24/7, ISO 20022, PayID-enabled. See [NPP](./npp.md).

**NSFR (Net Stable Funding Ratio)**
An APRA regulatory metric requiring banks to fund assets with sufficiently stable funding.

---

## O

**OFAC (Office of Foreign Assets Control)**
US Treasury department that administers sanctions. OFAC SDN (Specially Designated Nationals) list is the most powerful sanctions list globally.

**Originator**
The person or entity that initiates a payment. Also called the debtor, payer, or sender.

**Osko**
The brand name for consumer and business payments on the NPP, operated by BPAY Group.

---

## P

**pacs (Payment Clearing and Settlement)**
The ISO 20022 message family for interbank payment messages. Examples: pacs.008 (credit transfer), pacs.004 (return).

**pain (Payment Initiation)**
The ISO 20022 message family for customer-to-bank payment instructions. Examples: pain.001 (initiation), pain.002 (status).

**PayID**
A proxy identifier (phone number, email, ABN) linked to a BSB+account number via the NPP directory.

**PayTo**
An NPP overlay service that replaces BECS Direct Debit with real-time, consent-based pull payments.

**PCI-DSS**
Payment Card Industry Data Security Standard. Required for any entity handling card data.

**PEP (Politically Exposed Person)**
A person holding a prominent public function. Requires Enhanced Due Diligence. See [AML & KYC](./aml_kyc.md).

**Principal**
The original loan amount, excluding interest.

---

## R

**RBA (Reserve Bank of Australia)**
Australia's central bank. Issues currency, manages monetary policy, operates the RTGS/ESA settlement system.

**Remittance Information**
Details about the purpose or reference of a payment (invoice numbers, etc.) carried in ISO 20022 `RmtInf`.

**RTGS (Real-Time Gross Settlement)**
A settlement method where each payment settles immediately and individually. See [Clearing & Settlement](./clearing.md).

**RTO (Recovery Time Objective)**
How quickly a system must be restored after an outage. For payments: typically < 4 hours; for critical systems < 30 minutes.

---

## S

**SAR/SMR (Suspicious Activity/Matter Report)**
A report filed with AUSTRAC (AU) or FinCEN (US) when a bank suspects financial crime. Cannot be disclosed to the subject.

**Settlement**
The final, irrevocable transfer of funds between banks' settlement accounts. See [Clearing & Settlement](./clearing.md).

**STP (Straight-Through Processing)**
A payment that is processed entirely by automated systems without any manual intervention.

**Suspense Account**
An internal holding account for transactions that cannot be immediately matched or applied.

**SWIFT**
Society for Worldwide Interbank Financial Telecommunication. The global secure messaging network for financial institutions.

---

## T

**TPS (Transactions Per Second)**
A measure of payment system throughput capacity.

**TTR (Threshold Transaction Report)**
An AUSTRAC-mandated report for cash transactions of AUD $10,000 or more.

**TxId (Transaction ID)**
ISO 20022 field — unique ID assigned to a payment transaction by the debtor bank.

---

## U

**UETR (Unique End-to-end Transaction Reference)**
A UUID assigned to a payment by the debtor bank, used by SWIFT gpi to track a payment across the entire chain.

---

## V

**Value Date**
The date from which interest is calculated on a credited or debited amount. May differ from booking date for some payment types.

**Vostro Account**
"Your" account held at our bank on your behalf (Latin: "yours"). The mirror perspective of a nostro account.

---

## W

**Write-Off**
An accounting action where an unrecoverable amount is removed from the balance sheet and recognised as a loss.

---

## X

**XSD (XML Schema Definition)**
The schema that defines the structure and validation rules for ISO 20022 XML messages. All ISO 20022 messages are validated against their XSD.

---

## Z

**Zero-Hour Rule**
A legal concept in some jurisdictions: if a bank collapses, transactions from that day may be unwound to the "zero hour" (midnight). RTGS finality protections are designed to override this.

---

## Related Concepts
- [payment_lifecycle_101.md](./payment_lifecycle_101.md) — See these terms in context
- [overview.md](./overview.md) — Summary glossary on the overview page
