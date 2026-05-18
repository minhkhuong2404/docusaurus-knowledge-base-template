---
id: behavioral
title: Behavioral Patterns
sidebar_label: Behavioral Patterns
---

# Behavioral Patterns

> Behavioral patterns focus on algorithms and the assignment of responsibilities between objects — how objects *communicate* and *collaborate*.

---

## Strategy

**Intent:** Define a family of algorithms, encapsulate each one, and make them interchangeable at runtime.

**Use when:** You have multiple algorithms for a task and want to switch between them.

```java
// Sorting strategy example
@FunctionalInterface
public interface SortStrategy<T> {
    void sort(List<T> data);
}

public class QuickSort<T extends Comparable<T>> implements SortStrategy<T> {
    @Override
    public void sort(List<T> data) { /* quicksort implementation */ }
}

public class MergeSort<T extends Comparable<T>> implements SortStrategy<T> {
    @Override
    public void sort(List<T> data) { /* mergesort implementation */ }
}

// Context
public class DataProcessor<T extends Comparable<T>> {
    private SortStrategy<T> sortStrategy;

    public DataProcessor(SortStrategy<T> strategy) {
        this.sortStrategy = strategy;
    }

    // Strategy can be changed at runtime
    public void setSortStrategy(SortStrategy<T> strategy) {
        this.sortStrategy = strategy;
    }

    public void process(List<T> data) {
        sortStrategy.sort(data);
        // ... further processing
    }
}

// Real-world: Rate Limiter strategy
public interface RateLimitStrategy {
    boolean allowRequest(String clientId);
}

public class TokenBucketStrategy implements RateLimitStrategy {
    private final int capacity;
    private final double refillRatePerSecond;
    private final Map<String, Double> buckets = new ConcurrentHashMap<>();

    public TokenBucketStrategy(int capacity, double refillRatePerSecond) {
        this.capacity = capacity;
        this.refillRatePerSecond = refillRatePerSecond;
    }

    @Override
    public boolean allowRequest(String clientId) {
        // Token bucket logic
        double tokens = buckets.getOrDefault(clientId, (double) capacity);
        if (tokens >= 1.0) {
            buckets.put(clientId, tokens - 1.0);
            return true;
        }
        return false;
    }
}

public class FixedWindowStrategy implements RateLimitStrategy {
    private final int limit;
    private final Map<String, AtomicInteger> counters = new ConcurrentHashMap<>();

    @Override
    public boolean allowRequest(String clientId) {
        return counters.computeIfAbsent(clientId, k -> new AtomicInteger(0))
                       .incrementAndGet() <= limit;
    }
}
```

---

## Observer

**Intent:** Define a one-to-many dependency so that when one object changes state, all its dependents are notified automatically.

**Use when:** An event in one object should trigger reactions in other objects, without tight coupling.

```java
// Generic Observer pattern
public interface Observer<T> {
    void update(T event);
}

public interface Observable<T> {
    void subscribe(Observer<T> observer);
    void unsubscribe(Observer<T> observer);
    void notifyObservers(T event);
}

// Concrete: Auction system
public record BidEvent(String itemId, String bidderId, Money amount, Instant timestamp) {}

public class AuctionItem implements Observable<BidEvent> {
    private final String id;
    private Money currentBid;
    private final List<Observer<BidEvent>> observers = new CopyOnWriteArrayList<>();

    public AuctionItem(String id, Money startingBid) {
        this.id = id;
        this.currentBid = startingBid;
    }

    @Override
    public void subscribe(Observer<BidEvent> observer) { observers.add(observer); }
    @Override
    public void unsubscribe(Observer<BidEvent> observer) { observers.remove(observer); }

    @Override
    public void notifyObservers(BidEvent event) {
        observers.forEach(o -> o.update(event));  // notify all subscribers
    }

    public void placeBid(String bidderId, Money amount) {
        if (amount.isLessThanOrEqual(currentBid)) {
            throw new InsufficientBidException("Bid must exceed " + currentBid);
        }
        this.currentBid = amount;
        notifyObservers(new BidEvent(id, bidderId, amount, Instant.now()));
    }
}

// Various observers with different reactions
public class BidNotificationService implements Observer<BidEvent> {
    @Override
    public void update(BidEvent event) {
        System.out.println("📧 Notifying previous bidders of new bid: " + event.amount());
    }
}

public class AuctionDashboard implements Observer<BidEvent> {
    @Override
    public void update(BidEvent event) {
        System.out.println("📊 Dashboard updated: " + event.itemId() + " = " + event.amount());
    }
}

public class FraudDetector implements Observer<BidEvent> {
    @Override
    public void update(BidEvent event) {
        System.out.println("🔍 Analyzing bid for fraud: " + event.bidderId());
    }
}

// Wire up
AuctionItem item = new AuctionItem("ITEM-001", Money.of(100, "USD"));
item.subscribe(new BidNotificationService());
item.subscribe(new AuctionDashboard());
item.subscribe(new FraudDetector());

item.placeBid("bidder-42", Money.of(150, "USD"));
// All three observers react automatically
```

:::note[Senior Deep Dive 🔴]
`CopyOnWriteArrayList` for the observer list handles the case where observers unsubscribe themselves during notification (concurrent modification). For high-frequency events, prefer an async event bus (e.g., Guava `EventBus`, or a `BlockingQueue` + dedicated consumer thread) over synchronous notification.
:::

---

## Command

**Intent:** Encapsulate a request as an object, allowing you to parameterize clients, queue requests, log them, or support undo.

**Use when:** You need undo/redo, request queuing, transaction-like behavior, or request logging.

```java
// Command interface
public interface Command {
    void execute();
    void undo();
}

// Text editor example
public class TextEditor {
    private final StringBuilder text = new StringBuilder();

    public void insert(int position, String content) {
        text.insert(position, content);
    }

    public void delete(int position, int length) {
        text.delete(position, position + length);
    }

    public String getText() { return text.toString(); }
}

// Concrete commands
public class InsertCommand implements Command {
    private final TextEditor editor;
    private final int position;
    private final String content;

    public InsertCommand(TextEditor editor, int position, String content) {
        this.editor = editor;
        this.position = position;
        this.content = content;
    }

    @Override public void execute() { editor.insert(position, content); }
    @Override public void undo()    { editor.delete(position, content.length()); }
}

public class DeleteCommand implements Command {
    private final TextEditor editor;
    private final int position;
    private final int length;
    private String deletedText; // saved for undo

    @Override
    public void execute() {
        deletedText = editor.getText().substring(position, position + length);
        editor.delete(position, length);
    }

    @Override
    public void undo() {
        editor.insert(position, deletedText); // restore deleted text
    }
}

// Command history (undo/redo stack)
public class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<>();
    private final Deque<Command> redoStack = new ArrayDeque<>();

    public void execute(Command command) {
        command.execute();
        undoStack.push(command);
        redoStack.clear(); // new command clears redo stack
    }

    public void undo() {
        if (undoStack.isEmpty()) return;
        Command command = undoStack.pop();
        command.undo();
        redoStack.push(command);
    }

    public void redo() {
        if (redoStack.isEmpty()) return;
        Command command = redoStack.pop();
        command.execute();
        undoStack.push(command);
    }
}
```

---

## State

**Intent:** Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.

**Use when:** An object's behavior depends on its state, and the behavior changes at runtime.

```java
// ATM machine states
public interface AtmState {
    void insertCard(AtmContext atm);
    void enterPin(AtmContext atm, String pin);
    void requestCash(AtmContext atm, double amount);
    void ejectCard(AtmContext atm);
}

public class AtmContext {
    private AtmState state;
    private double cashAvailable;
    private Card insertedCard;

    public AtmContext(double initialCash) {
        this.cashAvailable = initialCash;
        this.state = new IdleState();  // initial state
    }

    public void setState(AtmState state) { this.state = state; }

    // Delegate all actions to current state
    public void insertCard(Card card) {
        this.insertedCard = card;
        state.insertCard(this);
    }
    public void enterPin(String pin) { state.enterPin(this, pin); }
    public void requestCash(double amount) { state.requestCash(this, amount); }
    public void ejectCard() { state.ejectCard(this); }

    public double getCashAvailable() { return cashAvailable; }
    public void dispenseCash(double amount) { cashAvailable -= amount; }
    public Card getInsertedCard() { return insertedCard; }
}

public class IdleState implements AtmState {
    @Override
    public void insertCard(AtmContext atm) {
        System.out.println("Card inserted.");
        atm.setState(new HasCardState());  // transition
    }

    @Override public void enterPin(AtmContext atm, String pin) { System.out.println("Insert card first."); }
    @Override public void requestCash(AtmContext atm, double amount) { System.out.println("Insert card first."); }
    @Override public void ejectCard(AtmContext atm) { System.out.println("No card to eject."); }
}

public class HasCardState implements AtmState {
    @Override public void insertCard(AtmContext atm) { System.out.println("Card already inserted."); }

    @Override
    public void enterPin(AtmContext atm, String pin) {
        boolean valid = atm.getInsertedCard().validatePin(pin);
        if (valid) {
            System.out.println("PIN accepted.");
            atm.setState(new AuthenticatedState());
        } else {
            System.out.println("Wrong PIN.");
            // could track attempts and transition to BlockedState after 3 failures
        }
    }

    @Override public void requestCash(AtmContext atm, double amount) { System.out.println("Enter PIN first."); }

    @Override
    public void ejectCard(AtmContext atm) {
        System.out.println("Card ejected.");
        atm.setState(new IdleState());
    }
}

public class AuthenticatedState implements AtmState {
    @Override
    public void requestCash(AtmContext atm, double amount) {
        if (amount > atm.getCashAvailable()) {
            System.out.println("Insufficient funds in ATM.");
            return;
        }
        atm.dispenseCash(amount);
        System.out.println("Dispensing $" + amount);
        atm.setState(new IdleState());
    }
    // ...
}
```

---

## Template Method

**Intent:** Define the skeleton of an algorithm in a base class, deferring some steps to subclasses.

**Use when:** Multiple classes share the same algorithm structure but differ in specific steps.

```java
// Data mining report generator — fixed process, variable steps
public abstract class DataMiner {

    // Template method — defines the algorithm skeleton
    public final Report mine(String filePath) {
        var rawData   = readFile(filePath);    // step 1
        var parsed    = parseData(rawData);    // step 2 — abstract
        var analysis  = analyzeData(parsed);   // step 3 — abstract
        var formatted = formatResults(analysis); // step 4 — hook with default
        sendReport(formatted);                 // step 5 — fixed
        return formatted;
    }

    // Fixed steps
    private byte[] readFile(String path) {
        try { return Files.readAllBytes(Path.of(path)); }
        catch (IOException e) { throw new RuntimeException(e); }
    }

    private void sendReport(Report report) {
        System.out.println("Report generated: " + report.getSummary());
    }

    // Abstract steps — subclasses must implement
    protected abstract List<Map<String, Object>> parseData(byte[] rawData);
    protected abstract AnalysisResult analyzeData(List<Map<String, Object>> data);

    // Hook — subclasses may override
    protected Report formatResults(AnalysisResult analysis) {
        return new DefaultReport(analysis);
    }
}

public class CsvDataMiner extends DataMiner {
    @Override
    protected List<Map<String, Object>> parseData(byte[] rawData) {
        // CSV parsing logic
        return CsvParser.parse(new String(rawData));
    }

    @Override
    protected AnalysisResult analyzeData(List<Map<String, Object>> data) {
        return new StatisticalAnalyzer().analyze(data);
    }
}

public class XmlDataMiner extends DataMiner {
    @Override
    protected List<Map<String, Object>> parseData(byte[] rawData) {
        return XmlParser.parse(rawData);
    }

    @Override
    protected AnalysisResult analyzeData(List<Map<String, Object>> data) {
        return new XmlAnalyzer().analyze(data);
    }
}
```

:::tip[Interview Tip 🎯]
Template Method vs Strategy: Template Method uses **inheritance** (subclass overrides steps). Strategy uses **composition** (swap the whole algorithm object). Prefer Strategy for flexibility — it avoids the tight coupling of inheritance.
:::

---

## Chain of Responsibility

**Intent:** Pass a request along a chain of handlers. Each handler decides to process or pass to the next.

```java
public abstract class SupportHandler {
    private SupportHandler next;

    public SupportHandler setNext(SupportHandler next) {
        this.next = next;
        return next; // enables chaining: first.setNext(second).setNext(third)
    }

    protected void passToNext(SupportTicket ticket) {
        if (next != null) next.handle(ticket);
        else System.out.println("No handler found for ticket: " + ticket.getId());
    }

    public abstract void handle(SupportTicket ticket);
}

public class Level1Support extends SupportHandler {
    @Override
    public void handle(SupportTicket ticket) {
        if (ticket.getPriority() == Priority.LOW) {
            System.out.println("L1 handling: " + ticket.getDescription());
        } else {
            System.out.println("L1 escalating to L2...");
            passToNext(ticket);
        }
    }
}

public class Level2Support extends SupportHandler {
    @Override
    public void handle(SupportTicket ticket) {
        if (ticket.getPriority() == Priority.MEDIUM) {
            System.out.println("L2 handling: " + ticket.getDescription());
        } else {
            passToNext(ticket);
        }
    }
}

// Build the chain
SupportHandler l1 = new Level1Support();
SupportHandler l2 = new Level2Support();
SupportHandler l3 = new Level3EngineerSupport();

l1.setNext(l2).setNext(l3);

l1.handle(new SupportTicket("T-001", Priority.HIGH, "Server is down!"));
// L1 → L2 → L3 handles it
```

---

## Behavioral Patterns Quick Reference

| Pattern | Key Question | Use in LLD problems |
|---------|-------------|-------------------|
| **Strategy** | Which algorithm should run? | Rate Limiter, Pricing, Scheduling |
| **Observer** | Who needs to know when X changes? | Seat availability, Bid events |
| **Command** | Can this action be undone/queued? | Booking, Transactions, Undo/Redo |
| **State** | Does behavior depend on current state? | Elevator, ATM, Traffic Light |
| **Template Method** | Same steps, different implementations? | Report generation, Data pipeline |
| **Chain of Responsibility** | Who handles this request? | Support escalation, HTTP filters |

**Next →** [Concurrency — Correctness](../concurrency/correctness)
