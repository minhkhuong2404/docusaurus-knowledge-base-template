---
id: rag-fundamentals
title: Retrieval-Augmented Generation (RAG) Architecture & Guide
sidebar_label: RAG Fundamentals & Agentic RAG
description: Complete architectural deep-dive into Retrieval-Augmented Generation (RAG) — from offline document ingestion and vector databases to Advanced Reranking and Agentic RAG workflows.
tags: [ai, ai-agents, rag, retrieval-augmented-generation, vector-database, embeddings, qdrant, pinecone, langchain]
---

import RagArchitectureDiagram from '@site/src/components/RagArchitectureDiagram';

# Retrieval-Augmented Generation (RAG) Architecture & Guide

While Large Language Models (LLMs) possess extraordinary general reasoning abilities, they suffer from two critical enterprise weaknesses:
1. **Knowledge Cutoffs & Hallucinations:** They cannot access private corporate data (Notion pages, Jira tickets, Postgres DBs, internal PDFs) and invent convincing-sounding falsehoods when asked about topics outside their training data.
2. **Context Window Limits & Cost:** Stuffing entire company knowledge bases into every prompt is computationally prohibitive and exceeds token limits.

**Retrieval-Augmented Generation (RAG)** solves this by giving the LLM an *"open-book exam"*—dynamically searching a vector database for the exact relevant paragraphs and injecting them into the prompt before generation.

This guide breaks down RAG architecture from fundamentals to production Agentic workflows based on the [Cloud X Berry & KodeKloud tutorials](https://www.youtube.com/watch?v=swvzKSOEluc).

---

## Interactive RAG Architecture & Vector Search Simulator

Use the interactive visualizer below to inspect the two core pipelines, simulate live vector similarity matching, explore RAG evolution, and compare RAG against fine-tuning.

<RagArchitectureDiagram />

---

## The 2 Foundational Pipelines of RAG

A production RAG system is divided into two distinct asynchronous pipelines:

```
📥 1. OFFLINE INGESTION PIPELINE (Pre-computed & Indexed):
[Raw Docs (PDF/Wiki)] ➔ [Chunking Engine] ➔ [Embedding Model] ➔ [Vector Database (HNSW Index)]

⚡ 2. ONLINE RETRIEVAL & GENERATION PIPELINE (Real-Time User Request):
[User Query] ➔ [Embed Query] ➔ [Vector Similarity Search] ➔ [Augment Prompt] ➔ [LLM Output]
```

---

### 1. Offline Ingestion Pipeline (Indexing Data)

1. **Document Loading:** Ingest raw files from multiple sources (PDFs, Markdown documentation, Confluence, Google Drive, SQL dumps).
2. **Chunking Strategies:** Breaking long documents into digestible semantic pieces:
   * **Fixed-size Chunking (with Overlap):** E.g., 512 tokens with 50-token sliding window overlap to ensure sentences cut across chunk boundaries do not lose context.
   * **Semantic Chunking:** Splitting by markdown headings, paragraphs, or semantic topic boundaries.
   * **Recursive Character Splitting:** Hierarchy splits (paragraphs `\n\n` ➔ lines `\n` ➔ spaces ` `) to keep units natural.
3. **Dense Vector Embeddings:** Passing each text chunk through an embedding model (e.g. `text-embedding-3-small`, `bge-large-en-v1.5`) that converts text into high-dimensional numerical vectors (e.g. 1536 floating-point numbers).
4. **Vector Database Storage:** Saving the vector embeddings alongside metadata (source file, page number, timestamp) in an index optimized for nearest-neighbor search (e.g., Qdrant, Pinecone, Milvus, PostgreSQL with `pgvector`).

---

### 2. Online Retrieval & Generation Pipeline (Answering Questions)

1. **Query Embedding:** When a user asks *"What is the refund policy for enterprise plans?"*, the query is converted into a vector using the exact same embedding model.
2. **Vector Similarity Search:** The vector database calculates mathematical distance between the query vector and millions of indexed chunk vectors using **Cosine Similarity**:
   $$\text{Cosine Similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
   The Top-$K$ closest chunks (e.g., $K=3$) are retrieved.
3. **Context Augmentation:** A prompt is synthesized injecting the retrieved snippets:
   ```text
   SYSTEM: You are a helpful assistant. Answer the user's question using ONLY the provided context. If the answer is not in the context, say "I don't know."
   
   CONTEXT:
   [Chunk 1: Enterprise refund terms...]
   [Chunk 2: SLA reimbursement rules...]
   
   USER QUESTION: What is the refund policy for enterprise plans?
   ```
4. **LLM Generation:** The model generates a 100% grounded response complete with source citations, eliminating hallucinations.

---

## The Evolution of RAG: Naive ➔ Advanced ➔ Agentic

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Naive RAG     │  ──▶  │  Advanced RAG   │  ──▶  │   Agentic RAG   │
│ Embed ➔ Top-K   │       │ Pre/Post Rerank │       │ Multi-Hop Loops │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

| Phase | Architecture | Key Techniques | Drawbacks Solved |
|---|---|---|---|
| **1. Naive RAG** | Direct Top-$K$ semantic search | Fixed chunking + Cosine Top-K | Baseline setup, but low precision on domain jargon |
| **2. Advanced RAG** | Pre-Retrieval + Post-Retrieval Pipeline | **HyDE** (Hypothetical Document Embeddings), **Multi-Query Expansion**, **Cross-Encoder Reranking** (Cohere Rerank / BGE Reranker), **Context Compression** | Filters out irrelevant top-k chunks and fixes poor query phrasing |
| **3. Agentic RAG** | Autonomous Multi-Hop Agent Loop | Self-Reflection, Multi-Vector DB Routing, Dynamic Query Reformulation, Tool Fallback (Web search / SQL) | Handles complex multi-step research questions that require multi-source synthesis |

---

## RAG vs. Fine-Tuning: The Definitive Mental Model

| Dimension | Retrieval-Augmented Generation (RAG) | Model Fine-Tuning |
|---|---|---|
| **Analogy** | **Open-book exam** (looking up facts in real time) | **Medical school** (learning tone, vocabulary, style) |
| **Primary Purpose** | Injecting **new facts, knowledge, and private data** | Teaching **specific behavior, output formats, and styles** |
| **Data Freshness** | Instant (update vector DB without retraining) | Static (requires retraining for new knowledge) |
| **Hallucination Risk** | Near Zero (grounded in retrieved context) | High (model can still fabricate facts) |
| **Cost & Compute** | Low (Vector DB + standard API tokens) | High (GPU compute clusters for model training) |
| **Source Citations** | ✅ Yes (points to exact document / page) | ❌ No (black-box weights) |

> **Rule of Thumb:** Use **RAG** when you want the model to know *what to say* (facts). Use **Fine-Tuning** when you want the model to know *how to say it* (custom JSON syntax, medical nomenclature, specific brand voice).

---

## Production Python Implementation (LangChain + Qdrant)

```python
import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Qdrant
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# 1. Load and chunk documents
loader = TextLoader("company_policies.md")
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", " ", ""]
)
chunks = text_splitter.split_documents(docs)

# 2. Embed and index into Qdrant Vector Store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = Qdrant.from_documents(
    chunks,
    embeddings,
    location=":memory:",  # Or url="http://localhost:6333"
    collection_name="knowledge_base"
)
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# 3. Create RAG generation prompt & chain
system_prompt = (
    "You are a strict technical assistant. Use the following pieces of "
    "retrieved context to answer the question. If you don't know the answer, "
    "state that you don't know.\n\n"
    "Context:\n{context}"
)
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)

# 4. Execute query
response = rag_chain.invoke({"input": "What is the policy for expense reimbursement?"})
print("Answer:", response["answer"])
```

---

## Senior Interview Q&A on RAG

### Q1: What is the "Lost in the Middle" phenomenon in RAG?
**Senior Answer:**
> *"Research has demonstrated that LLMs are best at recalling information placed at the very beginning and very end of their context window. When 10–20 chunks are retrieved, critical facts located in middle chunks are frequently overlooked by the attention mechanism. To solve this, Advanced RAG uses **Cross-Encoder Re-rankers** to filter down to the top 3–5 highest-density chunks and sorts the most relevant chunks to the outer edges of the prompt."*

### Q2: Why is Hybrid Search (BM25 + Dense Vectors) preferred over Pure Vector Search?
**Senior Answer:**
> *"Dense vector embeddings excel at capturing semantic intent (e.g. understanding that 'car' is related to 'automobile'). However, they struggle with exact keyword matches such as error codes (e.g. `ERR_502_BAD_GATEWAY`), SKU numbers, or specific function names. Hybrid search combines **BM25 keyword search** (for exact tokens) with **Dense Vector Search** (for conceptual meaning) using Reciprocal Rank Fusion (RRF) to get the best of both worlds."*
