---
id: command
title: "Command Pattern"
slug: command
description: Explains the Command pattern for encapsulating requests as objects to support queuing, logging, and undo operations.
tags: [design-patterns, java, behavioral, command]
---

# Command Pattern

> **Category:** Behavioral  
> **Intent:** Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

---

## Overview

The Command pattern turns a request into a stand-alone object containing all information about the request. This transformation lets you pass requests as method arguments, delay or queue a request's execution, and support undo/redo operations.

**Key characteristics:**
- Encapsulates all details of an operation in a command object
- Decouples the invoker (who triggers the action) from the receiver (who performs it)
- Commands can be stored, queued, logged, and undone
- Supports macro commands (composite commands)

---

## When to Use

- You need to parameterize objects with operations
- You want to queue operations, schedule their execution, or execute them remotely
- You need undo/redo functionality
- You want to log changes so they can be reapplied after a crash (transaction logging)
- You need to structure a system around high-level operations built from primitive operations

---

## How It Works

### Text Editor with Undo/Redo

```java
// Command interface
public interface Command {
    void execute();
    void undo();
    String getDescription();
}

// Receiver
public class TextDocument {
    private final StringBuilder content = new StringBuilder();

    public void insertText(int position, String text) {
        content.insert(position, text);
    }

    public void deleteText(int position, int length) {
        content.delete(position, position + length);
    }

    public String getContent() {
        return content.toString();
    }

    @Override
    public String toString() {
        return content.toString();
    }
}

// Concrete commands
public class InsertTextCommand implements Command {
    private final TextDocument document;
    private final int position;
    private final String text;

    public InsertTextCommand(TextDocument document, int position, String text) {
        this.document = document;
        this.position = position;
        this.text = text;
    }

    @Override
    public void execute() {
        document.insertText(position, text);
    }

    @Override
    public void undo() {
        document.deleteText(position, text.length());
    }

    @Override
    public String getDescription() {
        return "Insert '" + text + "' at position " + position;
    }
}

public class DeleteTextCommand implements Command {
    private final TextDocument document;
    private final int position;
    private final int length;
    private String deletedText;  // saved for undo

    public DeleteTextCommand(TextDocument document, int position, int length) {
        this.document = document;
        this.position = position;
        this.length = length;
    }

    @Override
    public void execute() {
        deletedText = document.getContent().substring(position, position + length);
        document.deleteText(position, length);
    }

    @Override
    public void undo() {
        document.insertText(position, deletedText);
    }

    @Override
    public String getDescription() {
        return "Delete " + length + " chars at position " + position;
    }
}
```

### Invoker — Command History Manager

```java
public class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<>();
    private final Deque<Command> redoStack = new ArrayDeque<>();

    public void executeCommand(Command command) {
        command.execute();
        undoStack.push(command);
        redoStack.clear();  // new command invalidates redo history
        System.out.println("Executed: " + command.getDescription());
    }

    public void undo() {
        if (undoStack.isEmpty()) {
            System.out.println("Nothing to undo");
            return;
        }
        Command command = undoStack.pop();
        command.undo();
        redoStack.push(command);
        System.out.println("Undone: " + command.getDescription());
    }

    public void redo() {
        if (redoStack.isEmpty()) {
            System.out.println("Nothing to redo");
            return;
        }
        Command command = redoStack.pop();
        command.execute();
        undoStack.push(command);
        System.out.println("Redone: " + command.getDescription());
    }
}
```

### Client Usage

```java
TextDocument doc = new TextDocument();
CommandHistory history = new CommandHistory();

history.executeCommand(new InsertTextCommand(doc, 0, "Hello"));
// Executed: Insert 'Hello' at position 0
// Document: "Hello"

history.executeCommand(new InsertTextCommand(doc, 5, " World"));
// Executed: Insert ' World' at position 5
// Document: "Hello World"

history.executeCommand(new DeleteTextCommand(doc, 5, 6));
// Executed: Delete 6 chars at position 5
// Document: "Hello"

history.undo();
// Undone: Delete 6 chars at position 5
// Document: "Hello World"

history.undo();
// Undone: Insert ' World' at position 5
// Document: "Hello"

history.redo();
// Redone: Insert ' World' at position 5
// Document: "Hello World"
```

### Macro Command (Composite Command)

```java
public class MacroCommand implements Command {
    private final String name;
    private final List<Command> commands;

    public MacroCommand(String name, List<Command> commands) {
        this.name = name;
        this.commands = new ArrayList<>(commands);
    }

    @Override
    public void execute() {
        for (Command cmd : commands) {
            cmd.execute();
        }
    }

    @Override
    public void undo() {
        // Undo in reverse order
        ListIterator<Command> it = commands.listIterator(commands.size());
        while (it.hasPrevious()) {
            it.previous().undo();
        }
    }

    @Override
    public String getDescription() {
        return "Macro: " + name + " (" + commands.size() + " commands)";
    }
}

// Usage — "Replace All" as a macro
Command replaceAll = new MacroCommand("Replace 'foo' with 'bar'", List.of(
    new DeleteTextCommand(doc, 10, 3),
    new InsertTextCommand(doc, 10, "bar")
));

history.executeCommand(replaceAll);
history.undo();  // undoes the entire replacement
```

---

## Real-World Examples

| Framework/Library | Description |
|-------------------|-------------|
| `java.lang.Runnable` | Encapsulates an action to run in a thread |
| `javax.swing.Action` | Encapsulates UI actions (button clicks, menu items) |
| Spring `@Transactional` | Transaction management wraps commands with commit/rollback |
| CQRS (Command Query Responsibility Segregation) | Architectural pattern using commands and queries |
| Java `CompletableFuture` | Commands that can be composed and executed asynchronously |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Decouples invoker from receiver | Can proliferate many small command classes |
| Supports undo/redo | Complex undo logic for stateful operations |
| Commands can be queued, logged, serialized | Memory overhead for command history |
| Supports macro/composite commands | Indirect execution is harder to debug |

---

## Interview Questions

**Q1: What is the Command pattern and what problem does it solve?**

The Command pattern encapsulates a request as an object, separating the object that invokes the operation from the one that knows how to perform it. This enables parameterization of actions, queuing, logging, and undo/redo. Without it, the invoker must know directly about the receiver and its methods, creating tight coupling.

**Q2: How would you implement undo/redo using the Command pattern?**

Each command implements `execute()` and `undo()` methods. The `undo()` method reverses the effect of `execute()`. An invoker maintains an undo stack and a redo stack. When a command executes, it's pushed onto the undo stack and the redo stack is cleared. Undo pops from the undo stack, calls `undo()`, and pushes to the redo stack. Redo does the reverse.

**Q3: What are the key components of the Command pattern?**

**Command** — interface declaring `execute()`. **ConcreteCommand** — implements the interface and holds a reference to the receiver. **Receiver** — the object that performs the actual work. **Invoker** — triggers the command (doesn't know about the receiver). **Client** — creates concrete commands and configures the invoker.

**Q4: How does the Command pattern relate to CQRS?**

CQRS (Command Query Responsibility Segregation) separates read operations (queries) from write operations (commands) into different models. The Command pattern underpins the "command" side — write operations are encapsulated as command objects that can be validated, queued, logged, and processed asynchronously. This scales well for event-sourced systems.

**Q5: How is `Runnable` an example of the Command pattern?**

`Runnable` is a command interface with a single method (`run()`). When you create a `Runnable` and pass it to a `Thread` or `ExecutorService`, you're encapsulating an action as an object and giving it to an invoker. The invoker (thread pool) doesn't know what the action does — it just calls `run()`. This is the Command pattern in its simplest form.

---

## Advanced Editorial Pass: Command as a Reliability Primitive

### Strategic Value
- Commands decouple intention capture from execution timing and location.
- They support retries, auditability, deduplication, and deferred processing workflows.
- They create a natural seam for queueing, scheduling, and transactional outbox patterns.

### Advanced Trade-offs
- Serializing commands can freeze unstable domain models into long-lived contracts.
- Undo semantics are often domain-specific compensations, not simple inverse operations.
- Overuse can fragment simple synchronous flows into unnecessary orchestration.

### Implementation Heuristics
1. Treat command payloads as explicit contracts with versioning.
2. Attach idempotency keys where execution can be retried.
3. Keep handlers side-effect explicit and telemetry-rich.

### Compare Next
- [Strategy Pattern](./strategy.md)
- [Chain of Responsibility Pattern](./chain-of-responsibility.md)
- [Observer Pattern](./observer.md)
