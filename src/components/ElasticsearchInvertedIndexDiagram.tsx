import React, { useState } from 'react';

type TabKey = 'analogy' | 'pipeline' | 'features';

interface TokenStep {
  stage: string;
  input: string;
  output: string[];
  explanation: string;
}

const TOKEN_STEPS: TokenStep[] = [
  {
    stage: '1. Character Filter',
    input: '<p>Fast &amp; Distributed Search Engine!</p>',
    output: ['Fast and Distributed Search Engine!'],
    explanation: 'Strips HTML tags (<p>, </p>) and replaces HTML entities (&amp; -> and).'
  },
  {
    stage: '2. Tokenizer (Standard)',
    input: 'Fast and Distributed Search Engine!',
    output: ['Fast', 'and', 'Distributed', 'Search', 'Engine'],
    explanation: 'Splits raw text stream on whitespace and punctuation boundaries into individual words.'
  },
  {
    stage: '3. Token Filter (Lowercase & Stop Words)',
    input: 'Fast, and, Distributed, Search, Engine',
    output: ['fast', 'distributed', 'search', 'engine'],
    explanation: 'Converts all tokens to lowercase and removes meaningless noise words ("and", "the", "is").'
  },
  {
    stage: '4. Stemming / Lemmatization (Porter)',
    input: 'fast, distributed, search, engine',
    output: ['fast', 'distribut', 'search', 'engin'],
    explanation: 'Reduces words to grammatical root forms so queries for "distributing" or "distribution" match.'
  },
  {
    stage: '5. Inverted Index Registration',
    input: 'Tokens registered with Document IDs',
    output: ['"distribut" -> [Doc #1, Doc #4]', '"fast" -> [Doc #1, Doc #2]', '"search" -> [Doc #1, Doc #3]'],
    explanation: 'Adds tokens into the in-memory Term Dictionary (FST) pointing to on-disk postings lists.'
  }
];

const SEARCH_FEATURES = [
  {
    id: 'relevance',
    title: 'BM25 Relevance Scoring',
    subtitle: 'TF-IDF evolution ranking matching quality',
    detail: 'Unlike SQL WHERE queries that return boolean true/false, Elasticsearch calculates a relevance score (_score) for every document using BM25. Combines Term Frequency (how often term appears in doc), Inverse Document Frequency (how rare term is across entire index), and Field-Length Normalization.',
    exampleQuery: 'GET /products/_search\n{\n  "query": {\n    "match": { "description": "wireless bluetooth headphones" }\n  }\n}'
  },
  {
    id: 'fuzzy',
    title: 'Typo Tolerance & Fuzzy Search',
    subtitle: 'Levenshtein edit distance matching',
    detail: 'Allows users to make typos (e.g. typing "elsticsearch" instead of "elasticsearch"). Uses Damerau-Levenshtein distance to calculate the number of single-character insertions, deletions, substitutions, or transpositions required to match terms in the inverted index.',
    exampleQuery: 'GET /products/_search\n{\n  "query": {\n    "fuzzy": {\n      "title": {\n        "value": "elsticsearch",\n        "fuzziness": "AUTO"\n      }\n    }\n  }\n}'
  },
  {
    id: 'autocomplete',
    title: 'Autocomplete & Search-As-You-Type',
    subtitle: 'Edge N-Grams & Completion Suggesters',
    detail: 'Powers search bar dropdowns. Edge N-grams break tokens into sequential prefix letter combinations (e.g., "phone" -> ["p", "ph", "pho", "phon", "phone"]). As the user types keystroke by keystroke, instant prefix lookups return matching suggestions in sub-5ms.',
    exampleQuery: 'PUT /autocomplete_index\n{\n  "settings": {\n    "analysis": {\n      "tokenizer": {\n        "edge_ngram_tok": { "type": "edge_ngram", "min_gram": 2, "max_gram": 10 }\n      }\n    }\n  }\n}'
  },
  {
    id: 'aggregations',
    title: 'Aggregations & Real-Time Faceting',
    subtitle: 'Instant statistical grouping and faceting',
    detail: 'Summarizes data on the fly. Generates e-commerce filter sidebars ("Category: Electronics (42)", "Brand: Sony (18)", "Price: $50–$100 (9)"). Employs column-oriented Doc Values on disk to calculate averages, histograms, and distinct counts at hardware speed without loading document source.',
    exampleQuery: 'GET /sales/_search\n{\n  "size": 0,\n  "aggs": {\n    "by_category": {\n      "terms": { "field": "category.keyword" },\n      "aggs": {\n        "avg_price": { "avg": { "field": "price" } }\n      }\n    }\n  }\n}'
  }
];

export default function ElasticsearchInvertedIndexDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('analogy');
  const [activeFeature, setActiveFeature] = useState<string>('relevance');
  const [highlightTerm, setHighlightTerm] = useState<string>('distributed');

  const selectedFeature = SEARCH_FEATURES.find((f) => f.id === activeFeature) || SEARCH_FEATURES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .es-split-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Elasticsearch Search Architecture: Inverted Index &amp; Text Analysis
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'analogy', label: '1. Book Index Analogy (RDBMS vs Inverted Index)' },
            { id: 'pipeline', label: '2. Text Analysis Pipeline (Tokenization)' },
            { id: 'features', label: '3. Advanced Search Capabilities' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabKey)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: activeTab === tab.id ? '2px solid #0284c7' : '1px solid #D9D9D9',
                background: activeTab === tab.id ? '#e0f2fe' : '#F2F2F2',
                color: activeTab === tab.id ? '#0369a1' : '#334155',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Book Index Analogy */}
        {activeTab === 'analogy' && (
          <div>
            <div style={{ background: '#F7FDF9', border: '1px solid #98A2B3', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '3px' }}>
                The "Back-of-the-Book" Search Analogy
              </div>
              <p style={{ fontSize: '12.5px', color: '#1e293b', margin: 0, lineHeight: 1.55 }}>
                If you need to find the word <strong>"distributed"</strong> in a 500-page textbook, reading page-by-page from start to finish is a full scan (slow $O(N)$ relational SQL <code>LIKE %distributed%</code>).
                Instead, you turn to the <strong>Index at the back of the book</strong>: find the word alphabetically in seconds, and see the exact page numbers listed. That is exactly what an <strong>Inverted Index</strong> does.
              </p>
            </div>

            {/* Interactive Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Select Search Term:</span>
              {['distributed', 'database', 'search', 'cluster'].map((term) => (
                <button
                  key={term}
                  onClick={() => setHighlightTerm(term)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: highlightTerm === term ? '1.5px solid #0284c7' : '1px solid #D9D9D9',
                    background: highlightTerm === term ? '#0284c7' : '#ffffff',
                    color: highlightTerm === term ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '11.5px',
                  }}
                >
                  "{term}"
                </button>
              ))}
            </div>

            <div className="es-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              {/* Left: Relational DB Forward Index */}
              <div style={{ background: '#ffffff', border: '1px solid #D9D9D9', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                  Relational DB (Forward Table Scan)
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                  <code>SELECT * FROM docs WHERE text LIKE '%{highlightTerm}%'</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { id: 1, text: 'Building resilient distributed database clusters' },
                    { id: 2, text: 'High throughput database connection pooling' },
                    { id: 3, text: 'Real-time full text search engine indexing' },
                    { id: 4, text: 'Scaling distributed search systems across nodes' },
                  ].map((doc) => {
                    const matches = doc.text.toLowerCase().includes(highlightTerm);
                    return (
                      <div
                        key={doc.id}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: matches ? '1.5px solid #fca5a5' : '1px solid #f1f5f9',
                          background: matches ? '#fee2e2' : '#f8fafc',
                          fontSize: '11px',
                          color: '#0f172a',
                        }}
                      >
                        <strong>Doc #{doc.id}:</strong> {doc.text}
                        {matches && <span style={{ marginLeft: '6px', color: '#dc2626', fontWeight: 700 }}>[MATCH]</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#991b1b', fontStyle: 'italic' }}>
                  ⚠️ Traverses all 4 rows sequentially. In a 50M row database, this causes disk saturation and multi-second query timeouts.
                </div>
              </div>

              {/* Right: Inverted Index Postings List */}
              <div style={{ background: '#F7FDF9', border: '1.5px solid #86efac', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                  Elasticsearch (Inverted Index Lookup)
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                  Dictionary Term ➔ Postings List (Document IDs)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { term: 'cluster', docs: [1] },
                    { term: 'database', docs: [1, 2] },
                    { term: 'distributed', docs: [1, 4] },
                    { term: 'search', docs: [3, 4] },
                  ].map((row) => {
                    const isSelected = row.term === highlightTerm;
                    return (
                      <div
                        key={row.term}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #10b981' : '1px solid #D9D9D9',
                          background: isSelected ? '#dcfce7' : '#ffffff',
                          fontSize: '11.5px',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: isSelected ? '#15803d' : '#0f172a' }}>
                          "{row.term}"
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {row.docs.map((docId) => (
                            <span
                              key={docId}
                              style={{
                                background: isSelected ? '#15803d' : '#F2F2F2',
                                color: isSelected ? '#ffffff' : '#334155',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '10.5px',
                              }}
                            >
                              Doc #{docId}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#166534', fontStyle: 'italic' }}>
                  ✓ Inverted index locates term in $O(1)$ memory time (FST) and instantly returns exact matching document IDs!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Text Analysis Pipeline */}
        {activeTab === 'pipeline' && (
          <div>
            <div style={{ background: '#F7FDF9', border: '1px solid #98A2B3', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '3px' }}>
                How Text Is Processed Into Inverted Indexes
              </div>
              <p style={{ fontSize: '12.5px', color: '#1e293b', margin: 0, lineHeight: 1.55 }}>
                Elasticsearch does not store raw strings in the inverted index. Documents pass through an <strong>Analyzer</strong> comprising three sequential stages: Character Filters, Tokenizer, and Token Filters.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TOKEN_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #D9D9D9',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      {step.stage}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      {step.explanation}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginTop: '4px' }}>
                    <span style={{ color: '#64748b' }}>Input:</span>
                    <code style={{ background: '#F2F2F2', padding: '1px 6px', borderRadius: '4px' }}>{step.input}</code>
                    <span style={{ color: '#0284c7', fontWeight: 700 }}>➔</span>
                    <span style={{ color: '#64748b' }}>Result:</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {step.output.map((out, i) => (
                        <span key={i} style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {out}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Advanced Search Features */}
        {activeTab === 'features' && (
          <div className="es-split-grid" style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '14px', alignItems: 'start' }}>
            {/* Feature Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SEARCH_FEATURES.map((feat) => {
                const isSelected = feat.id === activeFeature;
                return (
                  <div
                    key={feat.id}
                    onClick={() => setActiveFeature(feat.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #D9D9D9',
                      background: isSelected ? '#e0f2fe' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569' }}>
                      {feat.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Detail Panel */}
            <div style={{ background: '#F7FDF9', border: '1px solid #98A2B3', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {selectedFeature.title}
              </div>
              <p style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.55, margin: '0 0 12px 0' }}>
                {selectedFeature.detail}
              </p>

              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                Elasticsearch Query DSL Example
              </div>
              <div style={{ background: '#1e293b', borderRadius: '6px', padding: '10px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, background: 'transparent', padding: 0, fontSize: '11px', color: '#e2e8f0', lineHeight: 1.45, fontFamily: 'monospace' }}>
                  {selectedFeature.exampleQuery}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
