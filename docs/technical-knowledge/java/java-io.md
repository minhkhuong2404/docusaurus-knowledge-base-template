---
id: java-io
title: "Java I/O: Streams, NIO & I/O Models"
slug: java-io
---

# Java I/O: Streams, NIO & I/O Models

A guide to Java's I/O system — from classic stream-based I/O and design patterns to NIO channels/buffers and the five I/O models.

---

## 1. Classic I/O (java.io)

### Byte Streams vs Character Streams

| Aspect | Byte Streams | Character Streams |
|--------|-------------|-------------------|
| Base classes | `InputStream` / `OutputStream` | `Reader` / `Writer` |
| Unit | Byte (8 bits) | Character (16 bits, Unicode) |
| Use for | Binary data (images, files, network) | Text data (files, strings) |

### Key Stream Classes

```
InputStream
├── FileInputStream        — reads bytes from a file
├── ByteArrayInputStream   — reads from a byte array
├── BufferedInputStream     — adds buffering (decorator)
├── DataInputStream        — reads Java primitives
└── ObjectInputStream      — reads serialized objects

OutputStream
├── FileOutputStream       — writes bytes to a file
├── ByteArrayOutputStream  — writes to a byte array
├── BufferedOutputStream    — adds buffering (decorator)
├── DataOutputStream       — writes Java primitives
└── ObjectOutputStream     — writes serialized objects

Reader
├── FileReader             — reads characters from a file
├── InputStreamReader      — bridge: byte stream → character stream
├── BufferedReader          — adds buffering + readLine()
└── StringReader           — reads from a string

Writer
├── FileWriter             — writes characters to a file
├── OutputStreamWriter     — bridge: character stream → byte stream
├── BufferedWriter          — adds buffering
└── PrintWriter            — convenient print methods
```

### Buffered vs Unbuffered

Without buffering, every `read()` or `write()` call triggers a system call. `BufferedInputStream` / `BufferedReader` read ahead into an internal buffer (default 8 KB), drastically reducing system calls:

```java
// Unbuffered: slow (one byte per system call)
try (InputStream in = new FileInputStream("data.bin")) {
    int b;
    while ((b = in.read()) != -1) { /* process byte */ }
}

// Buffered: fast (reads 8KB at a time)
try (InputStream in = new BufferedInputStream(new FileInputStream("data.bin"))) {
    int b;
    while ((b = in.read()) != -1) { /* process byte from buffer */ }
}
```

---

## 2. I/O Design Patterns

Java's I/O library is a textbook example of several design patterns:

### Decorator Pattern

`BufferedInputStream`, `DataInputStream`, etc. wrap another stream to add functionality without modifying it:

```java
// Stacking decorators: file → buffering → data reading
InputStream raw = new FileInputStream("data.bin");
InputStream buffered = new BufferedInputStream(raw);
DataInputStream data = new DataInputStream(buffered);

int value = data.readInt();  // reads 4 bytes as an int, with buffering
```

Each decorator implements the same interface (`InputStream`) and delegates to the wrapped stream, adding its own behavior.

### Adapter Pattern

`InputStreamReader` adapts a byte stream to a character stream:

```java
// Adapting InputStream (bytes) to Reader (characters)
Reader reader = new InputStreamReader(new FileInputStream("text.txt"), StandardCharsets.UTF_8);
BufferedReader br = new BufferedReader(reader);
String line = br.readLine();
```

### Template Method Pattern

`InputStream.read(byte[], int, int)` uses a template method that calls the abstract `read()` method (which subclasses must implement):

```java
// In InputStream (simplified)
public int read(byte[] b, int off, int len) throws IOException {
    // Template: calls abstract read() in a loop
    for (int i = 0; i < len; i++) {
        int c = read();  // abstract — subclass provides implementation
        if (c == -1) return (i == 0) ? -1 : i;
        b[off + i] = (byte) c;
    }
    return len;
}
```

---

## 3. Java NIO (New I/O)

NIO (introduced in Java 1.4) provides a **non-blocking, buffer-oriented** alternative to classic I/O.

### Three Core Abstractions

#### Channel

A bidirectional connection to a data source (file, socket, pipe). Unlike streams, channels can read and write, and support non-blocking mode.

```java
// File channel
FileChannel channel = FileChannel.open(Path.of("data.txt"), StandardOpenOption.READ);

// Socket channel (non-blocking)
SocketChannel socket = SocketChannel.open();
socket.configureBlocking(false);
socket.connect(new InetSocketAddress("example.com", 80));
```

Key channels: `FileChannel`, `SocketChannel`, `ServerSocketChannel`, `DatagramChannel`.

#### Buffer

A container for data being read from or written to a channel. Buffers have three key properties:

- **capacity** — maximum number of elements
- **position** — index of the next element to read/write
- **limit** — first element that should not be read/written

```java
// Allocate a 1024-byte buffer
ByteBuffer buffer = ByteBuffer.allocate(1024);

// Write mode: fill the buffer
channel.read(buffer);  // channel writes into buffer

// Flip to read mode
buffer.flip();  // sets limit = position, position = 0

// Read from buffer
while (buffer.hasRemaining()) {
    byte b = buffer.get();
}

// Clear for reuse
buffer.clear();  // position = 0, limit = capacity
```

**Direct buffers:** `ByteBuffer.allocateDirect(size)` allocates memory outside the JVM heap, avoiding one copy during I/O. Better for large, long-lived buffers.

#### Selector

Multiplexes multiple channels onto a single thread. A `Selector` monitors registered channels for readiness events (connect, accept, read, write).

```java
Selector selector = Selector.open();

ServerSocketChannel server = ServerSocketChannel.open();
server.configureBlocking(false);
server.bind(new InetSocketAddress(8080));
server.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    selector.select();  // blocks until at least one channel is ready
    Set<SelectionKey> keys = selector.selectedKeys();
    for (SelectionKey key : keys) {
        if (key.isAcceptable()) {
            SocketChannel client = server.accept();
            client.configureBlocking(false);
            client.register(selector, SelectionKey.OP_READ);
        } else if (key.isReadable()) {
            SocketChannel client = (SocketChannel) key.channel();
            ByteBuffer buf = ByteBuffer.allocate(256);
            client.read(buf);
            // process data
        }
    }
    keys.clear();
}
```

---

## 4. I/O Models

Understanding I/O models is essential for building high-performance network applications.

### BIO (Blocking I/O)

The traditional model. Each I/O operation **blocks** the calling thread until completion.

```
Thread-per-connection model:
Client 1  →  Thread 1 (blocked on read)
Client 2  →  Thread 2 (blocked on read)
Client 3  →  Thread 3 (blocked on read)
```

- **Simple** to program
- **Wasteful** — each connection requires a dedicated thread
- Suitable for low-concurrency scenarios

### NIO (Non-Blocking I/O) / I/O Multiplexing

A single thread manages multiple connections using a **selector**. Channels are non-blocking — `read()` returns immediately (with or without data).

```
Selector model:
                    ┌──── Client 1 (Channel)
Single Thread ──── Selector ──── Client 2 (Channel)
                    └──── Client 3 (Channel)
```

- **Efficient** — one thread handles thousands of connections
- **Complex** — requires event loop programming
- Foundation of frameworks like Netty

### AIO (Asynchronous I/O)

Also called NIO.2 (Java 7). Operations are **truly asynchronous** — the OS notifies the application when I/O completes via callbacks.

```java
AsynchronousFileChannel channel = AsynchronousFileChannel.open(path, StandardOpenOption.READ);
ByteBuffer buffer = ByteBuffer.allocate(1024);

channel.read(buffer, 0, buffer, new CompletionHandler<Integer, ByteBuffer>() {
    @Override
    public void completed(Integer bytesRead, ByteBuffer buf) {
        // called when read completes
    }

    @Override
    public void failed(Throwable exc, ByteBuffer buf) {
        // called on error
    }
});
```

### Five UNIX I/O Models

| Model | Blocking? | Mechanism | Java Equivalent |
|-------|-----------|-----------|-----------------|
| **Blocking I/O** | Yes | Thread waits for data | `java.io` streams |
| **Non-blocking I/O** | Polling | Returns immediately; app polls for data | `SocketChannel` non-blocking |
| **I/O Multiplexing** | Blocks on selector | `select`/`poll`/`epoll` waits for any ready channel | `java.nio.Selector` |
| **Signal-driven I/O** | Signal on ready | Kernel signals when data is ready | Not directly supported |
| **Asynchronous I/O** | No | Kernel handles everything; notifies on completion | `java.nio2` (AIO) |

### Reactor vs Proactor Pattern

| Pattern | Used By | Model |
|---------|---------|-------|
| **Reactor** | Netty, Node.js, Redis | **I/O multiplexing**: selector notifies when data is _ready_, then app reads synchronously |
| **Proactor** | Windows IOCP, Java AIO | **Async I/O**: OS handles the read, notifies app when data is _already read_ |

---

## 5. Zero-Copy

Traditional data transfer involves multiple copies between user space and kernel space:

```
Disk → Kernel buffer → User buffer → Socket buffer → NIC
       (DMA)           (CPU copy)     (CPU copy)      (DMA)
```

**Zero-copy** eliminates CPU copies:

### `transferTo()` / `sendfile()`

```java
FileChannel source = FileChannel.open(Path.of("large-file.dat"));
SocketChannel target = SocketChannel.open(new InetSocketAddress("host", 8080));

// Zero-copy transfer: kernel sends directly from file to socket
source.transferTo(0, source.size(), target);
```

```
Disk → Kernel buffer → NIC  (only 2 DMA copies, no CPU copies)
```

### Memory-Mapped Files (`mmap`)

Maps a file directly into memory. File reads/writes become memory reads/writes:

```java
FileChannel channel = FileChannel.open(Path.of("data.bin"), StandardOpenOption.READ);
MappedByteBuffer buffer = channel.map(FileChannel.MapMode.READ_ONLY, 0, channel.size());

// Read file contents directly from memory
byte b = buffer.get(0);
```

**Used by:** Kafka (log segments), RocketMQ, database engines.

---

## 6. BIO vs NIO vs AIO Summary

| Feature | BIO | NIO | AIO |
|---------|-----|-----|-----|
| Blocking | Yes | Non-blocking (with selector) | Fully asynchronous |
| Threads | Thread-per-connection | Single thread + selector | Callback-based |
| API complexity | Simple | Medium | High |
| Throughput | Low | High | High |
| OS support | Universal | Universal (epoll/kqueue) | Limited (best on Windows) |
| Framework | Raw `java.io` | Netty, Vert.x | Rarely used directly |
| Best for | Simple clients, low concurrency | High-concurrency servers | File I/O operations |
