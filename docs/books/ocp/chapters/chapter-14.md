---
id: chapter-14
title: "Chapter 14 — I/O"
sidebar_label: "Ch 14 · I/O"
description: "Deep dive into Java Input/Output: Path/Files (NIO.2), legacy File, low/high-level streams, Serialization/Deserialization, Console interaction, stream manipulation (mark/reset), attributes/views, and directory traversal (walk, find, DirectoryStream)."
tags:
  - io
  - nio2
  - path
  - files
  - serialization
  - console
  - file-attributes
  - java-se-21
---

# Chapter 14 — I/O

<span class="chapter-badge">Exam Domain: Using Java I/O API</span>

> **Key Topics:** Legacy `java.io.File` vs NIO.2 `java.nio.file.Path`, high-level vs low-level I/O streams, object Serialization/Deserialization rules, JVM-wide `System` streams, `java.io.Console` capabilities, stream manipulation (`mark`/`reset`/`skip`), File Attribute Views, and recursive directory tree traversal (`walk`/`find`/`DirectoryStream`).

---

## 🟦 Legacy File vs. Modern NIO.2 Path

Java I/O has evolved from the original synchronous `java.io` package to the modern NIO.2 (`java.nio.file`) API. The exam tests both, along with translation between them.

### Comparing File and Path APIs

| Attribute / Feature | Legacy `java.io.File` | Modern NIO.2 `java.nio.file.Path` |
| :--- | :--- | :--- |
| **Creation** | `new File("path")` | `Path.of("path")` (or `Paths.get("path")` legacy factory) |
| **I/O Operations** | Methods inside the `File` class | Static helper methods in `java.nio.file.Files` class |
| **Metadata & Attributes** | Very limited (e.g. `length()`, `exists()`) | Rich, customizable `FileAttributeView` and `BasicFileAttributes` |
| **Symbolic Links** | Limited/No support | Native support (`LinkOption.NOFOLLOW_LINKS`, `isSymbolicLink()`) |
| **Exceptions** | Often returns `boolean` on failure (fails silently) | Throws `IOException` variants (e.g. `NoSuchFileException`) |

```java
// Converting between systems
File legacyFile = new File("zoo.txt");
Path modernPath = legacyFile.toPath();
File backToFile = modernPath.toFile();
```

---

### Path Manipulation (Metadata & String Processing)
Remember: **`Path` operations do NOT touch the file system!** They are pure string manipulations.

* **Absolute vs. Relative Paths:** An absolute path starts with a drive letter (e.g., `C:`) or a root forward slash `/`. A relative path does not.
* **Path Symbols:**
  * `.` refers to the current directory.
  * `..` refers to the parent directory.

```java
Path path = Path.of("/zoo/monkey/banana.txt");

System.out.println("FileName: " + path.getFileName()); // banana.txt
System.out.println("Parent: " + path.getParent());     // /zoo/monkey
System.out.println("Root: " + path.getRoot());         // /
System.out.println("Absolute? " + path.isAbsolute());  // true

// Listing sub-components
System.out.println("Name count: " + path.getNameCount()); // 3 (zoo, monkey, banana.txt)
System.out.println("Name at index 0: " + path.getName(0)); // zoo
System.out.println("Subpath(0,2): " + path.subpath(0, 2)); // zoo/monkey (exclusive of end index)
```

#### Path Resolution and Relativization
* **`resolve(Path other)`**: Joins two paths together. If `other` is absolute, it returns `other`.
* **`relativize(Path other)`**: Calculates the relative path from this path to `other`. Both paths must be of the same type (either both absolute or both relative), otherwise an `IllegalArgumentException` is thrown.
* **`normalize()`**: Cleans up path redundancies like `.` and `..` without accessing the file system.
* **`toRealPath()`**: Resolves symbolic links, normalizes the path, **and verifies the file exists on the disk** (throws `IOException` if not found).

```java
Path p1 = Path.of("fish.txt");
Path p2 = Path.of("birds.txt");
System.out.println(p1.resolve(p2)); // fish.txt/birds.txt

Path p3 = Path.of("/usr/local");
Path p4 = Path.of("/usr/local/bin/java");
System.out.println(p3.relativize(p4)); // bin/java
System.out.println(p4.relativize(p3)); // ../..
```

---

## 🟨 Files Helper Operations

The `java.nio.file.Files` class contains static helper methods to interact directly with the file system. Most of these throw `IOException`.

### Creation, Deletion, and Moving
* **`createDirectory(Path)`** / **`createDirectories(Path)`**: `createDirectory` throws an exception if the parent directory does not exist or if the target directory already exists. `createDirectories` creates all missing parent directories and is a no-op if the directory already exists.
* **`delete(Path)`** / **`deleteIfExists(Path)`**: `delete` throws `NoSuchFileException` if the path doesn't exist. `deleteIfExists` returns a `boolean` (true if deleted, false if not found). Both throw `DirectoryNotEmptyException` if deleting a non-empty directory.
* **`copy(Path, Path, CopyOption...)`**: Copies a file/directory. Directory copies are **shallow** (children are not copied). Fails if target exists unless `StandardCopyOption.REPLACE_EXISTING` is passed.
* **`move(Path, Path, CopyOption...)`**: Moves/renames. Performs an atomic move if `StandardCopyOption.ATOMIC_MOVE` is passed.

### Path Comparison: `isSameFile` vs. `mismatch`
* **`Files.isSameFile(Path, Path)`**:
  1. Compares path references directly first. If they are equal (via `equals()`), it returns `true` **without checking if the files exist**.
  2. If they are not equal, it accesses the file system to locate the files and determine if they resolve to the same underlying file system resource (handles symbolic links). It **will throw `IOException`** if the files do not exist.
* **`Files.mismatch(Path, Path)`**:
  * Compares the *contents* of two files.
  * Returns `-1` if the files are identical.
  * If they differ, returns the `long` index of the first byte where they differ.
  * Throws `IOException` if either file does not exist.

---

## 🟩 Java I/O Streams

I/O streams represent a flow of data. They can be divided into several axes:
1. **Byte Streams** (operating on raw 8-bit binary data, classes end in `Stream`) vs. **Character Streams** (operating on 16-bit Unicode characters, classes end in `Reader` or `Writer`).
2. **Input Streams** (read data) vs. **Output Streams** (write data).
3. **Low-level Streams** (interact directly with the underlying resource, e.g. `FileInputStream`) vs. **High-level Streams** (wrap around other streams to add buffering, formatting, or serialization features).

### Common Stream Hierarchy

```
Byte Streams (Binary Data)            Character Streams (Text Data)
----------------------------------    --------------------------------------
InputStream                           Reader
  ├── FileInputStream (Low)             ├── FileReader (Low)
  ├── BufferedInputStream (High)        ├── BufferedReader (High)
  └── ObjectInputStream (High)          └── InputStreamReader (Bridge/High)

OutputStream                          Writer
  ├── FileOutputStream (Low)            ├── FileWriter (Low)
  ├── BufferedOutputStream (High)       ├── BufferedWriter (High)
  ├── ObjectOutputStream (High)         ├── OutputStreamWriter (Bridge/High)
  └── PrintStream (High)                └── PrintWriter (High)
```

> [!NOTE]
> The **Bridge Streams** `InputStreamReader` and `OutputStreamWriter` convert a byte stream into a character stream (and vice versa), handling character encodings.

### The Wrapping Pattern
To achieve high performance, always wrap a low-level stream with a buffered high-level stream:

```java
// Buffer reading from a text file
try (var br = new BufferedReader(new FileReader("zoo.txt"))) {
    String line;
    while ((line = br.readLine()) != null) { // returns null at end-of-stream (EOF)
        System.out.println(line);
    }
}
```

---

## 🟪 Serialization & Deserialization

Serialization transforms an object's state into a byte stream. Deserialization reverses this.

### Requirements for Serialization
1. The class must implement the `java.io.Serializable` marker interface (it has no methods).
2. All non-transient, non-static instance fields must be serializable.
3. Every class should explicitly declare a `private static final long serialVersionUID`. If omitted, the compiler generates one automatically, but minor code changes will change the UID and break deserialization of old data (throwing `InvalidClassException`).

```java
public class Gorilla implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String name;
    private transient int age; // Marked transient: will NOT be serialized
    private static String habitat = "Forest"; // static fields are NOT serialized
    
    // Constructors, getters, setters
}
```

### Constructor Behavior During Deserialization
When an object is deserialized:
* **The constructor and instance initializers of the serialized class itself are NOT executed.**
* Java looks up the inheritance tree for the **first non-serializable superclass** and executes its no-argument constructor. Any parent classes above that non-serializable class will also have their constructors executed.
* `transient` fields revert to their default Java value (`null` for objects, `0` for numbers, `false` for booleans) unless populated by custom serialization logic.

```
Class Hierarchy:
Object (Non-Serializable) -> Mammal (Non-Serializable) -> Chimpanzee (Serializable)

When Chimpanzee is deserialized:
1. Mammal's default constructor is called.
2. Chimpanzee's constructor is completely bypassed.
3. Chimpanzee's transient fields are initialized to default values (0 or null).
```

### Customizing Serialization
Define these two `private` methods with exact signatures in your `Serializable` class to customize serialization behaviors (e.g., encrypting passwords, initializing transient fields):

```java
private void writeObject(ObjectOutputStream out) throws IOException {
    out.defaultWriteObject(); // Handles all normal non-transient fields
    // Custom logic: e.g. encrypt or write extra data
}

private void readObject(ObjectInputStream in) throws ClassNotFoundException, IOException {
    in.defaultReadObject(); // Handles all normal non-transient fields
    // Custom logic: e.g. decrypt or initialize transient fields
    this.age = 10; // set default value for transient field
}
```

---

## 🟧 User Interactions & System Streams

### The Shared JVM-wide System Streams
Java provides three static streams on `java.lang.System`:
* `System.out` (`PrintStream`): For standard application output.
* `System.err` (`PrintStream`): For application error logging.
* `System.in` (`InputStream`): For reading user keyboard input.

> [!WARNING]
> Do NOT close standard streams (`System.out.close()`, `System.err.close()`, `System.in.close()`) or use them inside a try-with-resources statement. Because they are shared JVM-wide, closing them renders them permanently unavailable for all threads, and `PrintStream` methods fail silently without throwing exceptions! `System.in` readers, however, will throw an `IOException` if accessed after being closed.

---

### Working with `java.io.Console`
The `Console` class is a singleton tailored for command-line interactive input.

* **Retrieval:** Obtain via `System.console()`.
* **Important:** `System.console()` will return `null` if the JVM is not attached to an interactive terminal session (like inside many IDE runners or background server processes). You **must** check for null before using it!
* **Private Constructor:** `new Console()` does not compile.

```java
Console console = System.console();
if (console != null) {
    String username = console.readLine("Enter username: ");
    
    // Read password securely: text is not echoed to terminal,
    // and returns char[] instead of String to prevent secret pooling in memory.
    char[] password = console.readPassword("Enter password: ");
    
    console.writer().format("User %s is logging in...", username);
    console.flush(); // Ensure output is written immediately
} else {
    System.err.println("Console is not available!");
}
```

---

## 🟫 Advanced I/O and NIO.2 APIs

### Stream Position Manipulation
Some input streams and readers support traversing forward and backing up:

* **`markSupported()`**: Returns `true` if the stream supports marking a location.
* **`mark(int readLimit)`**: Marks the current position in the stream. The `readLimit` tells the stream how many bytes can be read before the mark becomes invalid.
* **`reset()`**: Resets the stream back to the position of the last mark. Throws `IOException` if the mark is invalid or not supported.
* **`skip(long n)`**: Skips and discards `n` bytes/characters of data from the stream. Returns the actual number of elements skipped.

```java
// Given stream has bytes: [L, I, O, N]
if (is.markSupported()) {
    System.out.print((char) is.read()); // L
    is.mark(10);
    System.out.print((char) is.read()); // I
    System.out.print((char) is.read()); // O
    is.reset();                         // resets stream to 'I'
}
System.out.print((char) is.read());     // I
System.out.print((char) is.read());     // O
System.out.print((char) is.read());     // N
// Prints: LIOION
```

---

### Discovering File Attributes and Views
To avoid costly individual disk calls, NIO.2 allows fetching attributes in bulk or requesting an updatable view.

* **Bulk Read:** `Files.readAttributes(path, BasicFileAttributes.class)` returns a read-only snapshot.
* **Updatable View:** `Files.getFileAttributeView(path, BasicFileAttributeView.class)` returns an object that allows writing attribute metadata.

```java
Path path = Path.of("zoo.txt");

// 1. Read-only bulk retrieval
BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
System.out.println("Size: " + attrs.size());
System.out.println("Is Directory: " + attrs.isDirectory());

// 2. Modifying file times (e.g. updating last modified time by 10s)
BasicFileAttributeView view = Files.getFileAttributeView(path, BasicFileAttributeView.class);
FileTime newTime = FileTime.fromMillis(attrs.lastModifiedTime().toMillis() + 10_000);
view.setTimes(newTime, null, null); // Pass null to leave values unchanged
```

---

### Traversing a Directory Tree (Recursion)
NIO.2 provides modern Stream-based APIs to walk directories. **All stream-returning methods (`walk`, `find`, `list`, `lines`) must be closed using try-with-resources to avoid file handle leaks!**

* **`Files.list(Path)`**: Lists direct children (depth 1 only).
* **`Files.walk(Path, int maxDepth, FileVisitOption...)`**: Recursively traverses depth-first. Does NOT follow symbolic links by default. Must pass `FileVisitOption.FOLLOW_LINKS` to enable.
* **`Files.find(Path, int maxDepth, BiPredicate<Path, BasicFileAttributes>, FileVisitOption...)`**: Recursively walks and filters using a predicate that gets both the path and the attributes.

:::caution
If `FOLLOW_LINKS` is enabled and the directory tree has a circular reference (e.g., a symlink pointing to an ancestor folder), walking the tree will throw a `FileSystemLoopException` to prevent infinite recursion.
:::

```java
// Searching files using Files.find()
try (Stream<Path> stream = Files.find(
        Path.of("/project"), 
        10, 
        (p, attr) -> attr.isRegularFile() && p.toString().endsWith(".java")
    )) {
    stream.forEach(System.out::println);
}
```

* **`DirectoryStream` (Alternative Legacy NIO.2):** An older iterable interface to filter directory contents using wildcards:
```java
try (DirectoryStream<Path> dirStream = Files.newDirectoryStream(Path.of("/data"), "*.{txt,java}")) {
    for (Path entry : dirStream) {
        System.out.println(entry);
    }
}
```

---

## 🚨 Top Exam Traps & Gotchas

:::danger[Top I/O Traps to Watch For]
1. **Path String Operations vs. File System Access:**
   `Path.of("/invalid/file.txt").getParent()` returns `/invalid`. It compiles and runs successfully! String operations (`getParent()`, `getFileName()`, `getName()`, `subpath()`, `resolve()`, `relativize()`) **never** check if the path exists. Only `toRealPath()` and `Files` methods do.
2. **Missing `FOLLOW_LINKS` Option:**
   `Files.walk()` does **not** follow symbolic links by default. If the exam question asks if a symlink's contents are listed, the answer is no unless `FileVisitOption.FOLLOW_LINKS` is explicitly specified.
3. **Closing Streams in Try-With-Resources:**
   If a stream like `Files.lines()` or `Files.walk()` is used in a standard pipeline without a try-with-resources block, it constitutes a **resource leak**.
4. **`mismatch` Returns `-1`:**
   Be careful: `Files.mismatch(p1, p2)` returns `-1` if the files are identical, and `0` or greater if they differ (representing the first index of difference). Do not confuse it with returns of standard comparators where `0` means equal!
5. **No-Args Constructors in Deserialization:**
   During deserialization, the constructor of the class being deserialized is **ignored**. The constructor of the first non-serializable superclass is run.
6. **`delete()` vs `deleteIfExists()`:**
   `Files.delete(Path)` throws `NoSuchFileException` if the file doesn't exist, whereas `Files.deleteIfExists(Path)` returns `false` cleanly.
7. **Writing to Directories:**
   You cannot write content directly into a directory path. Doing so throws an `IOException` (typically `AccessDeniedException` or similar depending on OS).
:::

---

## 🔗 Review Focus Questions

1. Which method on `Path` accesses the file system to normalize paths and resolve symbolic links?
2. What exception is thrown if `Files.walk()` encounters a circular reference when `FOLLOW_LINKS` is enabled?
3. Which method compares the contents of two files and returns `-1` if they are identical?
4. What happens when you deserialize an object whose class contains a `transient` instance field?
5. Why should you avoid calling `close()` on `System.out` or `System.err`?
6. Under what circumstances will `System.console()` return `null`?
7. What is the difference between `Files.createDirectory()` and `Files.createDirectories()`?
8. How does `isSameFile()` behave if the two paths are identical according to `Path.equals()`?
9. Which stream class is used to bridge a byte stream to a character stream?
10. What is the return type of `Console.readPassword()` and why is it preferred over a String?

<details>
<summary>Click to view answers</summary>

1. **`Path.toRealPath()`**.
2. **`java.nio.file.FileSystemLoopException`**.
3. **`Files.mismatch(Path, Path)`**.
4. The field is not serialized and, upon deserialization, it is initialized to its default type value (`null`, `0`, or `false`).
5. These streams are shared JVM-wide. Closing them makes them permanently unavailable for the remainder of the program, and `PrintStream` methods fail silently.
6. When the application is run in a non-interactive environment (e.g. within an IDE, inside a build tool like Maven/Gradle, or redirecting I/O to/from a pipe or file).
7. `createDirectory()` fails if parent folders are missing or the target directory already exists. `createDirectories()` creates any missing intermediate parent folders and is a no-op if the target folder already exists.
8. It returns `true` immediately without checking if the files actually exist on the disk.
9. **`java.io.InputStreamReader`**.
10. **`char[]`**. It prevents password characters from being stored in the JVM's immutable `String` constant pool, allowing the characters to be cleared from memory immediately after use.
</details>
