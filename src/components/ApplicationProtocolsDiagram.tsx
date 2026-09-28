import React, { useState, useMemo } from 'react';

type ProtocolCategory = 'all' | 'transport' | 'web' | 'remote_file' | 'infra_routing';

interface ProtocolInfo {
  id: string;
  name: string;
  layer: string;
  port: string;
  transport: 'TCP' | 'UDP' | 'TCP/UDP' | 'None (IP Layer)';
  category: ProtocolCategory;
  color: string;
  badgeBg: string;
  rfc: string;
  tagline: string;
  mechanics: string[];
  flowSteps: string[];
  productionGotcha: string;
  codeExample?: string;
}

const PROTOCOLS: ProtocolInfo[] = [
  {
    id: 'tcp',
    name: 'TCP (Transmission Control Protocol)',
    layer: 'L4 Transport',
    port: 'Dynamic / Any',
    transport: 'TCP',
    category: 'transport',
    color: '#0284c7',
    badgeBg: '#e0f2fe',
    rfc: 'RFC 793 / 9293',
    tagline: 'Connection-oriented, reliable byte-stream with ordered delivery, retransmission, and congestion control.',
    mechanics: [
      '3-Way Handshake: SYN -> SYN-ACK -> ACK establishes sequence numbers.',
      'Reliability via ACKs & Sliding Window Flow Control (prevents overwhelming receiver buffer).',
      'Congestion Control algorithms (CUBIC, BBR) probe available network bandwidth.',
      'Full-duplex bidirectional stream terminated by 4-way FIN/ACK handshake.'
    ],
    flowSteps: [
      'Client sends SYN (seq=X) to Server',
      'Server allocates TCB buffer, responds SYN-ACK (seq=Y, ack=X+1)',
      'Client responds ACK (ack=Y+1) -> Connection ESTABLISHED',
      'Data transfer with sequence numbering and cumulative ACKs',
      'Termination: Client FIN -> Server ACK -> Server FIN -> Client ACK (TIME_WAIT 2MSL)'
    ],
    productionGotcha: 'SYN Flood attacks fill the kernel listen backlog queue. Mitigate with SYN Cookies (syncookies=1 in sysctl). TIME_WAIT socket exhaustion under high connection churn can be mitigated with SO_REUSEADDR or HTTP connection pooling.',
    codeExample: '# Linux TCP socket tuning:\nsysctl -w net.ipv4.tcp_syncookies=1\nsysctl -w net.ipv4.tcp_tw_reuse=1\nsysctl -w net.ipv4.tcp_congestion_control=bbr'
  },
  {
    id: 'udp',
    name: 'UDP (User Datagram Protocol)',
    layer: 'L4 Transport',
    port: 'Dynamic / Any',
    transport: 'UDP',
    category: 'transport',
    color: '#15803d',
    badgeBg: '#dcfce7',
    rfc: 'RFC 768',
    tagline: 'Lightweight, connectionless, stateless datagram protocol with zero handshake overhead.',
    mechanics: [
      'Tiny 8-byte fixed header (Source Port, Dest Port, Length, Checksum).',
      'No connection establishment, no ACKs, no retransmissions, no ordering.',
      'Fire-and-forget datagram transmission — packets may arrive out-of-order, duplicated, or dropped.',
      'Essential foundation for real-time media (VoIP, video conferencing, gaming) and DNS/DHCP.'
    ],
    flowSteps: [
      'Application writes datagram directly to OS socket buffer',
      'Kernel encapsulates with 8-byte UDP header + IP packet',
      'Packet dispatched over network immediately without handshake',
      'Receiver processes datagram as independent, atomic packet',
      'Lost packets are silently ignored; application layer implements custom loss recovery if needed'
    ],
    productionGotcha: 'UDP fragmentation: If a datagram exceeds network MTU (typically 1500 bytes), IP-level fragmentation occurs. If a single fragment is dropped, the entire datagram is lost. Keep UDP payloads under 1280 bytes (IPv6 minimum MTU safe limit).',
    codeExample: '// Java DatagramSocket non-blocking receive\nDatagramSocket socket = new DatagramSocket(9876);\nbyte[] buf = new byte[1024];\nDatagramPacket packet = new DatagramPacket(buf, buf.length);\nsocket.receive(packet); // Blocks until single datagram arrives'
  },
  {
    id: 'dns',
    name: 'DNS (Domain Name System)',
    layer: 'L7 Application',
    port: '53 (UDP / TCP)',
    transport: 'TCP/UDP',
    category: 'infra_routing',
    color: '#7c3aed',
    badgeBg: '#f3e8ff',
    rfc: 'RFC 1034 / 1035',
    tagline: 'Hierarchical, distributed naming directory resolving human-readable domain names to IP addresses.',
    mechanics: [
      'Recursive query resolution: Stub Resolver -> Recursive Resolver (e.g. 8.8.8.8) -> Root (.) -> TLD (.com) -> Authoritative (example.com).',
      'Uses UDP port 53 for queries (< 512 bytes) for ultra-low latency; fails over to TCP for zone transfers or large responses.',
      'Record Types: A (IPv4), AAAA (IPv6), CNAME (canonical alias), MX (mail), TXT (SPF/DKIM/verification).',
      'Caching at all tiers governed by TTL (Time to Live) values.'
    ],
    flowSteps: [
      'Browser checks local OS / hosts cache; on miss, queries Recursive Resolver',
      'Recursive Resolver queries Root Nameserver (.) -> Returns .com TLD NS',
      'Recursive Resolver queries .com TLD NS -> Returns Authoritative NS for domain',
      'Recursive Resolver queries Authoritative NS -> Returns A record IP address',
      'Resolver caches record for TTL seconds and returns IP to browser'
    ],
    productionGotcha: 'DNS propagation delays: Lower TTL to 60s before major DNS or IP migrations. DNS Cache Poisoning is mitigated via DNSSEC (cryptographic signature validation). In Java, InetAddress caches forever by default; configure `networkaddress.cache.ttl=60` in java.security.',
    codeExample: '# Check DNS records and traversal:\ndig +trace example.com A\nnslookup -type=TXT example.com 8.8.8.8'
  },
  {
    id: 'dhcp',
    name: 'DHCP (Dynamic Host Configuration)',
    layer: 'L7 Application (over UDP)',
    port: '67 (Server) / 68 (Client)',
    transport: 'UDP',
    category: 'infra_routing',
    color: '#c2410c',
    badgeBg: '#ffedd5',
    rfc: 'RFC 2131',
    tagline: 'Automated network configuration dynamically assigning IP addresses, subnet masks, gateways, and DNS.',
    mechanics: [
      'DORA Process: Discover -> Offer -> Request -> Acknowledge.',
      'Uses UDP broadcast because a new client does not yet possess an IP address or know the network subnet.',
      'Lease Duration: IPs are leased temporarily; clients must renew at 50% (T1) and 87.5% (T2) lease times.',
      'Fallback to APIPA (169.254.0.0/16 Link-Local) if no DHCP server responds.'
    ],
    flowSteps: [
      'DHCP DISCOVER: Client broadcasts (0.0.0.0:68 -> 255.255.255.255:67) seeking servers',
      'DHCP OFFER: Server reserves IP from pool and broadcasts proposed IP, subnet, gateway',
      'DHCP REQUEST: Client formally requests the offered IP, broadcasting acceptance',
      'DHCP ACK: Server confirms lease binding with lease duration and DNS servers',
      'Client configures its network interface and begins normal IP routing'
    ],
    productionGotcha: 'DHCP Starvation Attack: Malicious actor spoofs MAC addresses to exhaust the DHCP IP pool. Mitigate with DHCP Snooping on managed network switches, which blocks unauthorized DHCP server packets and limits MAC binding rates.',
    codeExample: '# Release and renew DHCP lease on Linux:\nsudo dhclient -r eth0  # Release current IP\nsudo dhclient -v eth0  # Request new lease via DORA'
  },
  {
    id: 'http_https',
    name: 'HTTP / HTTPS (Hypertext Transfer Protocol)',
    layer: 'L7 Application',
    port: '80 (HTTP) / 443 (HTTPS)',
    transport: 'TCP',
    category: 'web',
    color: '#0f766e',
    badgeBg: '#ccfbf1',
    rfc: 'RFC 9110 / 9112 / 9113',
    tagline: 'Stateless request-response foundation of the World Wide Web and RESTful microservices.',
    mechanics: [
      'HTTP/1.1: Plaintext pipelining, persistent Keep-Alive connections, but suffers from Head-of-Line blocking.',
      'HTTP/2: Binary framing layer, single TCP connection with concurrent multiplexed streams, HPACK header compression, server push.',
      'HTTPS: Wraps HTTP within TLS encryption (port 443), guaranteeing confidentiality, integrity, and server authentication.',
      'Idempotent methods (GET, PUT, DELETE) vs non-idempotent methods (POST, PATCH).'
    ],
    flowSteps: [
      'TCP 3-way handshake on port 80/443',
      'TLS 1.3 Handshake (1 RTT): ClientHello -> ServerHello + Encrypted Extensions -> Key Finished',
      'Client sends HTTP Request: Method, Path, Headers, Body',
      'Server processes and returns HTTP Response: Status Code (2xx, 3xx, 4xx, 5xx), Headers, Body',
      'Connection kept alive in pool for subsequent requests or closed via Connection: close'
    ],
    productionGotcha: 'HTTP/2 Head-of-Line Blocking at TCP: While HTTP/2 multiplexes streams logically, a single dropped TCP packet halts all multiplexed streams until retransmitted. Solved in HTTP/3 via QUIC over UDP.',
    codeExample: '// Java HttpClient with HTTP/2 and connection pooling\nHttpClient client = HttpClient.newBuilder()\n    .version(HttpClient.Version.HTTP_2)\n    .connectTimeout(Duration.ofSeconds(5))\n    .build();'
  },
  {
    id: 'quic',
    name: 'QUIC (HTTP/3 Transport)',
    layer: 'L4/L7 Hybrid (over UDP)',
    port: '443 (UDP)',
    transport: 'UDP',
    category: 'web',
    color: '#b45309',
    badgeBg: '#fef3c7',
    rfc: 'RFC 9000 / 9114',
    tagline: 'Modern UDP-based encrypted multiplexed transport eliminating TCP Head-of-Line blocking and connection setup latency.',
    mechanics: [
      'Zero Handshake Head-of-Line Blocking: Each stream is independently acknowledged; packet loss on Stream 1 does not freeze Stream 2.',
      'Integrated TLS 1.3: Cryptographic handshake combined with transport handshake (1-RTT initial, 0-RTT resumption).',
      'Connection Migration: Identifies sessions via 64-bit Connection ID, not (IP:Port) tuple. Connections survive Wi-Fi to 5G network switches.',
      'Pipelined Forward Error Correction and packet pacing.'
    ],
    flowSteps: [
      'Client sends QUIC Initial Packet containing TLS 1.3 ClientHello',
      'Server responds with Initial Packet (ServerHello, Cert, Finished) + Handshake Keys in 1 RTT',
      'Connection Established; 0-RTT session ticket issued for instant future reconnects',
      'Independent streams multiplexed over single UDP socket',
      'Client switches from Wi-Fi to Cellular: retains Connection ID; zero re-handshake needed'
    ],
    productionGotcha: 'UDP Throttling on Corporate Firewalls: Many enterprise firewalls block or rate-limit UDP port 443 thinking it is BitTorrent or peer-to-peer traffic. Always configure seamless fallback to HTTP/2 over TCP.',
    codeExample: '# Test HTTP/3 QUIC endpoint using curl:\ncurl --http3 -IL https://cloudflare.com'
  },
  {
    id: 'websocket',
    name: 'WebSocket (Full-Duplex Persistent)',
    layer: 'L7 Application',
    port: '80 (WS) / 443 (WSS)',
    transport: 'TCP',
    category: 'web',
    color: '#0369a1',
    badgeBg: '#e0f2fe',
    rfc: 'RFC 6455',
    tagline: 'Bidirectional, full-duplex persistent TCP connection over a single socket initiated via HTTP upgrade.',
    mechanics: [
      'Handshake begins as standard HTTP GET with `Upgrade: websocket` and `Connection: Upgrade`.',
      'Server validates `Sec-WebSocket-Key` with SHA-1 GUID hash and responds with `101 Switching Protocols`.',
      'Extremely lightweight framing: 2 to 10-byte binary frame header instead of heavyweight HTTP headers on every message.',
      'Built-in Heartbeat control frames: Ping (0x9) and Pong (0xA) to maintain firewall NAT bindings.'
    ],
    flowSteps: [
      'Client sends HTTP GET with Upgrade: websocket and Sec-WebSocket-Key: dGhlIHNhbXBsZQ==',
      'Server responds HTTP 101 Switching Protocols with Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=',
      'TCP socket remains open; protocol switches to raw binary WebSocket frames',
      'Both Client and Server can push messages at any millisecond without polling',
      'Connection closed via 2-way Close Frame (opcode 0x8)'
    ],
    productionGotcha: 'Load Balancer Idle Timeouts: AWS ALB or Nginx drop idle TCP connections after 60 seconds. Must implement an application-level ping/pong heartbeat interval (e.g. every 25 seconds) to keep the socket alive.',
    codeExample: '// WebSocket Server upgrade check in Node.js\nserver.on("upgrade", (req, socket, head) => {\n  wss.handleUpgrade(req, socket, head, (ws) => {\n    wss.emit("connection", ws, req);\n  });\n});'
  },
  {
    id: 'ssh',
    name: 'SSH (Secure Shell) & SFTP',
    layer: 'L7 Application',
    port: '22 (TCP)',
    transport: 'TCP',
    category: 'remote_file',
    color: '#475569',
    badgeBg: '#f1f5f9',
    rfc: 'RFC 4251 / 4253',
    tagline: 'Encrypted network protocol for secure remote command-line login, tunneling, and file management.',
    mechanics: [
      'Server host key authentication (prevents Man-In-The-Middle attacks via `~/.ssh/known_hosts`).',
      'Diffie-Hellman Key Exchange securely negotiates ephemeral symmetric session key (AES-256-GCM).',
      'User Authentication: Public-key cryptography (`~/.ssh/authorized_keys`) or interactive passwords.',
      'SSH Tunneling / Port Forwarding: Local (-L), Remote (-R), and Dynamic SOCKS5 Proxy (-D).'
    ],
    flowSteps: [
      'TCP 3-way handshake on port 22',
      'Protocol version exchange: SSH-2.0 negotiation',
      'Diffie-Hellman Key Exchange -> Computes shared secret; verifies server signature against known_hosts',
      'Session encryption activated (AES-GCM); User authentication challenge/response verified',
      'Encrypted PTY interactive shell session or SFTP file transfer subsystem spawned'
    ],
    productionGotcha: 'Exposing default port 22 to public internet results in thousands of automated botnet brute-force attempts per hour. Best practice: change default port, disable root password login (`PermitRootLogin no`), and use SSH Bastion hosts with Tailscale/WireGuard VPN.',
    codeExample: '# SSH Tunneling: Access internal PostgreSQL through bastion\nssh -L 5432:internal-db.vpc:5432 -N -f user@bastion.example.com\n\n# Dynamic SOCKS5 Proxy through remote server:\nssh -D 1080 -q -C -N user@remote-host'
  },
  {
    id: 'ftp_sftp',
    name: 'FTP / FTPS vs SFTP (File Transfer)',
    layer: 'L7 Application',
    port: '21 (FTP Control), 20 (Data), 22 (SFTP)',
    transport: 'TCP',
    category: 'remote_file',
    color: '#991b1b',
    badgeBg: '#fee2e2',
    rfc: 'RFC 959 (FTP) / RFC 4251 (SFTP)',
    tagline: 'Legacy dual-port file transfer protocol vs modern SSH-subsystem secure file transfer.',
    mechanics: [
      'Legacy FTP uses dual connections: Port 21 for Control commands and Port 20 / random ports for Data transfer.',
      'Active FTP: Server connects back to client data port (frequently blocked by client NAT/firewalls).',
      'Passive FTP: Client initiates both control and data connections to server (PASV mode).',
      'FTP transmits passwords and data in cleartext. SFTP runs entirely over SSH (port 22) as a single encrypted stream.'
    ],
    flowSteps: [
      'FTP Control: Client connects to Server port 21; sends USER and PASS in plain plaintext',
      'Passive Mode: Client sends PASV; Server opens random high port (e.g. 50001) and returns it',
      'FTP Data: Client connects to Server port 50001 to stream file contents',
      'Control connection issues completion code 226 Transfer Complete',
      'SFTP Alternative: Runs completely inside encrypted SSH tunnel on port 22 with zero NAT firewall complications'
    ],
    productionGotcha: 'Never use plain FTP in production — credentials and payload are readable via Wireshark. Always prefer SFTP (SSH-based) over FTPS (FTP with TLS) because FTPS still suffers from the complex firewall routing of dual-port passive ranges.',
    codeExample: '# SFTP automated script transfer using public key:\nsftp -b batch_commands.txt -i ~/.ssh/id_ed25519 service_user@sftp.example.com'
  },
  {
    id: 'smtp_imap_pop3',
    name: 'SMTP, IMAP & POP3 (Email Infrastructure)',
    layer: 'L7 Application',
    port: '25 (Relay), 587 (Submission), 993 (IMAP)',
    transport: 'TCP',
    category: 'remote_file',
    color: '#9333ea',
    badgeBg: '#f3e8ff',
    rfc: 'RFC 5321 (SMTP) / RFC 3501 (IMAP)',
    tagline: 'Store-and-forward email delivery protocol (SMTP) paired with mailbox synchronization (IMAP) and retrieval (POP3).',
    mechanics: [
      'SMTP is a **push protocol** used by senders to transfer email between Mail Transfer Agents (MTAs).',
      'Port 25 (Server-to-Server relay), Port 587 (Client Submission with STARTTLS), Port 465 (Implicit TLS).',
      'IMAP (Port 993 SSL) provides multi-device folder synchronization; POP3 (Port 995 SSL) downloads and deletes locally.',
      'Anti-Spoofing Authentication: SPF (authorized sender IPs), DKIM (cryptographic header signature), DMARC (enforcement policy).'
    ],
    flowSteps: [
      'Sender client connects to mail server on port 587 with STARTTLS',
      'Client issues EHLO -> MAIL FROM:<alice@a.com> -> RCPT TO:<bob@b.com> -> DATA -> .',
      'Sender MTA queries DNS for MX (Mail Exchange) record of b.com',
      'Sender MTA connects to recipient MTA on port 25 and transmits message',
      'Recipient fetches and synchronizes email into inbox using IMAP over port 993'
    ],
    productionGotcha: 'Residential and cloud provider IP ranges (e.g. AWS EC2) block outbound port 25 by default to prevent spam. Production applications must send outbound transactional emails through trusted relays (SES, SendGrid, Postmark) with complete SPF, DKIM, and DMARC DNS records.',
    codeExample: '# Dig MX record and check SPF record\ndig mx google.com +short\ndig txt google.com | grep "v=spf1"'
  },
  {
    id: 'tls_ssl',
    name: 'TLS 1.3 / SSL (Cryptographic Security)',
    layer: 'L4/L7 Session / Security',
    port: 'Encapsulates L7 protocols',
    transport: 'TCP',
    category: 'transport',
    color: '#047857',
    badgeBg: '#d1fae5',
    rfc: 'RFC 8446 (TLS 1.3)',
    tagline: 'Cryptographic protocol providing data confidentiality, message integrity, and endpoint authentication.',
    mechanics: [
      'Asymmetric Encryption used for mutual authentication and session key exchange (ECDHE - Elliptic Curve Diffie-Hellman).',
      'Symmetric Encryption used for wire payload encryption (AES-256-GCM or ChaCha20-Poly1305) for high hardware throughput.',
      'Digital Certificates: X.509 certificates signed by Certificate Authorities (CAs) bind public keys to domain names.',
      'TLS 1.3 reduces handshake latency from 2 RTTs (in TLS 1.2) to **1 RTT** (and 0-RTT resumption), removing insecure cipher suites.'
    ],
    flowSteps: [
      'ClientHello: Client proposes supported ciphers, key shares (ECDHE), and SNI (Server Name Indication)',
      'ServerHello: Server selects cipher, sends its key share + X.509 Certificate + Finished message (1 RTT!)',
      'Client verifies certificate chain of trust to root CA in truststore',
      'Both parties compute shared master symmetric secret; encrypted application data streams immediately',
      'Reconnection: 0-RTT Pre-Shared Key (PSK) resumption sends early encrypted data in initial packet'
    ],
    productionGotcha: 'Certificate expiration outages: Always automate certificate renewal using ACME protocol (Let\'s Encrypt / Certbot) and monitor expiration dates with Prometheus alert rules at 30, 14, and 7 days.',
    codeExample: '# Inspect TLS certificate chain and handshake timing using openssl:\nopenssl s_client -connect example.com:443 -tls1_3 -servername example.com'
  },
  {
    id: 'bgp',
    name: 'BGP (Border Gateway Protocol)',
    layer: 'L7 / Routing Protocol (over TCP)',
    port: '179 (TCP)',
    transport: 'TCP',
    category: 'infra_routing',
    color: '#be123c',
    badgeBg: '#ffe4e6',
    rfc: 'RFC 4271',
    tagline: 'The postal service of the internet: Path-vector exterior gateway protocol coordinating routing across Autonomous Systems (AS).',
    mechanics: [
      'The entire internet is segmented into ~100,000 Autonomous Systems (ASNs owned by ISPs, Google, Cloudflare, AWS).',
      'BGP routers establish peerings over TCP port 179 and exchange routing prefix tables.',
      'Path-Vector Routing: Routes include the `AS-PATH` attribute listing every AS the packet must traverse to reach destination.',
      'Loop prevention: If a router receives an advertisement containing its own ASN in the AS-PATH, it discards the route.'
    ],
    flowSteps: [
      'Two edge routers establish a TCP connection on port 179 (BGP Peering session)',
      'Routers exchange BGP OPEN messages and negotiate capabilities',
      'Routers exchange entire initial routing table via BGP UPDATE messages',
      'When an ISP acquires a new IP prefix (e.g. 198.51.100.0/24), it advertises prefix with its ASN in AS-PATH',
      'Periodic KEEPALIVE messages maintain neighbor peering; routes recalculated on link flap'
    ],
    productionGotcha: 'BGP Route Hijacking: A misconfigured or malicious AS advertises a more specific IP prefix (/24 beats /16) that it does not own, redirecting global traffic to itself (e.g. YouTube 2008 Pakistan hijack). Defend using RPKI (Resource Public Key Infrastructure) Route Origin Authorization (ROA).',
    codeExample: '# View BGP summary on a Cisco / Linux FRRouting router:\nvtysh -c "show ip bgp summary"\nvtysh -c "show ip bgp 8.8.8.8"'
  }
];

export default function ApplicationProtocolsDiagram(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<ProtocolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProtoId, setSelectedProtoId] = useState<string>('tcp');

  const filteredProtocols = useMemo(() => {
    return PROTOCOLS.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.port.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rfc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeProto = PROTOCOLS.find((p) => p.id === selectedProtoId) || PROTOCOLS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 820px) {
          .proto-split-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive Network Protocols Explorer (Every Essential Protocol Explained)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Controls Bar: Category Filters & Search */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All (12 Protocols)' },
              { id: 'transport', label: 'Transport & Security' },
              { id: 'web', label: 'Web & Real-Time' },
              { id: 'remote_file', label: 'Remote & Mail' },
              { id: 'infra_routing', label: 'Infra & Routing' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ProtocolCategory)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: selectedCategory === cat.id ? '1.5px solid #0284c7' : '1px solid #D9D9D9',
                  background: selectedCategory === cat.id ? '#e0f2fe' : '#F2F2F2',
                  color: selectedCategory === cat.id ? '#0369a1' : '#334155',
                  cursor: 'pointer',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  fontSize: '11px',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search protocol, port, or RFC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #98A2B3',
              background: '#ffffff',
              fontSize: '11.5px',
              color: '#0f172a',
              outline: 'none',
              minWidth: '200px',
            }}
          />
        </div>

        {/* 2-Column Split: Protocol Selector List & Deep Dive Inspector */}
        <div className="proto-split-grid" style={{ display: 'grid', gridTemplateColumns: '38% 62%', gap: '14px', alignItems: 'start' }}>
          {/* Left Column: Protocol Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredProtocols.map((p) => {
              const isSelected = p.id === activeProto.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProtoId(p.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${p.color}` : '1px solid #D9D9D9',
                    background: isSelected ? p.badgeBg : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      {p.name.split(' ')[0]}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: p.color,
                        background: '#ffffff',
                        border: `1px solid ${p.color}40`,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Port {p.port}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.tagline}
                  </div>
                </div>
              );
            })}
            {filteredProtocols.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                No protocols matched your search filter.
              </div>
            )}
          </div>

          {/* Right Column: Active Protocol Deep-Dive Panel */}
          <div style={{ background: '#F7FDF9', border: '1px solid #98A2B3', borderRadius: '10px', padding: '14px' }}>
            {/* Title & Metadata Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {activeProto.name}
                </h4>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  {activeProto.rfc} • {activeProto.layer}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ background: activeProto.badgeBg, color: activeProto.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${activeProto.color}30` }}>
                  Transport: {activeProto.transport}
                </span>
                <span style={{ background: '#F2F2F2', color: '#334155', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid #D9D9D9' }}>
                  Port {activeProto.port}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.5, margin: '0 0 12px 0', fontStyle: 'italic' }}>
              "{activeProto.tagline}"
            </p>

            {/* Core Mechanics */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                Core Protocol Mechanics
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#334155', lineHeight: 1.5 }}>
                {activeProto.mechanics.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: '3px' }}>{m}</li>
                ))}
              </ul>
            </div>

            {/* Protocol Handshake / Lifecycle Flow */}
            <div style={{ background: '#ffffff', border: '1px solid #D9D9D9', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: activeProto.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Protocol Lifecycle &amp; Packet Flow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {activeProto.flowSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#1e293b' }}>
                    <span style={{ background: activeProto.color, color: '#ffffff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Production Gotcha Alert */}
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                ⚠️ Production Gotcha &amp; Security Trap
              </div>
              <div style={{ fontSize: '11px', color: '#7f1d1d', lineHeight: 1.45 }}>
                {activeProto.productionGotcha}
              </div>
            </div>

            {/* Code / Command Inspection */}
            {activeProto.codeExample && (
              <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px 10px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, background: 'transparent', padding: 0, fontSize: '10.5px', color: '#e2e8f0', lineHeight: 1.4, fontFamily: 'monospace' }}>
                  {activeProto.codeExample}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
