---
id: splunk-eval-and-time-bucketing
title: Splunk eval & Time Bucketing (timespan, bin, timechart)
sidebar_label: eval & Time Bucketing
description: Deep dive into Splunk eval command functions (case, if, coalesce, strftime/strptime) and time bucketing mechanics (bin, bucket, span, timechart, timewrap).
tags: [splunk, spl, eval, timespan, bin, timechart, time-series, observability]
---

import SplunkQueryPipelineDiagram from '@site/src/components/SplunkQueryPipelineDiagram';

# Splunk eval & Time Bucketing

In real-world incident response and observability, logs rarely arrive pre-formatted for executive reporting. Raw logs contain timestamps formatted as epoch numbers, HTTP status codes as raw integers, and latency values in microseconds.

The **`eval`** command and **time bucketing (`bin` / `bucket` / `timechart`)** are the two foundational tools that bridge raw log ingestion with actionable time-series dashboards.

---

## 1. Interactive Time Bucketing & eval Visualizer

Explore how raw event streams are quantized into discrete time spans and how conditional `eval` expressions classify events on the fly:

<SplunkQueryPipelineDiagram initialTab="timebucketing" />

---

## 2. The `eval` Command: Concept & Core Syntax

The `eval` command calculates an expression and assigns the result to a new or existing field. It is a **distributable streaming command**, meaning it runs concurrently on every Indexer where matching events reside.

```spl
| eval <field_name> = <expression>
```

You can chain multiple expressions in a single `eval` command separated by commas:

```spl
| eval 
    response_sec = round(response_time_ms / 1000, 3),
    is_error = if(status >= 500, 1, 0),
    service_tier = case(cost > 1000, "Platinum", cost > 500, "Gold", 1=1, "Standard")
```

---

## 3. `eval` Operators & Mathematical Functions

Splunk supports standard arithmetic operators (`+`, `-`, `*`, `/`, `%`) alongside mathematical formatting functions:

| Function | Syntax | Real-World Use Case |
|---|---|---|
| `round(X, N)` | `round(avg_latency, 2)` | Round floating point decimals to $N$ decimal places. |
| `ceil(X)` / `floor(X)` | `ceil(memory_mb / 1024)` | Quantize numerical resources up or down to whole integers. |
| `abs(X)` | `abs(drift_seconds)` | Measure absolute deviation or clock drift. |
| `max(X, Y, ...)` | `max(db_time, api_time)` | Find peak latency across downstream components. |
| `min(X, Y, ...)` | `min(cpu_core1, cpu_core2)` | Find minimum available headroom. |
| `exact(X)` | `exact(bytes / 1073741824)` | Force high-precision 64-bit floating point arithmetic. |

### Concrete Example: SLA Violation & Error Ratio
```spl
index=payment_gw sourcetype=access_log
| eval 
    duration_sec = round(duration_us / 1000000, 4),
    bytes_mb = round(response_bytes / (1024 * 1024), 2)
| where duration_sec > 2.0
| table _time, transaction_id, duration_sec, bytes_mb, status
```

---

## 4. Conditional Logic: `if()`, `case()`, and `coalesce()`

### 1. The `if(condition, then, else)` Function
A simple ternary operator:
```spl
| eval status_type = if(status >= 500, "SERVER_ERROR", "OK")
```

### 2. The `case(c1, v1, c2, v2, ..., 1=1, default)` Function
Evaluates conditions sequentially from top to bottom and returns the value of the first condition that evaluates to `true`.

:::important[The `1=1` Catch-All Clause]
Always terminate a `case()` expression with `1=1, "DEFAULT_VALUE"`. If none of the conditions match and no fallback is specified, Splunk assigns `null` to the field.
:::

```spl
| eval http_category = case(
    status >= 200 AND status < 300, "2xx Success",
    status >= 300 AND status < 400, "3xx Redirect",
    status == 401 OR status == 403, "4xx Auth Failure",
    status == 404, "404 Not Found",
    status >= 400 AND status < 500, "4xx Client Error",
    status >= 500, "5xx Server Critical",
    1=1, "Other / Unknown"
)
```

### 3. The `coalesce(field1, field2, ..., fallback)` Function
Returns the **first non-null value** in the argument list. This is indispensable when querying heterogeneous microservice logs where the client IP or user ID might appear under different keys:

```spl
| eval client_ip = coalesce(
    http_x_forwarded_for, 
    true_client_ip, 
    x_real_ip, 
    remote_addr, 
    "0.0.0.0"
)
```

### 4. Null & Pattern Checking: `isnull()`, `isnotnull()`, `match()`, `like()`
```spl
# Check if a token exists
| eval has_token = if(isnotnull(bearer_token), "AUTHENTICATED", "ANONYMOUS")

# Regex pattern matching inside eval
| eval is_admin = if(match(user_agent, "(?i)bot|crawler|spider"), "BOT", "HUMAN")

# SQL-style wildcard like()
| eval is_checkout = if(like(uri_path, "/api/v1/checkout%"), 1, 0)
```

---

## 5. String Operations & Multi-Value Functions

| Function | Syntax | Output Description |
|---|---|---|
| String Concatenation | `field1 . " " . field2` | Joins strings (dot `.` is preferred over `+`). |
| `lower(X)` / `upper(X)` | `lower(method)` | Normalizes casing (`"POST"` ➔ `"post"`). |
| `substr(X, start, len)` | `substr(trace_id, 1, 8)` | Extracts substring (1-indexed). |
| `len(X)` | `len(payload)` | Character count of a string. |
| `replace(X, regex, sub)`| `replace(email, "(?<=.).(?=.*@)", "*")` | Masking sensitive characters with asterisks. |
| `split(X, delim)` | `split(tags, ",")` | Converts delimited string into a multi-value array. |
| `mvindex(mv, idx)` | `mvindex(split(path, "/"), 2)` | Extracts specific element from multi-value array. |
| `mvcount(mv)` | `mvcount(split(roles, ";"))` | Counts elements inside a multi-value array. |

---

## 6. Date & Time Functions (`_time`, `strftime`, `strptime`)

In Splunk, every event has an internal `_time` attribute stored as a **UNIX Epoch timestamp** (number of seconds elapsed since January 1, 1970 00:00:00 UTC).

```
Epoch Timestamp: 1726500000 
           ↕ (strftime / strptime)
Human Format:    "2024-09-16 15:20:00"
```

### 1. `strftime(time, format)`: Epoch ➔ Human-Readable String
Converts an epoch integer into a readable string:

```spl
| eval readable_time = strftime(_time, "%Y-%m-%d %H:%M:%S %Z")
| eval hour_of_day   = strftime(_time, "%H")
| eval day_of_week   = strftime(_time, "%A")
```

### 2. `strptime(string, format)`: Human String ➔ Epoch
Parses an unindexed string date into a UNIX epoch number so you can perform mathematical date comparisons:

```spl
# Extract custom application timestamp string into epoch
| eval log_epoch = strptime(raw_time_str, "%d/%b/%Y:%H:%M:%S")
| eval duration_sec = now() - log_epoch
| where duration_sec < 3600   # Logs generated within the last hour
```

### Common Format Specifiers
- `%Y`: 4-digit year (e.g. `2026`)
- `%m`: Month number `01`-`12`
- `%d`: Day of month `01`-`31`
- `%H`: Hour in 24-hour format `00`-`23`
- `%M`: Minute `00`-`59`
- `%S`: Second `00`-`59`
- `%s`: Total seconds since UNIX epoch

---

## 7. Time Bucketing Mechanics: `bin` / `bucket`

Logs arrive at random, millisecond-level intervals. To plot trend charts, events must be aligned into regular temporal bins (e.g. 1-minute, 5-minute, or 1-hour slots).

The command `bin` (synonymous with `bucket`) quantizes continuous timestamps:

```spl
| bin _time span=5m
```

### How `bin` Works Under the Hood
`bin _time span=5m` performs discrete integer math:

$$\text{bucket\_time} = \left\lfloor \frac{\text{\_time}}{300} \right\rfloor \times 300$$

Every event occurring between `10:00:00` and `10:04:59` is normalized to `10:00:00`.

### Valid `span` Definitions
- Seconds: `span=10s`, `span=30s`
- Minutes: `span=1m`, `span=5m`, `span=15m`
- Hours: `span=1h`, `span=4h`
- Days / Weeks: `span=1d`, `span=1w`, `span=1mon`

### Pairing `bin` with `stats`
```spl
index=prod_k8s sourcetype=ingress_nginx
| bin _time span=15m
| stats 
    count as total_reqs,
    count(eval(status >= 500)) as errors,
    perc95(request_time) as p95_latency
    by _time, service_name
| eval error_rate = round((errors / total_reqs) * 100, 2)
```

---

## 8. The `timechart` Command

`timechart` is a specialized transforming command that combines `bin _time` with `stats` in a single operation, producing an output structure specifically optimized for line charts, area charts, and time-series heatmaps.

```spl
| timechart span=5m count by status
```

### Differences: `timechart` vs `bin + stats`

| Feature | `timechart` | `bin _time + stats` |
|---|---|---|
| **Primary Use Case** | Single-metric visualization over time (line / area charts) | Multi-metric reporting tables & exports |
| **Field Split Limit** | Supports only **one** `by` split-by field (e.g. `by service`) | Supports arbitrary multiple `by` fields (e.g. `by service, region, host`) |
| **Default Column Cap** | Automatically truncates to top 10 series (groups rest in `OTHER`) | No column limit; retains all group permutations |
| **Continuous Timeline** | Automatically fills missing time intervals with null/0 | Gaps in time are skipped unless explicitly filled |

### Critical `timechart` Tuning Flags

```spl
index=prod_api sourcetype=kong_gateway
| timechart span=10m 
    limit=0 
    useother=f 
    cont=t 
    perc95(latency) by api_endpoint
```

- `limit=0`: Disables the default top-10 series truncation, displaying all endpoints.
- `useother=f`: Prevents Splunk from creating an aggregated `"OTHER"` column.
- `cont=t`: Ensures a continuous timeline; missing time buckets are filled rather than omitted.

---

## 9. Period-over-Period Comparisons (`timewrap`)

To diagnose whether an error spike is an anomaly or typical Monday morning peak traffic, compare today's metrics with the previous week using `timewrap`:

```spl
index=payment_service status>=500
| timechart span=1h count
| timewrap 1w
```

This splits the single `count` time-series into overlapping weekly series:
- `count_latest_week`
- `count_1week_before`
- `count_2weeks_before`

```spl
| eval wow_pct_change = round(((count_latest_week - count_1week_before) / count_1week_before) * 100, 2)
```

---

## 10. Senior Cheat Sheet: eval & timespan Recipes

```spl
# 1. Human readable time formatting
| eval formatted_date = strftime(_time, "%Y-%m-%d %H:%M")

# 2. Dynamic multi-tier latency classification
| eval latency_tier = case(
    duration_ms < 100, "FAST (<100ms)",
    duration_ms >= 100 AND duration_ms < 500, "NORMAL (100-500ms)",
    duration_ms >= 500 AND duration_ms < 2000, "SLOW (500ms-2s)",
    1=1, "CRITICAL SLA BREACH (>2s)"
)

# 3. Microservice error budget burn calculation
| bin _time span=1h
| stats count as total, count(eval(status>=500)) as failed by _time
| eval 
    avail_pct = round((1 - (failed / total)) * 100, 3),
    sla_target = 99.900,
    budget_burned = if(avail_pct < sla_target, "ALERT", "HEALTHY")

# 4. Extract domain from email address
| eval email_domain = mvindex(split(user_email, "@"), 1)
```
