---
id: chapter-02
title: "Chapter 2: Data Models and Query Languages"
sidebar_label: "Ch 2 — Data Models & Query Languages"
sidebar_position: 2
---

# Chapter 2: Data Models and Query Languages

## The Big Idea

Data models are probably the most important part of developing software — they shape not just how we write the code, but how we *think about the problem*. Each layer of a system provides an abstraction model for the layer above it.

This chapter surveys the major families of data models and their query languages, helping you understand which fits which use case.

---

## 🗃️ Relational Model vs Document Model

### The Relational Model (SQL)

Proposed by Edgar Codd in 1970. Data is organized into **relations** (tables), where each relation is an unordered collection of **tuples** (rows). This model has dominated for ~40 years because:
- It hides implementation details behind a clean query interface
- Joins connect data across tables efficiently
- Consistency constraints keep data clean

### The Rise of NoSQL

NoSQL emerged in the late 2000s driven by:
- Need for greater scalability (huge datasets, high write throughput)
- Preference for free/open source software over commercial databases
- Need for more flexible/dynamic data models than rigid relational schemas
- Frustration with the *object-relational mismatch*

:::note
"NoSQL" is a poor name — it doesn't mean "no SQL ever." It means a variety of non-relational databases. "Not Only SQL" is a retroactive backronym.
:::

### The Object-Relational Mismatch

Most application code today is written in OOP languages (Java, Python, etc.), but data is stored in relational tables. This creates an **impedance mismatch** — an awkward translation layer between objects and rows/columns.

ORMs (Hibernate, ActiveRecord) reduce the boilerplate but can't fully hide the mismatch.

**Example — storing a résumé:**

A person has one name but multiple jobs, education entries, and contact details. In SQL, this requires multiple tables with foreign keys. In JSON (document model), the entire résumé fits naturally in one self-contained document:

```json
{
  "user_id": 251,
  "first_name": "Bill",
  "last_name": "Gates",
  "positions": [
    {"title": "Co-chair", "organization": "Bill & Melinda Gates Foundation"},
    {"title": "Co-founder", "organization": "Microsoft"}
  ],
  "education": [
    {"school_name": "Harvard University", "start": 1973, "end": 1975}
  ]
}
```

For data like this, the document model has **better locality** (all data in one place) and **schema flexibility** (no rigid column types required upfront).

### Many-to-One and Many-to-Many Relationships

When you normalize data (store IDs instead of strings — e.g., `region_id: 5` instead of `"Greater Seattle Area"`), you get:
- Consistent style and spelling
- Easy updates (change name in one place)
- Better internationalization

But joins become necessary. Document databases handle one-to-many well but **struggle with many-to-many and many-to-one relationships** that require joins.

### Are Document Databases Repeating History?

The IMS database (1968) used a hierarchical model similar to JSON documents — great for one-to-many, poor for many-to-many. This led to the relational model. Document databases have the same structural trade-off, just with better tooling around it.

---

## 🔄 Relational vs Document Databases Today

| Aspect | Document | Relational |
|---|---|---|
| Schema flexibility | Schema-on-read (flexible) | Schema-on-write (enforced) |
| Locality | High (whole document) | Low (multiple tables/joins) |
| Joins | Weak | Strong |
| Many-to-many relationships | Awkward | Natural |
| Best for | Hierarchical, self-contained data | Interconnected data |

**Schema-on-read** (document): Structure is implicit, interpreted at read time. Like dynamic typing in programming languages.

**Schema-on-write** (relational): Structure is explicit and enforced on write. Like static typing.

Neither is universally better. Choose based on your data's natural shape.

---

## 🔍 Query Languages for Data

### Declarative vs Imperative

**Imperative:** You tell the computer *how* to do something step by step.

```python
# Imperative: manually iterate and filter
sharks = []
for animal in animals:
    if animal.family == "Sharks":
        sharks.append(animal)
```

**Declarative:** You tell the computer *what* you want, not how to compute it.

```sql
-- Declarative: the DB optimizes execution
SELECT * FROM animals WHERE family = 'Sharks';
```

SQL is declarative. Advantages:
- More concise and easier to reason about
- The database optimizer can improve the execution plan without changing your query
- Easier to parallelize

### Declarative Queries on the Web

CSS is a great analogy for declarative querying:

```css
/* Declarative: "make selected items blue" */
li.selected > p { color: blue; }
```

vs JavaScript's imperative equivalent (more verbose, fragile). The same principle applies to data queries.

### MapReduce Querying

**MapReduce** is a programming model for processing large amounts of data across many machines. It's a middle ground — not fully declarative, not fully imperative.

```javascript
// MongoDB MapReduce example: count sharks observed per month
db.observations.mapReduce(
  function map() {
    if (this.family === "Sharks") {
      emit(this.observationMonth, this.numAnimals);
    }
  },
  function reduce(key, values) {
    return Array.sum(values);
  },
  { out: "monthlySharkReport" }
);
```

Both `map` and `reduce` functions must be **pure** — no side effects, no additional queries. This is constraining but enables distributed execution.

MongoDB later added an **aggregation pipeline** — a more declarative alternative to MapReduce.

---

## 🕸️ Graph-Like Data Models

When many-to-many relationships are pervasive, the relational model gets awkward and document databases can't help. **Graph databases** shine here.

A graph has:
- **Vertices** (nodes, entities)
- **Edges** (relationships, arcs)

Examples of graph data:
- Social networks (people → friends)
- Web graphs (pages → links)
- Road/rail networks (locations → routes)
- Dependency graphs in software

### Property Graphs

Each vertex has:
- A unique ID
- Outgoing and incoming edges
- A collection of key-value properties

Each edge has:
- A unique ID
- Start and end vertex
- A label (relationship type)
- Key-value properties

This is flexible enough to represent heterogeneous data in one graph.

### The Cypher Query Language

Cypher is a declarative query language for property graphs (used in Neo4j):

```cypher
// Find people who emigrated from the US to Europe
MATCH
  (person) -[:BORN_IN]-> () -[:WITHIN*0..]-> (us:Location {name:'United States'}),
  (person) -[:LIVES_IN]-> () -[:WITHIN*0..]-> (eu:Location {name:'Europe'})
RETURN person.name
```

This is far more expressive than the equivalent SQL (which requires recursive CTEs and is much harder to read).

### Triple-Stores and SPARQL

In a **triple-store**, all data is stored as three-part statements: *(subject, predicate, object)*.

Example:
- `(Jim, age, 33)`
- `(Jim, marriedTo, Lucy)`
- `(Lucy, type, Person)`

**SPARQL** is the query language for triple-stores (and the semantic web / RDF data model).

### Graph Queries in SQL

Graph-style queries *can* be done in SQL using recursive common table expressions (CTEs), but they're verbose and awkward. Cypher and SPARQL make the same query far more readable — showing how the right data model and query language for the job matters enormously.

---

## Summary

| Model | Best for | Query language |
|---|---|---|
| **Relational** | Interconnected data, joins, constraints | SQL |
| **Document** | Self-contained hierarchical data, flexible schema | MongoDB queries, aggregation pipeline |
| **Graph** | Highly connected data with many-to-many relationships | Cypher, SPARQL, Gremlin |

The key insight: **data models encode assumptions about usage patterns**. Choose the model that matches your data's natural relationships, not the one you're most familiar with.
