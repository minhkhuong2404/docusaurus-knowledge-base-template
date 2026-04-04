---
id: rebalance-storms
title: Preventing Kafka Connect Rebalance Storms
sidebar_label: Prevent Rebalance Storms
description: A comprehensive guide to tuning Kafka Connect to prevent stop-the-world rebalance storms during routine patching and rolling restarts.
tags: [kafka, kafka-connect, operations, runbook, troubleshooting]
---

# Preventing Kafka Connect Rebalance Storms During Patching

Dealing with a "stop-the-world" pause during a routine patching cycle disrupts data pipelines and violates high availability expectations. 

When a worker node goes down for patching, the Kafka Connect cluster detects the missing node, stops all tasks across all workers, and recalculates the workload. If the node comes back online shortly after, the process repeats. This continuous cycle of stopping and starting tasks is known as a **rebalance storm**.

This guide outlines the configuration changes and procedural steps required to eliminate downtime during rolling restarts.

---

## 🛠️ Required Configuration Tuning

To prevent rebalance storms, you must apply the following configurations to your Kafka Connect worker properties (`connect-distributed.properties`).

### 1. Enable Incremental Cooperative Rebalancing
By default in older Kafka versions, Connect uses the "Eager" rebalancing protocol, which stops *all* tasks during a rebalance. Incremental Cooperative Rebalancing only stops and moves the specific tasks that need to be relocated.

```properties title="connect-distributed.properties"
# Ensures only affected tasks are paused during a worker leaving/joining
connect.protocol=compatible
```
:::info
If you are running Apache Kafka 3.0 or higher, `connect.protocol=compatible` is already the default behavior.
:::

### 2. Configure the Rebalance Delay
This is the most critical setting for rolling restarts. It dictates how long the cluster leader will wait after a worker leaves before it triggers a rebalance. The goal is to give the patched worker enough time to reboot and rejoin before the leader reassigns its tasks.

```properties title="connect-distributed.properties"
# 5 minutes (300000 ms). Adjust this based on your actual patch/restart time.
scheduled.rebalance.max.delay.ms=300000
```
:::tip How to size this value
Measure how long it takes to safely stop the Connect service, apply your OS/software patch, and start the service back up. Add 1-2 minutes of buffer to that time to get your ideal `scheduled.rebalance.max.delay.ms` value.
:::

### 3. Enforce Task Shutdown Grace Periods
If a worker takes too long to shut down because a connector is hanging (often due to slow database connections), it holds the entire rebalance hostage. Lowering the graceful timeout forces stubborn tasks to die so the rolling restart can proceed.

```properties title="connect-distributed.properties"
# Force kill tasks that take longer than 5 seconds to stop
task.shutdown.graceful.timeout.ms=5000
```

### 4. Optimize Cluster Detection Times
Ensure the cluster quickly detects when you intentionally stop a node. If detection takes too long, you waste valuable time in your patching window before the rebalance delay timer even starts.

```properties title="connect-distributed.properties"
# Time before a worker is considered dead
session.timeout.ms=10000
# Frequency of heartbeats to the cluster
heartbeat.interval.ms=3000
```

---

## 📋 The Patching Runbook

Once the configurations above are deployed to your cluster, follow this procedure for routine patching to ensure zero downtime.

### Pre-Flight Checks
1. Verify the cluster is currently healthy and all tasks are `RUNNING`.
2. Confirm `scheduled.rebalance.max.delay.ms` is set higher than your expected restart window.

### Execution Steps
Perform these steps **one worker node at a time**:

1. **Stop the Kafka Connect service** on the target node.
   ```bash
   sudo systemctl stop confluent-kafka-connect
   ```
2. **Apply patches** (OS updates, library upgrades, etc.).
3. **Reboot the server** if required by the patch.
4. **Start the Kafka Connect service**.
   ```bash
   sudo systemctl start confluent-kafka-connect
   ```
5. **Verify the node rejoined.** Check the Connect REST API or your monitoring dashboard to ensure the node is back in the cluster.
   ```bash
   curl -s http://localhost:8083/connectors | jq
   ```
6. **Wait.** Ensure the node has fully initialized and resumed its tasks. 
7. **Proceed to the next node.**

:::warning Important
**Do not** stop the next worker until the previous worker has fully rejoined the cluster and stabilized. If multiple workers go down simultaneously, it may trigger an emergency rebalance regardless of your delay settings.
:::

---

## 🔍 Troubleshooting

| Symptom                                           | Probable Cause                                            | Resolution                                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Tasks still stop globally during restart**      | `connect.protocol` is not set to `compatible`.            | Verify worker properties. Ensure all nodes in the cluster have been restarted with the new config.                 |
| **Rebalance happens before the node comes back**  | `scheduled.rebalance.max.delay.ms` is too short.          | Increase the delay time. Check OS logs to see if the server took longer than expected to boot.                     |
| **Worker node gets stuck in `Stopping...` state** | A connector task is hanging and ignoring the stop signal. | Review worker logs for `TimeoutException` during shutdown. Ensure `task.shutdown.graceful.timeout.ms` is enforced. |
