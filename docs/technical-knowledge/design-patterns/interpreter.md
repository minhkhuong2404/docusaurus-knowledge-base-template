---
id: interpreter
title: "Interpreter Pattern"
slug: interpreter
description: Explains the Interpreter pattern used to evaluate sentences in a specific language by defining a grammar representation and an interpreter.
tags: [design-patterns, java, behavioral, interpreter]
---

# Interpreter Pattern

> **Category:** Behavioral    
> **Complexity:** ⭐⭐⭐ (3/3)  
> **Popularity:** ⭐☆☆ (1/3)  
> **Intent:** Given a language, define a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language.

---

## Overview

The Interpreter pattern provides a way to evaluate sentences or queries written in a specific language (like SQL, or simple mathematical expressions). It involves designing an Abstract Syntax Tree (AST) where every node in the tree represents a rule of the grammar.

While extremely powerful for parsing custom Domain-Specific Languages (DSLs) or evaluating complex logical expressions, it is rarely used in typical enterprise development due to modern parsing libraries.

**Key characteristics:**
- You define a grammar utilizing strict Composite-like Tree structures.
- Parses a string (a sentence) into an executable tree of objects.
- Each class in the syntax tree has an `interpret()` or `evaluate()` method.
- Typically requires a separate lexer/parser to convert the string into the object tree.

---

## When to Use

- You are designing a simple Domain-Specific Language (DSL) or rule-engine (e.g., search query evaluator).
- You need a way to evaluate mathematical expressions dynamically.
- The grammar of your language is simple. If it's complex, the object tree becomes unmanageably massive.
- Efficiency is NOT a critical concern (building the object tree is slow).

---

## How It Works

### Boolean Logic Evaluator Example

Let's build an interpreter that evaluates custom string rules like `"John AND Married"` against an active user context.

```java
// 1. Abstract Expression
public interface Expression {
    boolean interpret(String context);
}

// 2. Terminal Expression
public class TerminalExpression implements Expression {
    private String data;

    public TerminalExpression(String data) {
        this.data = data;
    }

    @Override
    public boolean interpret(String context) {
        return context.contains(data);
    }
}

// 3. Non-Terminal Expression (OR)
public class OrExpression implements Expression {
    private Expression expr1;
    private Expression expr2;

    public OrExpression(Expression expr1, Expression expr2) {
        this.expr1 = expr1;
        this.expr2 = expr2;
    }

    @Override
    public boolean interpret(String context) {
        return expr1.interpret(context) || expr2.interpret(context);
    }
}

// 3. Non-Terminal Expression (AND)
public class AndExpression implements Expression {
    private Expression expr1;
    private Expression expr2;

    public AndExpression(Expression expr1, Expression expr2) {
        this.expr1 = expr1;
        this.expr2 = expr2;
    }

    @Override
    public boolean interpret(String context) {
        return expr1.interpret(context) && expr2.interpret(context);
    }
}
```

### Usage (The AST / Grammatical Tree)

In practice, a separate "Parser" class often builds this tree by reading a string input, but here we build the AST manually to demonstrate the execution pattern.

```java
public class RuleEngine {

    // Rule: Robert OR John
    public static Expression getMaleExpression() {
        Expression robert = new TerminalExpression("Robert");
        Expression john = new TerminalExpression("John");
        return new OrExpression(robert, john);
    }

    // Rule: Julie AND Married
    public static Expression getMarriedWomanExpression() {
        Expression julie = new TerminalExpression("Julie");
        Expression married = new TerminalExpression("Married");
        return new AndExpression(julie, married);
    }
}

// Client
public static void main(String[] args) {
    Expression isMale = RuleEngine.getMaleExpression();
    Expression isMarriedWoman = RuleEngine.getMarriedWomanExpression();

    // The 'context' holds global state passed through the syntax tree
    System.out.println("John is male? " + isMale.interpret("John")); 
    // True

    System.out.println("Julie is a married women? " + isMarriedWoman.interpret("Married Julie")); 
    // True
    
    System.out.println("Bob is a married women? " + isMarriedWoman.interpret("Married Bob")); 
    // False
}
```

---

## Real-World Examples

| Framework/Library | Description |
|-------------------|-------------|
| **Spring Expression Language (SpEL)** | Spring parses strings like `#{systemProperties['user.name']}` and interprets them to evaluate dynamic values at configuration runtime. |
| `java.util.regex.Pattern` | Regular expressions define a language. The Java RegEx engine compiles strings into a hierarchy of evaluation nodes to match text. |
| SQL Parsers | JDBC implementations construct abstract trees mapping `SELECT`, `FROM`, `WHERE` to executable blocks. |

---

## Interpreter vs. Composite

| Aspect | Interpreter | Composite |
|--------|-------------|-----------|
| **Structure** | Both represent trees of objects where parent nodes delegate to child nodes. | Both utilize structural tree encapsulation. |
| **Intent** | Specifically intended to execute grammatical evaluation over a contextual state. | Designed to sum weights, display nested nodes, or format structures without execution context. |

---

## Advantages & Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Easy to change and extend the grammar (just add a new Expression class like `NotExpression`). | Horrifically inefficient and complex for large grammars. |
| Implementing the language is simple because the logic is tightly coupled to the grammar rules. | Requires building a separate "Parser" to convert strings into the AST first. |
| | Object instantiation overhead (a String with 10 words might generate 20 AST objects). |

---

## Interview Questions

**Q1: For what types of problems is the Interpreter pattern suitable?**

It is uniquely suited for rapidly developing simple Domain-Specific Languages (DSLs), mathematical expression evaluators, or dynamic business-rule engines. If you allow users to type custom filter criteria like `price > 500 AND category == 'Shoes'`, the backend parses this into an Interpreter tree to execute that rule dynamically.

**Q2: What are the two types of expressions in an Interpreter tree?**

1. **Terminal Expressions:** The leaf nodes of the tree. They perform an actual calculation or lookup and return a raw value (e.g., extracting the text, returning a boolean). They have no children.
2. **Non-Terminal Expressions:** The branch nodes. They possess references to children expressions, execute them, and combine the results (e.g., an `ADD()` node executing its left branch child and right branch child, then summing the returns).

**Q3: How is context handled during evaluation?**

In most architectures, a `Context` object (a wrapper around global state, maps, or environment variables) is instantiated once and passed top-down through the `interpret(Context c)` method of the tree. Variables and states are resolved by querying this context inside Terminal Expressions.

**Q4: Why is the Interpreter pattern rarely seen in modern commercial applications?**

Modern technology stacks use battle-tested third-party parsers like ANTLR, yacc/lex, or embedded script engines (Groovy, Rhino) to evaluate dynamic code. Building a custom Interpreter object tree from scratch for complex grammars rapidly becomes an unmaintainable architectural anti-pattern known as a "Class Explosion", as every single grammatical token requires a dedicated class.

---

## Advanced Editorial Pass: Rule Engines and AST Generation

### Strategic Payoff
- Very powerful when implementing generic product pricing rules or permissions matching matrices that clients define via a web UI rather than hardcoding.
- Separates parsing logic (the Lexer) from execution logic.

### Non-Obvious Risks
- **Infinite Recursion:** A poorly structured grammar tree or cyclical context references can trigger a StackOverflowError.
- **Parsing Omitted:** The GoF Interpreter Pattern definition *assumes* the Abstract Syntax Tree already exists. It notoriously omits instructions on *how* to convert a String into the object tree (lexing/parsing), which is usually the hardest part.
- **Garbage Collection Pressure:** Every character or word parsed might spawn multiple object wrappers, drastically spiking heap usage.

### Implementation Heuristics
1. Do not use this pattern for parsing HTML, XML, or standard code formats. Use proper streaming parsers (SAX/DOM) or libraries like JSoup.
2. If your grammar requires more than 10-15 grammatical classes, you should pivot to a parser-generator tool like ANTLR.

### Compare Next
- [Composite Pattern](./composite.md)
- [Visitor Pattern](./visitor.md)
- [Command Pattern](./command.md)
