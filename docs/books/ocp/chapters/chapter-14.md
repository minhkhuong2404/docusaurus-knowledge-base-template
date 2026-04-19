---
id: chapter-14
title: "Chapter 14 — I/O"
sidebar_label: "Ch 14 · I/O"
description: "Complete guide to Java I/O: NIO.2 Path/Files API, classic java.io streams, BufferedReader/Writer, serialization (transient, serialVersionUID), directory walking with Files.walk(), file watching with WatchService, and common exam traps around stream closing and null returns."
tags:
  - io
  - nio2
  - path
  - files
  - serialization
  - bufferedreader
  - files-walk
  - watchservice
  - transient
  - serialversionuid
---

# Chapter 14 — I/O

<span class="chapter-badge">Exam Domain: Using Java I/O API</span>

> **Key Topics:** `java.io` streams, `java.nio.file` NIO.2, `Path`, `Files`, serialization, file walking, `BufferedReader`/`BufferedWriter`, `ObjectInputStream`/`ObjectOutputStream`.

---

## 🟦 New Learner: File I/O

### The Two I/O APIs

| API | Package | Introduced | Style |
|-----|---------|-----------|-------|
| Classic I/O | `java.io` | Java 1.0 | Stream-based, `File` class |
| NIO.2 | `java.nio.file` | Java 7 | `Path`/`Files` static methods |

**Prefer NIO.2** for modern code — richer API, better error handling.

---

### Path and Files (NIO.2)

```java
// Creating paths
Path p1 = Path.of("/home/user/data.txt");
Path p2 = Path.of("relative", "path", "file.txt");
Path p3 = Paths.get("/home/user/data.txt"); // legacy way

// Path operations (pure string manipulation — no I/O)
p1.getFileName();        // data.txt
p1.getParent();          // /home/user
p1.getRoot();            // /
p1.getNameCount();       // 3
p1.getName(0);           // home
p1.subpath(0, 2);        // home/user
p1.isAbsolute();         // true
p1.toAbsolutePath();     // resolves relative paths
p1.normalize();          // removes . and ..
p1.resolve("other.txt"); // /home/user/other.txt
p1.relativize(p2);       // relative path from p1 to p2
```

---

### Files — Checking and Metadata

```java
Path path = Path.of("data.txt");

Files.exists(path);          // true/false
Files.notExists(path);       // true/false
Files.isDirectory(path);
Files.isRegularFile(path);
Files.isReadable(path);
Files.isWritable(path);
Files.isHidden(path);
Files.size(path);            // bytes
Files.getLastModifiedTime(path);
```

---

### Files — Reading and Writing

```java
Path path = Path.of("data.txt");

// Read everything
String content = Files.readString(path);
List<String> lines = Files.readAllLines(path);
byte[] bytes = Files.readAllBytes(path);

// Write everything
Files.writeString(path, "Hello, NIO.2!");
Files.write(path, bytes);
Files.write(path, List.of("line1", "line2"), StandardOpenOption.APPEND);

// Stream of lines (lazy, must close)
try (Stream<String> stream = Files.lines(path)) {
    stream.filter(l -> l.startsWith("#")).forEach(System.out::println);
}
```

---

### Files — Creating, Copying, Moving, Deleting

```java
// Create
Files.createFile(Path.of("new.txt"));
Files.createDirectory(Path.of("newDir"));
Files.createDirectories(Path.of("a/b/c")); // creates all missing parents

// Copy
Files.copy(src, dest);                           // fails if dest exists
Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
Files.copy(src, dest, StandardCopyOption.COPY_ATTRIBUTES);

// Move/Rename
Files.move(src, dest, StandardCopyOption.REPLACE_EXISTING);

// Delete
Files.delete(path);         // throws if not found
Files.deleteIfExists(path); // safe version
```

---

### Classic java.io Streams

I/O streams are **unidirectional** — either input or output.

```
Byte Streams (raw bytes)        Character Streams (text, handles encoding)
InputStream                     Reader
  └── FileInputStream             └── FileReader
  └── BufferedInputStream         └── BufferedReader
  └── ObjectInputStream           └── InputStreamReader (bridge)
OutputStream                    Writer
  └── FileOutputStream            └── FileWriter
  └── BufferedOutputStream        └── BufferedWriter
  └── ObjectOutputStream          └── PrintWriter
```

**Always wrap with Buffered streams for performance:**

```java
// Writing text
try (BufferedWriter writer = new BufferedWriter(new FileWriter("out.txt"))) {
    writer.write("Line 1");
    writer.newLine();
    writer.write("Line 2");
}

// Reading text
try (BufferedReader reader = new BufferedReader(new FileReader("out.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}

// Modern NIO.2 versions (prefer these)
try (BufferedWriter bw = Files.newBufferedWriter(path)) { ... }
try (BufferedReader br = Files.newBufferedReader(path)) { ... }
```

---

### Serialization

Serialization converts an object graph to bytes; deserialization reconstructs it.

```java
// Mark class as serializable
public class Employee implements Serializable {
    private static final long serialVersionUID = 1L; // version identifier
    private String name;
    private int salary;
    transient private String password; // transient = NOT serialized
    static String company; // static = NOT serialized (belongs to class)
}

// Serialize
try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("data.ser"))) {
    oos.writeObject(employee);
}

// Deserialize
try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("data.ser"))) {
    Employee emp = (Employee) ois.readObject();
}
```

:::caution[Serialization Rules]
- Class must implement `Serializable`
- All fields must be serializable (or `transient`)
- `static` and `transient` fields are NOT serialized
- Missing `serialVersionUID` → compiler generates one based on class structure; changes break deserialization
:::

---

### Walking Directories

```java
// Walk all files recursively
try (Stream<Path> walk = Files.walk(Path.of("myDir"))) {
    walk.filter(Files::isRegularFile)
        .filter(p -> p.toString().endsWith(".java"))
        .forEach(System.out::println);
}

// Walk with depth limit
Files.walk(Path.of("myDir"), 2); // max 2 levels deep

// List directory contents (one level only)
try (Stream<Path> entries = Files.list(Path.of("myDir"))) {
    entries.forEach(System.out::println);
}

// Find with a BiPredicate
try (Stream<Path> found = Files.find(Path.of("myDir"), 10,
        (path, attrs) -> attrs.isRegularFile() && attrs.size() > 1000)) {
    found.forEach(System.out::println);
}
```

---

## 🟣 Senior Deep Dive

### `StandardOpenOption`

```java
Files.writeString(path, text, StandardOpenOption.APPEND);
Files.writeString(path, text, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
// Common options: CREATE, CREATE_NEW, APPEND, TRUNCATE_EXISTING, READ, WRITE, SYNC
```

### File Attributes

```java
BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
attrs.creationTime();
attrs.lastModifiedTime();
attrs.size();
attrs.isDirectory();
attrs.isSymbolicLink();

// POSIX attributes (Linux/Mac)
PosixFileAttributes posix = Files.readAttributes(path, PosixFileAttributes.class);
posix.permissions(); // Set<PosixFilePermission>
posix.owner();
```

### Symbolic Links and `NOFOLLOW_LINKS`

```java
Files.exists(symlink);                           // follows the link
Files.exists(symlink, LinkOption.NOFOLLOW_LINKS); // checks the link itself

Files.copy(symlink, dest, LinkOption.NOFOLLOW_LINKS); // copies the link, not target
```

### `WatchService` — File System Events

```java
WatchService watcher = FileSystems.getDefault().newWatchService();
Path dir = Path.of("watchDir");
dir.register(watcher, StandardWatchEventKinds.ENTRY_CREATE,
                       StandardWatchEventKinds.ENTRY_DELETE,
                       StandardWatchEventKinds.ENTRY_MODIFY);

WatchKey key = watcher.take(); // blocks until event
for (WatchEvent<?> event : key.pollEvents()) {
    System.out.println(event.kind() + ": " + event.context());
}
key.reset(); // MUST reset to receive further events
```

### Serialization `readObject`/`writeObject` Customization

```java
public class SecureData implements Serializable {
    private String sensitiveField;

    private void writeObject(ObjectOutputStream oos) throws IOException {
        oos.defaultWriteObject();
        // custom encryption before write
    }

    private void readObject(ObjectInputStream ois) throws IOException, ClassNotFoundException {
        ois.defaultReadObject();
        // validation after read
        if (sensitiveField == null) throw new InvalidObjectException("field is null");
    }
}
```

### `PrintWriter` and `PrintStream`

```java
// PrintWriter — wraps any Writer, handles all types
PrintWriter pw = new PrintWriter(new FileWriter("out.txt"), true); // autoFlush
pw.println("Line 1");
pw.printf("Formatted: %d%n", 42);

// System.out IS a PrintStream
System.out.printf("Hello, %s!%n", "world");
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| `Path.of()` | Preferred over `Paths.get()` (Java 11+) |
| `Files.readString()` | Reads entire file as String (Java 11+) |
| `Files.lines()` | Lazy `Stream<String>` — **must close** (try-with-resources) |
| `Files.walk()` | Recursive; lazy `Stream<Path>` — **must close** |
| `Files.list()` | One level only; lazy `Stream<Path>` — **must close** |
| `transient` | Field excluded from serialization |
| `static` fields | NOT serialized (belong to class, not instance) |
| `serialVersionUID` | Declare explicitly; mismatch causes `InvalidClassException` |
| `BufferedReader.readLine()` | Returns `null` at end-of-stream (not an exception!) |
| `ObjectInputStream.readObject()` | Returns `Object` — must cast; throws `ClassNotFoundException` |
| `Files.copy()` | Fails with `FileAlreadyExistsException` unless `REPLACE_EXISTING` |
| `Path` operations | Pure string manipulation — do NOT perform I/O, do NOT check existence |
| `Files.createDirectories()` | Creates all missing intermediate directories; no-op if already exists |
| `Files.delete()` | Throws if not found; `Files.deleteIfExists()` does not |
| `Files.mismatch(Path, Path)` | Returns `-1` if identical; otherwise index of first differing byte |
| `Files.readAllLines` / `readAllBytes` | Convenience methods — still handle large files carefully |
| `BufferedInputStream` / `BufferedOutputStream` | Wrap low-level streams to reduce syscalls |
| `InputStream.transferTo(OutputStream)` | Java 9+ — efficient bulk copy |
| `Charset` / `StandardCharsets` | Use `UTF_8` constant instead of string `"UTF-8"` |
| `Serializable` marker | No methods; subclasses inherit serializability |
| `readResolve` / `writeReplace` | Advanced serialization hooks for singleton control |
| `Path.relativize` | Other path relative to this path — both typically absolute or both relative |
| `Files.isSameFile` | Follows symlinks; compares actual file identity |
| `WatchService` | Register `Path` with `StandardWatchEventKinds` — key must be reset |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 14]
**Trap 1 — `Files.lines()` and `Files.walk()` must be closed:**
```java
// ❌ Resource leak — stream is never closed
Stream<String> lines = Files.lines(Path.of("data.txt"));
lines.forEach(System.out::println);

// ✅ Use try-with-resources
try (Stream<String> lines = Files.lines(Path.of("data.txt"))) {
    lines.forEach(System.out::println);
}
```

**Trap 2 — `Path` operations are NOT I/O operations:**
```java
Path p = Path.of("/non/existent/path");
p.getFileName(); // ✅ returns "path" — no file system access
p.getParent();   // ✅ returns /non/existent — no file system access
p.toAbsolutePath(); // ✅ resolves relative path — still no I/O
Files.exists(p); // THIS is the I/O check
```

**Trap 3 — `BufferedReader.readLine()` returns null, not exception:**
```java
try (BufferedReader br = Files.newBufferedReader(Path.of("data.txt"))) {
    String line;
    while ((line = br.readLine()) != null) { // null = end of file
        System.out.println(line);
    }
    // br.readLine() after EOF returns null — NOT an exception
}
```

**Trap 4 — `transient` and `static` are both NOT serialized:**
```java
class Config implements Serializable {
    String host = "localhost";      // ✅ serialized
    transient String password = ""; // ❌ not serialized → null after deserialization
    static int count = 0;           // ❌ not serialized → value from class, not object
    final int port = 8080;          // ✅ serialized (final ≠ transient)
}
```

**Trap 5 — `serialVersionUID` mismatch causes `InvalidClassException`:**
```java
// Serialized with:
class User implements Serializable {
    private static final long serialVersionUID = 1L;
    String name;
}
// Then you add a field and change serialVersionUID to 2L:
// ❌ Deserializing old data: InvalidClassException (UIDs don't match)
// ✅ Keep serialVersionUID = 1L and add default handling for the new field
```

**Trap 6 — `Files.copy()` without options fails on existing destination:**
```java
Files.copy(src, dest);                                    // ❌ FileAlreadyExistsException
Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING); // ✅
Files.copy(src, dest, StandardCopyOption.COPY_ATTRIBUTES);  // ✅ preserve metadata
```

**Trap 7 — `Path.normalize()` removes redundant elements:**
```java
Path p = Path.of("/a/b/../c/./d");
p.normalize(); // /a/c/d
// normalize() does NOT check if path exists on the file system
// Use toRealPath() to resolve symlinks AND check existence
```

**Trap 8 — `ObjectInputStream.readObject()` checked exception:**
```java
try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("data.ser"))) {
    Object obj = ois.readObject(); // throws ClassNotFoundException + IOException
    MyClass data = (MyClass) obj;  // unchecked ClassCastException if wrong type
}
// Both ClassNotFoundException AND IOException must be handled/declared
```

**Trap 9 — `Files.readString` throws `IOException` for missing file:**
```java
Files.readString(Path.of("missing.txt")); // NoSuchFileException extends IOException
```

**Trap 10 — `Files.walk` max depth:**
```java
try (Stream<Path> s = Files.walk(Path.of("root"), 1)) { } // depth 1 = only root + immediate children
```

**Trap 11 — `Console` may be `null` when no console attached:**
```java
Console c = System.console();
if (c != null) c.readLine();
```
:::

### Exam vignettes

```java
// Vignette 1 — try-with-resources on stream
try (var lines = Files.lines(Path.of("f.txt"))) {
    lines.limit(10).forEach(System.out::println);
}

// Vignette 2 — Path resolve
Path p = Path.of("/a/b");
p.resolve("c"); // /a/b/c
```

:::tip[Spring/Senior Relevance]
- `Files.walk()` with try-with-resources is used in Spring Boot test utilities to clean up temp directories and in Spring's `ResourcePatternResolver` for scanning classpath resources.
- Serialization (`Serializable`) matters in Spring Session (HTTP session replication), Spring Cache with distributed stores (Redis), and JPA entity caching. Always declare `serialVersionUID` in any class that crosses a JVM boundary.
- NIO.2 `WatchService` underpins Spring Boot's DevTools hot-reload mechanism — understanding the `ENTRY_MODIFY` / `ENTRY_CREATE` event model explains why sometimes DevTools doesn't detect all changes immediately.
:::

---

## 🔗 Review Questions Focus

1. What is the difference between `Files.walk()` and `Files.list()`?
2. Which fields are NOT serialized — `transient`, `static`, `final`, `private`?
3. What does `BufferedReader.readLine()` return at end of file?
4. What happens if you call `Files.copy()` to an existing destination without options?
5. What NIO.2 class do you use to watch for file system changes?
6. Do `Path` methods like `getFileName()` access the file system?
7. What exception is thrown if `serialVersionUID` doesn't match during deserialization?
8. What two checked exceptions must be handled when calling `ObjectInputStream.readObject()`?
9. What is the difference between `Files.delete()` and `Files.deleteIfExists()`?
10. Why must streams returned by `Files.lines()` and `Files.walk()` be closed?
