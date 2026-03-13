---
id: builder
title: "Builder Pattern"
slug: builder
description: Explains the Builder pattern for constructing complex objects step by step with clearer, more maintainable APIs.
tags: [design-patterns, java, creational, builder]
---

# Builder Pattern

> **Category:** Creational  
> **Intent:** Separate the construction of a complex object from its representation, allowing the same construction process to create different representations.

---

## Overview

The Builder pattern constructs complex objects step by step. Unlike constructors that require all parameters upfront, a builder lets you set properties one at a time and then assemble the final object. This is especially valuable when objects have many optional parameters.

**Key characteristics:**
- Step-by-step object construction
- Fluent API through method chaining (`return this`)
- Separates construction logic from the object's representation
- Can produce different representations using the same construction process

---

## When to Use

- Objects have many parameters (especially optional ones) — the "telescoping constructor" problem
- Object construction involves multiple steps or configurations
- You need to create different representations of the same type of object
- You want to enforce immutability in the constructed object
- Object creation requires validation across multiple fields

---

## How It Works

### The Telescoping Constructor Problem

Without Builder, adding optional parameters leads to an explosion of constructors:

```java
// BAD — telescoping constructors
public class Pizza {
    public Pizza(String size) { ... }
    public Pizza(String size, boolean cheese) { ... }
    public Pizza(String size, boolean cheese, boolean pepperoni) { ... }
    public Pizza(String size, boolean cheese, boolean pepperoni, boolean mushrooms) { ... }
    // ... and so on
}
```

### Builder Solution

```java
public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeout;
    private final boolean followRedirects;

    private HttpRequest(Builder builder) {
        this.url = builder.url;
        this.method = builder.method;
        this.headers = Collections.unmodifiableMap(builder.headers);
        this.body = builder.body;
        this.timeout = builder.timeout;
        this.followRedirects = builder.followRedirects;
    }

    // Getters only — the object is immutable
    public String getUrl() { return url; }
    public String getMethod() { return method; }
    public Map<String, String> getHeaders() { return headers; }
    public String getBody() { return body; }
    public int getTimeout() { return timeout; }
    public boolean isFollowRedirects() { return followRedirects; }

    public static class Builder {
        // Required
        private final String url;

        // Optional with defaults
        private String method = "GET";
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeout = 30_000;
        private boolean followRedirects = true;

        public Builder(String url) {
            this.url = Objects.requireNonNull(url, "URL must not be null");
        }

        public Builder method(String method) {
            this.method = method;
            return this;
        }

        public Builder header(String key, String value) {
            this.headers.put(key, value);
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public Builder timeout(int timeout) {
            this.timeout = timeout;
            return this;
        }

        public Builder followRedirects(boolean followRedirects) {
            this.followRedirects = followRedirects;
            return this;
        }

        public HttpRequest build() {
            // Validation
            if (("POST".equals(method) || "PUT".equals(method)) && body == null) {
                throw new IllegalStateException(method + " request requires a body");
            }
            return new HttpRequest(this);
        }
    }
}

// Usage — fluent, readable, self-documenting
HttpRequest request = new HttpRequest.Builder("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer token123")
    .body("{\"name\": \"John\"}")
    .timeout(5000)
    .followRedirects(false)
    .build();
```

### Director Pattern (Optional)

A Director encapsulates common build sequences—useful when you frequently build the same configurations:

```java
public class HttpRequestDirector {
    public static HttpRequest.Builder jsonPost(String url, String body) {
        return new HttpRequest.Builder(url)
            .method("POST")
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .body(body);
    }

    public static HttpRequest.Builder healthCheck(String baseUrl) {
        return new HttpRequest.Builder(baseUrl + "/health")
            .method("GET")
            .timeout(3000);
    }
}

// Usage
HttpRequest request = HttpRequestDirector.jsonPost(
    "https://api.example.com/users",
    "{\"name\": \"John\"}"
).timeout(5000).build();
```

---

## Builder vs Factory

| Aspect | Builder | Factory |
|--------|---------|---------|
| **Focus** | Step-by-step construction of complex objects | One-step creation, selecting the right type |
| **Complexity** | Complex objects with many optional parameters | Simpler objects, type-based selection |
| **Control** | Fine-grained construction control | Type-based creation |
| **Returns** | One specific class (configured differently) | Different implementations of an interface |

---

## Real-World Examples in Java

| Class | Description |
|-------|-------------|
| `StringBuilder` | Builds strings step by step |
| `Stream.Builder` | Builds streams incrementally |
| `Locale.Builder` | Constructs locale objects with various settings |
| `Calendar.Builder` (Java 8+) | Builds calendar instances |
| `HttpClient.newBuilder()` (Java 11+) | Builds HTTP clients with various configurations |
| Lombok's `@Builder` | Generates builder pattern code at compile time |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Eliminates telescoping constructors | More code than simple constructors |
| Enforces immutability naturally | Requires a separate builder class |
| Self-documenting fluent API | Not ideal for objects with few parameters |
| Separates required from optional params | |
| Enables validation at build time | |
| Same process, different representations | |

---

## Interview Questions

**Q1: What is the Builder pattern and when would you use it?**

The Builder pattern constructs complex objects step by step. It separates the construction of an object from its representation, allowing the same construction process to create different configurations. Use it when an object has many parameters (especially optional ones), when constructors become unwieldy, or when you need to enforce immutability with a readable construction API.

**Q2: How does the Builder pattern differ from the Factory pattern?**

The Builder pattern is for constructing complex objects with multiple parts through a detailed, step-by-step process. The Factory pattern creates simpler objects from a single method call, selecting the right type based on input. Builder gives fine-grained control over construction; Factory focuses on type selection.

**Q3: Can you explain how method chaining works in the Builder pattern?**

Each setter method in the builder sets an attribute and returns the builder object itself (`return this`). This allows a fluent interface where multiple setters can be called in a single expression: `new Builder("url").method("POST").body("data").build()`. This improves readability and makes the construction self-documenting.

**Q4: Provide an example of when using a Builder pattern is preferable over multiple constructors.**

Building an HTTP request with options for URL (required), method, headers, body, timeout, retries, redirect policy, and proxy settings. Having a constructor for each combination would be impractical. A Builder allows specifying only the relevant attributes, and the API clearly shows what's being configured. This is exactly how `java.net.http.HttpClient.newBuilder()` works in the JDK.

**Q5: What are the benefits of using the Builder pattern for constructing complex objects?**

Precise control over step-by-step construction. Cleaner code by separating construction from representation. Enforced immutability — the built object has no setters. Self-documenting API where each method clearly describes what it configures. Ability to validate the complete object state at build time. Support for different configurations using the same construction process.
