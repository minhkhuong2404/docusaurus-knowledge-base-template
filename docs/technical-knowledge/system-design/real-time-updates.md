---
id: real-time-updates
title: Real-Time Updates
sidebar_label: Real-Time Updates
description: Delivering real-time data to clients - short/long polling, SSE, WebSocket/STOMP, push notifications - with Spring Boot code, scaling, delivery guarantees, failure modes, observability and interview Q&A.
tags: [real-time, websocket, sse, long-polling, push-notifications, stomp, kafka, redis, streaming, spring-boot]
---

import RealTimeTransportsDiagram from '@site/src/components/RealTimeTransportsDiagram';
import RealTimeUseCasesArchitectureDiagram from '@site/src/components/RealTimeUseCasesArchitectureDiagram';

# Real-Time Updates

> "Real-time" means **low-latency delivery of state changes** to clients. The right mechanism depends on directionality, scale, delivery guarantees and what sits between client and server (proxies, LBs, mobile networks).

:::tip[Beginner analogy]
- **Short polling** = kid in the back seat asking "are we there yet?" every minute.
- **Long polling** = asking once and the driver answers only when something changes.
- **SSE** = radio broadcast: you listen, you can't talk back.
- **WebSocket** = phone call: both sides talk any time.
- **Push notification** = postal service delivering to your door when you're not home.
:::

---

## Decision Matrix

<RealTimeTransportsDiagram initialTransport="websocket" />

| Mechanism | Direction | Latency | Server cost / client | Proxy/LB friendliness | Auto-reconnect | Best for |
|---|---|---|---|---|---|---|
| **Short polling** | Client → Server | High (up to interval) | Low per request, high QPS | Excellent | n/a | Rare status checks |
| **Long polling** | Client → Server | Medium | 1 held request | Good | Manual | Fallback, low message rate |
| **SSE** | Server → Client | Low | 1 held HTTP stream | Good (disable buffering) | Built in (`Last-Event-ID`) | Feeds, notifications, progress, LLM token streaming |
| **WebSocket** | Bidirectional | Very low | 1 TCP conn + buffers | Needs upgrade support, idle timeouts | Manual | Chat, gaming, collaboration, trading |
| **WebRTC** | Peer-to-peer | Very low | Signaling only after setup | NAT traversal (STUN/TURN) | Manual | Audio/video, P2P data |
| **Push (APNs/FCM)** | Server → Device | Seconds, best effort | None (3rd party) | n/a | n/a | Offline/background mobile users |

**Rule of thumb**
1. Server → client only? **SSE**.
2. Client also sends frequent low-latency messages? **WebSocket**.
3. Client may be offline/backgrounded? **Push**, with inbox in DB.
4. Hostile network, no upgrade support? **Long polling** fallback.
5. Updates less than once a minute and staleness is OK? **Short polling** (+ `ETag`/`304`).

---

## Short Polling

<RealTimeTransportsDiagram initialTransport="short-polling" />

Client repeatedly asks "any updates?"

**Problems**: wasted requests when nothing changed; QPS = clients / interval (1M clients at 5s = 200K QPS of mostly empty responses); latency up to one interval.
**Mitigations**: conditional requests (`If-None-Match` → `304`), jittered intervals, server-supplied `Retry-After`/next-poll hint, cheap cache-backed endpoint.
**When to use**: simplest implementation, infrequent updates (job status, payment status).

---

## Long Polling

<RealTimeTransportsDiagram initialTransport="long-polling" />

Server holds the request open until data is available or timeout; client immediately re-requests.

**Pros**: far fewer empty responses than short polling; plain HTTP, works everywhere.
**Cons**: one held request per client; **gap between response and next request** can lose events unless a cursor is used; each message costs full HTTP headers.

```java
// Spring MVC long polling with DeferredResult (cursor-based, no lost events)
@GetMapping("/updates")
public DeferredResult<ResponseEntity<UpdateBatch>> getUpdates(@RequestParam long since) {
    DeferredResult<ResponseEntity<UpdateBatch>> result = new DeferredResult<>(30_000L);

    // 1. Anything already after the cursor? Return immediately.
    List<Update> pending = updateStore.findAfter(since);
    if (!pending.isEmpty()) {
        result.setResult(ResponseEntity.ok(new UpdateBatch(pending, lastId(pending))));
        return result;
    }

    // 2. Otherwise park the request.
    updateRegistry.register(since, result);
    result.onTimeout(() -> result.setResult(
            ResponseEntity.ok(new UpdateBatch(List.of(), since)))); // empty batch, same cursor
    result.onCompletion(() -> updateRegistry.remove(result));      // avoid leaks
    return result;
}
```

Client always sends the **last cursor it received**, never "now". Keep the timeout below the shortest proxy/LB idle timeout (e.g. 30s vs ALB 60s).

---

## Server-Sent Events (SSE)

<RealTimeTransportsDiagram initialTransport="sse" />

One long-lived HTTP response with `Content-Type: text/event-stream`; server pushes text events.

```
GET /stream HTTP/1.1
Accept: text/event-stream
Last-Event-ID: 41

id: 42
event: notification
data: {"type":"notification","msg":"Hello"}

: heartbeat comment (keeps proxies from idling out the stream)

id: 43
retry: 5000
data: {"type":"update","count":42}
```

| Field | Purpose |
|---|---|
| `id` | Event ID; browser echoes last one as `Last-Event-ID` on reconnect |
| `event` | Named event type for `addEventListener` |
| `retry` | Reconnect delay (ms) |
| `:` comment | Heartbeat, ignored by client |

**Pros**: simple, native `EventSource` reconnect + resume, plain HTTP (auth, caching headers, observability tooling work), multiplexed over HTTP/2.
**Cons**: unidirectional, text only, `EventSource` cannot set custom headers (use cookies or a fetch-based client such as `fetch-event-source` for `Authorization`), **~6 connections per origin on HTTP/1.1** (HTTP/2 raises this to the negotiated stream limit, typically ~100).

```java
@RestController
public class SseController {

    private final SseRegistry registry;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal UserPrincipal user,
                             @RequestHeader(value = "Last-Event-ID", required = false) Long lastEventId) {

        SseEmitter emitter = new SseEmitter(0L);          // 0 = no Spring timeout; LB timeout still applies
        registry.add(user.id(), emitter);                  // multiple tabs/devices per user

        Runnable cleanup = () -> registry.remove(user.id(), emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());               // client vanished mid-write

        // Replay missed events from a bounded buffer / Kafka offset / DB
        if (lastEventId != null) {
            registry.replayAfter(user.id(), lastEventId, emitter);
        }
        return emitter;
    }
}

@Component
public class SseRegistry {
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public void add(Long userId, SseEmitter e) {
        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(e);
    }
    public void remove(Long userId, SseEmitter e) {
        emitters.computeIfPresent(userId, (k, list) -> { list.remove(e); return list.isEmpty() ? null : list; });
    }

    public void push(Long userId, long eventId, Object payload) {
        for (SseEmitter e : emitters.getOrDefault(userId, new CopyOnWriteArrayList<>())) {
            try {
                e.send(SseEmitter.event().id(String.valueOf(eventId)).data(payload));
            } catch (IOException | IllegalStateException ex) {
                e.completeWithError(ex);                    // triggers onError -> cleanup
            }
        }
    }

    @Scheduled(fixedDelay = 15_000)                         // heartbeat < smallest idle timeout
    void heartbeat() {
        emitters.values().forEach(list -> list.forEach(e -> {
            try { e.send(SseEmitter.event().comment("hb")); }
            catch (Exception ex) { e.completeWithError(ex); }
        }));
    }
}
```

:::warning[Production notes]
- `SseEmitter` sends are **not thread-safe per emitter**; serialize sends per connection (single writer / per-user queue).
- Disable proxy buffering: nginx `proxy_buffering off; proxy_read_timeout 1h;`, or `X-Accel-Buffering: no`. CloudFront/ALB defaults can buffer or idle out.
- `SseEmitter` holds a servlet thread-adjacent async context; for very high fan-out prefer **WebFlux** (`Flux<ServerSentEvent<T>>`) or virtual threads (Java 21+).
:::

```java
// WebFlux variant: backpressure-aware, no thread per connection
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<Update>> stream(@AuthenticationPrincipal UserPrincipal user) {
    return updateSink.asFlux()                                   // Sinks.Many<Update> multicast
        .filter(u -> u.userId().equals(user.id()))
        .map(u -> ServerSentEvent.builder(u).id(u.id()).build())
        .mergeWith(Flux.interval(Duration.ofSeconds(15)).map(i -> ServerSentEvent.<Update>builder().comment("hb").build()))
        .onBackpressureDrop();                                   // slow consumer: drop or buffer, decide explicitly
}
```

---

## WebSocket

<RealTimeTransportsDiagram initialTransport="websocket" />

Full-duplex, persistent TCP connection started via HTTP upgrade.

### Handshake

```
GET /ws HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://app.example.com

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

After `101`, the connection carries WebSocket frames (text, binary, ping, pong, close), not HTTP. Over HTTP/2 the upgrade is replaced by extended CONNECT (RFC 8441), rarely deployed outside browsers/CDNs that support it.

### Raw WebSocket vs STOMP

| | Raw `WebSocketHandler` | STOMP over WebSocket |
|---|---|---|
| Routing | You build it | Destinations, subscriptions |
| Pub/sub, user queues | You build it | Built in |
| Headers, receipts, heartbeat | You build it | Built in |
| Broker relay (RabbitMQ/ActiveMQ) | No | Yes |
| Overhead | Lowest | Slightly higher (text frames) |
| Use when | Custom binary protocol, gaming | Typical app messaging |

### Spring Boot WebSocket + STOMP

STOMP (Simple Text Oriented Messaging Protocol) adds pub/sub semantics over WebSocket.

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue")              // in-memory: single node only
              .setHeartbeatValue(new long[]{10_000, 10_000})
              .setTaskScheduler(heartbeatScheduler());             // required for heartbeats
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("https://*.example.com") // CSWSH protection
                .withSockJS();                                     // fallback; drop if clients are modern
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration reg) {
        reg.setSendTimeLimit(15_000)             // slow consumer: abort send after 15s
           .setSendBufferSizeLimit(512 * 1024)   // per-session outbound buffer cap
           .setMessageSizeLimit(64 * 1024);      // reject oversized inbound frames
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration reg) {
        reg.interceptors(jwtAuthChannelInterceptor());             // see Security
        reg.taskExecutor().corePoolSize(8).maxPoolSize(32).queueCapacity(1000);
    }

    @Bean ThreadPoolTaskScheduler heartbeatScheduler() {
        ThreadPoolTaskScheduler s = new ThreadPoolTaskScheduler();
        s.setPoolSize(1); s.setThreadNamePrefix("ws-heartbeat-"); return s;
    }
}

@Controller
public class OrderWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final OrderService orderService;

    // Client -> server request/response style
    @MessageMapping("/orders/{orderId}/subscribe")
    @SendTo("/topic/orders/{orderId}")
    public OrderStatus subscribe(@DestinationVariable Long orderId, Principal principal) {
        orderService.assertCanView(principal, orderId);            // authorize per destination
        return orderService.getStatus(orderId);
    }

    // Server -> specific user (all of that user's sessions)
    public void notifyOrderUpdate(String username, OrderUpdate update) {
        messagingTemplate.convertAndSendToUser(username, "/queue/order-updates", update);
    }
}
```

:::note
`convertAndSendToUser` routes by the **`Principal` name**, not the DB user ID, unless your `Principal.getName()` returns the ID. Be consistent.
:::

```javascript
// JavaScript client (@stomp/stompjs)
const client = new StompJs.Client({
  brokerURL: 'wss://app.example.com/ws',
  connectHeaders: { Authorization: `Bearer ${token}` },
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
  reconnectDelay: 0,                    // we manage backoff ourselves (below)
});

client.onConnect = () => {
  client.subscribe('/topic/orders/42', msg => render(JSON.parse(msg.body)));
  client.subscribe('/user/queue/order-updates', msg => updateUI(JSON.parse(msg.body)));
  client.publish({ destination: '/app/orders/42/subscribe', body: '{}' });
};
client.activate();
```

### Security

- **`wss://` only** (TLS) - prevents eavesdropping and MitM.
- **Validate `Origin`** during handshake (`setAllowedOriginPatterns`) to stop cross-site WebSocket hijacking (CSWSH). Cookies are sent automatically on handshake, so Origin checking is mandatory if you use cookie auth.
- **Authenticate at CONNECT**, not just at the HTTP handshake. Browsers can't set headers on `new WebSocket()`, so use a STOMP `CONNECT` header, a short-lived ticket in the URL, or cookies. Avoid long-lived JWTs in query strings (they land in access logs).
- **Authorize every SUBSCRIBE/SEND** (users must not subscribe to `/topic/orders/other-users-id`).
- Rate-limit messages per session; cap frame size; cap connections per user/IP.

```java
@Component
public class JwtAuthChannelInterceptor implements ChannelInterceptor {
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null) return message;

        if (StompCommand.CONNECT.equals(acc.getCommand())) {
            String token = Optional.ofNullable(acc.getFirstNativeHeader("Authorization"))
                    .map(h -> h.replaceFirst("^Bearer ", ""))
                    .orElseThrow(() -> new MessagingException("Missing token"));
            acc.setUser(jwtService.authenticate(token));            // sets Principal for the session
        }
        if (StompCommand.SUBSCRIBE.equals(acc.getCommand())) {
            subscriptionAuthorizer.check(acc.getUser(), acc.getDestination()); // throw on deny
        }
        return message;
    }
}
```

---

## Heartbeat, Reconnection & Resume

Connections die silently (NAT timeouts, mobile network switches, LB idle timeouts). You need **detection**, **backoff** and **resume**.

```javascript
// Reconnect with exponential backoff + full jitter (avoids thundering herd after an outage)
class ReconnectingSocket {
  constructor(url) { this.url = url; this.retries = 0; this.lastSeq = 0; }

  connect() {
    this.ws = new WebSocket(`${this.url}?resumeFrom=${this.lastSeq}`);
    this.ws.onopen = () => { this.retries = 0; };
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.seq <= this.lastSeq) return;           // dedupe replays
      this.lastSeq = m.seq;
      this.onMessage(m);
      this.ws.send(JSON.stringify({ ack: m.seq })); // or batch acks
    };
    this.ws.onclose = () => {
      const cap = Math.min(30000, 1000 * 2 ** this.retries++);
      setTimeout(() => this.connect(), Math.random() * cap);   // full jitter
    };
  }
}
```

| Concern | Technique |
|---|---|
| Dead peer detection | App/STOMP heartbeats or WS ping/pong; close after 2 missed intervals |
| Idle timeouts | Heartbeat interval < smallest LB/proxy timeout (ALB 60s default, nginx `proxy_read_timeout`) |
| Reconnect storms | Exponential backoff **with jitter**; server-side connection-rate limits; `Retry-After` on 503 |
| Lost messages | Per-stream monotonic `seq`; client acks; server retains window in Redis Stream / Kafka / DB |
| Duplicates | Client dedupes by `seq` / message ID (delivery is at-least-once) |
| Gap too large | Server replies `RESYNC` -> client refetches full state via REST, then resumes live stream |

**Pattern**: *snapshot + stream*. Client fetches a snapshot with version N over REST, then subscribes from N+1. Never rely on the stream alone for correctness.

---

## Delivery Guarantees & Ordering

WebSocket/SSE give you an **ordered byte stream per connection**, nothing more. Everything else is on you.

- **Default is at-most-once** per connection: if the socket drops mid-send, the message is lost unless you persist and replay.
- **At-least-once** = persist event -> send -> client ack -> retry/replay on reconnect. Make clients idempotent.
- **Ordering** holds per connection and per partition key. Across nodes/partitions it breaks. Key by room/user/entity (Kafka partition key) and carry a sequence number.
- **Exactly-once** is effectively "at-least-once + idempotent consumer".
- Durable inbox (DB) is the source of truth; real-time channels are a **latency optimization** on top of it.

---

## Scaling Real-Time Connections

### The Problem

WebSocket/SSE connections are **stateful** - tied to a specific server instance.

```
User A ──── Server 1
User B ──── Server 2

A sends to B: Server 1 has no connection to B!
```

### Solution: Pub/Sub Backplane Between Servers

```
User A → Server 1 → [Publish to Redis/Kafka/RabbitMQ] → Server 2 → User B
```

| Backplane | Pros | Cons |
|---|---|---|
| **Redis Pub/Sub** | Very low latency, trivial | Fire-and-forget; subscriber down = message lost; no replay |
| **Redis Streams** | Replay, consumer groups | More plumbing |
| **Kafka** | Durable, replay, ordering per key | Higher latency; each gateway needs its own consumer group (broadcast) or key-routing |
| **RabbitMQ (STOMP relay)** | Native Spring STOMP broker relay, user destinations | Broker is a new component to run |

**Spring STOMP broker relay** targets a STOMP-capable broker (RabbitMQ with the STOMP plugin, ActiveMQ), **not Redis**:

```java
config.enableStompBrokerRelay("/topic", "/queue")
      .setRelayHost("rabbitmq-host")
      .setRelayPort(61613)                     // RabbitMQ STOMP plugin default
      .setClientLogin("app").setClientPasscode("secret")
      .setSystemLogin("app").setSystemPasscode("secret");
```

**Redis Pub/Sub backplane** with the simple broker (each node delivers to its own local sessions):

```java
@Configuration
public class RedisBackplaneConfig {

    @Bean
    RedisMessageListenerContainer container(RedisConnectionFactory cf, MessageListener listener) {
        var c = new RedisMessageListenerContainer();
        c.setConnectionFactory(cf);
        c.addMessageListener(listener, new PatternTopic("rt:user:*"));
        return c;
    }

    @Bean
    MessageListener listener(SimpMessagingTemplate template, ObjectMapper om) {
        return (message, pattern) -> {
            RtEnvelope env = om.readValue(message.getBody(), RtEnvelope.class);
            // Local delivery; users not connected to this node are simply ignored
            template.convertAndSendToUser(env.username(), "/queue/events", env.payload());
        };
    }
}

@Service
public class RealtimePublisher {
    private final StringRedisTemplate redis;
    public void publish(String username, Object payload) {
        redis.convertAndSend("rt:user:" + username, toJson(new RtEnvelope(username, payload)));
    }
}
```

Every node receives every message (O(nodes) fan-out). At large scale, shard channels (`rt:shard:{hash(user) % N}`) so each node subscribes only to shards of users it hosts, or keep a **user -> node** routing table in Redis and publish directly to that node's channel.

### Sticky Sessions (Alternative)

Route a client to the same node on reconnect (LB cookie or consistent hashing on user ID). Helps with in-memory state and replay buffers, but hurts rebalancing and failure recovery. **WebSocket itself does not need stickiness** once the connection is established (it is one TCP connection); stickiness only matters for SockJS fallback transports and node-local state.

### Capacity Planning

- Each connection costs memory (kernel socket buffers + app buffers, commonly ~10-50 KB+), a file descriptor, and heartbeat CPU. 
- Raise `ulimit -n`, `net.core.somaxconn`, ephemeral port range; LB limits connections per target.
- Netty/WebFlux or virtual threads handle 100K+ idle connections/node; platform-thread-per-connection (classic Tomcat) tops out far lower.
- **Separate gateway tier** (connection handling only) from business logic; gateways stay thin and stateless apart from the socket.
- **Graceful deploys**: stop accepting, send a `reconnect` hint with jitter, drain over minutes, otherwise a rolling deploy triggers a reconnect storm.

---

## Push Notifications

For mobile/offline users (can't maintain WebSocket connection). Delivery is **best effort**, may be delayed, throttled, collapsed or dropped by the OS; never use push as the only copy of important data.

```
App Server → APNs (iOS) or FCM (Android/Web) → Device
```

```java
@Service
public class PushNotificationService {

    public CompletableFuture<Void> sendToDevice(DeviceToken token, String title, String body, String collapseKey) {
        Message message = Message.builder()
            .setToken(token.value())
            .setNotification(Notification.builder().setTitle(title).setBody(body).build())
            .setAndroidConfig(AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH)
                .setCollapseKey(collapseKey)                   // newer replaces older
                .setTtl(Duration.ofHours(1).toMillis())
                .build())
            .build();

        return toCompletable(FirebaseMessaging.getInstance().sendAsync(message))
            .thenAccept(id -> meter.counter("push.sent").increment())
            .exceptionally(ex -> {
                if (ex.getCause() instanceof FirebaseMessagingException fme
                        && fme.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                    deviceRepo.delete(token);                  // prune dead tokens
                }
                meter.counter("push.failed").increment();
                return null;
            });
    }
}
```

Production notes: prune invalid tokens, honor user preferences/quiet hours, collapse keys for superseded state, TTLs for time-sensitive content, batch/topic sends for broadcast, rate-limit per user, use data messages + local rendering when you need app logic.

---

## Core Real-Time Use Cases: Google Docs, Chat Systems & Notifications

**Yes — Google Docs (collaborative online editors), Chat Systems, and Real-Time Notifications are the three flagship real-world use cases of Real-Time Updates.** However, they solve **fundamentally different consistency and conflict-resolution problems**, so a Senior/Staff engineer never designs them with the same architecture:

<RealTimeUseCasesArchitectureDiagram />

| Use Case | Primary Transport | Directionality | Hardest Engineering Problem | Source of Truth & Conflict Engine |
|:---|:---|:---|:---|:---|
| **1. Google Docs / Online Editor** | **WebSocket** + REST Snapshot | Bidirectional, high-frequency keystroke deltas | Merging concurrent edits at the same cursor position without locking | **OT (Operational Transformation)** or **CRDT** + append-only op-log + S3 snapshots |
| **2. Real-Time Chat (WhatsApp / Slack)** | **WebSocket** (online) + **APNs/FCM Push** (offline) | Bidirectional, medium frequency | Strict per-conversation ordering, offline catch-up, multi-device sync, 10k-member channels | Durable message DB (`(channel_id, bucket)`) + Snowflake/ULID `seq` + Redis `user → node` map |
| **3. Real-Time Notifications** | **SSE (`Last-Event-ID`)** + **APNs/FCM Push** | Unidirectional (Server $\to$ Client) | Zero lost alerts, user preference filtering, deduplication/collapsing, celebrity fan-out | **Transactional Outbox** $\to$ Kafka (`userId`) $\to$ Durable Inbox DB + Presence check |

---

### Use Case 1: Building a Google Docs-Style Online Collaborative Editor

A collaborative editor cannot lock the document while User A types, nor can it use naive *"last-write-wins"* (which silently overwrites User B's paragraph).

#### Core Architecture & Logic
1. **Initial Load (`Snapshot + Stream`)**: Client opens the document via `GET /docs/{docId}/snapshot` (receives `content` + `revision = 1042`) and immediately opens a WebSocket room subscription for `docId` starting at `revision = 1043`.
2. **Consistent-Hashed Stateful Document Server**:
   - The Load Balancer / Gateway routes all collaborators of `docId` to the **same Document Collaboration Server** using consistent hashing on `docId`.
   - Keeping the active document's state and revision counter in memory on one primary node lets you serialize operations sequentially without distributed locks per keystroke.
3. **Conflict Resolution Engine — OT vs. CRDT**:
   - **Operational Transformation (OT — used by Google Docs)**:
     - Client A and Client B both start at `revision = 10`. Client A sends `Insert("X", pos=2, baseRev=10)`; Client B concurrently sends `Insert("Y", pos=0, baseRev=10)`.
     - The server commits B first (`rev = 11`). When A's op arrives with `baseRev = 10 < currentRev (11)`, the server transforms A's position against op 11: since `"Y"` was inserted at `pos=0` (before `pos=2`), A's transformed op becomes `Insert("X", pos=3, rev=12)`.
   - **CRDTs (Yjs / Automerge — used by Figma, Linear, Notion)**:
     - Every character gets a globally unique, immutable ID `(clientId, lamportClock)` and fractional/linked-list positioning (e.g., RGA / YATA). Merging two concurrent edits is mathematically **commutative, associative, and idempotent**—even across offline clients!
4. **Separate Durable Edits from Ephemeral Cursor Presence**:
   - Document character deltas go through the OT/CRDT engine $\to$ **Append-Only Op-Log** (and periodic snapshot compaction every 500 ops).
   - Live cursor positions and text selections are throttled (`50–100ms`) and broadcast over **ephemeral Redis Pub/Sub**—never persisted to disk.

```java
package com.knowledge.systemdesign.realtime;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal in-memory Operational Transformation (OT) sequencer for one active document room.
 * In production, each committed op is appended durably (WAL/DB) and broadcast to room WebSockets.
 */
public final class DocumentOtSequencer {

    public enum OpType { INSERT, DELETE }

    public record TextOp(String opId, String clientId, int baseRevision, OpType type, int pos, String text) {}
    public record CommittedOp(int revision, String opId, String clientId, OpType type, int pos, String text) {}

    private final List<CommittedOp> opLog = new ArrayList<>();
    private final Map<String, CommittedOp> idempotentOps = new HashMap<>();

    public synchronized CommittedOp apply(TextOp incoming) {
        // 1. Idempotency guard for WebSocket reconnect retries
        CommittedOp existing = idempotentOps.get(incoming.opId());
        if (existing != null) {
            return existing;
        }

        // 2. Transform incoming op against all ops committed since incoming.baseRevision()
        int transformedPos = incoming.pos();
        for (int i = incoming.baseRevision(); i < opLog.size(); i++) {
            CommittedOp concurrent = opLog.get(i);
            if (concurrent.type() == OpType.INSERT && concurrent.pos() <= transformedPos) {
                transformedPos += concurrent.text().length();
            } else if (concurrent.type() == OpType.DELETE && concurrent.pos() < transformedPos) {
                transformedPos = Math.max(concurrent.pos(), transformedPos - concurrent.text().length());
            }
        }

        // 3. Assign monotonic server revision and append to log
        int nextRevision = opLog.size() + 1;
        CommittedOp committed = new CommittedOp(
                nextRevision, incoming.opId(), incoming.clientId(),
                incoming.type(), transformedPos, incoming.text()
        );
        opLog.add(committed);
        idempotentOps.put(incoming.opId(), committed);
        return committed;
    }
}
```

---

### Use Case 2: Building a Real-Time Chat System (1:1 & Group Messaging)

Unlike Google Docs, chat messages are **immutable append-only records** where **durability and strict per-conversation ordering** matter more than sub-character conflict merging.

#### Core Architecture & Logic
1. **Idempotent Send + Persist-Before-Push**:
   - Sender attaches a client-generated UUID (`clientMsgId`) over WebSocket.
   - Chat Service assigns a time-sortable **Snowflake / ULID `messageId`** and a per-conversation monotonic **`seq`**, then writes to the Message Store (`Cassandra / ScyllaDB` partitioned by `(conversation_id, month_bucket)` or sharded PostgreSQL) **before** sending over the socket.
2. **Targeted Cross-Node Routing (`user -> gatewayNodeId`)**:
   - Instead of broadcasting every chat message to all 100 WebSocket gateway nodes ($O(N)$ noise), gateways register online connections in Redis (`HSET rt:user:{userId} {connId} {gatewayNodeId}` with TTL).
   - Chat Service publishes only to the specific `rt:node:{gatewayNodeId}` channel(s) hosting the recipient's active devices.
3. **Multi-Device Sync & Offline Catch-Up**:
   - If Recipient B is offline (`SCARD presence:conn:{userId} == 0`), Chat Service triggers **APNs / FCM Push**.
   - When B's phone wakes up, it sends `GET /conversations/{id}/messages?afterSeq={lastSeq}` (or WebSocket `resumeFrom`) to pull missed messages seamlessly.
4. **Group Chat Fan-Out & Read Receipts**:
   - For small groups (`< 500` members), fan out notifications per member; for large Slack/Discord channels (`10,000+` members), publish to a **channel topic** for currently online subscribers only, and let offline members fetch unread counts on open.
   - Store a single **`last_read_seq` watermark** per `(userId, conversationId)` rather than writing a database row per message read.

---

### Use Case 3: Building a Real-Time Notification System

Notifications (order status updates, PR reviews, social likes, banking fraud alerts) are **unidirectional server-to-client** events—making **SSE + Push Notifications** cleaner and far cheaper to operate than full-duplex WebSockets.

```
Event Source (DB via Transactional Outbox / CDC)
      ↓
Kafka topic: "notifications" (key = userId)
      ↓
Notification Router (consumer group)
      ├─ Preference / quiet-hours filter, rate limit, & burst collapsing ("12 others liked...")
      ├─ Always FIRST: write to Durable Inbox (DB) with UNIQUE(event_id) + monotonic seq
      ├─ User online? (Redis presence) → publish to backplane → Gateway → SSE (Last-Event-ID) / WS
      └─ User offline? → Push (FCM / APNs) with collapseKey
```

#### Core Architecture & Logic
- **Transactional Outbox + Kafka (`key = userId`)**: Prevents losing notifications when a database transaction commits but Kafka is momentarily unreachable.
- **Inbox Is Truth; SSE/Push Is Acceleration**: Always persist to the `notifications` inbox table before pushing. If the user's SSE stream drops, `EventSource` automatically reconnects with `Last-Event-ID` and replays from the inbox.
- **Celebrity / Broadcast Fan-Out**: Never write 10M rows to `notifications` when a celebrity posts (`Fan-out-on-Write`). Instead, use **Fan-out-on-Read** (pulling from a shared `celebrity_announcements` stream merged at read time).

---

## Presence System (Online/Offline)

Track **connections**, not users - a user may have several tabs/devices.

```
On connect:     SADD   presence:conn:{userId} {connId}    + EXPIRE key 60
                SETEX  presence:node:{connId} 60 {nodeId}
On heartbeat:   EXPIRE presence:conn:{userId} 60  (every ~30s)
On disconnect:  SREM   presence:conn:{userId} {connId}
Online = SCARD presence:conn:{userId} > 0
```

- TTL covers crashed nodes (no disconnect event ever arrives).
- Debounce transitions (~5-10s) so flaky mobile networks don't flap online/offline.
- Broadcast changes only to interested parties (friends/room members) via pub/sub; don't broadcast to everyone.
- Redis keyspace notifications on expiry are unreliable as a sole signal; prefer a periodic sweep or heartbeat-driven events.

---

## Observability (Micrometer / Prometheus)

```java
@Component
public class RealtimeMetrics {
    private final AtomicInteger wsSessions = new AtomicInteger();

    public RealtimeMetrics(MeterRegistry registry) {
        Gauge.builder("rt.ws.sessions", wsSessions, AtomicInteger::get).register(registry);
    }

    @EventListener void onConnect(SessionConnectedEvent e)    { wsSessions.incrementAndGet(); }
    @EventListener void onDisconnect(SessionDisconnectEvent e) { wsSessions.decrementAndGet(); }
}
```

| Metric | Why |
|---|---|
| `rt.ws.sessions` / SSE emitters | Connections per node; capacity and skew |
| Connect / disconnect rate, close codes | Reconnect storms, flapping, deploy impact |
| End-to-end delivery latency (event time → client receive/ack) | The actual SLO |
| Outbound buffer size, send timeouts, dropped messages | Slow-consumer detection |
| Backplane lag (Kafka consumer lag / Redis publish errors) | Cross-node delivery health |
| Replay/resync count | Message loss indicators |
| Push success / `UNREGISTERED` ratio | Token hygiene |
| Heap/direct memory, FDs, GC pauses per node | Connection-count scaling limits |

Alert on: sudden session drop (>X% in 1 min), reconnect rate spike, p99 delivery latency, backplane lag.

---

## Failure Modes

| Failure | Symptom | Mitigation |
|---|---|---|
| Node crash / deploy | All its clients reconnect at once | Jittered backoff, connection-rate limiting, graceful drain, resume from `seq` |
| Slow consumer | Outbound buffers grow, OOM, head-of-line blocking | `sendTimeLimit`, `sendBufferSizeLimit`, drop/disconnect policy, per-connection queue caps |
| Silent dead connection | Server thinks client online | Heartbeats + timeouts, TTL presence |
| LB/proxy idle timeout | Streams cut every ~60s | Heartbeat < timeout; raise `proxy_read_timeout`; disable buffering |
| Backplane partition / Redis Pub/Sub loss | Missed cross-node messages | Durable log (Kafka/Streams) + client resume, periodic reconciliation |
| Duplicate delivery on replay | Double notifications | Idempotent clients keyed by message ID / `seq` |
| Cross-node reordering | Out-of-order updates | Key by entity, sequence numbers, client reorder buffer |
| Memory/FD exhaustion | Refused connections | Per-node connection caps, backpressure at LB, autoscale on session count |
| Auth expiry on long-lived socket | Revoked users stay connected | Periodic token revalidation, server-initiated close, short-lived tickets |
| Hot room/topic | One partition/channel saturated | Shard topic, fan-out tiers, fan-out-on-read |
| Registry leak | Emitters/sessions never removed | `onCompletion/onTimeout/onError` cleanup, scheduled sweep |

---

## Interview Questions

### Q: What's the difference between WebSocket and SSE? When would you choose each?

**A:** WebSocket is full-duplex over a single upgraded TCP connection: use for chat, gaming, collaboration. SSE is server-to-client over plain HTTP with built-in reconnect and `Last-Event-ID` resume: use for feeds, notifications, progress and token streaming. Choose SSE unless the client needs to send frequent low-latency messages.

### Q: How do you scale a WebSocket-based chat app to 1 million concurrent connections?

**A:** Thin gateway tier on non-blocking IO (Netty/WebFlux or virtual threads), tuned FDs/kernel limits, ~50-100K connections per node. Gateways subscribe to a pub/sub backplane (sharded Redis/Kafka) and deliver only to local sessions; a user -> node map avoids broadcasting every message to every node. Persist messages in a durable store keyed by room with sequence numbers for resume. Rate-limit connects and drain gracefully on deploy to avoid reconnect storms.

### Q: What is the "sticky session" problem and how do you solve it?

**A:** Sticky sessions pin a client to one node, which skews load and makes failure recovery harder because state lives on that node. A WebSocket doesn't need stickiness once established; only node-local state and SockJS fallback do. Externalize presence, session and replay state (Redis/DB/Kafka) so any node can serve a reconnect, and use stickiness at most as an optimization.

### Q: How would you implement a real-time notification system for 10M users?

**A:** Emit events via outbox into Kafka keyed by user; a notification service applies preferences, dedupe and rate limits, writes to a durable inbox first, then delivers via WebSocket/SSE if the user is online (presence lookup + backplane) or FCM/APNs if offline. Real-time channels are best-effort accelerators; the inbox plus resume-from-seq is the source of truth. Handle large fan-out with fan-out-on-read and sharded topics.

### Q: How does long polling differ from short polling, and when is it preferable?

**A:** Short polling asks at fixed intervals and mostly gets empty responses; long polling holds the request until data or timeout, cutting empty responses and latency. It's preferable as a fallback where WebSocket/SSE are blocked. Must use a cursor so events between response and the next request aren't lost.

### Q: How do you build a presence system (online/offline indicators)?

**A:** Track connections per user in Redis with TTLs refreshed by heartbeats; online = at least one live connection. TTL handles crashed nodes. Debounce transitions to avoid flapping, and publish changes only to interested subscribers via pub/sub.

### Q: How do you handle reconnection and message recovery in a WebSocket system?

**A:** Per-stream monotonic sequence IDs, client acks, and a bounded retention window (Redis Streams/Kafka/DB). On reconnect the client sends its last seq and the server replays; if the gap exceeds retention, return RESYNC and refetch a snapshot via REST. Client dedupes by seq since delivery is at-least-once. Reconnect with exponential backoff and jitter.

### Q: What's the challenge of delivering ordered messages in a real-time system?

**A:** A single connection is ordered, but parallel consumers, retries, multiple nodes and regions reorder events. Preserve order per key (room/entity) via partition affinity (Kafka key), attach sequence numbers, and let clients buffer/reassemble or discard stale versions. Global ordering is rarely worth the cost.

### Q: How do you handle a slow consumer on a WebSocket?

**A:** Bound the per-session outbound buffer and send time (`setSendBufferSizeLimit`, `setSendTimeLimit`). On overflow choose an explicit policy: drop non-critical/conflatable updates (latest-wins), or close the session and let the client resume. Never let one slow client's buffer grow unbounded or block a shared broadcast loop.

### Q: Why can't you just use Redis Pub/Sub as the message backbone for guaranteed delivery?

**A:** It is fire-and-forget: no persistence, no acks, no replay. A disconnected subscriber loses messages. Fine for ephemeral signals (typing indicators, "refresh" hints); for guaranteed delivery use Kafka/Redis Streams plus client-driven resume.

### Networking & Protocol Implementation Questions

**Q1. What is the difference between WebSocket, SSE, and long polling?**
> Long polling: client requests, server holds until data or timeout; per-message HTTP overhead, works everywhere. SSE: one-way server→client stream over HTTP; native reconnection with `Last-Event-ID`, browser `EventSource`, text-only. WebSocket: full-duplex after HTTP upgrade; lowest per-message overhead, binary support, but stateful and harder to scale. Use SSE for push-only, WebSocket for two-way.

**Q2. How does the WebSocket handshake work?**
> The client sends an HTTP/1.1 GET with `Upgrade: websocket`, `Connection: Upgrade`, a random `Sec-WebSocket-Key` and `Sec-WebSocket-Version: 13`. The server replies `101 Switching Protocols` with `Sec-WebSocket-Accept` (SHA-1 of key + fixed GUID, base64) proving it understands the protocol. The same TCP connection then switches from HTTP to WebSocket frames (including ping/pong and close frames). No new TCP handshake is needed. Subprotocols (e.g. `v12.stomp`) are negotiated via `Sec-WebSocket-Protocol`.

**Q3. How do you scale WebSocket connections across multiple server instances?**
> Connections are stateful, so a client is attached to exactly one node. Use a backplane (Redis Pub/Sub or Streams, RabbitMQ, Kafka): the publishing node emits the event, every node (or only the node owning the target user, via a routing table) receives it and delivers to its local sessions. Spring supports this through the STOMP broker relay (RabbitMQ/ActiveMQ) or a custom Redis/Kafka listener calling `SimpMessagingTemplate`.

**Q4. What is STOMP and why would you use it over raw WebSocket?**
> STOMP adds messaging semantics to WebSocket: destinations, subscriptions, headers, receipts, heartbeats, and user-specific queues (`/user/queue/...`). Without it you hand-build routing and subscription management. Spring's `@MessageMapping`, `@SendTo` and `SimpMessagingTemplate` build on it, and the broker relay plugs into RabbitMQ/ActiveMQ. Trade-off: text framing and extra overhead; use raw WebSocket for custom binary or ultra-low-latency protocols.

**Q5. Why is HTTP keep-alive important for SSE connections, and what breaks it in practice?**
> SSE is one long-lived HTTP response that must not be closed or buffered. Intermediaries break it: nginx buffering (`proxy_buffering off`, `X-Accel-Buffering: no`), short `proxy_read_timeout`, ALB idle timeouts (default 60s), CDN response buffering (CloudFront needs streaming-friendly settings). Send heartbeat comments more often than the shortest timeout. On HTTP/1.1 remember the ~6 connections per origin limit.

**Q6. How does SSE handle reconnection?**
> `EventSource` reconnects automatically after a drop (delay controlled by the `retry:` field). The server tags events with `id:`; the browser sends the last one in a `Last-Event-ID` header, and the server replays from there. This works only if the server retains recent events per stream. Limitation: `EventSource` can't set custom headers, so auth is cookie-based or needs a fetch-based client.

**Q7. What are the security considerations for WebSocket connections?**
> Use `wss://`. Validate `Origin` at handshake to prevent CSWSH, especially with cookie auth (no SOP/CORS protection applies to WebSockets). Authenticate during CONNECT/handshake with short-lived tokens, avoid long-lived JWTs in URLs. Authorize every subscribe/send per destination, rate-limit, cap frame size and connections per user, and revalidate/expire tokens on long-lived sessions.

**Q8. When would you NOT use WebSockets?**
> When one-way push suffices (SSE is simpler and HTTP-native), when updates are infrequent (polling is fine), when responses benefit from HTTP caching/semantics (verbs, status codes, CDN), when intermediaries can't handle upgrades, or for backgrounded/offline mobile clients (use push notifications). Also avoid when your team can't operate stateful connection infrastructure (drain, reconnect storms, backplane).

**Q9. What are WebSocket ping/pong frames versus STOMP heartbeats?**
> Ping/pong are protocol-level control frames (browsers answer pings automatically but JS can't send them). STOMP heartbeats are application-level (negotiated in CONNECT `heart-beat`) and visible to client code, so they detect dead peers and keep intermediaries from idling out the connection. Spring requires a `TaskScheduler` for broker heartbeats.

**Q10. How do WebSocket close codes help operationally?**
> Codes like `1000` (normal), `1001` (going away, e.g. deploy), `1006` (abnormal, no close frame), `1008` (policy violation), `1011` (server error), `1013` (try again later) let clients decide reconnect behavior (immediate vs backoff vs give up) and let you chart disconnect reasons in metrics.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Real-Time Updates & Collaboration Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked *"Design Google Docs"*, *"Design WhatsApp/Slack"*, or *"Design a Real-Time Notification System"*, frame your architecture around four non-negotiable invariants before drawing boxes:

1. **Match Transport to Directionality & Network Reality**:
   - Open with: *"If the client only consumes server events (notifications, live feeds, LLM token streaming), I'll use **SSE over HTTP/2** for native `Last-Event-ID` resume and proxy friendliness. If the client sends high-frequency bidirectional deltas (chat, collaborative editing, multiplayer state), I'll use **WebSockets** paired with **APNs/FCM Push** for offline mobile wake-ups."*
2. **Separate Durable State from Ephemeral Real-Time Acceleration**:
   - State upfront: *"WebSockets and Redis Pub/Sub are **latency optimizations**, never the source of truth. Every durable message, document op, or notification is persisted to durable storage (`Op-Log`, `Message Store`, or `Inbox DB`) with monotonic sequence numbers **before** or **via Outbox** alongside socket delivery."*
3. **Quantify Connection & Fan-Out Physics**:
   - Anchor capacity math: *"A single Netty/WebFlux/Virtual-Thread gateway node holds ~50k–100k idle TCP sockets (`~20–50 KB` kernel + app buffers per socket $\approx 2\text{–}5\text{ GB}$ RAM). At 1M concurrent users, we run ~15–20 thin stateful gateway pods behind L4/L7 load balancers, using a `user -> gatewayNode` Redis routing table to avoid $O(N)$ cluster-wide broadcasts."*
4. **Proactively Design for Reconnect Storms & Slow Consumers**:
   - Call out **exponential backoff with full jitter** on client reconnects, **bounded per-socket outbound send buffers** (`setSendBufferSizeLimit`), and **graceful deploy draining** (`1001 Going Away` staggered over minutes).

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "For Google Docs, why not just send the full document JSON over WebSocket on every keystroke, or use database row locking (`SELECT ... FOR UPDATE`)?"
* **Junior/Mid Answer:** *"We can debounce 500ms and send the whole document text, or lock the paragraph in PostgreSQL while User A is typing."*
* **Principal Rebuttal:**
  > *"Both approaches collapse immediately under concurrent editing: locking a document or paragraph ruins collaboration latency and stalls if a user goes offline mid-edit, while last-write-wins full-document overwrites silently destroy concurrent edits by other users. Instead, we send tiny character-level **deltas** and use either **Operational Transformation (OT)**—where a consistent-hashed Document Server sequences operations against a monotonic `revision` and transforms out-of-date cursor indices—or **CRDTs (Yjs / Automerge)**—which assign globally unique `(clientId, lamportClock)` character IDs so concurrent edits merge commutatively without locks, even offline."*

#### Trap 2: "In our Chat / Notification system, we put Redis Pub/Sub between our WebSocket servers—doesn't Redis Pub/Sub guarantee every message reaches the user?"
* **Junior/Mid Answer:** *"Yes, Redis is super fast and keeps our chat servers decoupled so messages are always delivered."*
* **Principal Rebuttal:**
  > *"Standard Redis Pub/Sub is strictly **fire-and-forget**: if a recipient's WebSocket drops for 2 seconds in an elevator, or a gateway node restarts mid-publish, Redis discards the message permanently with zero persistence or replay. For guaranteed delivery, you must **persist the message/notification to a durable store (DB / Cassandra / Kafka) with a monotonic `seq` BEFORE pushing**, and have reconnecting clients execute `snapshot + stream` resume (`?afterSeq=N` or SSE `Last-Event-ID`). Reserve fire-and-forget Redis Pub/Sub strictly for ephemeral signals like typing indicators and live cursor positions."*

#### Trap 3: "When a celebrity with 10 million followers posts an update or triggers a notification, how do we push it in real time without melting our database?"
* **Junior/Mid Answer:** *"We loop over all 10 million follower IDs, insert 10 million rows into the `notifications` inbox table, and push 10 million WebSocket messages."*
* **Principal Rebuttal:**
  > *"Unbounded **Fan-out-on-Write** for a 10M-follower celebrity creates a massive write-amplification storm across both the database and Kafka/WebSocket backplane, delaying normal users' notifications by minutes. Instead, use a **Hybrid Fan-Out**: execute Fan-out-on-Write for normal users (`< 10k` followers), and switch to **Fan-out-on-Read** for celebrity/broadcast accounts—writing a single event to a shared stream and merging it into followers' feeds/inboxes lazily on poll or active-session push."*

#### Trap 4: "We deployed a rolling update of our WebSocket gateway fleet in Kubernetes, and the database + auth service immediately crashed from a thundering herd!"
* **Junior/Mid Answer:** *"We probably need to double the database CPU and add more auth pods."*
* **Principal Rebuttal:**
  > *"Terminating a gateway pod drops 50,000+ persistent WebSocket connections simultaneously. If clients reconnect immediately (`reconnectDelay = 0`) and immediately fire `GET /snapshot` + JWT verification, you hit your DB and auth tier with a synchronized 500k-QPS **reconnect storm**. The fix is two-fold: (1) On the server, drain connections gradually over 2–5 minutes during shutdown (`1001 Going Away`); (2) On the client, enforce **exponential backoff with full jitter** (`Math.random() * min(30s, 1s * 2^attempt)`) plus token-bucket connection rate-limiting at the gateway edge."*

---

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Real-Time Design Dimension | Mid-Level Candidate Says (L4) | Principal Candidate Demonstrates (L5+ / Staff) |
|:---|:---|:---|
| **Transport Selection** | *"Use WebSockets for everything real-time."* | *"Use **SSE (`Last-Event-ID`)** for unidirectional notifications/feeds; **WebSockets** for bidirectional chat/Docs; **APNs/FCM** for offline mobile."* |
| **Google Docs Concurrency** | *"Use optimistic locking or send the whole document every second."* | *"Use **OT (server revision sequencer + sticky `docId` routing)** or **CRDTs** for lock-free concurrent character merging, separating durable ops from ephemeral cursor presence."* |
| **Cross-Node Scaling** | *"Broadcast every message to all WebSocket servers via Redis Pub/Sub."* | *"Maintain a Redis `user -> gatewayNode` routing table (or sharded channels) to eliminate $O(N)$ cluster broadcasts, backed by durable `seq` replay."* |
| **Delivery & Ordering** | *"WebSocket uses TCP so messages are always ordered and never lost."* | *"TCP only orders bytes on one live socket; true reliability requires **persist-before-push**, **idempotency keys (`clientMsgId`)**, and **client `afterSeq` resume**."* |
| **Slow Consumers & Deploys** | *"Set a large buffer and reconnect immediately on disconnect."* | *"Cap `sendBufferSizeLimit` & `sendTimeLimit` per session to prevent OOM; use **graceful drain + full-jitter exponential backoff** to stop reconnect storms."* |