---
id: rebalance-storms
title: Preventing Kafka Connect Rebalance Storms
sidebar_label: Rebalance Storms
description: Deep-dive into Kafka Connect rebalance storm internals — why they happen, the two rebalance protocols, incremental cooperative mechanics, task assignment algorithms, Spring Boot monitoring, and a production-grade rolling restart runbook.
tags: [kafka, kafka-connect, operations, runbook, troubleshooting, rebalance, distributed-systems]
---

# Preventing Kafka Connect Rebalance Storms

A **rebalance storm** is a self-reinforcing cycle of cluster-wide task reassignments triggered by workers joining or leaving a Kafka Connect cluster. What should be a routine rolling restart becomes a cascade of stop-the-world pauses that can halt data pipelines for minutes at a time.

This guide explains **why** rebalance storms happen at the protocol level, **how** each configuration parameter actually works, and the precise steps to eliminate downtime during rolling restarts.

---

## Why Rebalance Storms Happen: The Root Cause

### Kafka Connect's Distributed Architecture

A Kafka Connect cluster is a group of **worker processes** that collectively own a set of **connector tasks**. Workers coordinate using Kafka's group membership protocol — the same mechanism used by standard consumer groups.

The cluster leader (always the first member in the group) is responsible for computing the **task assignment** — deciding which worker runs which connector task. This assignment is recalculated every time the group membership changes.

### The Three Internal Kafka Topics

Kafka Connect uses three compacted topics as its distributed state store:

| Topic | Purpose | Contents |
|:---|:---|:---|
| `__connect-configs` | Connector and task configurations | Connector JSON configs, task counts |
| `__connect-offsets` | Source connector progress | Last read offset per source partition |
| `__connect-status` | Task and connector status | RUNNING / FAILED / PAUSED states |

When a worker restarts, it **replays all three topics** from the beginning to reconstruct cluster state before it can rejoin. This replay time is a major contributor to restart duration and directly impacts how long `scheduled.rebalance.max.delay.ms` needs to be set.

### The Rebalance Trigger Chain

**The "storm" pattern** occurs when:
1. Workers restart faster than `scheduled.rebalance.max.delay.ms` → rebalance triggered before the node rejoins
2. Multiple workers restart in quick succession → each triggers its own rebalance
3. Connectors fail during the rebalance chaos → connector restart triggers a third rebalance

---

## Protocol Deep Dive: Eager vs. Incremental Cooperative

### Eager Rebalancing (Stop-the-World)

In the **Eager** protocol, every rebalance is a full reset:

*The topic replay time (step 5) grows with the size of `__connect-configs` and `__connect-status`. Clusters with hundreds of connectors may take several minutes just to replay these topics on startup.

**Measure your actual replay time:**

---

## Rolling Restart Runbook

### Pre-Flight Checklist

Before touching any worker:

```bash
# 1. Verify cluster is healthy — all tasks RUNNING
curl -s http://worker-1:8083/connectors?expand=status | \
  jq '[.[] | .status.tasks[] | select(.state != "RUNNING")] | length'
# Expected output: 0

# 2. Verify all workers are present in the group
curl -s http://worker-1:8083/ | jq .
# Check: "kafka_cluster_id" matches across all workers

# 3. Confirm scheduled.rebalance.max.delay.ms is set (check running config)
curl -s http://worker-1:8083/config | jq '."scheduled.rebalance.max.delay.ms"'
# Expected: "300000" (or your configured value)

# 4. Measure baseline connector lag (source connectors)
# Use kafka-consumer-groups.sh to check source topic consumer group lag
kafka-consumer-groups.sh --bootstrap-server kafka:9092 \
  --describe --group connect-cluster-prod 2>/dev/null | \
  grep -v "^$" | head -20

# 5. Note which connectors are on which worker (to verify after restart)
curl -s http://worker-1:8083/connectors?expand=status | \
  jq 'to_entries[] | {connector: .key, workers: [.value.status.tasks[].worker_id]} | unique'
```

### Execution: One Worker at a Time

```bash
TARGET_WORKER="worker-3"
CONNECT_URL="http://${TARGET_WORKER}:8083"
DELAY_MS=300000   # Must match scheduled.rebalance.max.delay.ms

echo "=== Step 1: Record current task assignments ==="
curl -s http://worker-1:8083/connectors?expand=status | \
  jq 'to_entries[] | {(.key): [.value.status.tasks[] | {id:.id, worker:.worker_id, state:.state}]}'

echo "=== Step 2: Stop Connect service on ${TARGET_WORKER} ==="
ssh ${TARGET_WORKER} "sudo systemctl stop confluent-kafka-connect"

echo "=== Step 3: Verify worker is detected as leaving (check logs on another worker) ==="
# Within session.timeout.ms (~45s), other workers will log:
# "Rebalance started" or "Member <worker> left group"
ssh worker-1 "grep 'Rebalance\|left group\|joined group' /var/log/kafka/connect.log | tail -5"

echo "=== Step 4: Apply patches ==="
ssh ${TARGET_WORKER} "sudo apt-get update && sudo apt-get upgrade -y"
# Or: sudo yum update -y, OS-specific patching commands

echo "=== Step 5: Reboot if required ==="
ssh ${TARGET_WORKER} "sudo reboot" || true
sleep 60   # Wait for reboot

echo "=== Step 6: Start Connect service ==="
ssh ${TARGET_WORKER} "sudo systemctl start confluent-kafka-connect"

echo "=== Step 7: Wait for worker to complete topic replay and rejoin group ==="
# Poll until the worker's REST API is responsive
DEADLINE=$((SECONDS + ${DELAY_MS}/1000 - 60))   # Must rejoin before delay expires
until curl -sf ${CONNECT_URL}/ > /dev/null 2>&1; do
    if [ $SECONDS -gt $DEADLINE ]; then
        echo "ERROR: Worker did not rejoin within the rebalance delay window!"
        echo "Manual intervention required. The cluster will rebalance now."
        exit 1
    fi
    echo "Waiting for ${TARGET_WORKER} REST API... (${SECONDS}s elapsed)"
    sleep 10
done
echo "${TARGET_WORKER} REST API is responding — worker has rejoined the group"

echo "=== Step 8: Wait for all tasks to reach RUNNING state ==="
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    FAILED=$(curl -s http://worker-1:8083/connectors?expand=status | \
        jq '[.[] | .status.tasks[] | select(.state != "RUNNING")] | length')
    if [ "$FAILED" == "0" ]; then
        echo "All tasks RUNNING — cluster is stable"
        break
    fi
    echo "Waiting: ${FAILED} tasks not yet RUNNING (${ELAPSED}s elapsed)"
    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

echo "=== Step 9: Verify no rebalance occurred (check logs) ==="
ssh worker-1 "grep 'Rebalance\|Assignment' /var/log/kafka/connect.log | tail -10"

echo "=== Step 10: Proceed to next worker ==="
```

### Verification After All Workers Patched

```bash
echo "=== Final verification ==="

# All tasks running
FAILED=$(curl -s http://worker-1:8083/connectors?expand=status | \
    jq '[.[] | .status.tasks[] | select(.state != "RUNNING")] | length')
echo "Failed/non-running tasks: ${FAILED}"

# Connector count matches expected
CONNECTOR_COUNT=$(curl -s http://worker-1:8083/connectors | jq 'length')
echo "Active connectors: ${CONNECTOR_COUNT}"

# Source connector lag (should be near baseline from pre-flight)
kafka-consumer-groups.sh --bootstrap-server kafka:9092 \
  --describe --group connect-cluster-prod 2>/dev/null | head -20

# Rebalance count from JMX (incremental cooperative should be low)
# Use your monitoring tooling to check: kafka.connect:type=connect-worker-rebalance-metrics
```

---

## Troubleshooting Guide

### Symptom: Tasks still stop globally during restart

**Root cause:** `connect.protocol=compatible` is not active on all workers.

**Diagnosis:**
```bash
# Check the effective protocol by inspecting Connect worker startup logs
grep "connect.protocol\|Protocol\|rebalance" /var/log/kafka/connect.log | grep -i "protocol" | head -5

# Expected (incremental cooperative):
# "Using 'compatible' protocol for Kafka Connect group"
# "Performing incremental cooperative rebalance"

# Problem indicator (eager):
# "Performing eager rebalance"
# "Revoking all task assignments"
```

**Fix:** Ensure all workers have `connect.protocol=compatible` in their config files. The setting only takes effect after all workers have been restarted — if even one worker is still on the eager protocol, the whole cluster drops to eager.

---

### Symptom: Rebalance triggers before the patched worker comes back

**Root cause:** `scheduled.rebalance.max.delay.ms` is smaller than the actual restart time.

**Diagnosis:**
```bash
# Measure actual restart time from shutdown signal to "Joined group" log
# On the restarting worker:
grep "systemd.*confluent-kafka-connect\|Joined group\|Assignment received" \
    /var/log/kafka/connect.log | tail -20

# Compare timestamps to your configured delay value
```

**Fix:**
1. Increase `scheduled.rebalance.max.delay.ms` to exceed measured restart time + 20% buffer
2. Reduce topic replay time by compacting `__connect-configs` and `__connect-status`:
   ```bash
   # Check current topic sizes
   kafka-log-dirs.sh --bootstrap-server kafka:9092 --topic-list __connect-configs | \
     jq '.brokers[].logDirs[].partitions[] | {partition:.partition, size:.size}'
   ```
3. Consider reducing connector count on the cluster if topic replay is the bottleneck

---

### Symptom: Worker stuck in `STOPPING` state

**Root cause:** A connector task is ignoring the stop signal.

**Diagnosis:**
```bash
# Find which task is hanging
grep "Waiting for task\|TimeoutException\|task.*stop" /var/log/kafka/connect.log | tail -20

# Common culprit: JDBC source connector mid-query
grep "JDBC\|ResultSet\|Connection" /var/log/kafka/connect.log | tail -10
```

**Fix — immediate (during incident):**
```bash
# Force kill the Connect process (tasks will be rebalanced)
sudo kill -9 $(pgrep -f "kafka.connect.Connect")
```

**Fix — permanent:**
```properties
# Reduce grace period so hanging tasks are force-killed faster
task.shutdown.graceful.timeout.ms=3000
```

For JDBC connectors specifically, set a database query timeout:
```json
{
  "name": "jdbc-source-orders",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "connection.url": "jdbc:postgresql://db:5432/orders?socketTimeout=5&connectTimeout=3",
    "query.timeout.ms": "4000"
  }
}
```

---

### Symptom: Rebalance storm — continuous rebalancing, no stability

**Root cause:** Multiple workers restarting simultaneously, or a worker crashing repeatedly.

**Diagnosis:**
```bash
# Count rebalances per minute
grep "Rebalance\|rebalance" /var/log/kafka/connect.log | \
    awk '{print $1, $2}' | uniq -c | sort -rn | head -20

# Find crashing worker
grep "Exception\|ERROR\|FATAL\|Worker.*died" /var/log/kafka/connect.log | tail -30
```

**Immediate mitigation:**
```bash
# 1. Pause all connectors to stop task churn during the storm
for connector in $(curl -s http://worker-1:8083/connectors | jq -r '.[]'); do
    echo "Pausing: $connector"
    curl -s -X PUT http://worker-1:8083/connectors/${connector}/pause
done

# 2. Fix the root cause (crashing worker, config error, etc.)

# 3. Resume all connectors
for connector in $(curl -s http://worker-1:8083/connectors | jq -r '.[]'); do
    echo "Resuming: $connector"
    curl -s -X PUT http://worker-1:8083/connectors/${connector}/resume
done
```

---

### Symptom: `offset.flush.timeout.ms` warnings in logs

**Root cause:** Source connectors cannot flush offsets fast enough during shutdown.

```
# Log pattern:
WARN Failed to flush offsets within the timeout. This may cause some sources to be reprocessed on the next connect worker startup. (org.apache.kafka.connect.runtime.WorkerSourceTask)
```

**Fix:**
1. Increase `offset.flush.timeout.ms` if your Kafka brokers are slow to acknowledge writes
2. Check Kafka broker health — slow acks cause flush timeouts
3. Accept the duplicate processing and ensure your sink connectors or downstream systems are idempotent

---

## Decision Matrix

| Scenario | Recommended Action |
|:---|:---|
| Fresh cluster setup | Set `connect.protocol=compatible`, `scheduled.rebalance.max.delay.ms=300000`, measure restart time and adjust |
| Kafka < 2.4 (no cooperative support) | Upgrade Kafka first; there is no safe workaround for eager-only clusters |
| Restart time > `scheduled.rebalance.max.delay.ms` | Increase delay OR reduce restart time via faster OS patching / smaller topic logs |
| Connector task hangs on shutdown | Lower `task.shutdown.graceful.timeout.ms`; add DB query timeouts to connector config |
| Rebalance storm in progress | Pause all connectors → fix root cause → resume |
| Single worker crashing repeatedly | Check worker OOM, connector heap usage, GC logs; don't restart until root cause fixed |
| Rolling upgrade of Connect version | Follow same runbook; `connect.protocol=compatible` ensures old + new workers coexist |
| 50+ connectors, slow topic replay | Add `__connect-configs` compaction, consider separate clusters per domain |