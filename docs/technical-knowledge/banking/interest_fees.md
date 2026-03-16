---
id: interest_fees
title: Interest & Fees
sidebar_label: Interest & Fees
sidebar_position: 5
---

# Interest & Fees

## Overview

Interest and fees are the primary ways banks **generate revenue** from accounts and products. Understanding how they work is important for product configuration, posting logic, and customer disputes.

---

## Interest — The Basics

**Interest** is the cost of borrowing money, or the reward for saving it:

| From Customer's View | From Bank's View |
|---------------------|-----------------|
| Saves money → earns interest | Pays interest on deposits (liability) |
| Borrows money → pays interest | Earns interest on loans (asset) |

### Interest Rate Types

| Type | Description | Example |
|------|-------------|---------|
| **Fixed Rate** | Rate locked for a term | 5.00% p.a. for 12 months |
| **Variable Rate** | Can change at bank's discretion (follows RBA cash rate) | RBA rate + 2.50% |
| **Introductory Rate** | Promotional rate for new customers (limited period) | 5.50% for 4 months, then 3.00% |
| **Tiered Rate** | Different rates for different balance bands | 0–$10K: 2%, $10K+: 4% |
| **Bonus Rate** | Extra interest if conditions met (e.g., deposit each month) | Base 2% + Bonus 3% = 5% |

---

## How Interest is Calculated

### Simple Interest (Daily Accrual)

Most bank accounts use **daily accrual** — interest accumulates every day based on the closing balance:

```
Daily Interest = (Annual Rate / 365) × Balance

Example:
  Balance:      $10,000
  Rate:         5.00% p.a.
  Daily rate:   5.00 / 365 = 0.013699%
  Daily amount: $10,000 × 0.013699% = $1.37

Monthly:  ~$41 (varies by days in month)
Yearly:   ~$500
```

### Compound Interest (Interest on Interest)

```
Formula: A = P × (1 + r/n)^(n×t)

Where:
  P = Principal ($10,000)
  r = Annual rate (0.05)
  n = Compounding frequency per year (12 for monthly)
  t = Years (1)

A = $10,000 × (1 + 0.05/12)^12 = $10,511.62
Interest earned = $511.62  (vs $500 simple)
```

Banks use compound interest for loans — it means customers pay more over time.

---

## Interest in Banking Systems

### Accrual vs Capitalisation

```
ACCRUAL:        Interest earned but NOT yet paid
                Recorded as a liability (owed to customer) or receivable (owed by customer)

CAPITALISATION: Accrued interest is added to the principal balance
                (For savings: credited to account)
                (For loans: added to outstanding balance if not paid)
```

### Payment Frequency

| Product | Typical Interest Payment |
|---------|------------------------|
| Savings account | Monthly (end of month) |
| Term deposit | Maturity / monthly / annually |
| Home loan | Monthly (deducted from payment) |
| Credit card | Daily accrual; billed monthly |
| Overdraft | Daily; debited monthly |

---

## Common Bank Fees

### Account Fees

| Fee | Description | Typical Amount |
|-----|-------------|---------------|
| **Monthly account fee** | Charged for maintaining account | $5–$15/month |
| **Excess transaction fee** | Fee per transaction over monthly limit | $0.50–$2 each |
| **Paper statement fee** | Fee for receiving paper statements | $2–$5/month |
| **Account closure fee** | Sometimes charged on term deposits if broken early | $0–$50 |

### Payment Fees

| Fee | Description | Typical Amount |
|-----|-------------|---------------|
| **International transfer fee** | SWIFT outbound payment | $15–$30 per payment |
| **Currency conversion margin** | Spread on FX rate | 1%–3% |
| **BPAY fee** | Usually nil (absorbed by bank) | $0 (retail) |
| **Real-time payment fee** | NPP — usually nil for consumers | $0 |

### Penalty / Event Fees

| Fee | Description |
|-----|-------------|
| **Dishonour fee** | Direct debit or cheque bounced due to insufficient funds — $10–$15 |
| **Overdrawn fee** | Account went negative without approved overdraft — $10–$20 |
| **Late payment fee** | Credit card or loan payment overdue — $20–$30 |
| **Break fee** | Exiting a fixed-rate product early (e.g., fixed home loan) — can be thousands |

---

## Fee Posting in the System

When a fee is charged, a **debit posting** is made to the customer's account:

```
Fee event trigger (e.g., end of month, dishonour event)
        │
        ▼
Fee calculation engine
  (looks up product config, calculates fee)
        │
        ▼
Post debit to customer account:
  DR  Customer Account     $10.00  (Fee: Dishonour fee)
  CR  Fee Income Account   $10.00  (Bank's P&L)
        │
        ▼
camt.054 notification:
  CdtDbtInd: DBIT
  BkTxCd: PMNT/FEES/SRVC
  Amount: $10.00
  Narrative: "Dishonour fee - DD returned insufficient funds"
```

---

## Regulation: Responsible Lending & Fee Caps

Banks are subject to regulatory limits on fees:

| Regulation | Requirement |
|------------|------------|
| **National Consumer Credit Protection Act** | Responsible lending; fee disclosure |
| **Credit Code (NCCP)** | Maximum default fees; comparison rate disclosure |
| **ASIC oversight** | Unconscionable fees; deferred sales model |
| **RBA guidance** | Surcharging rules (merchant passing on card fees) |
| **Fee-free basics (COBA)** | Mutual/community banks offer fee-free basic accounts |

---

## Interest on a Home Loan — How It Works

```
Home Loan: $500,000 at 6.00% p.a., 30 years, monthly payments

Month 1:
  Daily rate:   6.00 / 365 = 0.016438%
  Days in month: 31
  Interest:     $500,000 × 0.016438% × 31 = $2,547.95

  Monthly payment: $2,997.75 (fixed, from amortisation schedule)
  Principal paid:  $2,997.75 − $2,547.95 = $449.80
  New balance:     $500,000 − $449.80 = $499,550.20

Month 2:
  Interest:     $499,550.20 × 0.016438% × 28 = $2,299.49
  (fewer days)

Over 30 years:
  Total paid:   ~$1,079,190 (more than double the loan)
  Total interest: ~$579,190
```

---

## RBA Cash Rate and Its Effect

The **RBA Cash Rate** is the benchmark interest rate set by the Reserve Bank of Australia. It flows through to customer rates:

```
RBA Cash Rate (e.g., 4.35%)
         │
         ▼
Bank Funding Cost (deposits, wholesale)
         │
         ▼
Retail Lending Rates (mortgages, personal loans)
  = Cash rate + Bank's margin

Retail Deposit Rates (savings)
  = Cash rate − Bank's margin

When RBA raises rates:
  ├── Variable mortgage rates increase (bad for borrowers)
  └── Savings rates increase (good for savers)
```

---

## Java Spring Notes — Fee Processing

```java
@Service
public class FeePostingService {

    @Scheduled(cron = "0 0 2 1 * *")  // 2 AM on 1st of each month
    public void processMonthlyAccountFees() {
        List<Account> feeableAccounts = accountRepository
            .findAccountsEligibleForMonthlyFee();
        
        feeableAccounts.forEach(account -> {
            BigDecimal fee = feeCalculator.calculateMonthlyFee(account);
            
            if (fee.compareTo(BigDecimal.ZERO) > 0) {
                ledgerService.postDebit(
                    account.getId(),
                    fee,
                    "Monthly account fee",
                    BankTransactionCode.FEES_MONTHLY
                );
                notificationService.sendFeeAdvice(account, fee);
            }
        });
    }

    @EventListener
    public void onDishonour(DishonourEvent event) {
        BigDecimal dishonourFee = productConfig
            .getDishonourFee(event.getAccountType());
        
        ledgerService.postDebit(
            event.getAccountId(),
            dishonourFee,
            "Dishonour fee - " + event.getPaymentReference(),
            BankTransactionCode.FEES_DISHONOUR
        );
    }
}
```

---

## Related Concepts
- [account_types.md](./account_types.md) — Accounts that accrue interest/fees
- [debit_post.md](./debit_post.md) — How fees are posted as debits
- [camt054.md](./camt054.md) — Fee transactions appear in camt.054
- [camt053.md](./camt053.md) — Fees appear in end-of-day statement
- [core_banking.md](./core_banking.md) — Interest engine lives in CBS
