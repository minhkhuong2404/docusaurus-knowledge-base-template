---
id: real-time-updates
title: Real-Time Updates
sidebar_label: Real-Time Updates
description: Patterns for delivering real-time data to clients including WebSockets, Server-Sent Events, long polling, short polling, and push notification architectures.
tags: [real-time, websocket, sse, long-polling, push-notifications, kafka, streaming]
---

# Real-Time Updates

> "Real-time" means **low latency delivery of state changes** to clients. The right mechanism depends on directionality, scale, and latency requirements.

---

## Comparison of Delivery Mechanisms

| Mechanism | Direction | Latency | Overhead | Best For |
|---|---|---|---|---|
| **Short Polling** | Client → Server | High | High (many requests) | Simple, low-frequency checks |
| **Long Polling** | Client → Server | Medium | Medium | Fallback, low message rate |
| **SSE** | Server → Client | Low | Low | Unidirectional streams, feed updates |
| **WebSocket** | Bidirectional | Very Low | Medium | Chat, gaming, live collaboration |
| **WebRTC** | Peer-to-peer | Very Low | Low (after setup) | Video/audio, P2P data |

---

## Short Polling

Client repeatedly asks "any updates?"

```
Client: GET /messages?since=1234  (every 5 seconds)
Server: 200 OK [messages] or 204 No Content
```

**Problems**: Wastes resources even when no data. High QPS amplification.  
**When to use**: Simplest implementation, very infrequent updates (e.g., status check).

---

## Long Polling

Server holds request open until data is available or timeout.

```
Client → GET /updates (request held)
  ... server waits for new data ...
Server ← 200 OK [new data]  (after event or 30s timeout)
Client → immediately re-connects
```

**Pros**: Lower QPS than short polling. Simpler than WebSocket.  
**Cons**: One connection per client, high-memory server-side, latency on reconnect.

```java
// Spring MVC long polling with DeferredResult
@GetMapping("/updates")
public DeferredResult<ResponseEntity<List<Update>>> getUpdates(
        @RequestParam Long since) {
    DeferredResult<ResponseEntity<List<Update>>> result =
        new DeferredResult<>(30_000L); // 30s timeout

    updateRegistry.register(since, result);

    result.onTimeout(() ->
        result.setResult(ResponseEntity.ok(Collections.emptyList()))
    );
    return result;
}
```

---

## Server-Sent Events (SSE)

HTTP/1.1 persistent connection, server pushes text events.

```
GET /stream HTTP/1.1
Accept: text/event-stream

data: {"type":"notification","msg":"Hello"}

data: {"type":"update","count":42}
```

**Pros**: Simple protocol, auto-reconnect built into browser `EventSource`, works over HTTP/2.  
**Cons**: Unidirectional only. Browsers limit ~6 concurrent SSE connections.

```java
// Spring Boot SSE
@GetMapping(value = "/stream/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamEvents(@PathVariable Long userId) {
    SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
    sseRegistry.register(userId, emitter);

    emitter.onCompletion(() -> sseRegistry.remove(userId));
    emitter.onTimeout(() -> sseRegistry.remove(userId));

    return emitter;
}

// Push from anywhere
public void notifyUser(Long userId, Object payload) {
    SseEmitter emitter = sseRegistry.get(userId);
    if (emitter != null) {
        emitter.send(SseEmitter.event().data(payload));
    }
}
```

---

## WebSocket

Full-duplex, persistent TCP connection. True bidirectional.

```
HTTP Upgrade Handshake → WS persistent connection
Client ↔ Server (messages at any time, both directions)
```

### Spring Boot WebSocket
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue"); // Broker prefixes
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").withSockJS(); // Fallback support
    }
}

@Controller
public class ChatController {
    @MessageMapping("/chat.send")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage send(@DestinationVariable String roomId, ChatMessage msg) {
        return msg;
    }
}
```

---

## Scaling Real-Time Connections

### The Problem
WebSocket connections are **stateful** — they're tied to a specific server instance.

```
User A ──── Server 1
User B ──── Server 2

A sends to B: Server 1 has no connection to B!
```

### Solution: Pub/Sub Broker Between Servers

```
User A → Server 1 → [Publish to Redis/Kafka] → Server 2 → User B
```

```java
// Spring WebSocket + Redis pub/sub for cross-node delivery
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Use Redis-backed broker instead of in-memory
        config.enableStompBrokerRelay("/topic", "/queue")
              .setRelayHost("redis-host")
              .setRelayPort(61613); // STOMP-over-Redis via Redisson
    }
}
```

### Sticky Sessions (Alternative)
Route users to the same server consistently using consistent hashing on user ID at the load balancer. Simpler but limits flexibility.

---

## Push Notifications

For mobile/offline users (can't maintain WebSocket connection).

```
App Server → APNs (iOS) or FCM (Android) → Device
```

```java
// Firebase Cloud Messaging (FCM) - Spring Boot
@Service
public class PushNotificationService {
    public void sendToDevice(String fcmToken, String title, String body) {
        Message message = Message.builder()
            .setToken(fcmToken)
            .setNotification(Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build())
            .build();

        FirebaseMessaging.getInstance().sendAsync(message);
    }
}
```

---

## Architecture: Real-Time Notification System

```
Event Source (DB, Service)
      ↓
Kafka topic: "notifications"
      ↓
Notification Service (consumer)
      ├─ User online? → WebSocket / SSE delivery
      └─ User offline? → Push notification (FCM/APNs)
                       → Store in DB (inbox)
```

---

## Presence System (Online/Offline)

```
On connect:  SETEX user:presence:{userId} 60 "online"  (Redis TTL)
On message:  Refresh TTL
On disconnect: DEL user:presence:{userId}
Heartbeat:   Client pings every 30s to refresh TTL
```

---


## Spring WebSocket + STOMP

STOMP (Simple Text Oriented Messaging Protocol) adds pub-sub semantics over WebSocket.

```java
// Spring WebSocket configuration
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");  // in-memory broker
        // or: config.enableStompBrokerRelay("/topic", "/queue")  // RabbitMQ/ActiveMQ
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("https://*.example.com")
                .withSockJS();  // fallback for browsers without WebSocket
    }
}

// Controller handling incoming WebSocket messages
@Controller
public class OrderWebSocketController {

    @MessageMapping("/orders/{orderId}/subscribe")
    @SendTo("/topic/orders/{orderId}")
    public OrderStatus subscribe(@DestinationVariable Long orderId,
                                  Principal principal) {
        return orderService.getStatus(orderId);
    }

    // Push update to specific user
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyOrderUpdate(Long userId, OrderUpdate update) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/order-updates",
            update
        );
    }
}
```

```javascript
// JavaScript client
const socket = new SockJS('/ws');
const client = Stomp.over(socket);

client.connect({}, () => {
    // Subscribe to order updates
    client.subscribe('/topic/orders/42', (msg) => {
        const update = JSON.parse(msg.body);
        console.log('Order update:', update);
    });

    // Subscribe to personal queue
    client.subscribe('/user/queue/order-updates', (msg) => {
        const update = JSON.parse(msg.body);
        updateUI(update);
    });

    // Send message to server
    client.send('/app/orders/42/subscribe', {}, JSON.stringify({}));
});
```

---


## Heartbeat & Reconnection

```javascript
// WebSocket reconnection with exponential backoff
class ReconnectingWebSocket {
    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onclose = () => {
            const delay = Math.min(1000 * 2 ** this.retries, 30000);
            setTimeout(() => { this.retries++; this.connect(); }, delay);
        };

        this.ws.onopen = () => { this.retries = 0; };  // reset on success
    }
}

// STOMP heartbeat
client.connect(
    { 'heart-beat': '10000,10000' },  // send/receive heartbeat every 10s
    onConnected
);
```

---


## Interview Questions

### Q: What's the difference between WebSocket and SSE? When would you choose each?

**A:** WebSocket is full-duplex and better for interactive bidirectional flows like chat. SSE is server-to-client only, simpler over HTTP, and ideal for one-way live feeds.

### Q: How do you scale a WebSocket-based chat app to 1 million concurrent connections?

**A:** Use many stateless gateway nodes, shard connection state by user/channel, and fan out via pub/sub backplane. Tune kernel/socket limits and place gateways close to users.

### Q: What is the "sticky session" problem and how do you solve it?

**A:** Sticky sessions couple a client to one node, hurting rebalancing and failure recovery. Externalize session/presence state to Redis or a broker so any node can serve reconnections.

### Q: How would you implement a real-time notification system for 10M users?

**A:** Ingest events into a queue, apply preference/routing rules, then push via WebSocket/SSE/mobile push channels. Store durable notification state for retries and offline delivery.

### Q: How does long polling differ from short polling, and when is it preferable?

**A:** Short polling asks at fixed intervals; long polling holds the request until update or timeout, reducing empty responses. Prefer long polling when WebSockets are unavailable but near-real-time is needed.

### Q: How do you build a presence system (online/offline indicators)?

**A:** Track heartbeats with TTL in an in-memory store and derive online status from recent activity windows. Broadcast presence changes through a lightweight pub/sub channel.

### Q: How do you handle reconnection and message recovery in a WebSocket system?

**A:** Issue sequence IDs and client ack checkpoints so reconnecting clients request missed messages from a retention store. Use exponential backoff and session resume tokens.

### Q: What's the challenge of delivering ordered messages in a real-time system?

**A:** Parallel consumers and network retries cause reordering across partitions and regions. Preserve order per key/room with partition affinity and sequence-based reassembly.


### Networking & Protocol Implementation Questions


**Q1. What is the difference between WebSocket, SSE, and long polling?**
> Long polling: client requests, server holds until data or timeout; high overhead, works everywhere. SSE (Server-Sent Events): one-way server→client stream over HTTP; native reconnection, browser-native `EventSource`, text-only. WebSocket: full-duplex bidirectional connection after HTTP upgrade; lowest overhead per message, binary support, but needs more infrastructure (scaling). Use SSE for push-only, WebSocket for two-way communication.

**Q2. How does the WebSocket handshake work?**
> WebSocket begins as an HTTP request with `Upgrade: websocket` and `Connection: Upgrade` headers plus a random `Sec-WebSocket-Key`. The server responds with `101 Switching Protocols` and a derived `Sec-WebSocket-Accept` value. After this, the TCP connection is no longer HTTP — both ends exchange lightweight WebSocket frames directly. The HTTP upgrade reuses the existing TCP connection with no new handshake.

**Q3. How do you scale WebSocket connections across multiple server instances?**
> WebSocket connections are stateful — a client is connected to one specific server. To scale: use a shared message broker (Redis Pub/Sub, RabbitMQ, Kafka). Each server subscribes to all channels; when a server needs to push to a client connected elsewhere, it publishes to the broker; all servers receive it and the one with the connected client forwards it. Spring WebSocket supports this via STOMP broker relay.

**Q4. What is STOMP and why would you use it over raw WebSocket?**
> STOMP (Simple Text Oriented Messaging Protocol) adds structured messaging semantics on top of raw WebSocket: topic subscriptions, message headers, receipts, and error handling. Without STOMP, you'd implement your own message routing. STOMP provides pub/sub patterns, user-specific queues (`/user/queue/...`), and integrates with message brokers (RabbitMQ, ActiveMQ). Spring's `SimpMessagingTemplate` builds on STOMP.

**Q5. Why is HTTP keep-alive important for SSE connections?**
> SSE relies on a persistent HTTP connection — the server holds the connection open and streams events. HTTP keep-alive prevents the connection from being closed after the first response. Standard HTTP proxies and load balancers may buffer the response or impose timeouts. Configure your proxy with `proxy_read_timeout` / `proxy_buffering off` (nginx) to allow long-lived SSE streams through. CloudFront, by default, buffers responses which breaks SSE — must configure for streaming.

**Q6. How does SSE handle reconnection?**
> The browser's `EventSource` API automatically reconnects when the connection drops. The server sends `id: <eventId>` with each event. On reconnect, the browser sends `Last-Event-ID: <lastId>` header. The server uses this to replay missed events from that ID forward. This built-in mechanism makes SSE reliable without application code for reconnection logic — unlike raw WebSocket.

**Q7. What are the security considerations for WebSocket connections?**
> Use `wss://` (WebSocket over TLS) to prevent eavesdropping and MitM. Validate the `Origin` header during handshake to prevent cross-site WebSocket hijacking (CSWSH) — only accept connections from your own domains. Implement authentication before the upgrade (check JWT/cookie in the HTTP handshake or first message). Implement rate limiting and message size limits (malicious clients can send huge frames). Use CORS-like origin restrictions in Spring via `setAllowedOriginPatterns`.

**Q8. When would you NOT use WebSockets?**
> When one-way server push is sufficient (use SSE — simpler, HTTP-native, no upgrade). When connections are short-lived (HTTP is more appropriate). When working behind HTTP/1.1 proxies that don't understand WebSocket upgrade (SSE uses regular HTTP). When caching is important (HTTP responses can be cached; WebSocket messages cannot). For public API access where HTTP semantics (verbs, status codes, caching) are valuable.