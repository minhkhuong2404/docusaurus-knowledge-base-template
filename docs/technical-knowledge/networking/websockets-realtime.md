---
id: websockets-realtime
title: WebSockets & Real-Time Communication
description: WebSocket protocol, Server-Sent Events, long polling, STOMP over WebSocket, and real-time system design patterns.
tags: [networking, websocket, sse, real-time, stomp, long-polling, spring-websocket, push]
sidebar_position: 12
---

# WebSockets & Real-Time Communication

## The Problem: HTTP is Pull-Based

Standard HTTP requires the **client to initiate** every request. For real-time use cases (chat, notifications, live dashboards), this is a problem — the server can't push updates to the client unprompted.

**Solutions**, from worst to best:

```
1. Short Polling     → Client asks every N seconds ("any news?")
2. Long Polling      → Client asks, server holds until data or timeout
3. Server-Sent Events → Server pushes events over one-way HTTP stream
4. WebSockets        → Full-duplex persistent connection
```

---

## Short Polling

```
Client ──GET /updates──► Server   "any news?"
Server ──────────────── 200 []    "no"  (returns immediately)
... wait 2 seconds ...
Client ──GET /updates──► Server   "any news?"
Server ──────────────── 200 []    "no"
... wait 2 seconds ...
Client ──GET /updates──► Server   "any news?"
Server ──────────────── 200 [msg] "yes!"
```

- ❌ Wasteful (many empty responses)
- ❌ Latency = polling interval / 2 on average
- ❌ Server load proportional to clients × frequency
- ✅ Simple to implement
- ✅ Works through all firewalls and proxies

---

## Long Polling

```
Client ──GET /updates──► Server   "any news? I'll wait"
Server  ........... (holds request) ........
Server ──────────────── 200 [msg]  "here's an event" (when data available)
Client ──GET /updates──► Server   "any more?" (immediately re-requests)
```

- ✅ Low latency when data arrives
- ✅ Works through firewalls
- ❌ One thread per client blocked waiting
- ❌ Complex timeout and reconnection handling
- ❌ HTTP overhead per "event" (headers, etc.)
- Used by: legacy chat systems, older notification systems

---

## Server-Sent Events (SSE)

A simple, one-way server → client event stream over HTTP.

```
GET /events HTTP/1.1
Accept: text/event-stream

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

data: {"type":"ORDER_UPDATE","orderId":42,"status":"shipped"}\n\n

data: {"type":"NOTIFICATION","message":"Your order has shipped"}\n\n

event: heartbeat
data: {}\n\n
```

**SSE format:**
```
event: <event-name>    (optional)
id: <event-id>         (for reconnect — browser re-sends Last-Event-ID)
data: <payload>        (can be multiple lines)
retry: <ms>            (reconnect delay)
                       (blank line = event boundary)
```

**SSE features:**
- ✅ Built-in reconnection with `Last-Event-ID`
- ✅ Works over HTTP/1.1 (no protocol upgrade)
- ✅ Native browser support (`EventSource` API)
- ✅ Works through HTTP proxies
- ❌ One-way only (server → client)
- ❌ Text-only (no binary)

```java
// Spring SSE
@GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<OrderUpdate>> streamEvents(@RequestParam Long userId) {
    return orderEventService.getEventStream(userId)
        .map(event -> ServerSentEvent.<OrderUpdate>builder()
            .id(String.valueOf(event.getEventId()))
            .event("order-update")
            .data(event.getData())
            .comment("heartbeat")
            .build());
}
```

---

## WebSocket Protocol

WebSocket provides **full-duplex, bidirectional** communication over a persistent connection.

### WebSocket Handshake

```
Client → Server:
GET /ws HTTP/1.1
Host: api.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==  (random base64)
Sec-WebSocket-Version: 13

Server → Client:
HTTP/1.1 101 Switching Protocols    ← upgrades from HTTP to WS
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=  (derived from key)

→ WebSocket connection established
→ Both sides can now send frames at any time
```

### WebSocket Frame Format

```
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 ...
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼
│F│R│R│R│ opcode│M│   Payload length   │
│I│S│S│S│       │A│                   │
│N│V│V│V│       │S│                   │
│ │1│2│3│       │K│                   │

FIN: final fragment
Opcode: 0x1=text, 0x2=binary, 0x8=close, 0x9=ping, 0xA=pong
MASK: client→server frames must be masked (security)
```

### WebSocket vs HTTP Overhead

```
HTTP request: ~800 bytes headers + data per message
WebSocket frame: 2–10 bytes overhead per message (after initial handshake)

For high-frequency messages: WebSocket is vastly more efficient
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

## Scaling WebSockets

WebSocket connections are **stateful** — a client must stay connected to the same server instance.

```
Problem:
  Client A connects to Server 1
  Client B connects to Server 2
  Server 1 wants to send a message to Client B → doesn't have the connection!

Solution: Message Broker (Redis Pub/Sub, RabbitMQ, Kafka)

Server 1 ──publish event──► [Redis/RabbitMQ] ──► all servers subscribe
                                                  Server 2 → sends to Client B
```

```java
// Spring WebSocket + Redis pub/sub for horizontal scaling
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableStompBrokerRelay("/topic", "/queue")  // use external broker
              .setRelayHost("rabbitmq")
              .setRelayPort(61613)
              .setClientLogin("guest")
              .setClientPasscode("guest");
    }
}
```

---

## Choosing the Right Real-Time Technology

| Scenario | Best Choice | Why |
|---------|------------|-----|
| Live notifications (server → client) | SSE | Simple, built-in reconnect, HTTP-native |
| Chat, collaborative editing | WebSocket | Bidirectional, low overhead |
| Live dashboards (read-only) | SSE | One-way, works through proxies |
| File upload progress | SSE | Server → client only |
| Online gaming | WebSocket (UDP if browser allows) | Low latency bidirectional |
| Order tracking | SSE or WebSocket | Depends on interaction needed |
| IoT device telemetry | MQTT over WebSocket | Protocol built for IoT |

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

## 🎯 Interview Questions

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
