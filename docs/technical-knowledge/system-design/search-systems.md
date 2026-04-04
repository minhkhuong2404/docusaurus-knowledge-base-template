---
id: search-systems
title: Search Systems
sidebar_label: Search Systems
description: Design patterns for full-text search, autocomplete, faceted search, and search-as-you-type using Elasticsearch, inverted indexes, and Spring Data Elasticsearch.
tags: [search, elasticsearch, full-text-search, autocomplete, inverted-index, relevance, faceted-search]
---

# Search Systems

---

## Why Not Just Use SQL?

```sql
-- SQL LIKE is O(n) — full table scan, no ranking
SELECT * FROM products WHERE description LIKE '%bluetooth speaker%';
-- 1M products → scans all 1M rows, no relevance score
```

**Elasticsearch advantages:**
- Inverted index → O(1) term lookup
- Relevance scoring (TF-IDF, BM25)
- Fuzzy matching, stemming, synonyms
- Near real-time search (1s delay after index)
- Horizontal scaling built-in

---

## Inverted Index

```
Documents:
  Doc1: "bluetooth speaker portable"
  Doc2: "wireless speaker home"
  Doc3: "bluetooth headphones portable"

Inverted Index:
  "bluetooth"  → [Doc1, Doc3]
  "speaker"    → [Doc1, Doc2]
  "portable"   → [Doc1, Doc3]
  "wireless"   → [Doc2]
  "headphones" → [Doc3]

Query "bluetooth speaker":
  "bluetooth" → [Doc1, Doc3]
  "speaker"   → [Doc1, Doc2]
  Intersection → Doc1 (highest score: matches both terms)
```

---

## Elasticsearch Concepts

| Concept | SQL Equivalent |
|---|---|
| Index | Table |
| Document | Row |
| Field | Column |
| Mapping | Schema |
| Shard | Partition |
| Replica | Read replica |

### Index Settings
```json
PUT /products
{
  "settings": {
    "number_of_shards": 5,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "my_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop", "snowball"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "my_analyzer" },
      "name_keyword": { "type": "keyword" },
      "price": { "type": "float" },
      "category": { "type": "keyword" },
      "description": { "type": "text" },
      "tags": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

---

## Common Query Patterns

### Full-Text Search with Boost
```json
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "bluetooth speaker",
      "fields": ["name^3", "description", "tags^2"],
      "type": "best_fields",
      "fuzziness": "AUTO"
    }
  }
}
```

### Boolean Query
```json
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "speaker" } }
      ],
      "filter": [
        { "range": { "price": { "gte": 50, "lte": 200 } } },
        { "term": { "category": "electronics" } },
        { "term": { "in_stock": true } }
      ],
      "should": [
        { "match": { "tags": "featured" } }
      ]
    }
  },
  "sort": [
    { "_score": "desc" },
    { "created_at": "desc" }
  ]
}
```

### Faceted Search (Aggregations)
```json
GET /products/_search
{
  "query": { "match": { "name": "speaker" } },
  "aggs": {
    "by_category": {
      "terms": { "field": "category", "size": 10 }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50 },
          { "from": 50, "to": 100 },
          { "from": 100, "to": 200 },
          { "from": 200 }
        ]
      }
    },
    "avg_price": { "avg": { "field": "price" } }
  }
}
```

---

## Spring Data Elasticsearch

```java
// Document mapping
@Document(indexName = "products")
@Setting(settingPath = "es-settings.json")
public class ProductDocument {
    @Id
    private String id;

    @MultiField(
        mainField = @Field(type = FieldType.Text, analyzer = "english"),
        otherFields = @InnerField(suffix = "keyword", type = FieldType.Keyword)
    )
    private String name;

    @Field(type = FieldType.Float)
    private BigDecimal price;

    @Field(type = FieldType.Keyword)
    private String category;

    @Field(type = FieldType.Date)
    private Instant createdAt;
}

// Repository
public interface ProductSearchRepository
        extends ElasticsearchRepository<ProductDocument, String> {

    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"name^3\", \"description\"]}}")
    Page<ProductDocument> search(String query, Pageable pageable);
}

// Service with custom query
@Service
public class ProductSearchService {
    @Autowired private ElasticsearchOperations esOps;

    public SearchResult<ProductDocument> search(ProductSearchRequest req) {
        Query query = NativeQuery.builder()
            .withQuery(q -> q.bool(b -> b
                .must(m -> m.multiMatch(mm -> mm
                    .query(req.getKeyword())
                    .fields("name^3", "description", "tags^2")
                    .fuzziness("AUTO")
                ))
                .filter(f -> f.range(r -> r
                    .field("price")
                    .gte(JsonData.of(req.getMinPrice()))
                    .lte(JsonData.of(req.getMaxPrice()))
                ))
            ))
            .withPageable(PageRequest.of(req.getPage(), req.getSize()))
            .build();

        return esOps.search(query, ProductDocument.class);
    }
}
```

---

## Autocomplete / Search-as-You-Type

### Completion Suggester
```json
PUT /products
{
  "mappings": {
    "properties": {
      "name_suggest": {
        "type": "completion",
        "analyzer": "simple",
        "search_analyzer": "simple"
      }
    }
  }
}

// Index document with suggestions
{
  "name": "Bluetooth Speaker",
  "name_suggest": {
    "input": ["Bluetooth Speaker", "bluetooth speaker", "speaker"],
    "weight": 100
  }
}

// Query
GET /products/_search
{
  "suggest": {
    "product_suggest": {
      "prefix": "blue",
      "completion": {
        "field": "name_suggest",
        "size": 5,
        "fuzzy": { "fuzziness": 1 }
      }
    }
  }
}
```

### Edge N-Gram (Type-ahead)
Better for partial word matching:
```json
"analysis": {
  "tokenizer": {
    "edge_ngram_tokenizer": {
      "type": "edge_ngram",
      "min_gram": 1,
      "max_gram": 20
    }
  }
}
// "blue" → "b", "bl", "blu", "blue"
// Searching "blu" matches "blue", "bluetooth", etc.
```

---

## Search Architecture

```
User Input → Search API
                ↓
           Query Parser (handle special chars, operators, quotes)
                ↓
           Query Builder (build ES query with filters, boosts)
                ↓
           Elasticsearch Cluster
           (5 shards, 1 replica each = 10 nodes total for 100M docs)
                ↓
           Result Ranker (personalization, A/B test scoring)
                ↓
           Response Formatter
                ↓
           Client
```

### Data Sync: DB → Elasticsearch

```
Option 1: Dual-write (write to DB + ES in same transaction)
  Risk: partial failure → inconsistency

Option 2: CDC (Change Data Capture) via Debezium
  DB binlog → Debezium → Kafka → ES Consumer
  Reliable, near real-time (~1s lag)

Option 3: Batch sync (nightly full reindex)
  Simple, but stale data during day
```

```java
// Debezium + Kafka → ES indexer
@KafkaListener(topics = "dbserver1.public.products")
public void onProductChange(DebeziumMessage msg) {
    if ("DELETE".equals(msg.getOp())) {
        productSearchRepository.deleteById(msg.getBefore().getId());
    } else {
        ProductDocument doc = mapper.toDocument(msg.getAfter());
        productSearchRepository.save(doc);
    }
}
```

---

## Relevance Tuning

| Technique | Effect |
|---|---|
| **Field boosting** | Name matches > description matches |
| **Freshness boost** | Recent products scored higher |
| **Popularity boost** | High-view products ranked up |
| **Personalization** | User's history influences ranking |
| **Synonym expansion** | "TV" matches "television" |
| **Stemming** | "running" matches "run", "runs" |
| **Fuzzy matching** | "speker" matches "speaker" |

---

## Interview Questions

1. Why is Elasticsearch (or search engine) better than SQL LIKE for full-text search?
2. What is an inverted index? How does it enable fast search?
3. How do you keep Elasticsearch in sync with your primary database?
4. What is BM25 and how does it improve over TF-IDF?
5. How would you design an autocomplete/search-as-you-type feature?
6. What is faceted search and how do you implement it?
7. How do you handle Elasticsearch going down while still accepting writes to your primary DB?
8. How would you scale Elasticsearch to handle 1 billion product documents?
9. What are the trade-offs of Elasticsearch's near real-time (~1s) indexing?
10. How do you tune relevance in search results?
