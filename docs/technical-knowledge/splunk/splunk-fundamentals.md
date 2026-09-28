---
id: splunk-fundamentals
title: Splunk Architecture & SPL Fundamentals
sidebar_label: Architecture & Basic SPL
description: Splunk core architecture (Search Head, Indexers, Forwarders) and SPL fundamentals — pipeline mechanics, fast filtering, bloom filters, boolean logic, and transforming commands.
tags: [splunk, spl, logging, observability, devops, search-processing-language]
---

import SplunkQueryPipelineDiagram from '@site/src/components/SplunkQueryPipelineDiagram';

# Splunk Architecture & SPL Fundamentals

Splunk is an enterprise-grade distributed platform designed to ingest, index, and analyze unstructured and semi-structured machine data (application logs, metrics, network packets, syslog) in real time.

At the heart of Splunk lies **Search Processing Language (SPL)**: a UNIX-inspired, pipe-delimited (`|`) language that lets engineers filter, extract, evaluate, correlate, and aggregate millions of log events across distributed clusters in sub-second latency.

---

## 1. High-Level Splunk Architecture

To write high-performance SPL queries, you must understand where your query actually runs. Splunk uses a distributed topology split into three primary tiers:

```
[ Sources / Apps / VMs ]
           │
           ▼
[ Universal / Heavy Forwarders ]  ──► (Port 9997 TCP)
           │
           ▼
┌────────────────────────────────────────────────────────┐
│                   INDEXER CLUSTER                      │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │  Indexer 1   │   │  Indexer 2   │   │  Indexer N  │ │
│  │ (Hot/Warm DB)│   │ (Hot/Warm DB)│   │(Hot/Warm DB)│ │
│  └──────▲───────┘   └──────▲───────┘   └──────▲──────┘ │
└─────────┼──────────────────┼──────────────────┼────────┘
          └──────────────────┼──────────────────┘
                      (Internal TCP)
                             │
                  ┌──────────┴──────────┐
                  │     SEARCH HEAD     │
                  │ (User UI & Reduce)  │
                  └──────────▲──────────┘
                             │
                  [ Browser / Dashboards ]
```

### The Three Tiers
1. **Forwarders (Ingest Tier)**:
   - **Universal Forwarder (UF)**: An ultra-lightweight C++ binary installed on host servers. It reads log files off disk and streams raw data over TCP (port 9997) with minimal CPU and memory footprints.
   - **Heavy Forwarder (HF)**: A full Splunk Enterprise instance with indexing disabled. It parses events, routes data dynamically to different indexes or Kafka, and masks PII before ingestion.
2. **Indexers (Storage & Compute Tier)**:
   - Receive raw streams from forwarders, parse timestamps (`_time`), break raw text into segments, and write data into **Buckets** (`Hot`, `Warm`, `Cold`, `Frozen`).
   - Store both compressed raw text (`.journal.zst` or `.journal.gz`) and the **tsidx** (time-series inverted index) accompanied by 1KB **Bloom Filters**.
   - Execute the **Map (Streaming)** phase of searches in parallel.
3. **Search Head (Coordination & Presentation Tier)**:
   - Serves the Splunk Web UI and REST API.
   - Parses the SPL search string, builds an execution plan, broadcasts queries to all Indexers, receives partial result sets, and executes the **Reduce (Transforming)** phase before displaying the final results.

---

## 2. How Splunk Executes an SPL Query: The Distributed Pipeline

SPL queries process events sequentially from left to right using the pipe operator (`|`). Each command receives events produced by the preceding command, mutates or aggregates them, and passes the output to the next command.

<SplunkQueryPipelineDiagram initialTab="pipeline" />

### Command Classification

Splunk commands fall into three performance classifications:

| Command Type | Where It Executes | Behavior | Key Examples |
|---|---|---|---|
| **Distributable Streaming** | **Indexers (Parallel)** | Operates on individual events one at a time on each Indexer independently. Scales linearly with indexer count. | `eval`, `rex`, `bin`, `fields`, `rename`, `where` |
| **Centralized Streaming** | **Search Head** | Operates on individual events, but requires ordering or global coordination across all indexers. | `head`, `tail`, `streamstats` (without grouping) |
| **Transforming** | **Search Head (Reduce)** | Groups events into a statistical table or chart. Changes data shape from event stream to tabular rows. | `stats`, `timechart`, `chart`, `top`, `rare` |

:::tip[The Golden Search Rule]
**Always push distributable streaming commands as far to the left of the query as possible.** 
Doing so ensures that Indexers perform field extraction and filtering in parallel before data is sent across the network to the Search Head.
:::

---

## 3. Basic SPL Syntax & Fast Filtering

The first command in an SPL search (before the first pipe `|`) is the **base search**. How you structure the base search determines whether your query completes in 300ms or times out after 10 minutes.

```spl
index=prod_ecommerce sourcetype=nginx:access status>=500 NOT uri_path="/health*"
```

### Essential Search Filters

1. **`index` and `sourcetype` (Mandatory)**:
   - Always specify the target index (`index=prod_app`) and sourcetype (`sourcetype=log4j`).
   - *Why?* Splunk partitions index data on disk by directory. Specifying the index immediately skips 90%+ of all files on disk.
2. **Time Range (`earliest` and `latest`)**:
   - Limit the time scope explicitly using the UI time picker or inline tokens:
   ```spl
   index=payment_service earliest=-15m latest=now
   index=orders earliest=@d latest=now   # From midnight today
   index=auth earliest=-7d@d latest=@d   # Previous 7 calendar days
   ```
3. **Boolean Operators (`AND`, `OR`, `NOT`)**:
   - **Must be UPPERCASE**. Lowercase `and`, `or`, `not` are treated as literal text terms to search for in logs!
   - `AND` is implicit between whitespace terms:
   ```spl
   # These two queries are identical:
   index=prod host=web-01 error timeout
   index=prod AND host=web-01 AND error AND timeout
   ```
   - Precedence: Parentheses `()` evaluate first, followed by `NOT`, then `OR`, then `AND`.

### Wildcard Mechanics & The Bloom Filter Hazard

Splunk utilizes **Bloom Filters** to determine whether a term *definitely does not exist* in an index bucket without reading the file off disk.

```spl
# ❌ Anti-Pattern: Leading wildcard destroys Bloom Filter index lookup
index=app_logs *exception*

# ✅ High-Performance: Trailing wildcard preserves inverted index search
index=app_logs NullPointer* OR IllegalState*
```

:::warning[Leading Wildcards Cause Full Disk Scans]
A search like `*error*` forces the Indexer to bypass tsidx bloom filters and decompress the entire raw `.journal` file off disk for every single bucket in the time window. Never use leading wildcards in production searches or scheduled alerts!
:::

---

## 4. Projection, Filtering & Result Shaping

Once events are fetched from disk, use base shaping commands to keep intermediate memory clean:

### 1. `fields` (Projection Pruning)
Splunk automatically extracts hundreds of fields at search time. Prune unnecessary fields early so only relevant keys travel over TCP to the Search Head:
```spl
index=prod_gateway 
| fields _time, host, status, duration_ms, request_uri
```
- `fields + a, b` keeps only fields `a` and `b`.
- `fields - raw_body, headers` strips bulky fields while keeping all others.

### 2. `table`
Formats the final output for human viewing or dashboard widgets:
```spl
index=prod_gateway status>=500 
| table _time, host, client_ip, status, error_message
```

### 3. `rename`
Renames technical field names into readable labels:
```spl
index=prod_orders 
| rename order_id as "Order ID", total_amt as "Amount (USD)", cust_email as Customer
```

### 4. `sort`
Sorts events in ascending (`+`) or descending (`-`) order:
```spl
# Top 10 slowest API requests
index=prod_gateway 
| sort 10 - duration_ms
```

### 5. `dedup`
Eliminates duplicate events based on specified fields:
```spl
# Keep only the single most recent log per microservice pod
index=k8s_logs 
| dedup pod_name
```

---

## 5. Statistical Aggregations with `stats`

The `stats` command is the foundational building block for reporting and alerting. It converts unstructured event streams into structured statistical tables.

### Common `stats` Functions

| Function | Syntax Example | Meaning |
|---|---|---|
| `count` | `stats count` | Total number of events matching criteria |
| `distinct_count (dc)` | `stats dc(user_id) as unique_users` | Count of unique values |
| `sum` | `stats sum(bytes) as total_bytes` | Sum of numerical values |
| `avg` | `stats avg(duration) as avg_duration` | Mathematical mean |
| `min` / `max` | `stats min(latency), max(latency)` | Extrema boundaries |
| `percentile` | `stats perc95(duration), perc99(duration)` | Latency SLAs (95th / 99th percentile) |
| `values` | `stats values(error_code) as errors` | Deduplicated list of all values found |
| `list` | `stats list(step_name) as workflow_steps` | Non-deduplicated list of values in order |

### Real-World Production Examples

#### Example 1: Service Error Rate & Latency Summary
```spl
index=microservices sourcetype=envoy:access
| stats 
    count as total_requests,
    count(eval(status>=500)) as server_errors,
    avg(response_time_ms) as avg_latency,
    perc95(response_time_ms) as p95_latency
    by service_name
| eval error_rate_pct = round((server_errors / total_requests) * 100, 2)
| sort - error_rate_pct
```

#### Example 2: Inspecting Affected Endpoints & Unique Users
```spl
index=auth_service action="login_failed"
| stats 
    count as failure_count,
    dc(user_email) as distinct_targeted_accounts,
    values(failure_reason) as reasons_seen
    by client_ip
| where failure_count > 20 AND distinct_targeted_accounts > 5
| sort - failure_count
```

---

## 6. Summary: Key SPL Rules Checklist

- [x] **Filter Early**: Put `index`, `sourcetype`, and time range in the first line.
- [x] **Uppercase Keywords**: Write `AND`, `OR`, `NOT`, and `BY` in capital letters.
- [x] **Avoid Leading Wildcards**: Use `error*` or exact tokens rather than `*error*`.
- [x] **Strip Fields**: Use `fields +` before running heavy transformations to reduce memory footprint.
- [x] **Group by Meaningful Cardinality**: When using `stats ... by x, y`, verify that `x` and `y` do not have millions of unique values (high cardinality creates Search Head memory exhaustion).
