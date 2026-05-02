---
id: creational
title: Creational Patterns
sidebar_label: Creational Patterns
---

# Creational Patterns

> Creational patterns abstract the instantiation process — they help you create objects in a manner suited to the situation, hiding the creation logic from callers.

---

## Singleton

**Intent:** Ensure a class has exactly one instance and provide global access to it.

**Use when:** Managing a shared resource — config, connection pool, registry.

```java
// ✅ Thread-safe Singleton using enum (Josh Bloch's recommendation)
public enum AppConfig {
    INSTANCE;

    private final Properties props = loadProperties();

    private Properties loadProperties() {
        Properties p = new Properties();
        try (InputStream in = getClass().getResourceAsStream("/app.properties")) {
            p.load(in);
        } catch (IOException e) {
            throw new RuntimeException("Cannot load config", e);
        }
        return p;
    }

    public String get(String key) {
        return props.getProperty(key);
    }

    public int getInt(String key) {
        return Integer.parseInt(props.getProperty(key));
    }
}

// Usage
String dbUrl = AppConfig.INSTANCE.get("db.url");
```

```java
// ✅ Classic thread-safe lazy Singleton using double-checked locking
public class ConnectionPool {
    // volatile ensures visibility across threads
    private static volatile ConnectionPool instance;
    private final List<Connection> connections;

    private ConnectionPool(int poolSize) {
        connections = new ArrayList<>(poolSize);
        for (int i = 0; i < poolSize; i++) {
            connections.add(createConnection());
        }
    }

    public static ConnectionPool getInstance() {
        if (instance == null) {                     // First check (no lock)
            synchronized (ConnectionPool.class) {
                if (instance == null) {             // Second check (with lock)
                    instance = new ConnectionPool(10);
                }
            }
        }
        return instance;
    }

    public synchronized Connection acquire() { /* ... */ }
    public synchronized void release(Connection c) { /* ... */ }
}
```

:::note[Senior Deep Dive 🔴]
The `volatile` keyword on the instance field is **mandatory** for double-checked locking correctness. Without it, a partially constructed object can be visible to other threads due to instruction reordering. The enum approach avoids this entirely and is preferable.
:::

---

## Factory Method

**Intent:** Define an interface for creating an object, but let subclasses decide which class to instantiate.

**Use when:** The exact type of object to create varies by subclass or context.

```java
// Product interface
public interface Notification {
    void send(String recipient, String message);
}

// Concrete products
public class EmailNotification implements Notification {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Email to " + recipient + ": " + message);
    }
}

public class PushNotification implements Notification {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Push to device " + recipient + ": " + message);
    }
}

public class SmsNotification implements Notification {
    @Override
    public void send(String recipient, String message) {
        System.out.println("SMS to " + recipient + ": " + message);
    }
}

// Creator — uses a factory method
public class NotificationFactory {
    public static Notification create(NotificationType type) {
        return switch (type) {
            case EMAIL -> new EmailNotification();
            case PUSH  -> new PushNotification();
            case SMS   -> new SmsNotification();
        };
    }
}

// Usage
Notification n = NotificationFactory.create(NotificationType.EMAIL);
n.send("alice@example.com", "Your order shipped!");
```

:::tip Interview Tip 🎯
When you create objects in an interview, don't use `new` directly in business logic. Say: *"I'll use a factory here so the caller doesn't need to know the concrete type — this keeps the creation logic centralized and makes it easy to add new types."*
:::

---

## Abstract Factory

**Intent:** Create families of related objects without specifying their concrete classes.

**Use when:** A system needs to be independent of how its products are created, and you need to ensure compatibility between products.

```java
// Abstract factory for UI components (cross-platform example)
public interface Button {
    void render();
    void onClick(Runnable handler);
}

public interface TextField {
    void render();
    String getValue();
}

// Abstract Factory
public interface UIFactory {
    Button createButton(String label);
    TextField createTextField(String placeholder);
}

// macOS family
public class MacButton implements Button {
    private final String label;
    public MacButton(String label) { this.label = label; }
    @Override public void render() { System.out.println("[Mac Button: " + label + "]"); }
    @Override public void onClick(Runnable h) { h.run(); }
}

public class MacTextField implements TextField {
    private final String placeholder;
    public MacTextField(String placeholder) { this.placeholder = placeholder; }
    @Override public void render() { System.out.println("[Mac TextField: " + placeholder + "]"); }
    @Override public String getValue() { return ""; }
}

public class MacUIFactory implements UIFactory {
    @Override public Button createButton(String label) { return new MacButton(label); }
    @Override public TextField createTextField(String ph) { return new MacTextField(ph); }
}

// Windows family — analogous implementation
public class WindowsUIFactory implements UIFactory { /* ... */ }

// Application — works with any UI family
public class LoginDialog {
    private final Button submitButton;
    private final TextField emailField;
    private final TextField passwordField;

    public LoginDialog(UIFactory factory) {
        emailField    = factory.createTextField("Email");
        passwordField = factory.createTextField("Password");
        submitButton  = factory.createButton("Login");
    }

    public void render() {
        emailField.render();
        passwordField.render();
        submitButton.render();
    }
}

// Wire the right family at startup
UIFactory factory = isMac() ? new MacUIFactory() : new WindowsUIFactory();
LoginDialog dialog = new LoginDialog(factory);
```

---

## Builder

**Intent:** Separate the construction of a complex object from its representation.

**Use when:** An object has many optional parameters, or construction requires multiple steps.

```java
// HTTP Request builder — classic Builder pattern
public class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final String body;
    private final int timeoutMs;
    private final boolean followRedirects;

    private HttpRequest(Builder builder) {
        this.method          = builder.method;
        this.url             = builder.url;
        this.headers         = Map.copyOf(builder.headers);
        this.body            = builder.body;
        this.timeoutMs       = builder.timeoutMs;
        this.followRedirects = builder.followRedirects;
    }

    public static Builder newBuilder(String method, String url) {
        return new Builder(method, url);
    }

    // Getters...
    public String getMethod() { return method; }
    public String getUrl() { return url; }

    public static class Builder {
        private final String method;
        private final String url;
        private final Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeoutMs = 30_000;         // sensible default
        private boolean followRedirects = true;  // sensible default

        private Builder(String method, String url) {
            this.method = Objects.requireNonNull(method);
            this.url    = Objects.requireNonNull(url);
        }

        public Builder header(String name, String value) {
            headers.put(name, value);
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public Builder timeoutMs(int ms) {
            if (ms <= 0) throw new IllegalArgumentException("Timeout must be positive");
            this.timeoutMs = ms;
            return this;
        }

        public Builder followRedirects(boolean follow) {
            this.followRedirects = follow;
            return this;
        }

        public HttpRequest build() {
            // Validate here before constructing
            if ("POST".equals(method) && body == null) {
                throw new IllegalStateException("POST request requires a body");
            }
            return new HttpRequest(this);
        }
    }
}

// Fluent, readable construction
HttpRequest request = HttpRequest.newBuilder("POST", "https://api.example.com/orders")
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer " + token)
    .body("""
        {"productId": "123", "quantity": 2}
        """)
    .timeoutMs(5_000)
    .build();
```

:::tip Interview Tip 🎯
Builder is perfect for problems where objects have many configuration options (think: `ParkingLot`, `ElevatorSystem`). In interviews, build your domain objects with builders and highlight: *"I'm using the Builder pattern here because the parking lot has many optional parameters, and I want construction to be readable and validated."*
:::

---

## Prototype

**Intent:** Create new objects by copying (cloning) an existing object.

**Use when:** Object creation is expensive, and you need many instances that differ slightly.

```java
public class GameCharacter implements Cloneable {
    private String name;
    private int health;
    private int mana;
    private List<String> abilities;
    private Map<String, Integer> stats;

    // Deep copy via clone()
    @Override
    public GameCharacter clone() {
        try {
            GameCharacter copy = (GameCharacter) super.clone();
            copy.abilities = new ArrayList<>(this.abilities); // deep copy list
            copy.stats = new HashMap<>(this.stats);           // deep copy map
            return copy;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError("Should never happen", e);
        }
    }
}

// Use a registry of prototypes
public class CharacterRegistry {
    private final Map<String, GameCharacter> prototypes = new HashMap<>();

    public void register(String key, GameCharacter character) {
        prototypes.put(key, character);
    }

    public GameCharacter create(String key) {
        GameCharacter prototype = prototypes.get(key);
        if (prototype == null) throw new IllegalArgumentException("Unknown character: " + key);
        return prototype.clone(); // return a copy
    }
}

// Pre-register expensive-to-create archetypes
GameCharacter warriorTemplate = buildWarrior(); // expensive DB lookup, stat calculation
registry.register("WARRIOR", warriorTemplate);

// Cheap to clone many instances
GameCharacter player1 = registry.create("WARRIOR");
GameCharacter player2 = registry.create("WARRIOR");
player2.setName("Gandalf"); // modify the copy — original unchanged
```

---

## Pattern Comparison

| Pattern | Creates | Key mechanism | Use when |
|---------|---------|--------------|---------|
| **Singleton** | One instance | Private constructor + static | Shared resource |
| **Factory Method** | One product type | Static/instance factory | Decouple creation from use |
| **Abstract Factory** | Families of products | Factory interface | Consistent families |
| **Builder** | One complex object | Fluent builder + validation | Many optional params |
| **Prototype** | Copies of an object | `clone()` | Expensive creation |

**Next →** [Structural Patterns](./structural)
