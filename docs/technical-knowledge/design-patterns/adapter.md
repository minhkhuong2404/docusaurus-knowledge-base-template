---
id: adapter
title: "Adapter Pattern"
slug: adapter
description: Explains the Adapter pattern for bridging incompatible interfaces so existing classes can work together cleanly.
tags: [design-patterns, java, structural, adapter]
---

# Adapter Pattern

> **Category:** Structural  
> **Intent:** Convert the interface of a class into another interface clients expect, allowing incompatible interfaces to work together.

---

## Overview

The Adapter pattern acts as a bridge between two incompatible interfaces. It wraps an existing class with a new interface so that it becomes compatible with the client's expected interface — without modifying the original class.

**Key characteristics:**
- Translates one interface into another
- Allows reuse of existing classes with incompatible interfaces
- The client works with the target interface, unaware of the adapter

---

## When to Use

- Integrating third-party libraries with different interfaces than your code expects
- Legacy code needs to work with a new system
- You want to reuse existing classes that don't match the required interface
- You need to create a reusable class that cooperates with unrelated or unforeseen classes

---

## How It Works

### Object Adapter (Composition — Recommended)

The adapter holds a reference to the adaptee and implements the target interface:

```java
// Target interface — what the client expects
public interface MediaPlayer {
    void play(String filename);
    String getFormat();
}

// Adaptee — existing class with an incompatible interface
public class VlcPlayer {
    public void playVlcFile(String filename) {
        System.out.println("VLC playing: " + filename);
    }

    public String supportedFormat() {
        return "VLC";
    }
}

// Another adaptee
public class FfmpegPlayer {
    public void playMedia(String path, String codec) {
        System.out.println("FFmpeg playing: " + path + " with codec " + codec);
    }
}

// Adapter for VlcPlayer
public class VlcAdapter implements MediaPlayer {
    private final VlcPlayer vlcPlayer;

    public VlcAdapter(VlcPlayer vlcPlayer) {
        this.vlcPlayer = vlcPlayer;
    }

    @Override
    public void play(String filename) {
        vlcPlayer.playVlcFile(filename);
    }

    @Override
    public String getFormat() {
        return vlcPlayer.supportedFormat();
    }
}

// Adapter for FfmpegPlayer
public class FfmpegAdapter implements MediaPlayer {
    private final FfmpegPlayer ffmpegPlayer;
    private final String codec;

    public FfmpegAdapter(FfmpegPlayer ffmpegPlayer, String codec) {
        this.ffmpegPlayer = ffmpegPlayer;
        this.codec = codec;
    }

    @Override
    public void play(String filename) {
        ffmpegPlayer.playMedia(filename, codec);
    }

    @Override
    public String getFormat() {
        return "FFmpeg (" + codec + ")";
    }
}

// Usage — client works with MediaPlayer only
MediaPlayer player = new VlcAdapter(new VlcPlayer());
player.play("movie.vlc");

MediaPlayer ffmpeg = new FfmpegAdapter(new FfmpegPlayer(), "H.264");
ffmpeg.play("video.mp4");
```

### Class Adapter (Inheritance)

The adapter extends the adaptee and implements the target interface:

```java
// Class adapter — uses inheritance instead of composition
public class VlcClassAdapter extends VlcPlayer implements MediaPlayer {
    @Override
    public void play(String filename) {
        playVlcFile(filename);  // inherited from VlcPlayer
    }

    @Override
    public String getFormat() {
        return supportedFormat();
    }
}
```

### Object Adapter vs Class Adapter

| Aspect | Object Adapter | Class Adapter |
|--------|---------------|---------------|
| **Mechanism** | Composition (has-a) | Inheritance (is-a) |
| **Flexibility** | Works with any subclass of adaptee | Tied to one specific adaptee class |
| **Java support** | ✅ Works naturally | ⚠️ Limited — Java has single inheritance |
| **Override behavior** | Cannot override adaptee methods | Can override adaptee methods |
| **Recommendation** | Preferred | Use only when you need to override |

---

## Real-World Examples

| Example | Target | Adaptee |
|---------|--------|---------|
| `java.io.InputStreamReader` | `Reader` | `InputStream` |
| `java.io.OutputStreamWriter` | `Writer` | `OutputStream` |
| `java.util.Arrays.asList()` | `List` | Array |
| `java.util.Collections.enumeration()` | `Enumeration` | `Collection` |
| Spring MVC `HandlerAdapter` | Unified handler interface | Various controller types |

`InputStreamReader` is a perfect example — it adapts a byte-oriented `InputStream` into a character-oriented `Reader`:

```java
// InputStream → Reader adapter
Reader reader = new InputStreamReader(new FileInputStream("data.txt"), StandardCharsets.UTF_8);
```

---

## Adapter vs Decorator vs Proxy

| Pattern | Purpose | Changes interface? | Adds behavior? |
|---------|---------|-------------------|----------------|
| **Adapter** | Make incompatible interfaces work together | ✅ Yes | ❌ No |
| **Decorator** | Add responsibilities dynamically | ❌ No (same interface) | ✅ Yes |
| **Proxy** | Control access to an object | ❌ No (same interface) | ✅ Yes (access control) |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Allows incompatible classes to collaborate | Introduces extra indirection |
| Single Responsibility — separates conversion logic | Can make code harder to follow with many adapters |
| Open/Closed — add adapters without modifying existing classes | Adds complexity when a simpler refactor might suffice |
| Promotes code reuse of existing classes | |

---

## Interview Questions

**Q1: What is the Adapter pattern and when would you use it?**

The Adapter pattern allows objects with incompatible interfaces to work together by creating an adapter that bridges the gap. It converts the interface of one class into another that the client expects. Use it when integrating third-party libraries, connecting legacy code to new systems, or when you need to reuse existing classes whose interfaces don't match your requirements.

**Q2: How does the Adapter pattern differ from the Decorator pattern?**

The Adapter converts an interface to make incompatible classes work together — it focuses on **compatibility**. The Decorator adds new functionality to objects dynamically without altering their structure — it focuses on **enhancement**. The Adapter changes the interface; the Decorator preserves it while adding behavior.

**Q3: What are the two types of adapters and how do they differ?**

**Class adapters** use inheritance — the adapter extends the adaptee class and implements the target interface. They can override adaptee behavior but are tied to one specific class. **Object adapters** use composition — the adapter holds a reference to the adaptee. They're more flexible (work with any subclass of the adaptee) and are generally preferred, especially in Java where single inheritance limits class adapters.

**Q4: Can you provide an example of using the Adapter pattern in Java?**

`InputStreamReader` adapts a byte-oriented `InputStream` into a character-oriented `Reader`. Your code expects a `Reader`, but you have a `FileInputStream`. The adapter translates between the two interfaces: `new InputStreamReader(new FileInputStream("file.txt"), UTF_8)`. The client reads characters while the underlying stream provides bytes.

**Q5: Why is the Adapter pattern useful when integrating third-party libraries?**

It lets you connect the library's interface to your application's interface without modifying either codebase. Your existing code continues to work with its expected interface, and the library remains untouched. The adapter acts as a translation layer, making integration clean, maintainable, and reversible.
