---
id: networking-overview
title: Networking Knowledge Base
description: A comprehensive reference covering OSI/TCP-IP models, TCP/UDP, HTTP/HTTPS, DNS, CDN, security, sockets, REST, gRPC, WebSockets, QUIC, and more — with interview questions.
tags: [networking, overview]
sidebar_position: 1
---

import NetworkIndexOverviewDiagram from '@site/src/components/NetworkIndexOverviewDiagram';
import NetworkPacketEncapsulationDiagram from '@site/src/components/NetworkPacketEncapsulationDiagram';



# 🌐 Networking Knowledge Base

<NetworkIndexOverviewDiagram />

<NetworkPacketEncapsulationDiagram />

---


A structured guide covering everything you need to know about computer networking — from low-level protocols to distributed API design — with Java/Spring examples and interview questions throughout.

## Topics Covered

| # | Topic | Description |
|---|-------|-------------|
| 1 | [OSI & TCP/IP Models](./osi-tcpip-models) | Layered models, encapsulation, ARP, ICMP, troubleshooting |
| 2 | [MAC Addressing & Layer 2 Forwarding](./mac-address-and-layer-2) | EUI-48 MAC anatomy, CAM switch tables, ARP state machine, GARP failover, VXLAN |
| 3 | [IP Addressing & Routing](./ip-addressing-routing) | IPv4/IPv6, CIDR, subnetting, BGP, OSPF, DHCP |
| 4 | [TCP, UDP & Transport Layer](./tcp-udp-transport-layer) | Handshake, flow control, congestion, UDP use cases |
| 5 | [QUIC & Modern Transport](./quic-modern-transport) | QUIC internals, 0-RTT, HOL blocking, HTTP/3, BBR |
| 6 | [HTTP & HTTPS](./http-https-application-layer) | HTTP/1.1–3, TLS handshake, headers, caching, CORS |
| 7 | [DNS](./dns-resolution) | Resolution process, record types, TTL, DNSSEC, DoH |
| 8 | [CDN & Load Balancing](../system-design/load-balancing-reliability) | CDN architecture, LB algorithms, health checks, Anycast |
| 9 | [Proxies, Firewalls, NAT & VPNs](./proxies-nat-firewalls) | Forward/reverse/SOCKS5 proxies, Netfilter conntrack, WireGuard vs IPsec, MSS clamping |
| 10 | [Tor, Onion Routing & Privacy Networks](./tor-and-privacy-networks) | 3-hop circuit telescoping, onion peeling cryptography, V3 rendezvous services, traffic analysis |
| 11 | [Network Security](./network-security) | TLS, firewalls, DDoS, Zero Trust, mTLS, cert management |
| 12 | [API Authentication & Authorization](./api-authentication-security) | OAuth 2.0, JWT, OIDC, client credentials, mTLS |
| 13 | [Socket Programming & I/O Models](./socket-programming-io-models) | Sockets, blocking/NIO, epoll, Netty, virtual threads |
| 14 | [REST & gRPC API Design](../system-design/api-design) | REST, gRPC/protobuf, GraphQL, versioning, OpenAPI |
| 15 | [WebSockets & Real-Time](../system-design/real-time-updates) | WS protocol, SSE, long polling, Spring WebSocket |
| 16 | [Network Performance & Optimization](./network-performance-optimization) | Latency, throughput, TCP tuning, connection pooling |
| 17 | [Service Mesh & Microservices Networking](../system-design/microservices-patterns) | Istio, Envoy, circuit breaker, service discovery, K8s |
| 18 | [Network Troubleshooting Tools](./network-troubleshooting-tools) | tcpdump, Wireshark, curl, openssl, dig, nmap, ss |
| 19 | [Application Protocols Reference](./application-protocols-reference) | SMTP, FTP, SSH, SNMP, NTP, MQTT, WebRTC |
| 20 | [Interview Questions — Master List](./networking-interview-questions) | Top questions across all topics, interview-ready answers |

:::tip[Java / Spring Focus]
Java NIO, Netty, Spring WebFlux, Spring WebSocket, gRPC-Java, WebClient, Spring Security OAuth2, and Resilience4j examples are included throughout.
:::
