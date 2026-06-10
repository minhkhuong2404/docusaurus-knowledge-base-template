---
id: two-phase-commit
title: "Two-Phase Commit (2PC) & Three-Phase Commit (3PC)"
sidebar_label: Two-Phase Commit (2PC)
description: A comprehensive guide to Two-Phase Commit (2PC) and Three-Phase Commit (3PC) synchronous protocols, diagrams, Java implementations, limitations, and failure modes.
tags: [system-design, distributed-systems, transactions, 2pc, 3pc, consistency]
---

# Two-Phase Commit (2PC) & Three-Phase Commit (3PC)

In a distributed architecture, business operations often span multiple database engines and message brokers. Managing data consistency across these boundaries is one of the hardest problems in software engineering. This guide details the synchronous coordination protocols: Two-Phase Commit (2PC) and Three-Phase Commit (3PC).

---

## Two-Phase Commit (2PC)

Two-Phase Commit (2PC) is a synchronous protocol designed to achieve atomic transaction commits across multiple independent resources (such as database nodes or message brokers).

### Mechanics of 2PC

The protocol relies on a central **Coordinator** and multiple **Participants**. It executes in two distinct phases:

```mermaid
sequenceDiagram
    autonumber
    participant Coordinator
    participant Participant A
    participant Participant B

    rect rgb(240, 248, 255)
        Note over Coordinator, Participant B: Phase 1: Prepare
        Coordinator->>Participant A: Can you commit? (Prepare)
        Coordinator->>Participant B: Can you commit? (Prepare)
        Participant A->>Participant A: Write changes to WAL, lock resources
        Participant B->>Participant B: Write changes to WAL, lock resources
        Participant A-->>Coordinator: Yes (Vote)
        Participant B-->>Coordinator: Yes (Vote)
    end

    rect rgb(240, 255, 240)
        Note over Coordinator, Participant B: Phase 2: Commit (All voted Yes)
        Coordinator->>Participant A: Commit!
        Coordinator->>Participant B: Commit!
        Participant A->>Participant A: Release locks, commit changes
        Participant B->>Participant B: Release locks, commit changes
        Participant A-->>Coordinator: Acknowledge (ACK)
        Participant B-->>Coordinator: Acknowledge (ACK)
    end
```

#### Phase 1: Prepare
1. The coordinator sends a `Prepare` message to all participants.
2. Each participant performs the transaction locally up to the point of committing. It writes changes to its Write-Ahead Log (WAL) and acquires lock resources.
3. Participants vote:
   - **Vote YES** if they are prepared to commit.
   - **Vote NO** if they cannot prepare (e.g., database constraint violation or transient failure).

#### Phase 2: Commit / Abort
1. **If all participants vote YES:**
   - The coordinator writes the commit decision to its transaction log.
   - The coordinator sends a `Commit` message to all participants.
   - Each participant applies the changes, releases locks, and responds with an acknowledgment (`ACK`).
2. **If any participant votes NO or times out:**
   - The coordinator sends an `Abort` message to all participants.
   - Each participant rolls back its changes, releases locks, and responds with an `ACK`.

### Spring Boot 2PC Code Representation

A logical coordinator managing participants in a 2PC workflow looks like:

```java
@Service
@RequiredArgsConstructor
public class TwoPhaseCommitCoordinator {
    private final List<TransactionParticipant> participants;

    public void executeTransaction(List<Operation> operations) {
        List<TransactionParticipant> preparedParticipants = new ArrayList<>();

        try {
            // Phase 1: Prepare
            for (Operation op : operations) {
                TransactionParticipant participant = getParticipant(op);
                if (participant.prepare(op)) {
                    preparedParticipants.add(participant);
                } else {
                    throw new TransactionException("Prepare phase failed on participant: " + participant.getName());
                }
            }

            // Phase 2: Commit
            for (TransactionParticipant participant : preparedParticipants) {
                participant.commit();
            }
        } catch (Exception e) {
            // Abort Phase: Roll back prepared participants
            for (TransactionParticipant prepared : preparedParticipants) {
                prepared.rollback();
            }
            throw new TransactionException("Transaction aborted, rolled back all changes", e);
        }
    }
}
```

### Limitations of 2PC

1. **Blocking Window:** 2PC is a blocking protocol. Once participants vote `YES` in Phase 1, they must hold database locks until the coordinator communicates the final decision in Phase 2. This degrades throughput and triggers lock amplification.
2. **Coordinator SPOF:** If the coordinator crashes mid-protocol after writing the decision to its log but before notifying the participants, participants are left in limbo holding locks indefinitely.
3. **Network Partitions:** If a partition separates the coordinator from a participant, that participant cannot proceed, causing indefinite blocking.

### XA Transactions
The XA Standard is a specification for distributed transaction processing across heterogeneous resources (e.g., an Oracle Database and an ActiveMQ broker). It uses 2PC under the hood, but is notoriously slow and resource-heavy.

---

## Three-Phase Commit (3PC)

Three-Phase Commit (3PC) is an evolution of 2PC designed to eliminate the blocking problem under coordinator failure by dividing the protocol into three phases: **CanCommit**, **PreCommit**, and **DoCommit**.

```
[CanCommit] ──► [PreCommit] ──► [DoCommit]
(Prepare/Vote)   (State Lock)   (Final Release)
```

1. **CanCommit:** Checks if nodes are capable of processing the transaction.
2. **PreCommit:** Nodes acquire locks and write to their logs. However, if the coordinator crashes during this phase, participants can time out and safely **abort** the transaction.
3. **DoCommit:** Nodes apply the changes. If a participant is stranded here without communication, it can time out and **commit** because it knows everyone entered the `PreCommit` state successfully.

**Drawback:** 3PC requires extra message rounds (higher tail latency) and is still vulnerable to network partitions. For this reason, 3PC is rarely used in high-throughput enterprise systems.
