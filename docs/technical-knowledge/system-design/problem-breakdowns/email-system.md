---
id: email-system
title: "Design an Enterprise Email System Like Gmail"
sidebar_label: "37. Email System (Gmail)"
description: "Staff-level breakdown of SMTP/IMAP/POP3 protocol gateways, distributed mail spooling, SPF/DKIM/DMARC authentication, anti-spam reputation scoring, and distributed mailbox storage."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design an Enterprise Email System Like Gmail

An enterprise email platform processes billions of messages daily, interfacing with external servers over legacy protocols (SMTP, IMAP, POP3) while delivering a modern web/mobile client experience. Operating at the scale of Google Gmail or Microsoft Outlook requires solving **strict zero-data-loss durability**, high-throughput asynchronous mail spooling, real-time spam/phishing mitigation, and sub-100ms full-text search across petabytes of encrypted user mailboxes.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Send & Receive Emails**: Send outgoing emails to any domain over SMTP; accept incoming emails from external Mail Transfer Agents (MTAs).
2. **Mailbox Operations**: Organize emails by folders/labels (Inbox, Sent, Trash, Custom), read status, and thread conversations.
3. **Attachments Support**: Support file attachments up to 25 MB directly, with cloud storage integration for larger files.
4. **Anti-Spam & Phishing Defense**: Screen incoming emails using SPF, DKIM, DMARC, and ML-based content reputation scoring.
5. **Full-Text Search**: Search across subject lines, body text, sender addresses, and attachments in $< 100\text{ms}$.

### Non-Functional Requirements
- **Zero Data Loss (100% Durability)**: Once an email is acknowledged to the sender MTA (`250 OK`), it must never be lost under any server or disk failure.
- **Delivery Latency SLA**: Internal delivery latency $< 1\text{ second}$ (P95); external delivery attempted within 5 seconds.
- **High Availability**: $99.999\%$ uptime for mail reception and mailbox access.
- **Extreme Scale**: Support **1.8 Billion users** processing **300+ Billion emails per day**.

### Capacity Estimations & Sizing (5 Years)
- **Active Accounts**: 1.8 Billion active mailboxes.
- **Email Volume**: 300 Billion emails received/sent daily $\implies$ **3.5 Million emails/second** average throughput (peak: **10 Million/sec**).
- **Average Email Size**: 100 KB (mix of small 10 KB plain text and 2–10 MB emails with attachments).
- **Daily Ingestion Storage**:
  $$\text{Daily Storage} = 300\text{ Billion emails} \times 100\text{ KB} = \mathbf{30\text{ Petabytes/day}}$$
- **5-Year Storage (with Deduplication & Compression)**:
  - Attachments represent 80% of storage. Deduplicating identical attachments across recipients reduces attachment storage by 60%.
  - Zstandard text compression reduces body text by 70%.
  - Net 5-year storage projection: $\approx \mathbf{25\text{ Exabytes}}$.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        EMAIL_MSG                       │
├──────────────────┬──────────────┬──────────────────────┤
│ message_id       │ VARCHAR(128) │ RFC 5322 Message-ID  │
│ thread_id        │ UUID         │ Conversation Thread  │
│ sender_address   │ VARCHAR(256) │ RFC 5321 Return Path │
│ subject          │ VARCHAR(512) │ Clean Subject Text   │
│ body_s3_uri      │ VARCHAR(512) │ Compressed HTML/Text │
│ size_bytes       │ INT          │ Total Message Size   │
│ has_attachments  │ BOOLEAN      │ Attachment Flag      │
│ created_at       │ TIMESTAMP    │ System Ingest Time   │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     USER_MAILBOX_ITEM                  │
├──────────────────┬──────────────┬──────────────────────┤
│ user_id          │ UUID         │ Partition Key        │
│ folder_id        │ ENUM         │ INBOX, SENT, TRASH   │
│ message_id       │ VARCHAR(128) │ Composite Key        │
│ is_read          │ BOOLEAN      │ Read / Unread Status │
│ is_starred       │ BOOLEAN      │ Flagged Star         │
│ received_at      │ TIMESTAMP    │ Sort Key (Order)     │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                       ATTACHMENT                       │
├──────────────────┬──────────────┬──────────────────────┤
│ attachment_id    │ UUID         │ PRIMARY KEY          │
│ sha256_hash      │ CHAR(64)     │ Deduplication Hash   │
│ s3_object_key    │ VARCHAR(512) │ Blob Storage Path    │
│ file_name        │ VARCHAR(256) │ Original Name        │
│ mime_type        │ VARCHAR(64)  │ Content-Type         │
│ size_bytes       │ INT          │ File Size            │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. REST Mail Submission API (Web / Mobile Clients)
```http
POST /api/v1/mailboxes/me/messages/send
Content-Type: application/json
Authorization: Bearer <user_oauth_token>
Idempotency-Key: 9481a-8291-419b-a012

{
  "to": ["alice@company.com"],
  "cc": ["team@company.com"],
  "subject": "Q3 Architecture Review",
  "body_html": "<p>Team, please find the deck attached.</p>",
  "attachment_ids": ["c4a7e-4123-..."]
}
```
**Response (`202 Accepted`)**:
```json
{
  "message_id": "<202609221200.9481a@mail.example.com>",
  "status": "QUEUED_FOR_DELIVERY",
  "thread_id": "8f12a-3310-..."
}
```

#### 2. SMTP Protocol Wire Flow (External MTAs)
```smtp
S: 220 mx.google.com ESMTP Postfix
C: EHLO mail.sender.com
S: 250-mx.google.com at your service
S: 250-STARTTLS
S: 250 SIZE 35882577
C: STARTTLS
S: 220 2.0.0 Ready to start TLS
[TLS 1.3 Handshake completed]
C: MAIL FROM:<sender@sender.com>
S: 250 2.1.0 OK
C: RCPT TO:<recipient@example.com>
S: 250 2.1.5 OK
C: DATA
S: 354 Start mail input; end with <CR><LF>.<CR><LF>
C: Subject: Hello World
C: ...
C: .
S: 250 2.0.0 OK: message queued 948102948
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="realtime-chat" title="Enterprise Email System Architecture & Mail Delivery Pipeline" />

### Walkthrough of Core Flows

#### 1. Receiving Incoming External Mail (Inbound SMTP Path)
1. The external sender MTA resolves DNS `MX` records for `example.com`, receiving the IP addresses of our **Edge SMTP Gateways (Inbound MTAs)**.
2. The sender establishes a TCP connection over port 25 with mandatory **TLS 1.3 encryption**.
3. **Authentication & Reputation Check**:
   - The Gateway executes DNS lookups for **SPF (Sender Policy Framework)** to verify the sender IP.
   - Verifies the cryptographic **DKIM (DomainKeys Identified Mail)** RSA/Ed25519 signature in the mail header.
   - Evaluates the domain’s **DMARC policy** (`p=reject`, `p=quarantine`, or `p=none`).
4. **Anti-Spam & Malware Scanning**:
   - The body and attachments are passed to an asynchronous ML inference engine that evaluates spam probability scores.
   - Attachments are scanned in a sandboxed ClamAV/threat-intelligence jail for zero-day malware.
5. **Persistence**:
   - The raw message body and attachments are uploaded to **Distributed Object Storage (S3 / GFS)** keyed by content hash.
   - Metadata is committed to the **Mailbox Database** (Bigtable / Cassandra).
   - An event is published to **Apache Kafka** to trigger real-time user notification (Push / WebSocket) and inverted index search ingestion.
6. The Gateway sends `250 2.0.0 OK` to the sender MTA. Only after durable storage is confirmed does the gateway acknowledge receipt.

#### 2. Sending Outgoing Mail (Outbound Delivery Path)
1. User clicks "Send"; client dispatches `POST /messages/send` to the **Mail Submission Agent (MSA)**.
2. The MSA signs the message with our domain’s private DKIM key.
3. The message is enqueued into the **Outbound Distributed Spooling Queue** (Kafka / RabbitMQ).
4. **Outbound MTA Worker Pool**:
   - Resolves target recipient domain MX records via a dedicated local DNS caching resolver.
   - Connects to the destination MTA over SMTP port 25 with opportunistic TLS.
   - Delivers the payload. If the remote MTA returns a temporary error (`4xx`), the worker schedules an exponential backoff retry. If permanent error (`5xx`), it generates a "Bounce / Delivery Status Notification (DSN)" back to the sender.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: The Email Authentication Triad (SPF, DKIM, DMARC)
How does an email system stop phishing and spoofing cold at the gateway?

```
┌────────────────────────────────────────────────────────┐
│                   EMAIL AUTHENTICATION TRIAD           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1. SPF (Sender Policy Framework - RFC 7208)           │
│     Domain owner publishes authorized sending IPs:     │
│     "v=spf1 ip4:198.51.100.0/24 include:_spf.google ~all│
│     Inbound MTA verifies: Does connecting IP match?    │
│                                                        │
│  2. DKIM (DomainKeys Identified Mail - RFC 6376)       │
│     Sender signs headers + body hash with private key. │
│     Public key published in DNS: selector._domainkey...│
│     Inbound MTA verifies: Has body been tampered with? │
│                                                        │
│  3. DMARC (RFC 7489)                                   │
│     Requires SPF/DKIM alignment with visible "From:"   │
│     Enforces policy: reject, quarantine, or none.      │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **The Alignment Rule**: Malicious attackers can pass SPF using an attacker-controlled envelope domain (`attacker.com`) while displaying `support@paypal.com` in the user's email client. DMARC closes this loophole by requiring that the domain in the visible `From:` header matches the domain verified by SPF or DKIM.

### Deep Dive 2: Distributed Mail Spooling & Exponential Backoff Retries
What happens when the recipient mail server is temporarily down or rate-limiting incoming traffic (`421 Too many connections`)?
- **Spool Queues**: Outgoing emails are stored in priority-partitioned queues based on destination domain (e.g. `queue-yahoo`, `queue-outlook`, `queue-general`).
- **Domain-Level Concurrency Throttling**: If our workers open 10,000 parallel connections to Yahoo simultaneously, Yahoo will blacklist our IP range. A centralized Redis token bucket caps active connections per destination domain (e.g. max 50 concurrent sockets to Yahoo).
- **Exponential Backoff Schedule**:
  - Retry 1: 5 minutes
  - Retry 2: 15 minutes
  - Retry 3: 45 minutes
  - Retry 4..N: Every 2 hours up to **72 hours**.
  - After 72 hours, the email is dropped from the spool and an automated Non-Delivery Report (NDR) bounce email is dispatched to the user.

### Deep Dive 3: Mailbox Storage Engine (LSM-Tree on Bigtable / Cassandra)
How do we store billions of emails per user without running into partition bottlenecks?
- **User-Partitioned Schema**: Data is sharded by `user_id`. All emails for a user live on the same physical database partition.
- **Why LSM-Tree?**
  - High write throughput for incoming email blasts.
  - Emails within a folder are indexed by `received_at DESC`. In an LSM-Tree, sequential writes are appended to Memtable and flushed to SSTables, matching the chronological arrival order.
- **Large Attachment Offloading**: Attachments are **never** stored directly in the database row. The database stores only a pointer `(attachment_id, sha256_hash, s3_uri)`. This keeps database row sizes small ($< 1\text{ KB}$), ensuring that folder listings and pagination (`SELECT * FROM messages WHERE user_id = ? ORDER BY received_at DESC LIMIT 50`) execute in $< 5\text{ms}$.

### Deep Dive 4: Real-Time Full-Text Search Over Petabytes of Encrypted Mail
How does Gmail search through 15 years of user emails in $< 100\text{ms}$?
- **Per-User Inverted Index**: A global search index across 1.8 billion users would suffer from catastrophic lock contention and multi-tenant isolation risks. Instead, the search engine shards the inverted index **by user ID**.
- **Posting List Structure**:
  - Word: `"architecture"` $\implies$ Posting List: `[msg_id: 1042, offset: 4], [msg_id: 1089, offset: 12]`.
- **Near-Real-Time (NRT) Indexing**: When a new email arrives, a lightweight Lucene/Elasticsearch or custom C++ indexing daemon tokenizes the message, stems terms, and updates an in-memory index segment within 500ms of arrival.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Attachment Storage** | In-Database BLOBs (Postgres/Cassandra) | Dedicated Object Store (S3 / GFS) | **Object Store**: Keeps database rows lean; enables global content-addressed deduplication via SHA-256 hashing. |
| **Search Architecture** | Global Shared Inverted Index (by Term) | Sharded by User ID (Document-Centric) | **Sharded by User ID**: Every user search queries only their personal index shard, isolating noisy neighbors and providing natural GDPR data deletion compliance. |
| **Mail Spooling** | Traditional Disk File Spool (Postfix) | Distributed Queue (Kafka / Pulsar) | **Distributed Queue**: Prevents single-host disk bottlenecks; allows elastic scaling of worker nodes during spam/burst events. |
| **Protocol Termination** | Monolithic Java/Go SMTP Daemon | C/Rust TLS Terminator + Proxy Protocol | **C/Rust TLS Gateway**: Hardened against buffer overflows and memory exploits; handles 100K+ concurrent SSL handshakes with minimal RAM. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands the core email protocols: SMTP (sending), IMAP/POP3 (fetching).
- Designs a clean relational database schema for users, messages, threads, and folders.
- Explains why attachments should be separated from database rows into object storage.

### Senior (L5 / IC5)
- Explains the email authentication protocols (SPF, DKIM, DMARC) and how to prevent header spoofing.
- Details the asynchronous distributed spooling queue and exponential backoff retry architecture.
- Designs a per-user sharded search index for sub-100ms full-text retrieval.
- Addresses IP reputation warm-up and rate-limiting outbound connections to major domains.

### Staff+ (L6 / Principal)
- Evaluates zero-data-loss durability guarantees: when is `250 OK` returned relative to disk `fsync` and cross-AZ replication.
- Formulates multi-region active-active mailbox replication strategies with conflict-free thread resolution.
- Designs defense-in-depth security against zero-day attachment exploits (sandboxing, font-rendering sanitization, HTML stripping).
- Evaluates legal compliance pipelines (eDiscovery, immutable litigation hold retention, and GDPR right-to-be-forgotten deletion workflows).
