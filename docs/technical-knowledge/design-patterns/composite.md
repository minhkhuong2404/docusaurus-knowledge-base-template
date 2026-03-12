---
id: composite
title: "Composite Pattern"
slug: composite
---

# Composite Pattern

> **Category:** Structural  
> **Intent:** Compose objects into tree structures to represent part-whole hierarchies, and treat individual objects and compositions uniformly.

---

## Overview

The Composite pattern lets clients treat individual objects (leaves) and groups of objects (composites) through the same interface. This uniformity simplifies client code — no need to distinguish between a single element and a group of elements.

**Key characteristics:**
- Tree structure of components: leaves and composites
- Uniform interface for both leaf and composite nodes
- Composites delegate operations to their children recursively

---

## When to Use

- Representing hierarchical data (file systems, UI component trees, organizational charts)
- Clients need to treat leaf and composite objects the same way
- You need recursive structures where groups can contain both items and sub-groups
- Operations should apply uniformly regardless of whether the target is a single item or a group

---

## How It Works

### Structure

```
Component (interface)
├── Leaf — has no children, performs actual work
└── Composite — contains children (Leaf or other Composites), delegates to them
```

### File System Example

```java
public interface FileSystemComponent {
    String getName();
    long getSize();
    void display(String indent);
    default int countFiles() { return 1; }
}

// Leaf
public class File implements FileSystemComponent {
    private final String name;
    private final long size;

    public File(String name, long size) {
        this.name = name;
        this.size = size;
    }

    @Override public String getName() { return name; }
    @Override public long getSize() { return size; }

    @Override
    public void display(String indent) {
        System.out.println(indent + "📄 " + name + " (" + formatSize(size) + ")");
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        return (bytes / 1024) + " KB";
    }
}

// Composite
public class Directory implements FileSystemComponent {
    private final String name;
    private final List<FileSystemComponent> children = new ArrayList<>();

    public Directory(String name) { this.name = name; }

    public void add(FileSystemComponent component) { children.add(component); }
    public void remove(FileSystemComponent component) { children.remove(component); }
    public List<FileSystemComponent> getChildren() { return Collections.unmodifiableList(children); }

    @Override public String getName() { return name; }

    @Override
    public long getSize() {
        return children.stream().mapToLong(FileSystemComponent::getSize).sum();
    }

    @Override
    public int countFiles() {
        return children.stream().mapToInt(FileSystemComponent::countFiles).sum();
    }

    @Override
    public void display(String indent) {
        System.out.println(indent + "📁 " + name + " (" + formatSize(getSize()) + ", " + countFiles() + " files)");
        for (FileSystemComponent child : children) {
            child.display(indent + "  ");
        }
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024) + " KB";
        return (bytes / (1024 * 1024)) + " MB";
    }
}

// Usage
Directory root = new Directory("project");

Directory src = new Directory("src");
src.add(new File("Main.java", 2048));
src.add(new File("Utils.java", 1024));

Directory test = new Directory("test");
test.add(new File("MainTest.java", 1536));

root.add(src);
root.add(test);
root.add(new File("README.md", 512));

root.display("");
// Output:
// 📁 project (5 KB, 4 files)
//   📁 src (3 KB, 2 files)
//     📄 Main.java (2 KB)
//     📄 Utils.java (1 KB)
//   📁 test (1 KB, 1 files)
//     📄 MainTest.java (1 KB)
//   📄 README.md (512 B)

System.out.println("Total size: " + root.getSize());  // 5120
```

### Menu System Example

```java
public interface MenuComponent {
    String getName();
    void display(String indent);
    default double getPrice() { return 0; }
}

public class MenuItem implements MenuComponent {
    private final String name;
    private final double price;

    public MenuItem(String name, double price) {
        this.name = name;
        this.price = price;
    }

    @Override public String getName() { return name; }
    @Override public double getPrice() { return price; }

    @Override
    public void display(String indent) {
        System.out.printf("%s%s — $%.2f%n", indent, name, price);
    }
}

public class Menu implements MenuComponent {
    private final String name;
    private final List<MenuComponent> items = new ArrayList<>();

    public Menu(String name) { this.name = name; }

    public void add(MenuComponent item) { items.add(item); }

    @Override public String getName() { return name; }

    @Override
    public double getPrice() {
        return items.stream().mapToDouble(MenuComponent::getPrice).sum();
    }

    @Override
    public void display(String indent) {
        System.out.println(indent + "【" + name + "】");
        items.forEach(item -> item.display(indent + "  "));
    }
}
```

---

## Real-World Examples in Java

| Class/API | Description |
|-----------|-------------|
| `java.awt.Component` / `Container` | UI components — containers hold child components |
| `javax.swing.JComponent` | Swing components can contain child components |
| `org.w3c.dom.Node` | XML/HTML DOM tree nodes |
| `java.io.File` | Files and directories (though not a pure Composite) |
| JSF `UIComponent` tree | JSF component tree |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Simplifies client code — no type checking | Can overgeneralize — some operations don't make sense on leaves |
| Easy to add new component types | Deep hierarchies can be hard to debug |
| Naturally models recursive/hierarchical data | May need to restrict operations (e.g., `add()` on a leaf) |
| Supports recursive operations elegantly | Type safety for leaf-only or composite-only operations |

---

## Interview Questions

**Q1: What is the Composite pattern and when is it most useful?**

The Composite pattern composes objects into tree structures to represent part-whole hierarchies. It allows treating individual objects (leaves) and groups (composites) uniformly through the same interface. It's most useful for hierarchical data like file systems, UI component trees, menu structures, or organizational charts — anywhere you need recursive structures with uniform operations.

**Q2: Can you provide an example of how the Composite pattern models tree structures?**

A file system: files are leaf nodes, directories are composite nodes containing files and subdirectories. Both implement `FileSystemComponent` with methods like `getSize()` and `display()`. A file returns its own size; a directory sums the sizes of all its children recursively. The client calls `getSize()` on any component without caring whether it's a file or a directory.

**Q3: How does the Composite pattern simplify working with hierarchical data?**

It lets clients apply operations uniformly to any node in the tree without checking whether it's a leaf or composite. Operations like `display()`, `getSize()`, or `search()` are called the same way on both. The recursion is handled internally by composites delegating to their children. This eliminates conditional type-checking logic in client code.

**Q4: What are the benefits and limitations of using the Composite pattern?**

**Benefits:** simplifies client code, naturally represents hierarchies, supports recursive operations, and makes adding new component types easy. **Limitations:** can overgeneralize (some operations don't apply to leaves), deep hierarchies can be hard to debug, and enforcing type-specific constraints requires extra care.

**Q5: How would you implement the Composite pattern in Java?**

Create a `Component` interface with common methods (`display()`, `getSize()`). Create `Leaf` classes that implement the interface with actual logic. Create a `Composite` class that also implements the interface but holds a list of `Component` children and delegates operations to them. The composite's methods typically iterate over children and aggregate results.
