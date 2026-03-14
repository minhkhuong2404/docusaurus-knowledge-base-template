---
id: network-troubleshooting-tools
title: Network Troubleshooting & Diagnostic Tools
description: Practical guide to tcpdump, Wireshark, netstat, ss, nmap, curl, openssl, dig, traceroute and how to diagnose every layer of the network stack.
tags: [networking, troubleshooting, tcpdump, wireshark, netstat, nmap, curl, openssl, dig, diagnostics]
sidebar_position: 16
---

# Network Troubleshooting & Diagnostic Tools

## The Diagnostic Mindset

Always work **layer by layer** — bottom up:

```
Layer 1 (Physical)  → is the link up?
Layer 2 (Data Link) → ARP, MAC reachable?
Layer 3 (Network)   → IP reachable? Routing correct?
Layer 4 (Transport) → port open? TCP/UDP responding?
Layer 7 (App)       → correct HTTP response? TLS valid? DNS resolving?
```

---

## Layer 1–2: Link & Connectivity

```bash
# Is the interface up?
ip link show
ip link show eth0        # Linux
ifconfig -a              # macOS / older Linux

# Interface statistics (errors, drops, collisions)
ip -s link show eth0
netstat -i               # all interfaces

# Check default gateway
ip route show
ip route get 8.8.8.8     # which interface/route for this destination?
route -n                 # classic display

# ARP cache — Layer 2 MAC mappings
arp -a
ip neigh show            # modern equivalent
```

---

## Layer 3: IP & Routing Diagnostics

### ping — ICMP Reachability

```bash
# Basic ping
ping -c 4 google.com
ping -c 4 8.8.8.8        # ping by IP (bypasses DNS)

# Ping with specific packet size (test MTU / fragmentation)
ping -c 4 -s 1472 google.com   # 1472 + 28 (ICMP+IP header) = 1500 MTU

# Detect MTU issues: DF (Don't Fragment) flag
ping -c 4 -M do -s 1473 google.com   # will fail if MTU < 1501

# IPv6 ping
ping6 ipv6.google.com
```

### traceroute / tracert — Path Discovery

```bash
# Standard traceroute (UDP probes by default on Linux)
traceroute google.com

# Use ICMP instead of UDP (less likely to be blocked)
traceroute -I google.com

# Use TCP SYN probes (port 80 — most firewall-friendly)
traceroute -T -p 80 google.com

# With timestamps and AS numbers
traceroute -a google.com

# MTR — continuous traceroute with statistics (best tool)
mtr google.com
mtr --report --report-cycles 20 google.com
```

**Reading traceroute output:**
```
 1  192.168.1.1    1.234 ms      ← home router (normal)
 2  100.64.0.1     5.123 ms      ← ISP gateway
 3  * * *                        ← hop doesn't respond to ICMP (firewall)
 4  72.14.209.1    15.2 ms       ← Google edge
 5  142.250.235.46 16.1 ms       ← destination

* * * means ICMP TTL-expired messages are dropped — route may still work
```

---

## Layer 4: Transport — Port & Connection Checks

### netstat / ss — Socket & Connection State

```bash
# ss (modern, faster than netstat)
ss -tlnp          # TCP listening ports + process names
ss -tulnp         # TCP + UDP listening
ss -s             # socket statistics summary
ss -tp            # all established TCP connections

# Specific port
ss -tlnp 'sport = :8080'

# All connections to a specific remote port
ss -tn dst :443

# netstat (older but available everywhere)
netstat -tlnp     # listening TCP ports
netstat -an       # all connections with addresses
netstat -tp       # TCP connections with process names

# Count connections by state (TCP state machine)
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn
# Shows: ESTABLISHED, TIME_WAIT, CLOSE_WAIT counts
```

### nc (netcat) — TCP/UDP Swiss Army Knife

```bash
# Test if port is open (TCP connect)
nc -zv hostname 443       # -z: scan only, -v: verbose
nc -zv hostname 80 443 8080  # test multiple ports

# Listen on a port (simple server for testing)
nc -l -p 8080

# Transfer data
nc -l -p 9999 > received_file.txt   # receiver
nc hostname 9999 < file.txt          # sender

# UDP port test
nc -uzv hostname 53      # test DNS UDP port

# Timeout
nc -zv -w 3 hostname 443  # 3s timeout
```

### telnet — Simple Port Test

```bash
telnet hostname 443    # CTRL+] then quit to exit
# Connected = port open, Connection refused = port closed
# Timeout = firewall dropping packets
```

---

## DNS Diagnostics

### dig — The Gold Standard DNS Tool

```bash
# Basic A record lookup
dig example.com
dig A example.com

# Specific record types
dig MX example.com           # mail servers
dig NS example.com           # authoritative nameservers
dig TXT example.com          # SPF, DKIM, verification tokens
dig CNAME www.example.com    # canonical name
dig AAAA example.com         # IPv6 address
dig SRV _grpc._tcp.api.example.com  # service records

# Short output (just the answer)
dig +short example.com
dig +short MX example.com

# Query specific DNS server (bypass OS resolver)
dig @8.8.8.8 example.com     # Google DNS
dig @1.1.1.1 example.com     # Cloudflare DNS
dig @192.168.1.1 example.com # local resolver

# Trace full resolution chain
dig +trace example.com

# Reverse DNS lookup (IP → hostname)
dig -x 8.8.8.8
dig PTR 8.8.8.8.in-addr.arpa

# Check DNSSEC
dig +dnssec example.com
dig DS example.com @a.gtld-servers.net

# All records
dig ANY example.com          # may be restricted

# Check SOA (find authoritative NS and serial)
dig SOA example.com
```

### nslookup — Cross-Platform DNS Tool

```bash
nslookup example.com
nslookup example.com 8.8.8.8  # use Google DNS
nslookup -type=MX example.com

# Interactive mode
nslookup
> server 8.8.8.8
> set type=ANY
> example.com
```

### host — Simple DNS Lookup

```bash
host example.com
host -t MX example.com
host 8.8.8.8              # reverse lookup
```

---

## HTTP & Application Layer Tools

### curl — HTTP Swiss Army Knife

```bash
# Basic GET
curl https://api.example.com/orders

# Verbose output (headers + TLS info)
curl -v https://api.example.com

# Extra verbose (TLS handshake detail)
curl -vvv https://api.example.com 2>&1 | grep -E "TLS|SSL|cert|expire"

# Show response headers only
curl -I https://api.example.com  # HEAD request
curl -D - https://api.example.com -o /dev/null  # dump headers, discard body

# POST with JSON
curl -X POST https://api.example.com/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product_id": 42, "quantity": 1}'

# Follow redirects
curl -L https://example.com

# Measure timing (performance breakdown)
curl -w "\n
       DNS lookup:        %{time_namelookup}s
       TCP connect:       %{time_connect}s
       TLS handshake:     %{time_appconnect}s
       Time to first byte:%{time_starttransfer}s
       Total:             %{time_total}s\n" \
  -o /dev/null -s https://api.example.com

# Test with specific DNS (host header override)
curl --resolve api.example.com:443:93.184.216.34 https://api.example.com

# Ignore TLS cert errors (debug only!)
curl -k https://api.example.com

# Client certificate (mTLS)
curl --cert client.crt --key client.key https://api.example.com

# HTTP/2 explicit
curl --http2 https://api.example.com

# Set timeout
curl --connect-timeout 5 --max-time 30 https://api.example.com

# Download with progress
curl -# -o output.zip https://example.com/file.zip
```

### wget — Download-Oriented HTTP

```bash
wget -q -O - https://api.example.com/health  # quiet, output to stdout
wget --server-response https://example.com   # show response headers
```

---

## TLS / Certificate Diagnostics

### openssl — TLS & Certificate Inspection

```bash
# Test TLS connection and see certificate
openssl s_client -connect example.com:443

# Show full certificate chain
openssl s_client -connect example.com:443 -showcerts

# Specific TLS version
openssl s_client -connect example.com:443 -tls1_2
openssl s_client -connect example.com:443 -tls1_3

# Check certificate expiry
echo | openssl s_client -connect example.com:443 2>/dev/null \
  | openssl x509 -noout -dates

# Verify certificate chain
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt cert.pem

# Decode a PEM certificate
openssl x509 -in cert.pem -noout -text

# Check if SNI is required (Server Name Indication)
openssl s_client -connect example.com:443 -servername example.com

# Test mTLS
openssl s_client -connect api.example.com:443 \
  -cert client.crt -key client.key

# View certificate expiry of all certs in a chain
openssl s_client -connect example.com:443 -showcerts 2>/dev/null \
  | awk '/BEGIN CERT/,/END CERT/' \
  | openssl x509 -noout -dates
```

### Certificate Expiry Monitoring Script

```bash
#!/bin/bash
# Check days until TLS cert expires
check_cert_expiry() {
  local host=$1
  local port=${2:-443}
  local expiry=$(echo | openssl s_client -connect "$host:$port" \
    -servername "$host" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null \
    | cut -d= -f2)
  local days=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
  echo "$host: $days days remaining (expires $expiry)"
}

check_cert_expiry api.example.com 443
```

---

## Packet Capture & Analysis

### tcpdump — Command-Line Packet Capture

```bash
# Capture on interface (requires root/sudo)
sudo tcpdump -i eth0

# Capture specific port
sudo tcpdump -i eth0 port 443
sudo tcpdump -i eth0 port 80 or port 443

# Capture specific host
sudo tcpdump -i eth0 host 93.184.216.34

# Capture HTTP (not HTTPS, which is encrypted)
sudo tcpdump -i eth0 port 80 -A  # -A: ASCII output

# Capture to file for Wireshark analysis
sudo tcpdump -i eth0 -w capture.pcap

# Read from file
tcpdump -r capture.pcap

# Verbose + no DNS resolution (faster, shows raw IPs/ports)
sudo tcpdump -i eth0 -nn -v port 80

# Capture TCP handshakes (SYN packets)
sudo tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn) != 0'

# Capture TCP RST (connection resets — indicates problems)
sudo tcpdump -i eth0 'tcp[tcpflags] & (tcp-rst) != 0'

# Filter by multiple criteria
sudo tcpdump -i eth0 'host 10.0.0.1 and (port 80 or port 443)'

# Capture DNS queries
sudo tcpdump -i eth0 udp port 53 -n
```

### Wireshark Filters (Display Filters)

```
# Protocol filters
http
tcp
udp
dns
tls

# IP address
ip.addr == 93.184.216.34
ip.src == 192.168.1.100
ip.dst == 8.8.8.8

# Port filters
tcp.port == 443
tcp.dstport == 80

# HTTP specific
http.request.method == "POST"
http.response.code == 500
http.host contains "api.example.com"

# TLS
tls.handshake.type == 1     # ClientHello
tls.handshake.type == 2     # ServerHello

# TCP flags
tcp.flags.syn == 1
tcp.flags.reset == 1
tcp.flags.fin == 1

# TCP retransmissions (indicates packet loss)
tcp.analysis.retransmission

# Combine filters
http && ip.src == 192.168.1.100
tcp.port == 443 && !ssl
```

---

## Port Scanning — nmap

```bash
# Basic scan (top 1000 ports)
nmap hostname

# Scan specific ports
nmap -p 80,443,8080 hostname

# Full port scan
nmap -p- hostname

# Service version detection
nmap -sV hostname

# OS detection
nmap -O hostname

# Aggressive scan (version + scripts + OS)
nmap -A hostname

# SYN scan (stealth, default for root)
sudo nmap -sS hostname

# UDP scan
sudo nmap -sU hostname

# Scan a subnet
nmap 192.168.1.0/24

# Quick host discovery (ping scan)
nmap -sn 192.168.1.0/24

# NSE scripts (vulnerability scan)
nmap --script=vuln hostname
nmap --script=ssl-cert hostname  # cert info
nmap --script=http-headers hostname
```

:::caution
Only scan networks and systems you own or have explicit permission to test. Unauthorized scanning is illegal in most jurisdictions.
:::

---

## Java / Spring Diagnostic Tools

### Connection Pool Monitoring (HikariCP)

```java
// Log HikariCP pool stats
HikariDataSource ds = (HikariDataSource) dataSource;
HikariPoolMXBean pool = ds.getHikariPoolMXBean();
log.info("Active: {}, Idle: {}, Awaiting: {}, Total: {}",
    pool.getActiveConnections(),
    pool.getIdleConnections(),
    pool.getThreadsAwaitingConnection(),
    pool.getTotalConnections());

// Expose via Actuator + Prometheus
# application.yml
management.endpoints.web.exposure.include: health,metrics,prometheus
management.metrics.enable.hikaricp: true
```

### HTTP Client Diagnostics (WebClient / RestTemplate)

```java
// Log all requests and responses (Spring WebClient)
WebClient client = WebClient.builder()
    .filter(ExchangeFilterFunction.ofRequestProcessor(req -> {
        log.debug("Request: {} {}", req.method(), req.url());
        return Mono.just(req);
    }))
    .filter(ExchangeFilterFunction.ofResponseProcessor(resp -> {
        log.debug("Response: {}", resp.statusCode());
        return Mono.just(resp);
    }))
    .build();

// Enable HttpClient wire logging
logging.level.reactor.netty.http.client: DEBUG
logging.level.org.springframework.web.reactive.function.client: DEBUG

# application.properties (RestTemplate)
logging.level.org.apache.http.wire: DEBUG
```

### JVM Network Properties

```bash
# JVM network timeout properties
-Dsun.net.client.defaultConnectTimeout=5000   # TCP connect timeout (ms)
-Dsun.net.client.defaultReadTimeout=30000     # Read timeout
-Djava.net.preferIPv4Stack=true               # Force IPv4
-Djava.net.preferIPv6Addresses=false

# DNS caching
-Dsun.net.inetaddr.ttl=30       # positive cache TTL
-Dsun.net.inetaddr.negative.ttl=10  # negative cache TTL
```

---

## Quick Diagnostic Cheatsheet

```bash
# "Can I reach the server?"
ping -c 3 api.example.com
traceroute api.example.com

# "Is the port open?"
nc -zv api.example.com 443
curl -v --connect-timeout 5 https://api.example.com

# "What's the DNS record?"
dig +short api.example.com
dig +trace api.example.com

# "Is the TLS cert valid?"
echo | openssl s_client -connect api.example.com:443 2>/dev/null | openssl x509 -noout -dates
curl -vI https://api.example.com 2>&1 | grep -E "expire|issuer|subject"

# "What's listening on this port?"
ss -tlnp 'sport = :8080'
lsof -i :8080

# "Why is this TCP connection stuck in TIME_WAIT?"
ss -tan state time-wait | head -20
# TIME_WAIT is normal — lasts 2*MSL (~60s). High count = many short connections

# "How many connections am I handling?"
ss -s
ss -tan | awk 'NR>1{print $1}' | sort | uniq -c
```

---

## 🎯 Interview Questions

**Q1. How would you diagnose why a microservice can't reach another microservice?**
> Step by step: (1) Confirm DNS resolves correctly: `dig service-b.namespace.svc.cluster.local`. (2) Confirm IP is reachable: `ping` or `curl --connect-timeout 3`. (3) Confirm port is open: `nc -zv host 8080`. (4) Check for TLS issues: `openssl s_client -connect host:443`. (5) Make actual HTTP request: `curl -v http://service-b:8080/health`. (6) Check network policies, firewalls, security groups. (7) If all OK at network layer, check app logs.

**Q2. What is the difference between `netstat` and `ss`? Which is preferred?**
> Both show socket/connection state, but `ss` is the modern replacement for `netstat`. `ss` reads directly from the kernel's socket tables via netlink (faster, more accurate), while `netstat` reads from `/proc/net`. `ss` handles millions of connections without significant slowdown. `netstat` is part of the deprecated `net-tools` package on Linux. Use `ss -tlnp` instead of `netstat -tlnp`.

**Q3. You see thousands of TIME_WAIT connections on your server. Is this a problem?**
> TIME_WAIT is a normal TCP state after connection close — it persists for 2×MSL (Maximum Segment Lifetime, ~60s on Linux) to ensure delayed packets don't confuse new connections on the same 4-tuple. Large counts indicate many short-lived connections (HTTP/1.0 style or poor keep-alive config). Solutions: enable HTTP keep-alive to reuse connections; enable `SO_REUSEADDR`; tune `net.ipv4.tcp_tw_reuse`; increase ephemeral port range. It's rarely an actual problem unless you're exhausting ports.

**Q4. How do you capture and inspect HTTPS traffic with tcpdump?**
> HTTPS is TLS-encrypted, so tcpdump captures the encrypted packets but can't read the payload directly. To decrypt: (1) Configure the application to log TLS session keys to an SSLKEYLOGFILE (Java: use `-Djavax.net.debug=ssl` or Wireshark's SSLKEYLOGFILE). (2) Capture with `tcpdump -w capture.pcap`. (3) Load in Wireshark, configure the key log file under TLS preferences — Wireshark decrypts in real time. For services you control, use a reverse proxy like Envoy with access logging as an alternative.

**Q5. What does `curl -w "%{time_total}"` tell you and how do you interpret it?**
> The `-w` flag with timing variables breaks down a request: `time_namelookup` (DNS), `time_connect` (TCP handshake), `time_appconnect` (TLS handshake), `time_pretransfer` (protocol setup), `time_starttransfer` (TTFB — Time To First Byte), `time_total` (complete request). High `time_namelookup` = DNS slow. High `time_connect` = network latency. High `time_appconnect` = TLS slow. High `time_starttransfer` minus `time_appconnect` = server processing time.

**Q6. How do you check if a firewall is blocking traffic vs the server not listening?**
> Three behaviors: (1) `Connection refused` (RST) = server is reachable but nothing listening on that port (or server explicitly rejects). (2) `Connection timed out` = firewall is silently dropping packets (no RST, no ICMP unreachable). (3) `ICMP Port Unreachable` = router/firewall explicitly rejecting. Use `nc -zv -w 3 host port` — timeout suggests firewall drop, immediate refusal suggests no listener. `traceroute -T -p 80` can show which hop is blocking.

**Q7. What is MTU, and how do you diagnose MTU-related issues?**
> MTU (Maximum Transmission Unit) is the largest frame size a link can carry — typically 1500 bytes for Ethernet. Mismatched MTU causes fragmentation or silent packet drops (especially with VPNs adding headers). Symptoms: large requests/responses fail while small ones succeed; TCP handshake works but data transfer hangs. Diagnose: `ping -M do -s 1472 host` — if 1472+28=1500 fails but 1400 works, MTU issue. Fix: set MTU consistently, or configure TCP MSS clamping on the network.

**Q8. How would you identify which process is using a specific port?**
> `ss -tlnp 'sport = :8080'` — shows the process name and PID. Or `lsof -i :8080` — lists open files including network sockets with PID and process name. On macOS: `lsof -i TCP:8080`. Then `ps -p <PID>` for full command. In containers: `ss` inside the container, or on the host `nsenter -t <container_pid> -n ss -tlnp`. For Docker: `docker inspect <container>` to see port bindings.
