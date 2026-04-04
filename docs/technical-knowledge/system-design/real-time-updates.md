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

## Interview Questions

1. What's the difference between WebSocket and SSE? When would you choose each?
2. How do you scale a WebSocket-based chat app to 1 million concurrent connections?
3. What is the "sticky session" problem and how do you solve it?
4. How would you implement a real-time notification system for 10M users?
5. How does long polling differ from short polling, and when is it preferable?
6. How do you build a presence system (online/offline indicators)?
7. How do you handle reconnection and message recovery in a WebSocket system?
8. What's the challenge of delivering ordered messages in a real-time system?
