---
id: defi-amm-mev
title: DeFi, AMMs, Flash Loans & MEV
sidebar_label: DeFi, AMMs & MEV
description: DeFi internals for senior engineers - constant-product AMM math, impermanent loss, lending protocols and liquidation, stablecoin designs, flash loans, oracles, MEV, sandwich attacks, PBS and mitigation.
tags:
  - technical-knowledge
  - blockchain
  - defi
  - mev
---

# DeFi, AMMs, Flash Loans & MEV

**DeFi** = financial primitives (exchange, lending, derivatives, stablecoins) implemented as composable smart contracts ("money legos"). Composability is the superpower and the main systemic risk.

## 1. Automated Market Makers (AMM)

An order book needs market makers quoting prices. An **AMM** replaces them with a pool and a pricing invariant.

### Constant Product (Uniswap v2): `x * y = k`

Pool holds `x` of token A and `y` of token B. Selling `dx` of A for B, with fee `f` (0.3%):

```
dx_eff = dx * (1 - f)
dy     = y - k / (x + dx_eff)         // = y * dx_eff / (x + dx_eff)
price impact grows with trade size relative to reserves
```

```java
import java.math.BigInteger;

public final class ConstantProduct {
    /** Uniswap v2 getAmountOut: integer math, fee 0.3% -> 997/1000. */
    public static BigInteger amountOut(BigInteger amountIn, BigInteger reserveIn, BigInteger reserveOut) {
        BigInteger inWithFee = amountIn.multiply(BigInteger.valueOf(997));
        BigInteger numerator = inWithFee.multiply(reserveOut);
        BigInteger denominator = reserveIn.multiply(BigInteger.valueOf(1000)).add(inWithFee);
        return numerator.divide(denominator);
    }
}
// Pool 1000 ETH / 2,000,000 USDC; swap 10 ETH -> about 19,743 USDC (spot value 20,000): ~1.3% (0.3% fee + ~1% price impact)
```

**Always integer math on-chain** (no floats); rounding must favour the pool.

### Impermanent Loss (IL)

If price ratio changes by factor `r`, an LP's position value vs holding is `2*sqrt(r)/(1+r) - 1`. Example: price x2 -> about -5.7%; x4 -> -20%; x10 -> -42%. Fees must outweigh IL for profitability.

### AMM Evolution

| Version | Idea | Trade-off |
|---|---|---|
| v2 | Uniform liquidity over (0, infinity) | Capital inefficient, simple, fungible LP tokens |
| **v3** | Concentrated liquidity in tick ranges; LP = NFT position | Up to ~4000x capital efficiency; active management, more IL risk |
| Curve (stableswap) | Hybrid invariant flat near peg | Great for stable pairs; depeg risk |
| Balancer | Weighted multi-asset pools | Flexible; complex math |
| v4 | Singleton contract + **hooks** (custom logic), flash accounting | Power vs hook-security risk |
| **RFQ / intent-based** (CoW, UniswapX) | Solvers compete off-chain to fill orders | MEV protection, batch auctions |

## 2. Lending Protocols (Aave, Compound, Morpho)

```
Supply collateral -> borrow up to LTV (e.g. 80% for ETH)
Health Factor HF = sum(collateral_i * liquidationThreshold_i) / totalDebt
HF < 1  ->  liquidatable: anyone repays up to 50% of debt and seizes collateral + bonus (5-10%)
Interest rate = f(utilisation U)   (kinked curve: low slope under optimal U ~80%, steep above)
```

Risks: **oracle lag/manipulation**, **bad debt** in fast crashes (Black Thursday 2020, congestion blocks liquidations), liquidation cascades, governance attacks on risk parameters, and wrapped-asset depeg (stETH).

## 3. Stablecoins

| Type | Mechanism | Failure mode |
|---|---|---|
| Fiat-backed (USDC, USDT) | Reserves at custodians | Custodian/regulatory risk, blacklist function |
| Crypto-collateralised (DAI/USDS, LUSD) | Over-collateralised vaults, liquidations | Collateral crash, oracle failure |
| Algorithmic (UST) | Reflexive mint/burn with a volatile sibling | **Death spiral** ($40B collapse, 2022) |
| Synthetic delta-neutral (USDe) | Spot + short perps funding | Funding rate flip, exchange risk |

## 4. Flash Loans

Uncollateralised loan that must be repaid **within the same transaction**, otherwise the whole transaction reverts. Legit uses: arbitrage, collateral swaps, self-liquidation. Attack use: temporarily acquire huge capital to manipulate a spot oracle or governance vote.

```solidity
function executeOperation(address asset, uint256 amount, uint256 premium, address, bytes calldata)
    external returns (bool)
{
    require(msg.sender == address(POOL), "only pool");
    // ... use funds: arbitrage, swap collateral ...
    IERC20(asset).approve(address(POOL), amount + premium);   // pool pulls repayment
    return true;
}
```

Atomicity = no credit risk for the lender; the *victim* protocol's invariants are what break.

## 5. MEV - Maximal Extractable Value

Profit from **ordering, including, or censoring** transactions in a block.

| Strategy | Description | Who loses |
|---|---|---|
| **DEX arbitrage** | Equalise prices across pools | Nobody (price discovery) |
| **Liquidation** | Be first to liquidate positions | Borrower pays bonus |
| **Front-running** | Copy and outbid a profitable pending tx | Original trader |
| **Sandwich** | Buy before victim's swap, sell after | Victim gets worse price up to slippage |
| **JIT liquidity** | Add/remove concentrated liquidity around a big swap | Passive LPs |
| **Time-bandit** | Reorg to capture past MEV | Network stability |

```
Mempool: victim swap 100 ETH -> USDC (slippage tolerance 3%)
Bot:  tx1 buy USDC (pushes price up)  | victim swap executes at worse price | tx2 sell USDC (profit)
Block order controlled by (priority fee / bundle bid to builder)
```

### Supply Chain Post-Merge: Proposer-Builder Separation (PBS)

```
Searchers --bundles--> Builders --blocks+bids--> Relays (MEV-Boost) --> Proposer (validator) picks highest bid
```

~90% of Ethereum blocks come via MEV-Boost; a few builders dominate (centralisation + censorship concerns - OFAC-compliant relays). Roadmap: enshrined PBS, inclusion lists (FOCIL), encrypted mempools.

### User & Protocol Mitigations

- **Tight slippage**, limit orders, **private RPC** (Flashbots Protect, MEV Blocker - refunds backrun profit).
- **Batch auctions** (CoW) give uniform clearing price - no ordering advantage.
- **Commit-reveal** / threshold encryption for sealed bids.
- Design protocols so that **order of transactions within a block does not affect fairness**.

## 6. Systemic Risk Checklist

- Composability depth: how many protocols fail if one oracle/stablecoin breaks?
- Admin keys and upgradeability: who can change parameters or mint?
- Liquidity depth vs TVL: can collateral be sold at stress prices?
- Oracle design: TWAP window vs attack cost; fallback sources.
- Governance: token concentration, flash-loan voting defence, timelocks.

Next: [Production Engineering](../production/blockchain-production-engineering.md).
