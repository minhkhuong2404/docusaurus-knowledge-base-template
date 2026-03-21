---
sidebar_position: 6
title: "Chapter 5: Formatting"
description: Code formatting as communication — how visual structure conveys meaning and intent.
---

# Chapter 5: Formatting

## Formatting Is Communication

> *"Code formatting is about communication, and communication is the professional developer's first order of business."*

Formatting isn't about personal preference or aesthetics. It's about communicating clearly with the next developer who reads your code — which is often you, six months from now.

Functionality will be refactored. Requirements will change. But the **readability habits you establish** will persist in the culture of the codebase long after your specific implementation is gone.

---

## Vertical Formatting

### How Big Should a File Be?

Martin analyzed several well-known Java projects (JUnit, FitNesse, Tomcat) and found that most files were between **200–500 lines**, with many in the 100–200 range. Files rarely exceeded 500 lines.

:::tip
Files around 200 lines are the sweet spot. They can be understood in a single sitting.
:::

### The Newspaper Metaphor

Think of a source file like a **newspaper article**:

- The **top** should give you the high-level concept — the headline.
- As you read **downward**, you get more and more detail.
- The **bottom** is low-level implementation detail.

In Java, this means:
- Class declaration at the top
- Public methods early
- Private helper methods toward the bottom

You shouldn't need to scroll to the bottom to understand what a class does.

### Vertical Openness Between Concepts

Use **blank lines** to separate concepts. A blank line is a visual paragraph break. Each group of lines represents a single thought.

```java
// Bad — no separation, hard to scan
import java.util.regex.*;
public class BoldWidget extends ParentWidget {
    public static final String REGEXP = "'''.+?'''";
    private static final Pattern pattern = Pattern.compile("'''(.+?)'''",
    Pattern.MULTILINE + Pattern.DOTALL);
    public BoldWidget(ParentWidget parent, String text) throws Exception {
        super(parent);
        Matcher match = pattern.matcher(text);
        match.find();
        addChildWidgets(match.group(1));
    }
    public String render() throws Exception {
        StringBuffer html = new StringBuffer("<b>");
        html.append(childHtml()).append("</b>");
        return html.toString();
    }
}

// Good — blank lines create visual grouping
import java.util.regex.*;

public class BoldWidget extends ParentWidget {
    public static final String REGEXP = "'''.+?'''";
    private static final Pattern pattern = Pattern.compile(
        "'''(.+?)'''", Pattern.MULTILINE + Pattern.DOTALL
    );

    public BoldWidget(ParentWidget parent, String text) throws Exception {
        super(parent);
        Matcher match = pattern.matcher(text);
        match.find();
        addChildWidgets(match.group(1));
    }

    public String render() throws Exception {
        StringBuffer html = new StringBuffer("<b>");
        html.append(childHtml()).append("</b>");
        return html.toString();
    }
}
```

### Vertical Density — Keep Related Code Together

Lines of code that are **conceptually related** should appear **close together**. Don't separate them with comments or blank lines:

```java
// Bad — comments between related fields break the visual grouping
public class ReporterConfig {
    /**
     * The class name of the reporter listener
     */
    private String m_className;

    /**
     * The properties of the reporter listener
     */
    private List<Property> m_properties = new ArrayList<Property>();
```

```java
// Good — related fields are visually dense
public class ReporterConfig {
    private String className;
    private List<Property> properties = new ArrayList<>();
```

### Vertical Distance

**Variables** should be declared as close to their use as possible:

```java
// Bad — variable declared far from where it's used
private static void readPreferences() {
    InputStream is = null;  // declared here
    // ... many lines of code ...
    try {
        is = new FileInputStream(getPreferencesFile()); // used here
    }
}

// Good — declare close to first use
private static void readPreferences() {
    try {
        InputStream is = new FileInputStream(getPreferencesFile());
        // ... use is ...
    }
}
```

**Instance variables** should be declared at the top of the class — they're used by many methods, so their location is a known contract (the Java idiom).

**Dependent functions** should be vertically close, with the caller above the callee:

```java
public class WikiPageResponder {
    public Response makeResponse(FitNesseContext context, Request request) {
        String pageName = getPageNameOrDefault(request, "FrontPage"); // calls below
        // ...
    }

    private String getPageNameOrDefault(Request request, String defaultPageName) {
        // ...
    }
}
```

**Conceptually similar code** should be grouped. Functions that perform similar operations should be nearby even if they don't call each other:

```java
public class Assert {
    static public void assertTrue(String message, boolean condition) { ... }
    static public void assertTrue(boolean condition) { ... }
    static public void assertFalse(String message, boolean condition) { ... }
    static public void assertFalse(boolean condition) { ... }
}
```

---

## Horizontal Formatting

### How Long Should a Line Be?

Martin's analysis found most lines in well-regarded codebases were **under 80–100 characters**. He recommends **a maximum of 120 characters**, and shorter is better.

If your line needs to scroll horizontally, it's probably doing too much.

### Horizontal Openness and Density

Use spaces to express relationships:

```java
// Spaces around assignment operator — separates left from right
int lineSize = line.length();

// Spaces around operands — shows precedence
return (-b + Math.sqrt(determinant)) / (2*a);
//  ↑ tighter spacing around * shows it binds more tightly than +/-
```

Use **no spaces** between a function name and its argument list — they're tightly related:

```java
// Good
lineWidthHistogram.addLine(lineSize, lineCount);

// Odd — space makes it look like two separate things
lineWidthHistogram.addLine (lineSize, lineCount);
```

### Indentation

Indentation visually represents **hierarchy**. Each level of nesting gets one more indent level.

```java
public class CommentWidget extends TextWidget {
    public static final String REGEXP = "^#[^\r\n]*(?:(?:\r\n)|\n|\r)?";

    public CommentWidget(ParentWidget parent, String text) {
        super(parent, text);
    }

    public String render() throws Exception {
        return "";
    }
}
```

**Don't collapse short methods to a single line** to be "clever":

```java
// Bad — saves vertical space but destroys readability
public String getTag() { return tag; }
public boolean isMeta() { return meta; }

// Good — consistent indentation structure
public String getTag() {
    return tag;
}

public boolean isMeta() {
    return meta;
}
```

### Dummy Scopes

If a `while` or `for` loop has an empty body, make the semicolon visible:

```java
// Bad — easy to miss the semicolon
while (dis.read(buf, 0, readBufferSize) != -1)
;

// Good — make the empty body explicit
while (dis.read(buf, 0, readBufferSize) != -1) {
    // intentionally empty
}
```

---

## Team Rules

If you work on a team, the team decides the formatting rules — then **everyone follows them consistently**. No one's personal style takes precedence.

A codebase that looks like it was written by a single person is the goal. Inconsistent style (some files with 2-space indent, others 4; some with braces on new lines, others inline) signals a fragmented team.

:::tip
Use an automatic formatter (like **Checkstyle**, **google-java-format**, or IDE formatting profiles) and commit the config to the repo. Automate the disagreement away.
:::

---

## Key Takeaways

| Concept | Guideline |
|---------|-----------|
| File size | Target 200–500 lines; rarely exceed 500 |
| Newspaper rule | High-level at top, detail at bottom |
| Blank lines | Separate concepts like paragraph breaks |
| Variable declaration | Declare close to first use |
| Caller/callee order | Caller above callee |
| Line length | Max ~120 characters |
| Indentation | Never collapse or collapse indented blocks |
| Team rules | Agree and automate — consistency wins |
