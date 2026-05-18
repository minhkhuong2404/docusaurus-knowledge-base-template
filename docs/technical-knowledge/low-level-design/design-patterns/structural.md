---
id: structural
title: Structural Patterns
sidebar_label: Structural Patterns
---

# Structural Patterns

> Structural patterns describe how classes and objects are composed to form larger structures. They focus on *relationships* between objects.

---

## Adapter

**Intent:** Convert the interface of a class into another interface that clients expect.

**Use when:** You need to use an existing class but its interface doesn't match what you need.

```java
// Third-party payment library — you can't change this
public class StripePaymentGateway {
    public StripeChargeResult chargeCard(String cardToken, long amountCents, String currency) {
        // Stripe API call...
        return new StripeChargeResult("ch_123", "succeeded");
    }
}

// Your application's payment interface
public interface PaymentProcessor {
    PaymentResult charge(PaymentRequest request);
}

public record PaymentRequest(String cardToken, Money amount) {}
public record PaymentResult(String transactionId, boolean success) {}

// Adapter: makes StripePaymentGateway conform to PaymentProcessor
public class StripeAdapter implements PaymentProcessor {
    private final StripePaymentGateway stripe;

    public StripeAdapter(StripePaymentGateway stripe) {
        this.stripe = stripe;
    }

    @Override
    public PaymentResult charge(PaymentRequest request) {
        // Adapt: Money → cents, Money.currency → String
        long cents = request.amount().toCents();
        String currency = request.amount().getCurrencyCode();

        StripeChargeResult result = stripe.chargeCard(
            request.cardToken(), cents, currency
        );

        // Adapt: StripeChargeResult → PaymentResult
        return new PaymentResult(result.getChargeId(), "succeeded".equals(result.getStatus()));
    }
}

// Usage — application only knows PaymentProcessor
PaymentProcessor processor = new StripeAdapter(new StripePaymentGateway());
PaymentResult result = processor.charge(new PaymentRequest(token, Money.of(29.99, "USD")));
```

---

## Decorator

**Intent:** Attach additional responsibilities to an object dynamically, without modifying the class.

**Use when:** You need to add behavior to objects at runtime, or subclassing would cause a combinatorial explosion.

```java
// Core abstraction
public interface DataSource {
    void writeData(String data);
    String readData();
}

// Concrete component
public class FileDataSource implements DataSource {
    private final String filename;

    public FileDataSource(String filename) { this.filename = filename; }

    @Override
    public void writeData(String data) {
        try (FileWriter fw = new FileWriter(filename)) {
            fw.write(data);
        } catch (IOException e) { throw new RuntimeException(e); }
    }

    @Override
    public String readData() {
        try { return Files.readString(Path.of(filename)); }
        catch (IOException e) { throw new RuntimeException(e); }
    }
}

// Base Decorator
public abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrapped;
    protected DataSourceDecorator(DataSource wrapped) { this.wrapped = wrapped; }
}

// Encryption Decorator
public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource wrapped) { super(wrapped); }

    @Override
    public void writeData(String data) {
        wrapped.writeData(encrypt(data));
    }

    @Override
    public String readData() {
        return decrypt(wrapped.readData());
    }

    private String encrypt(String data) { /* AES encryption */ return Base64.getEncoder().encodeToString(data.getBytes()); }
    private String decrypt(String data) { return new String(Base64.getDecoder().decode(data)); }
}

// Compression Decorator
public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource wrapped) { super(wrapped); }

    @Override
    public void writeData(String data) {
        wrapped.writeData(compress(data));
    }

    @Override
    public String readData() {
        return decompress(wrapped.readData());
    }

    private String compress(String data) { /* gzip */ return data; }
    private String decompress(String data) { return data; }
}

// Usage — wrap decorators at runtime
DataSource source = new FileDataSource("data.bin");
DataSource compressed = new CompressionDecorator(source);
DataSource encryptedAndCompressed = new EncryptionDecorator(compressed);

// Write: data → compress → encrypt → write to file
encryptedAndCompressed.writeData("sensitive data");

// Read: read from file → decrypt → decompress → return data
String data = encryptedAndCompressed.readData();
```

:::tip[Interview Tip 🎯]
Decorator is perfect for the File System problem (adding permissions, encryption, logging to files). Mention it when you see the need to "stack" behaviors: *"I'll use Decorator here so we can independently combine logging, encryption, and caching without a class explosion."*
:::

---

## Composite

**Intent:** Compose objects into tree structures to represent part-whole hierarchies. Treat individual objects and compositions uniformly.

**Use when:** You have a tree structure and want clients to treat leaf nodes and branches the same way.

```java
// File system example — classic Composite
public interface FileSystemEntry {
    String getName();
    long getSize();
    void print(String indent);
    void accept(FileSystemVisitor visitor);  // for future extensibility
}

// Leaf
public class File implements FileSystemEntry {
    private final String name;
    private final long size;

    public File(String name, long size) {
        this.name = name;
        this.size = size;
    }

    @Override public String getName() { return name; }
    @Override public long getSize() { return size; }

    @Override
    public void print(String indent) {
        System.out.println(indent + "📄 " + name + " (" + size + " bytes)");
    }
}

// Composite
public class Directory implements FileSystemEntry {
    private final String name;
    private final List<FileSystemEntry> children = new ArrayList<>();

    public Directory(String name) { this.name = name; }

    public void add(FileSystemEntry entry) { children.add(entry); }
    public void remove(FileSystemEntry entry) { children.remove(entry); }

    @Override public String getName() { return name; }

    @Override
    public long getSize() {
        // Recursive — size = sum of all children's sizes
        return children.stream().mapToLong(FileSystemEntry::getSize).sum();
    }

    @Override
    public void print(String indent) {
        System.out.println(indent + "📁 " + name + "/");
        children.forEach(c -> c.print(indent + "  "));
    }
}

// Usage — build a tree and treat it uniformly
Directory root = new Directory("root");
Directory src  = new Directory("src");
Directory main = new Directory("main");

main.add(new File("Main.java", 1024));
main.add(new File("App.java", 2048));
src.add(main);
root.add(src);
root.add(new File("README.md", 512));

root.print("");  // prints entire tree recursively
System.out.println("Total size: " + root.getSize() + " bytes");  // recursive sum
```

---

## Facade

**Intent:** Provide a simplified interface to a complex subsystem.

**Use when:** A subsystem is complex and you want to provide a simple entry point for common use cases.

```java
// Complex home theater subsystem
public class Amplifier {
    public void on() { System.out.println("Amp on"); }
    public void setVolume(int level) { System.out.println("Volume: " + level); }
}

public class Projector {
    public void on() { System.out.println("Projector on"); }
    public void wideScreenMode() { System.out.println("Widescreen mode"); }
}

public class StreamingPlayer {
    public void on() { System.out.println("Player on"); }
    public void play(String movie) { System.out.println("Playing: " + movie); }
}

public class Lights {
    public void dim(int level) { System.out.println("Lights dimmed to " + level + "%"); }
}

// Facade — simple interface over the complex subsystem
public class HomeTheaterFacade {
    private final Amplifier amp;
    private final Projector  projector;
    private final StreamingPlayer player;
    private final Lights lights;

    public HomeTheaterFacade(Amplifier amp, Projector projector,
                              StreamingPlayer player, Lights lights) {
        this.amp = amp;
        this.projector = projector;
        this.player = player;
        this.lights = lights;
    }

    public void watchMovie(String movie) {
        System.out.println("Get ready to watch a movie...");
        lights.dim(10);
        amp.on();
        amp.setVolume(15);
        projector.on();
        projector.wideScreenMode();
        player.on();
        player.play(movie);
    }

    public void endMovie() {
        System.out.println("Shutting down the home theater...");
        // reverse sequence
    }
}

// Client — one method call instead of 8
HomeTheaterFacade theater = new HomeTheaterFacade(amp, projector, player, lights);
theater.watchMovie("Inception");
```

---

## Proxy

**Intent:** Provide a surrogate or placeholder for another object to control access to it.

**Use when:** You need lazy initialization, access control, caching, or logging around an object.

```java
// Subject interface
public interface ImageLoader {
    BufferedImage load(String url);
}

// Real subject — expensive to instantiate
public class RemoteImageLoader implements ImageLoader {
    @Override
    public BufferedImage load(String url) {
        System.out.println("Fetching image from network: " + url);
        // Expensive network call here...
        return fetchFromNetwork(url);
    }
}

// Proxy — adds caching (virtual proxy)
public class CachingImageProxy implements ImageLoader {
    private final ImageLoader realLoader;
    private final Map<String, BufferedImage> cache = new ConcurrentHashMap<>();

    public CachingImageProxy(ImageLoader realLoader) {
        this.realLoader = realLoader;
    }

    @Override
    public BufferedImage load(String url) {
        return cache.computeIfAbsent(url, key -> {
            System.out.println("Cache miss — loading from remote: " + key);
            return realLoader.load(key);
        });
    }
}

// Protection Proxy — adds access control
public class AuthenticatedImageProxy implements ImageLoader {
    private final ImageLoader inner;
    private final UserSession session;

    public AuthenticatedImageProxy(ImageLoader inner, UserSession session) {
        this.inner = inner;
        this.session = session;
    }

    @Override
    public BufferedImage load(String url) {
        if (!session.isAuthenticated()) {
            throw new AccessDeniedException("Login required to load images");
        }
        return inner.load(url);
    }
}

// Stack proxies
ImageLoader loader = new AuthenticatedImageProxy(
    new CachingImageProxy(
        new RemoteImageLoader()
    ),
    currentSession
);
```

:::note[Senior Deep Dive 🔴]
**Proxy vs Decorator:** Both wrap an object and delegate to it. The key difference is *intent*:
- **Proxy** controls *access* to the real object (same interface, transparent to client)
- **Decorator** *adds behavior* (the client knows it's using a decorator)

In practice: if the caller doesn't know the wrapper exists → Proxy. If the caller explicitly stacks wrappers → Decorator.
:::

---

## Quick Reference

| Pattern | Structural Role | Key Signal |
|---------|----------------|-----------|
| **Adapter** | Interface translation | "I have class X but need interface Y" |
| **Decorator** | Runtime behavior stacking | "I need to add features dynamically" |
| **Composite** | Tree structure | "Part-whole hierarchy, treat uniformly" |
| **Facade** | Simplify complex subsystem | "This subsystem is too complex for clients" |
| **Proxy** | Access control / caching | "I need to intercept calls transparently" |

**Next →** [Behavioral Patterns](./behavioral)
