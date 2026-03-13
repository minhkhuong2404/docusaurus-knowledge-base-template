---
id: full-text-search
title: Full-Text Search
description: Full-text search concepts, inverted indexes, relevance scoring, MySQL FULLTEXT, PostgreSQL tsvector, and Elasticsearch for advanced search.
tags: [database, full-text-search, elasticsearch, inverted-index, tsvector, relevance, tfidf]
sidebar_position: 16
---

# Full-Text Search

## Why Full-Text Search?

Regular `LIKE '%term%'` queries are fundamentally broken for text search:
- Cannot use indexes (leading wildcard)
- No relevance ranking
- No stemming (`run` ≠ `running`)
- No stop word handling (`the`, `is` inflate results)
- No fuzzy matching, synonyms, or multi-language support

Full-text search engines solve all of these with an **inverted index**.

---

## The Inverted Index

An inverted index maps **each word** to all documents containing it:

```
Document 1: "Java Spring database optimization"
Document 2: "Spring Boot performance tuning"
Document 3: "Database performance tips"

Inverted Index:
  "java"        → [doc1]
  "spring"      → [doc1, doc2]
  "database"    → [doc1, doc3]
  "optimization"→ [doc1]
  "boot"        → [doc2]
  "performance" → [doc2, doc3]
  "tuning"      → [doc2]
  "tips"        → [doc3]

Query: "spring performance"
→ spring: [doc1, doc2] ∩ performance: [doc2, doc3] = doc2 (exact); doc1, doc3 (partial)
```

---

## Text Processing Pipeline

Before indexing, text is transformed:

```
Raw text: "The Quick Brown Foxes are RUNNING"
    ↓ Tokenization
["The", "Quick", "Brown", "Foxes", "are", "RUNNING"]
    ↓ Lowercase
["the", "quick", "brown", "foxes", "are", "running"]
    ↓ Stop word removal
["quick", "brown", "foxes", "running"]
    ↓ Stemming / Lemmatization
["quick", "brown", "fox", "run"]
    ↓ Stored in index
```

---

## Relevance Scoring

Documents are ranked by **relevance**, not just presence:

### TF-IDF (Term Frequency–Inverse Document Frequency)

```
TF  = (term occurrences in doc) / (total terms in doc)
IDF = log(total docs / docs containing term)
score = TF × IDF

High IDF = rare term = more discriminating = higher score
High TF  = term appears often in this doc = higher score
```

### BM25 (Best Match 25)

Modern improvement over TF-IDF used by Elasticsearch and PostgreSQL:
- Adds document length normalization (long docs don't have unfair TF advantage)
- Saturates TF (diminishing returns for very frequent terms)
- Default in Elasticsearch since v5, PostgreSQL since v15

---

## PostgreSQL Full-Text Search

### Basic FTS

```sql
-- tsvector: pre-processed searchable document representation
-- tsquery: search query expression

-- One-shot search (no index)
SELECT title, body
FROM articles
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('english', 'database & optimization');

-- @@ operator: "matches"
-- to_tsvector: tokenize + stem + remove stop words
-- to_tsquery: parse query (& = AND, | = OR, ! = NOT, <-> = phrase/followed-by)
```

### Stored tsvector Column (with Index)

```sql
-- Add pre-computed tsvector column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Populate
UPDATE articles SET search_vector =
    to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(body, ''));

-- Keep in sync with trigger
CREATE FUNCTION articles_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        coalesce(NEW.title, '') || ' ' || coalesce(NEW.body, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_articles_search_vector
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION articles_search_vector_update();

-- GIN index for fast search
CREATE INDEX idx_articles_fts ON articles USING GIN(search_vector);
```

### Search with Ranking

```sql
SELECT
    title,
    ts_rank(search_vector, query) AS rank,
    ts_headline('english', body, query,
        'MaxFragments=2, MaxWords=30, MinWords=10') AS excerpt
FROM articles,
     to_tsquery('english', 'database & (optimization | performance)') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 10;
```

### Query Syntax

```sql
-- AND
to_tsquery('english', 'database & optimization')

-- OR
to_tsquery('english', 'database | mysql | postgresql')

-- NOT
to_tsquery('english', 'database & !nosql')

-- Phrase (must follow each other)
to_tsquery('english', 'query <-> optimization')

-- Prefix (wildcard)
to_tsquery('english', 'optim:*')   -- matches: optimize, optimization, optimized

-- websearch_to_tsquery (user-friendly input)
websearch_to_tsquery('english', 'database "query optimization" -nosql')
-- Handles natural language, double-quoted phrases, - for NOT
```

---

## MySQL FULLTEXT Search

```sql
-- Add FULLTEXT index
ALTER TABLE articles ADD FULLTEXT INDEX ft_articles (title, body);

-- Or at create time
CREATE TABLE articles (
    id   INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    body  TEXT,
    FULLTEXT (title, body)
);

-- Natural Language Mode (default — relevance ranked)
SELECT title,
       MATCH(title, body) AGAINST('database optimization' IN NATURAL LANGUAGE MODE) AS score
FROM articles
WHERE MATCH(title, body) AGAINST('database optimization' IN NATURAL LANGUAGE MODE)
ORDER BY score DESC;

-- Boolean Mode (supports +, -, *, phrases)
SELECT title FROM articles
WHERE MATCH(title, body) AGAINST(
    '+database +optimization -nosql "query plan"' IN BOOLEAN MODE
);
-- + required, - excluded, * prefix wildcard, "phrase" exact phrase

-- Query Expansion (broaden results to related terms)
SELECT title FROM articles
WHERE MATCH(title, body) AGAINST('database' WITH QUERY EXPANSION);
```

**MySQL FULLTEXT limitations:**
- Minimum word length: 4 chars default (`ft_min_word_len`)
- Stop word list (common words ignored)
- MyISAM or InnoDB (InnoDB FT added in MySQL 5.6)
- No stemming (unlike PostgreSQL/Elasticsearch)

---

## Elasticsearch

The de-facto standard for production-grade search.

### Core Concepts

```
Index     ≈ Database table (collection of documents)
Document  ≈ Row (JSON)
Field     ≈ Column
Shard     ≈ Partition (each shard is a Lucene index)
Replica   ≈ Read replica of a shard
```

### Basic Operations

```json
// Index a document
PUT /articles/_doc/1
{
  "title": "Database Optimization Guide",
  "body": "Index tuning, query optimization, and caching...",
  "author": "Alice",
  "published_at": "2024-01-15"
}

// Search
GET /articles/_search
{
  "query": {
    "multi_match": {
      "query": "query optimization",
      "fields": ["title^2", "body"],    // title boosted 2x
      "type": "best_fields"
    }
  },
  "highlight": {
    "fields": { "body": {} }
  },
  "_source": ["title", "author"],
  "from": 0, "size": 10
}
```

### Query Types

```json
// Match (analyzed text search — full-text)
{ "match": { "title": "database optimization" } }

// Term (exact, no analysis — for keywords, IDs)
{ "term": { "status": "published" } }

// Range
{ "range": { "published_at": { "gte": "2024-01-01" } } }

// Bool (combine queries)
{
  "bool": {
    "must":   [{ "match": { "body": "database" } }],
    "should": [{ "match": { "title": "optimization" } }],
    "must_not": [{ "term": { "status": "draft" } }],
    "filter": [{ "range": { "published_at": { "gte": "2024-01-01" } } }]
  }
}
// filter clauses: don't affect scoring, are cached

// Fuzzy (typo tolerance — levenshtein distance)
{ "match": { "title": { "query": "optmization", "fuzziness": "AUTO" } } }
```

### Index Mapping

```json
PUT /articles
{
  "mappings": {
    "properties": {
      "title":        { "type": "text", "analyzer": "english" },
      "title_keyword":{ "type": "keyword" },    // exact match, aggregations
      "body":         { "type": "text", "analyzer": "english" },
      "author":       { "type": "keyword" },
      "published_at": { "type": "date" },
      "tags":         { "type": "keyword" }
    }
  },
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}
```

### Spring Boot + Elasticsearch

```java
@Document(indexName = "articles")
public class Article {
    @Id private String id;

    @Field(type = FieldType.Text, analyzer = "english")
    private String title;

    @Field(type = FieldType.Text, analyzer = "english")
    private String body;

    @Field(type = FieldType.Keyword)
    private String author;
}

@Repository
public interface ArticleRepository
        extends ElasticsearchRepository<Article, String> {
    List<Article> findByTitleContaining(String term);
}

// Custom query
@Service
public class SearchService {
    @Autowired ElasticsearchOperations ops;

    public SearchHits<Article> search(String query) {
        Query searchQuery = NativeQuery.builder()
            .withQuery(q -> q.multiMatch(m -> m
                .query(query)
                .fields("title^2", "body")))
            .withHighlightQuery(HighlightQuery.builder(
                Highlight.of(h -> h.fields("body", f -> f))).build())
            .build();
        return ops.search(searchQuery, Article.class);
    }
}
```

---

## DB Search vs Elasticsearch Trade-offs

| Concern | PostgreSQL FTS | Elasticsearch |
|---------|---------------|---------------|
| Setup complexity | Low | High |
| Consistency | Strong (same DB) | Eventual (sync lag) |
| Relevance tuning | Basic | Advanced (boosting, custom analyzers) |
| Scale | Vertical | Horizontal (sharding) |
| Analytics & aggregations | Limited | Excellent |
| Fuzzy / phonetic search | Limited | Built-in |
| Maintenance | None extra | Cluster management |
| Use when | Under 10M docs, simple | Large scale / complex |

---

## 🎯 Interview Questions

**Q1. Why is `LIKE '%term%'` a bad approach for text search?**
> Leading wildcards prevent index usage, so every row must be scanned. It has no relevance ranking, no stemming (so "run" won't match "running"), no stop words, and no fuzzy matching. Full-text search uses an inverted index for O(log n) lookups plus linguistic analysis for better result quality.

**Q2. What is an inverted index?**
> An inverted index maps each unique term to the list of documents (and positions) containing that term. It's the opposite of a forward index (document → terms). Enables efficient lookup: "which documents contain 'optimization'?" is a direct index key lookup, not a scan of all documents.

**Q3. What is TF-IDF and how does it affect search ranking?**
> TF (Term Frequency): how often the term appears in the document. IDF (Inverse Document Frequency): how rare the term is across all documents. Score = TF × IDF. Rare terms in specific documents score higher. Common words like "the" have very low IDF (so stop words are often just removed). BM25 improves on TF-IDF by adding document length normalization.

**Q4. What is the difference between `text` and `keyword` field types in Elasticsearch?**
> `text` fields are analyzed (tokenized, lowercased, stemmed) for full-text search. `keyword` fields are stored as-is for exact matching, filtering, sorting, and aggregations. A field named `title.keyword` is a common pattern — the `text` sub-field for search, the `keyword` sub-field for sorting/aggregation.

**Q5. When would you use Elasticsearch instead of PostgreSQL's built-in FTS?**
> Use Elasticsearch when: you have millions of documents and need horizontal scaling; you need advanced relevance tuning (custom analyzers, field boosting, personalization); you need real-time analytics aggregations; you need fuzzy matching, autocomplete, or multi-language support; or you need to search across data from multiple databases/services.

**Q6. What is the `filter` context vs `query` context in Elasticsearch?**
> Query context affects relevance scoring — documents are ranked by how well they match. Filter context is a yes/no check with no scoring — filters are cached and faster. Use `filter` for structured data (date ranges, status, user_id) and `must`/`should` for full-text fields where relevance matters.

**Q7. How do you keep Elasticsearch in sync with the primary database?**
> Options: dual-write (app writes to both — risk of divergence on partial failure); change data capture (CDC) with Debezium to stream binlog/WAL changes to Elasticsearch; batch sync jobs (periodic re-index — higher latency); outbox pattern (write event to DB table, consumer updates ES transactionally). CDC is most robust for production.

**Q8. What is a `tsvector` in PostgreSQL and how is it used for search?**
> A `tsvector` is a sorted list of lexemes (normalized tokens) extracted from a text document, stored as a special type. It's created by `to_tsvector('english', text)` which tokenizes, lowercases, removes stop words, and stems the text. Combined with a GIN index, `@@` operator searches are fast. A stored+indexed `tsvector` column avoids recomputing per query.

---

## Advanced Editorial Pass: Search Relevance and Data Consistency Trade-offs

### Senior Engineering Focus
- Treat search as a separate retrieval system with explicit consistency model.
- Design analyzers and ranking with domain vocabulary, not defaults.
- Plan synchronization pipeline between OLTP source and search index.

### Failure Modes to Anticipate
- Relevance drift after synonym/tokenizer changes.
- Indexing lag causing user-visible inconsistency.
- Operational overhead from under-monitored search clusters.

### Practical Heuristics
1. Version analyzer changes and test ranking impact.
2. Define lag budgets and stale-result handling strategy.
3. Instrument query relevance and error metrics continuously.

### Compare Next
- [Advanced SQL](./advanced-sql.md)
- [NoSQL & Distributed Databases](./nosql-distributed.md)
- [Performance & Monitoring](./performance-monitoring.md)
