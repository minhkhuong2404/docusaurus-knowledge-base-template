---
id: file-system
title: "Problem: File System"
sidebar_label: 📁 File System
---

# File System

> **Difficulty:** Hard | **Frequency:** Medium | **Patterns:** Composite, Iterator, Decorator

---

## Interview Expectation

The File System problem is a textbook Composite pattern application. Interviewers evaluate:

| Expectation | Details |
|------------|---------|
| Composite pattern | Files and directories treated uniformly |
| Tree traversal | DFS/BFS, path resolution |
| Path operations | Absolute vs relative, `..` resolution |
| Search | Find by name, extension, size, content |
| Permissions (bonus) | Read/write/execute bits, Decorator for access control |

---

## Step 1: Clarify Requirements

- **File operations?** → create, read, write, delete, move, copy
- **Directory operations?** → create, delete (recursive?), list, search
- **Paths?** → Unix-style absolute (`/home/user/file.txt`) and relative
- **Permissions?** → basic owner/group/other rwx
- **Symbolic links?** → out of scope for interview
- **Max file size?** → in-memory for interview; discuss storage backends

---

## Step 2: Composite Structure

```java
// ── Component (Composite interface) ───────────────────────
public abstract class FileSystemNode {
    protected String name;
    protected Directory parent;
    protected LocalDateTime createdAt;
    protected LocalDateTime modifiedAt;
    protected Permission permission;

    protected FileSystemNode(String name) {
        this.name       = name;
        this.createdAt  = LocalDateTime.now();
        this.modifiedAt = LocalDateTime.now();
        this.permission = Permission.defaultPermission();
    }

    public abstract long getSize();
    public abstract boolean isDirectory();
    public abstract FileSystemNode find(String name);
    public abstract List<FileSystemNode> listAll();
    public abstract void accept(FileSystemVisitor visitor);

    public String getName()     { return name; }
    public Directory getParent() { return parent; }

    public String getAbsolutePath() {
        if (parent == null) return "/" + name;
        String parentPath = parent.getAbsolutePath();
        return parentPath.equals("/") ? "/" + name : parentPath + "/" + name;
    }

    public void touch() { modifiedAt = LocalDateTime.now(); }
}

// ── File (Leaf) ───────────────────────────────────────────
public class File extends FileSystemNode {
    private byte[] content;

    public File(String name) {
        super(name);
        this.content = new byte[0];
    }

    public File(String name, String content) {
        super(name);
        this.content = content.getBytes(StandardCharsets.UTF_8);
    }

    public String read() {
        return new String(content, StandardCharsets.UTF_8);
    }

    public void write(String data) {
        this.content  = data.getBytes(StandardCharsets.UTF_8);
        touch();
    }

    public void append(String data) {
        byte[] newData = data.getBytes(StandardCharsets.UTF_8);
        byte[] merged  = new byte[content.length + newData.length];
        System.arraycopy(content, 0, merged, 0, content.length);
        System.arraycopy(newData, 0, merged, content.length, newData.length);
        this.content = merged;
        touch();
    }

    @Override public long getSize()     { return content.length; }
    @Override public boolean isDirectory() { return false; }
    @Override public List<FileSystemNode> listAll() { return List.of(this); }

    @Override
    public FileSystemNode find(String name) {
        return this.name.equals(name) ? this : null;
    }

    @Override
    public void accept(FileSystemVisitor visitor) { visitor.visitFile(this); }

    public String getExtension() {
        int dot = name.lastIndexOf('.');
        return dot >= 0 ? name.substring(dot + 1) : "";
    }
}

// ── Directory (Composite) ─────────────────────────────────
public class Directory extends FileSystemNode {
    private final Map<String, FileSystemNode> children = new LinkedHashMap<>(); // preserves insertion order

    public Directory(String name) { super(name); }

    // ── Mutation operations ────────────────────────────────

    public void add(FileSystemNode node) {
        if (children.containsKey(node.getName())) {
            throw new FileAlreadyExistsException(node.getName() + " already exists in " + name);
        }
        node.parent = this;
        children.put(node.getName(), node);
        touch();
    }

    public FileSystemNode remove(String name) {
        FileSystemNode removed = children.remove(name);
        if (removed != null) {
            removed.parent = null;
            touch();
        }
        return removed;
    }

    public Directory createSubDirectory(String name) {
        Directory dir = new Directory(name);
        add(dir);
        return dir;
    }

    public File createFile(String name) {
        File file = new File(name);
        add(file);
        return file;
    }

    // ── Query operations ───────────────────────────────────

    @Override
    public long getSize() {
        return children.values().stream().mapToLong(FileSystemNode::getSize).sum();
    }

    @Override
    public boolean isDirectory() { return true; }

    @Override
    public List<FileSystemNode> listAll() {
        List<FileSystemNode> all = new ArrayList<>();
        all.add(this);
        children.values().forEach(c -> all.addAll(c.listAll()));
        return all;
    }

    public List<FileSystemNode> list() {
        return new ArrayList<>(children.values());
    }

    @Override
    public FileSystemNode find(String name) {
        if (this.name.equals(name)) return this;
        for (FileSystemNode child : children.values()) {
            FileSystemNode found = child.find(name);
            if (found != null) return found;
        }
        return null;
    }

    public Optional<FileSystemNode> get(String name) {
        return Optional.ofNullable(children.get(name));
    }

    @Override
    public void accept(FileSystemVisitor visitor) {
        visitor.visitDirectory(this);
        children.values().forEach(c -> c.accept(visitor));
    }

    // ── Recursive delete ───────────────────────────────────
    public void deleteRecursive() {
        new ArrayList<>(children.values()).forEach(child -> {
            if (child instanceof Directory dir) dir.deleteRecursive();
            children.remove(child.getName());
        });
        if (parent != null) parent.remove(this.name);
    }
}
```

---

## Step 3: File System (Path Resolution + Search)

```java
public class InMemoryFileSystem {
    private final Directory root;

    public InMemoryFileSystem() {
        this.root = new Directory("");  // root has empty name; path = "/"
    }

    // ── Path resolution ────────────────────────────────────

    public Optional<FileSystemNode> resolve(String path) {
        if (path == null || path.isEmpty()) return Optional.empty();

        String[] parts = path.startsWith("/")
            ? Arrays.stream(path.substring(1).split("/")).filter(s -> !s.isEmpty()).toArray(String[]::new)
            : new String[0]; // relative path support omitted for brevity

        FileSystemNode current = root;
        for (String part : parts) {
            if (part.equals("..")) {
                current = current.getParent() != null ? current.getParent() : current;
            } else if (!part.equals(".")) {
                if (!(current instanceof Directory dir)) return Optional.empty();
                Optional<FileSystemNode> child = dir.get(part);
                if (child.isEmpty()) return Optional.empty();
                current = child.get();
            }
        }
        return Optional.of(current);
    }

    public File createFile(String path, String content) {
        String parentPath = path.substring(0, path.lastIndexOf('/'));
        String fileName   = path.substring(path.lastIndexOf('/') + 1);

        Directory parent = (Directory) resolve(parentPath.isEmpty() ? "/" : parentPath)
            .orElseThrow(() -> new PathNotFoundException(parentPath));
        File file = parent.createFile(fileName);
        file.write(content);
        return file;
    }

    public Directory createDirectory(String path) {
        String parentPath = path.substring(0, path.lastIndexOf('/'));
        String dirName    = path.substring(path.lastIndexOf('/') + 1);
        Directory parent  = (Directory) resolve(parentPath.isEmpty() ? "/" : parentPath)
            .orElseThrow(() -> new PathNotFoundException(parentPath));
        return parent.createSubDirectory(dirName);
    }

    // ── Search ─────────────────────────────────────────────

    public List<FileSystemNode> findByName(String name) {
        return root.listAll().stream()
            .filter(n -> n.getName().equals(name))
            .collect(Collectors.toList());
    }

    public List<File> findByExtension(String ext) {
        return root.listAll().stream()
            .filter(n -> !n.isDirectory())
            .map(n -> (File) n)
            .filter(f -> f.getExtension().equalsIgnoreCase(ext))
            .collect(Collectors.toList());
    }

    public List<FileSystemNode> findLargerThan(long bytes) {
        return root.listAll().stream()
            .filter(n -> n.getSize() > bytes)
            .collect(Collectors.toList());
    }

    // ── Tree print ─────────────────────────────────────────

    public void printTree() {
        root.accept(new PrintVisitor());
    }

    public Directory getRoot() { return root; }
}
```

---

## Step 4: Visitor for Operations

```java
// Visitor pattern for extensible tree operations
public interface FileSystemVisitor {
    void visitFile(File file);
    void visitDirectory(Directory directory);
}

public class PrintVisitor implements FileSystemVisitor {
    private int depth = 0;

    @Override
    public void visitFile(File file) {
        System.out.println("  ".repeat(depth) + "📄 " + file.getName()
            + " (" + file.getSize() + " bytes)");
    }

    @Override
    public void visitDirectory(Directory directory) {
        System.out.println("  ".repeat(depth) + "📁 " + directory.getName() + "/");
        depth++;
        // Children visited by Directory.accept()
        depth--;
    }
}

public class SizeCalculatorVisitor implements FileSystemVisitor {
    private long totalSize = 0;

    @Override public void visitFile(File file) { totalSize += file.getSize(); }
    @Override public void visitDirectory(Directory dir) { /* size is sum of children */ }

    public long getTotalSize() { return totalSize; }
}
```

---

## Step 5: Permission Decorator

```java
public class Permission {
    private boolean ownerRead, ownerWrite, ownerExecute;
    private boolean groupRead, groupWrite;
    private boolean otherRead;

    public static Permission defaultPermission() {
        Permission p = new Permission();
        p.ownerRead = p.ownerWrite = p.groupRead = p.otherRead = true;
        return p;
    }

    public boolean canRead(String userId, String groupId) {
        // Simplified: owner gets full rights
        return ownerRead;
    }
}

// Decorator: adds access control check before any file operation
public class SecureFile extends File {
    private final File wrapped;
    private final UserSession session;

    public SecureFile(File wrapped, UserSession session) {
        super(wrapped.getName());
        this.wrapped = wrapped;
        this.session = session;
    }

    @Override
    public String read() {
        if (!wrapped.permission.canRead(session.getUserId(), session.getGroupId())) {
            throw new AccessDeniedException("Read permission denied for " + wrapped.getName());
        }
        return wrapped.read();
    }

    @Override
    public void write(String data) {
        if (!session.hasWritePermission(wrapped)) {
            throw new AccessDeniedException("Write permission denied for " + wrapped.getName());
        }
        wrapped.write(data);
    }
}
```

---

## Step 6: Usage Example

```java
InMemoryFileSystem fs = new InMemoryFileSystem();

// Create directory structure
Directory home = fs.createDirectory("/home");
Directory user = home.createSubDirectory("alice");
Directory docs = user.createSubDirectory("documents");

File readme = fs.createFile("/home/alice/README.md", "# Hello World");
File notes  = fs.createFile("/home/alice/documents/notes.txt", "Meeting notes...");

// Print tree
fs.printTree();

// Resolve by path
Optional<FileSystemNode> found = fs.resolve("/home/alice/README.md");
found.ifPresent(f -> System.out.println("Found: " + f.getAbsolutePath()));

// Search
List<File> markdownFiles = fs.findByExtension("md");
System.out.println("Markdown files: " + markdownFiles.size());

// Read and write
File readmeFile = (File) found.get();
System.out.println(readmeFile.read());
readmeFile.append("\n## Installation");
```

---

## Interview Checklist

- [ ] Composite pattern: `File` (leaf) and `Directory` (composite) behind `FileSystemNode`
- [ ] `getSize()` is recursive for directories
- [ ] `find()` does DFS through the tree
- [ ] Path resolution handles `/`, `..`, nested paths
- [ ] `accept(visitor)` enables extensible operations without modifying nodes
- [ ] Permission Decorator as a bonus (if time allows)
- [ ] `LinkedHashMap` preserves insertion order for `ls`-like listing
- [ ] Discussed `getAbsolutePath()` walking up parent chain
