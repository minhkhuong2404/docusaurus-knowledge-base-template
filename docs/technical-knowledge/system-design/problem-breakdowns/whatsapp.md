---
id: whatsapp
title: Design a Real-Time Messaging App Like WhatsApp
sidebar_label: 8. WhatsApp (Real-Time Chat)
description: Staff-level system design breakdown for a globally distributed real-time messaging platform supporting billions of users and billions of daily messages.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Real-Time Messaging App Like WhatsApp

A global messaging platform (e.g., WhatsApp, Signal, Telegram, WeChat) allows billions of users to exchange text messages, voice notes, photos, videos, and documents in 1:1 and group chats. The system must support real-time delivery with sub-second latency, offline message buffering, delivery receipts (Sent, Delivered, Read), and end-to-end encryption.

---

## 1. Understanding the Problem

### Functional Requirements
1. **1:1 Real-Time Chat**: Users send and receive text and media messages instantly.
2. **Delivery Status Receipts**: Sent (single check), Delivered to recipient device (double gray checks), Read by recipient (double blue checks).
3. **Offline Message Queuing**: If a recipient is offline, messages are stored durably on the server and delivered immediately upon reconnection.
4. **Group Chat**: Support group conversations with up to 1,024 participants.
5. **Media Sharing**: Send photos, videos, audio, and documents with client-side encryption.
6. **Online Presence & Last Seen**: Real-time display of user online status and last active timestamp.

### Non-Functional Requirements
- **Ultra-Low Latency**: 1:1 message delivery latency `< 100ms` when both users are online.
- **High Availability**: `99.999%` uptime for the connection gateway cluster.
- **Zero Data Loss on In-Transit Messages**: In-transit messages must never be dropped before delivery acknowledgment.
- **Privacy & Security**: End-to-End Encryption (E2EE) using the Signal Protocol; the server cannot read message content.
- **Storage Minimization (WhatsApp Ephemeral Model)**: Once a message is delivered and acknowledged by the recipient, it is **deleted from server storage**.

### Capacity Estimations & Sizing (Global Scale)
- **Total Users**: 2 Billion users.
- **Daily Active Users (DAU)**: 1 Billion users.
- **Daily Messages Sent**: 100 Billion messages/day.
- **Average Message Throughput**:
  - $100\text{B} / 86,400 \approx$ **1.15 Million messages/sec average**.
  - Peak throughput = **3.5 Million messages/sec**.
- **Active TCP / WebSocket Connections**:
  - 500 Million users concurrently connected at peak.
  - If a modern Erlang/Netty gateway server manages 100,000 concurrent persistent TCP connections:
    $500\text{M} / 100,000 =$ **5,000 Gateway Servers** worldwide.
- **Offline Storage Sizing**:
  - ~10% of messages are sent to offline recipients at any given time = 10 Billion offline messages/day.
  - Average text message metadata payload $\approx$ 500 bytes.
  - $10\text{B} \times 500\text{ bytes} =$ **5 TB temporary storage/day** (stored with 30-day TTL in Cassandra/RocksDB).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                          USER                          │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID / E.164 │ PRIMARY KEY (Phone)  │
│ public_identity_k│ BLOB         │ E2EE Identity Key    │
│ signed_pre_key   │ BLOB         │ Signal Protocol      │
│ last_seen_at     │ TIMESTAMP    │ Online Presence      │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   CONNECTION_SESSION                   │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID         │ PRIMARY KEY (Redis)  │
│ gateway_node_id  │ VARCHAR(64)  │ Gateway IP/Host      │
│ connection_id    │ VARCHAR(64)  │ Socket Descriptor ID │
│ connected_at     │ TIMESTAMP    │ Heartbeat state      │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     OFFLINE_MESSAGE                    │
├──────────────────┬──────────────┬──────────────────────┤
│ recipient_id     │ UUID         │ PARTITION KEY        │
│ message_id       │ UUID         │ CLUSTERING KEY, ASC  │
│ sender_id        │ UUID         │ NOT NULL             │
│ ciphertext       │ BLOB         │ E2EE Encrypted Body  │
│ media_url        │ VARCHAR(255) │ Optional S3 Link     │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API / Wire Protocol Design
*WhatsApp does not use standard HTTP/REST for messaging; it uses a proprietary binary protocol over TLS or WebSockets (historically customized XMPP/Noise Protocol).*

#### 1. Send Message Packet (Client to Gateway)
```json
{
  "type": "MESSAGE_SEND",
  "message_id": "msg_99a812-4019",
  "recipient_id": "+14155552671",
  "encrypted_payload": "Base64EncryptedCiphertext...",
  "timestamp": 1774301928000
}
```

#### 2. Delivery Receipt Packet (Recipient to Gateway to Sender)
```json
{
  "type": "RECEIPT",
  "message_id": "msg_99a812-4019",
  "status": "DELIVERED", // "SENT", "DELIVERED", or "READ"
  "recipient_id": "+14155552671",
  "timestamp": 1774301928120
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="realtime-chat" title="WhatsApp Distributed WebSocket & Ephemeral Messaging Architecture" />

### Walkthrough of the 1:1 Message Lifecycle

#### 1. Sender Dispatches Message
1. User A sends an encrypted message packet to their connected **Chat Gateway Node (Node 1)** over a long-lived persistent TCP connection.
2. Gateway Node 1 acknowledges receipt back to User A $\implies$ Client displays single gray check (**Sent**).

#### 2. Session Routing & Recipient Lookup
1. Gateway Node 1 checks the global **User Session Cache (Redis Cluster)** to find User B's connection location:
   - Queries `GET session:UserB`.
2. **Scenario A: User B is ONLINE (Connected to Gateway Node 2)**:
   - Gateway Node 1 forwards the message directly to Gateway Node 2 via internal RPC or Kafka topic.
   - Gateway Node 2 pushes the packet down User B's open socket.
   - User B's device acknowledges receipt to Gateway Node 2.
   - A `DELIVERED` receipt travels back to User A $\implies$ Client updates to double gray checks (**Delivered**).
   - **Zero server storage needed!** The message was routed entirely through memory.
3. **Scenario B: User B is OFFLINE**:
   - The Session Cache indicates User B has no active socket.
   - The message is written to the **Offline Message Store (Cassandra)** keyed by `(recipient_id, message_id)`.
   - The system triggers an **Apple Push Notification (APNS) / Firebase Cloud Messaging (FCM)** wake-up ping to User B's phone.
   - When User B opens the app and establishes a new socket, the Gateway fetches all unread messages from Cassandra, pushes them down the socket, and deletes them from Cassandra upon client ACK.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Group Messaging Architecture (Client Fan-Out vs Server Fan-Out)
How do we efficiently send a message to a group of 1,024 members?

```
CLIENT-SIDE FAN-OUT:
User sends 1,024 individual encrypted messages from mobile device.
Catastrophic Mobile Drawback:
1 MB video sent to 1,024 members ➔ 1 GB mobile data upload!
Exhausts mobile battery and cellular data limits.

SERVER-SIDE FAN-OUT (WhatsApp Hybrid Model):
1. User encrypts the media payload ONCE with a random symmetric key (K).
2. User uploads the single encrypted media blob to S3.
3. User encrypts the small 32-byte key (K) for each of the 1,024 members using the Signal Double Ratchet algorithm.
4. User uploads the single small control packet to the Server Gateway.
5. The Server Gateway handles the fan-out: Resolves member session IDs and dispatches the payload to all 1,024 recipients in parallel.
➔ Saves 99.9% of mobile client upload bandwidth!
```

### Deep Dive 2: Managing 500 Million Persistent TCP Sockets
How does a server cluster maintain 500M concurrent idle connections without running out of memory or file descriptors?

1. **Linux Kernel & OS Tuning**:
   - `ulimit -n 1048576`: Raise maximum open file descriptors per node from default (1024) to over 1 Million.
   - `sysctl -w net.ipv4.tcp_rmem="4096 87380 4194304"`: Reduce default TCP receive buffer size for idle sockets from 128 KB to 4 KB.
   - By reducing memory footprint per socket from ~50 KB to ~8 KB, a modern 64 GB RAM server easily hosts **100,000+ concurrent open connections**.
2. **Erlang / Netty Non-Blocking I/O (epoll)**:
   - Avoid thread-per-connection architectures (Java standard sockets would exhaust thread stack memory at 10,000 threads).
   - Use epoll event loops where a small pool of worker threads multiplexes hundreds of thousands of network events asynchronously.

### Deep Dive 3: Online Presence & Last Seen Scaling
If 1 Billion users broadcast their online status every 5 seconds to all their contacts, it generates **Trillions of presence updates**, melting the infrastructure!
- **Presence Optimization (Pull on View)**:
  - Do **NOT** push presence updates to all contacts proactively.
  - A user only cares about another user's "Online / Last Seen" status **when they actually open that specific chat window**.
  - **Subscribe-on-Open**: When User A opens the chat with User B, the client sends a `SUBSCRIBE_PRESENCE: UserB` packet.
  - The server registers an ephemeral subscription in Redis and returns User B's presence.
  - When User A closes the chat window, the subscription is unsubscribed.
  - **Heartbeat Cadence**: Active clients send a lightweight heartbeat ping every 25 seconds. If no heartbeat arrives in 40 seconds, the user is marked as offline.

### Deep Dive 4: End-to-End Encryption (Signal Protocol Mechanics)
How does E2EE ensure that even if the server is subpoenaed or compromised, no message plaintext can be read?
- **Pre-Keys & Identity Keys**: Each client publishes a set of cryptographically signed public keys (Curve25519) to the server.
- **Double Ratchet Algorithm**:
  - When User A initiates a chat with User B, it combines User A's private key with User B's public pre-key using Diffie-Hellman (X3DH) to derive a shared root key.
  - For **every single message sent**, the encryption key is ratcheted forward using a KDF (Key Derivation Function).
  - **Forward Secrecy**: Even if an attacker compromises a user's phone today, they cannot decrypt previously intercepted messages because past keys cannot be derived backward from the current ratchet state.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Message Storage** | Permanent Cloud History (Telegram) | Ephemeral Local Storage (WhatsApp) | **Ephemeral Local Storage**: Deleting delivered messages from the server eliminates Petabytes of permanent storage costs and makes WhatsApp virtually immune to server-side data breach leaks. |
| **Connection Protocol** | HTTP Long-Polling | Persistent WebSockets / Custom TCP | **WebSockets / Custom TCP**: Zero HTTP header overhead per packet; bi-directional full-duplex communication delivers `< 100ms` message round trips. |
| **Presence Fan-Out** | Push to all address book contacts | Ephemeral Subscription on Chat Open | **Subscribe on Chat Open**: Cuts presence network traffic by 99.8%, preventing Redis cluster meltdown from contact-list fan-out storms. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands persistent connection requirements (WebSockets vs HTTP).
- Designs basic relational schemas for Users, Chats, and Messages.
- Identifies how to handle offline users by storing messages temporarily in a database.
- Implements basic single-check and double-check delivery receipts.

### Senior (L5 / IC5)
- Architects the Session Gateway cluster with distributed Redis session mapping (`user_id -> gateway_id`).
- Explains kernel TCP tuning (epoll, file descriptors, TCP buffer reduction) to host 100K connections per server.
- Designs hybrid server-side group message fan-out to preserve client upload bandwidth.
- Implements the "Subscribe-on-View" model for online presence to prevent broadcast storms.

### Staff+ (L6 / Principal)
- Explains the Signal Protocol cryptographic handshake (X3DH and Double Ratchet forward secrecy) and its impact on multi-device synchronization.
- Designs cross-region geo-routing: Directing users to edge connection gateways nearest to their physical location while maintaining reliable inter-datacenter message routing.
- Details operational crash recovery: What happens when Gateway Node 1 abruptly crashes with 100,000 active sockets? (Thundering reconnect mitigation with exponential backoff and jitter).
