---
id: chapter-04
title: "Chapter 4: Encoding and Evolution"
sidebar_label: "Ch 4 — Encoding & Evolution"
sidebar_position: 4
---

# Chapter 4: Encoding and Evolution

## The Big Idea

Applications change over time — requirements evolve, new features are added, bugs are fixed. Your data model must evolve too. But in large systems, you can't update everything atomically:

- **Rolling upgrades** mean old and new code run simultaneously
- Data written by the new version must be readable by old code (**backward compatibility**)
- Data written by the old version must be readable by new code (**forward compatibility**)

This chapter is about **how data is encoded** (serialized/marshalled) and how encoding formats handle schema evolution.

---

## 🔄 Formats for Encoding Data

Programs work with data in two forms:
1. **In-memory:** Objects, structs, lists, hash maps — optimized for CPU access
2. **On wire/disk:** A sequence of bytes — a self-contained encoding

The translation from in-memory to bytes is called **encoding** (serialization). The reverse is **decoding** (deserialization/parsing).

---

## 📝 Language-Specific Formats

Java's `Serializable`, Python's `pickle`, Ruby's `Marshal` — built-in serialization.

**Problems:**
- Tied to one language — you can't read Java serialized objects from Python
- Security vulnerabilities — deserializing untrusted data can execute arbitrary code
- Poor forward/backward compatibility
- Often poor performance

:::danger
Avoid language-specific serialization for anything that crosses service or storage boundaries. It's fine for ephemeral in-process use, not for long-lived data.
:::

---

## 📄 JSON, XML, and CSV

Human-readable text formats. Widely supported, easy to debug.

**Problems:**
- **XML:** Verbose, complex, poor number support
- **JSON:** No distinction between integers and floats, no binary support, no schema enforcement
- **CSV:** Ambiguous escaping, no schema — "comma separated values" but what are the columns?

**Common issues:**
- Numbers: JSON can't represent integers > 2⁵³ accurately (Twitter uses strings for tweet IDs)
- Binary data: JSON/XML don't support raw bytes natively — developers use Base64 encoding (increases size by 33%)
- Optional schema validation: XML Schema, JSON Schema — optional add-ons, not built-in

Despite these issues, JSON/XML are fine for many use cases. Their human-readability and universality make them excellent for external APIs and config files.

---

## ⚡ Binary Encoding Formats

For internal use, binary formats offer:
- Smaller encoded size (no field name repetition)
- Faster encoding/decoding
- Schema-enforced type safety

### MessagePack

A binary encoding of JSON. More compact than JSON text, but still includes field names in each record (so savings are modest).

### Apache Thrift and Protocol Buffers (Protobuf)

Both require a schema defined in an **Interface Definition Language (IDL)**:

```protobuf
// Protocol Buffers schema
message Person {
  required string user_name = 1;
  optional int64  favourite_number = 2;
  repeated string interests = 3;
}
```

Key difference from JSON: **field tags (numbers)** replace field names in the encoding. `user_name` becomes just `1`. This makes the binary encoding very compact and enables schema evolution:

**Adding fields:** New code can read old data (missing field = use default). Old code reading new data ignores unknown field tags → **forward compatibility** ✓

**Removing fields:** You can only remove optional fields, and you can never reuse that field tag number → **backward compatibility** ✓

**Thrift** has two binary protocols: BinaryProtocol (simpler) and CompactProtocol (uses variable-length encoding for smaller output).

### Apache Avro

Avro takes a different approach — there are **no field tags** in the schema or the binary encoding. Instead, the writer's and reader's schemas are compared side by side:

```
Writer schema:        Reader schema:
name (string)     →  name (string)
age (int)         →  (no 'age' field → ignored)
(no 'email')      ←  email (string, default null)
```

Avro can resolve schema differences automatically. This makes it ideal for **Hadoop / data pipelines** where data is written once and read by many different consumers over time.

**Schema resolution rules:**
- Writer field not in reader schema → ignored
- Reader field not in writer schema → filled with default value
- Type changed → must be compatible (e.g., int → long is ok)

Avro requires the writer's schema to be available when reading. Common solutions:
- Include schema in each file header (Avro Object Container Files)
- Store schema version number with data, look up schema in a schema registry

---

## 🔀 Modes of Dataflow

Encoding matters in the context of how data flows between processes:

### 1. Via Databases

A process writes to the database, another reads it. In a rolling deployment, different versions of the code read the same data:
- **New code writes new field → old code reads and ignores it → old code updates and saves back → new field is lost**

This is a **data loss** bug. Be careful about old code "round-tripping" data with unknown fields — it should preserve them.

### 2. Via Service Calls (REST and RPC)

**REST APIs:** Use HTTP verbs, JSON/XML payloads. Simple, human-readable, great for public APIs.

**RPC (Remote Procedure Call):** Makes a network call look like a local function call. Frameworks: gRPC (Protobuf), Thrift, Avro RPC, Finagle.

**Why RPC abstraction is leaky:** Network calls are fundamentally different from local calls:
- Network calls can fail or time out (no result, no error)
- Idempotency matters — did the server receive the request before the timeout?
- Latency is variable and high
- Parameters must be serialized (no passing object references)

Modern RPC frameworks (gRPC, Finagle) acknowledge this — they expose futures/promises to make async failure handling explicit.

**API evolution:** For a public API, you must maintain compatibility for years. New optional request parameters + new response fields = forward + backward compatible. Avoid breaking existing clients.

### 3. Via Message Passing (Asynchronous)

Message brokers (Kafka, RabbitMQ, ActiveMQ) sit between producer and consumer:

**Advantages over direct RPC:**
- Buffer messages if consumer is slow or down (improved reliability)
- Deliver to multiple consumers (fan-out)
- Decouple sender and receiver (sender doesn't need to know about consumer)
- Consumer can retry failed messages (message stays in queue)

**Encoding:** The producer encodes the message; the consumer decodes it. They may run different code versions, so encoding format must support forward + backward compatibility.

**Actor model:** (Erlang/Akka) Each actor processes one message at a time — message encoding is part of the actor's interface.

---

## Summary

| Format | Human-readable | Schema required | Compact | Good for |
|---|---|---|---|---|
| JSON / XML | ✅ Yes | ❌ Optional | ❌ No | External APIs, config |
| CSV | ✅ Yes | ❌ No | ❌ No | Simple tabular data |
| Protobuf / Thrift | ❌ No | ✅ Yes | ✅ Yes | Internal services, storage |
| Avro | ❌ No | ✅ Yes | ✅ Yes | Hadoop, event streams |
| MessagePack | ❌ No | ❌ No | ⚠️ Moderate | JSON replacement |

**The golden rule of schema evolution:**
- Always add new fields as **optional** (with defaults)
- Never remove required fields
- Never repurpose existing field numbers/names
- Always think about what happens when old code reads new data, and vice versa
