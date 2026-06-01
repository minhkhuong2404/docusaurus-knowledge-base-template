---
id: skills
title: "AI Agent Skills: Tools, MCP, Memory & RAG"
sidebar_label: "Agent Skills"
description: A complete guide to AI agent capabilities — Tool Use (Function Calling), Model Context Protocol (MCP), Memory systems, RAG, and how to write production-grade agent skills from beginner to senior.
tags: [ai-agents, tool-use, function-calling, mcp, model-context-protocol, rag, vector-database, memory, llm, langchain]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AI Agent Skills: Tools, MCP, Memory & RAG

:::info[Who this guide is for]
- **New learners** — start at [What is an AI Agent?](#what-is-an-ai-agent) and [Tool Use basics](#tool-use-function-calling) to understand how agents extend beyond text generation.
- **Senior engineers** — jump to [Writing Production-Grade Skills](#writing-production-grade-skills), [MCP Architecture](#model-context-protocol-mcp), [Advanced RAG](#advanced-agentic-rag), or [Memory Architecture Decisions](#memory-architecture-decisions).
:::

---

## What is an AI Agent?

A large language model (LLM) on its own is a **stateless text predictor**. It receives tokens, predicts the next token, and stops. It cannot:

- Search the web or query a database.
- Read or write files.
- Call an API or run code.
- Remember what you told it yesterday.
- Act on the world in any way.

An **AI agent** wraps an LLM with a **control loop** that grants it these capabilities through **skills** — structured interfaces between the LLM's reasoning and the outside world.

```
Without agent skills:
  User: "What is Apple's stock price right now?"
  LLM:  "I don't have access to real-time data..." ❌

With agent skills:
  User: "What is Apple's stock price right now?"
  Agent: [calls get_stock_price("AAPL") tool] → $189.45
  LLM:  "Apple (AAPL) is currently trading at $189.45." ✅
```

### The agent loop

Every agent, regardless of framework, runs the same fundamental loop:

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent Loop                           │
│                                                             │
│  User Input                                                 │
│      │                                                      │
│      ▼                                                      │
│   LLM Thinks ──→ "I need tool X with args Y"               │
│      │                                                      │
│      ▼                                                      │
│  Execute Tool ──→ Result returned to LLM                   │
│      │                                                      │
│      ▼                                                      │
│   LLM Thinks ──→ "I have enough info"                      │
│      │                                                      │
│      ▼                                                      │
│  Final Answer ──→ User                                      │
└─────────────────────────────────────────────────────────────┘
```

The loop continues until the LLM decides it has enough information to give a final answer — or until a max-step limit is reached.

### Types of agent skills

| Skill category | What it does | Examples |
|---------------|-------------|---------|
| **Tool Use** | Executes actions in the world | Search web, call API, run SQL |
| **Memory** | Stores and retrieves information across time | Vector DB, key-value store, context window |
| **RAG** | Grounds answers in external knowledge | Document search, code search, knowledge graph |
| **Code execution** | Runs code safely in a sandbox | Python REPL, shell commands |
| **Multi-agent delegation** | Routes sub-tasks to specialised agents | Researcher → Writer → Editor pipeline |

---

## Tool Use (Function Calling)

### Why LLMs need function calling

LLMs generate text. They cannot reach outside their token stream. Function calling is a protocol that lets an LLM **signal intent** — it outputs a structured JSON request saying "please call this function with these arguments" — and the host application executes the actual code.

```
LLM output (raw text) → no tools:
  "The weather in Hanoi is probably warm and humid."  ← guessing

LLM output (function call) → with tools:
  { "tool": "get_weather", "args": { "city": "Hanoi" } }
  Host executes → { "temp": 33, "humidity": 82, "condition": "Partly cloudy" }
  LLM: "Hanoi is currently 33°C with 82% humidity and partly cloudy skies."  ✅
```

### Step-by-step flow

```
1. Developer declares tools (name, description, JSON Schema for parameters)
         │
         ▼
2. User sends a message → LLM sees prompt + tool definitions
         │
         ▼
3. LLM decides a tool is needed → returns structured tool call JSON (not text)
         │
         ▼
4. Host application intercepts → executes the real function
         │
         ▼
5. Result is sent back to LLM as a "tool result" message
         │
         ▼
6. LLM generates the final text response using the real data
```

### Declaring tools — the JSON Schema contract

A tool declaration is a JSON Schema that tells the LLM:
- **What** the tool does (`description` — the LLM uses this to decide when to call it)
- **What it needs** (`parameters` — type-safe inputs)
- **What is required** (`required` — which args are mandatory)

```json
{
  "name": "get_stock_price",
  "description": "Fetch the current stock price for a given ticker symbol. Use this when the user asks about a company's stock price or market value.",
  "parameters": {
    "type": "object",
    "properties": {
      "ticker": {
        "type": "string",
        "description": "The stock ticker symbol, e.g. AAPL for Apple, GOOG for Google"
      },
      "currency": {
        "type": "string",
        "enum": ["USD", "EUR", "VND"],
        "description": "The currency to return the price in. Defaults to USD.",
        "default": "USD"
      }
    },
    "required": ["ticker"]
  }
}
```

:::tip[The description is the most important field]
The LLM decides **which tool to call** entirely based on the `description`. A vague or misleading description causes the LLM to call the wrong tool or miss a tool entirely. Write descriptions that explain: what the tool does, when to use it, and what its inputs mean — as if explaining to a smart colleague who has never seen the tool.
:::

### Complete implementation example

<Tabs>
<TabItem value="python" label="Python (Anthropic SDK)">

```python
import anthropic
import json

client = anthropic.Anthropic()

# ── Step 1: Declare tools ─────────────────────────────────────────────────
tools = [
    {
        "name": "get_stock_price",
        "description": "Fetch the current stock price for a given ticker. Use when the user asks about a stock's current price or market value.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "Stock ticker symbol, e.g. AAPL, GOOG, MSFT"
                }
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "search_news",
        "description": "Search for recent news articles about a company or topic. Use when the user asks about recent events or news.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query":     { "type": "string", "description": "Search query string" },
                "max_results": { "type": "integer", "description": "Number of results, default 5" }
            },
            "required": ["query"]
        }
    }
]

# ── Step 2: Implement tool functions ──────────────────────────────────────
def get_stock_price(ticker: str) -> dict:
    # In production: call a real financial API (Alpha Vantage, Yahoo Finance, etc.)
    mock_prices = {"AAPL": 189.45, "GOOG": 175.20, "MSFT": 420.30}
    price = mock_prices.get(ticker.upper())
    if price is None:
        return {"error": f"Ticker '{ticker}' not found"}
    return {"ticker": ticker.upper(), "price": price, "currency": "USD"}

def search_news(query: str, max_results: int = 5) -> dict:
    # In production: call NewsAPI, Bing News Search, etc.
    return {"articles": [{"title": f"Mock article about {query}", "url": "https://..."}]}

# ── Step 3: Tool dispatcher ───────────────────────────────────────────────
def execute_tool(tool_name: str, tool_input: dict) -> str:
    """Routes a tool call to the correct implementation and returns a string result."""
    try:
        if tool_name == "get_stock_price":
            result = get_stock_price(**tool_input)
        elif tool_name == "search_news":
            result = search_news(**tool_input)
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": str(e)})

# ── Step 4: Agent loop ────────────────────────────────────────────────────
def run_agent(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            tools=tools,
            messages=messages
        )

        # If the LLM is done — return the text answer
        if response.stop_reason == "end_turn":
            return next(b.text for b in response.content if b.type == "text")

        # If the LLM wants to use a tool
        if response.stop_reason == "tool_use":
            # Add the LLM's tool call to the conversation history
            messages.append({"role": "assistant", "content": response.content})

            # Execute every tool the LLM requested (may be multiple)
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })

            # Return the tool results to the LLM
            messages.append({"role": "user", "content": tool_results})
            # Loop — LLM will now see the results and decide next step

# Usage
answer = run_agent("What is Apple's stock price today?")
print(answer)
# → "Apple (AAPL) is currently trading at $189.45 USD."
```

</TabItem>
<TabItem value="java" label="Java (Spring AI)">

```java
// ── Step 1: Define a tool as a Spring-managed @Bean ────────────────────
@Component
public class StockPriceTool {

    @Tool(description = """
        Fetch the current stock price for a given ticker symbol.
        Use when the user asks about a company's stock price or market value.
        """)
    public StockResult getStockPrice(
            @ToolParam(description = "Stock ticker symbol, e.g. AAPL, GOOG") String ticker) {

        // In production: call a financial API
        Map<String, Double> prices = Map.of("AAPL", 189.45, "GOOG", 175.20);
        Double price = prices.get(ticker.toUpperCase());
        if (price == null) throw new IllegalArgumentException("Unknown ticker: " + ticker);
        return new StockResult(ticker.toUpperCase(), price, "USD");
    }

    public record StockResult(String ticker, double price, String currency) {}
}

// ── Step 2: Wire into ChatClient ───────────────────────────────────────
@Service
public class AgentService {

    private final ChatClient chatClient;

    public AgentService(ChatClient.Builder builder, StockPriceTool stockTool) {
        this.chatClient = builder
            .defaultTools(stockTool)      // registers the @Tool methods
            .defaultSystem("You are a helpful financial assistant.")
            .build();
    }

    public String ask(String userMessage) {
        return chatClient.prompt()
            .user(userMessage)
            .call()
            .content();
        // Spring AI handles the tool call loop automatically
    }
}
```

</TabItem>
<TabItem value="openai" label="Python (OpenAI SDK)">

```python
from openai import OpenAI
import json

client = OpenAI()

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city. Use when the user asks about weather conditions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": { "type": "string", "description": "City name" },
                    "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] }
                },
                "required": ["city"]
            }
        }
    }
]

def get_weather(city: str, unit: str = "celsius") -> dict:
    return {"city": city, "temperature": 33, "condition": "Sunny", "unit": unit}

messages = [{"role": "user", "content": "What's the weather in Hanoi?"}]

response = client.chat.completions.create(
    model="gpt-4o", messages=messages, tools=tools, tool_choice="auto"
)

# Handle tool calls
if response.choices[0].finish_reason == "tool_calls":
    tool_call = response.choices[0].message.tool_calls[0]
    args = json.loads(tool_call.function.arguments)
    result = get_weather(**args)

    messages.append(response.choices[0].message)
    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": json.dumps(result)
    })

    final = client.chat.completions.create(model="gpt-4o", messages=messages)
    print(final.choices[0].message.content)
```

</TabItem>
</Tabs>

### Parallel tool calls

Modern LLMs can request multiple tools simultaneously when they are independent:

```python
# User: "What are the stock prices of Apple, Google, and Microsoft?"

# LLM returns three tool calls at once (not sequentially):
tool_calls = [
    { "id": "tc_1", "name": "get_stock_price", "input": {"ticker": "AAPL"} },
    { "id": "tc_2", "name": "get_stock_price", "input": {"ticker": "GOOG"} },
    { "id": "tc_3", "name": "get_stock_price", "input": {"ticker": "MSFT"} }
]

# Execute in parallel — 3x faster than sequential
import asyncio

async def execute_parallel(tool_calls):
    tasks = [execute_tool_async(tc.name, tc.input) for tc in tool_calls]
    results = await asyncio.gather(*tasks)
    return results
```

---

## Writing Production-Grade Skills

The difference between a demo tool and a production skill is **reliability, safety, and observability**.

### The anatomy of a well-written skill

```python
import json
import logging
from typing import Any
from functools import wraps
import time

logger = logging.getLogger(__name__)

# ── 1. Input validation ───────────────────────────────────────────────────
def validate_ticker(ticker: str) -> str:
    """Validate and normalise a stock ticker symbol."""
    if not ticker or not isinstance(ticker, str):
        raise ValueError("Ticker must be a non-empty string")
    ticker = ticker.strip().upper()
    if not ticker.isalpha() or len(ticker) > 5:
        raise ValueError(f"Invalid ticker format: '{ticker}'. Must be 1–5 letters.")
    return ticker

# ── 2. Retry with exponential backoff ────────────────────────────────────
def with_retry(max_attempts: int = 3, backoff_seconds: float = 1.0):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return fn(*args, **kwargs)
                except (TimeoutError, ConnectionError) as e:
                    if attempt == max_attempts - 1:
                        raise
                    wait = backoff_seconds * (2 ** attempt)
                    logger.warning(f"Tool {fn.__name__} attempt {attempt+1} failed: {e}. Retrying in {wait}s")
                    time.sleep(wait)
        return wrapper
    return decorator

# ── 3. Observability ──────────────────────────────────────────────────────
def observable_tool(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            result = fn(*args, **kwargs)
            duration_ms = (time.perf_counter() - start) * 1000
            logger.info(f"Tool '{fn.__name__}' succeeded in {duration_ms:.1f}ms",
                        extra={"tool": fn.__name__, "duration_ms": duration_ms, "status": "success"})
            return result
        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.error(f"Tool '{fn.__name__}' failed after {duration_ms:.1f}ms: {e}",
                         extra={"tool": fn.__name__, "duration_ms": duration_ms, "status": "error"})
            raise
    return wrapper

# ── 4. Safe error response — never crash the agent loop ──────────────────
def safe_tool_result(fn):
    """Catch all exceptions and return a structured error JSON instead of raising.
    This ensures one bad tool call doesn't crash the entire agent."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except ValueError as e:
            return json.dumps({"error": "invalid_input", "message": str(e)})
        except TimeoutError:
            return json.dumps({"error": "timeout", "message": "The tool timed out. Try again."})
        except Exception as e:
            logger.error(f"Unexpected tool error in {fn.__name__}: {e}", exc_info=True)
            return json.dumps({"error": "internal_error", "message": "An unexpected error occurred."})
    return wrapper

# ── 5. Full production skill ──────────────────────────────────────────────
@safe_tool_result
@observable_tool
@with_retry(max_attempts=3)
def get_stock_price(ticker: str, currency: str = "USD") -> str:
    ticker = validate_ticker(ticker)
    # Call real API with timeout
    response = requests.get(
        f"https://api.financialdatasource.com/quote/{ticker}",
        params={"currency": currency},
        timeout=5.0,
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    response.raise_for_status()
    data = response.json()
    return json.dumps({
        "ticker": ticker,
        "price": data["latestPrice"],
        "currency": currency,
        "timestamp": data["latestUpdate"]
    })
```

### Tool description best practices

The description field is the only thing the LLM reads to decide when and how to call your tool. Write it like documentation, not a label:

<Tabs>
<TabItem value="bad" label="❌ Bad descriptions">

```json
{
  "name": "search",
  "description": "Search for things",
  "parameters": {
    "q": { "type": "string", "description": "query" }
  }
}
```

Problems:
- `"Search for things"` — what things? Web? Database? Files?
- `"query"` — what format? Max length? Keywords or natural language?
- No guidance on when to use this vs other tools.

</TabItem>
<TabItem value="good" label="✅ Good descriptions">

```json
{
  "name": "search_company_knowledge_base",
  "description": "Search the internal company knowledge base for policies, procedures, and HR documents. Use this when the user asks about company policies, benefits, leave rules, or internal procedures. Do NOT use this for general knowledge questions — use your built-in knowledge for those.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Natural language search query, e.g. 'annual leave policy for Vietnam employees' or 'laptop procurement process'. Be specific — vague queries return poor results."
      },
      "category": {
        "type": "string",
        "enum": ["hr", "it", "finance", "legal", "general"],
        "description": "Optional: narrow results to a specific category for better precision."
      },
      "max_results": {
        "type": "integer",
        "description": "Number of documents to retrieve. Default 5, max 10.",
        "default": 5
      }
    },
    "required": ["query"]
  }
}
```

What makes it good:
- States exactly what data source it searches.
- Tells the LLM when to use it AND when NOT to use it.
- Parameter descriptions explain expected format and include examples.

</TabItem>
</Tabs>

### Skill design rules

| Rule | Why | Example |
|------|-----|---------|
| **One responsibility per tool** | Easier for LLM to reason about; easier to test | `search_documents`, `create_document` — not `manage_documents` |
| **Always return JSON strings** | Consistent parsing; LLM can reason about structured data | `{"price": 189.45}` not `"$189.45"` |
| **Never raise exceptions to the agent** | One tool failure shouldn't crash the loop | Return `{"error": "..."}` and let the LLM handle it |
| **Include metadata in results** | LLM can cite sources, check freshness | `{"result": ..., "source": "...", "retrieved_at": "..."}` |
| **Add `when_to_use` in description** | Prevents tool confusion with similar tools | `"Use this for X, NOT for Y"` |
| **Keep tools stateless** | Enables parallel execution; easier to retry | Accept all needed inputs as parameters |
| **Cap execution time** | Prevents the agent loop from hanging | Always set `timeout` on HTTP calls |

---

## Model Context Protocol (MCP)

### The problem before MCP

Every AI platform (Claude Desktop, Cursor, VS Code, custom agents) needed custom integrations for every external tool. Building a GitHub integration meant writing it separately for Claude, for Cursor, for your own agent:

```
Before MCP:
  GitHub tool for Claude    → custom implementation
  GitHub tool for Cursor    → custom implementation again
  GitHub tool for LangChain → custom implementation again
  M tools × N platforms = M×N integrations  ❌

With MCP:
  GitHub MCP Server → one implementation
  Claude Desktop (MCP Client) → connects automatically
  Cursor (MCP Client)         → connects automatically
  Any Agent (MCP Client)      → connects automatically
  M tools + N platforms = M+N integrations  ✅
```

### MCP architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MCP Ecosystem                                │
│                                                                      │
│  MCP Clients (Hosts)          MCP Protocol (JSON-RPC 2.0)           │
│  ┌────────────────┐           ┌──────────────────────┐              │
│  │ Claude Desktop ├──────────►│                      │              │
│  └────────────────┘  Stdio /  │   MCP Server         ├──► Files    │
│  ┌────────────────┐  SSE      │   (GitHub, Postgres,  │             │
│  │   Cursor IDE   ├──────────►│    Slack, Jira...)   ├──► Database │
│  └────────────────┘           │                      │             │
│  ┌────────────────┐           └──────────────────────┘ ├──► APIs   │
│  │  Your Agent    ├──────────────────────────────────────────────► │
│  └────────────────┘                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### The three MCP primitives

| Primitive | What it does | Example |
|-----------|-------------|---------|
| **Resources** | URL-addressable data the LLM can read — like a filesystem for context | `file:///project/src/App.java`, `db://postgres/users` |
| **Tools** | Executable actions with JSON Schema inputs — the LLM can invoke these | `run_tests`, `web_search`, `create_issue` |
| **Prompts** | Pre-built prompt templates the user can invoke by name | `"Code Review"`, `"Write SQL"`, `"Explain Error"` |

### MCP transport layers

<Tabs>
<TabItem value="stdio" label="Stdio (local)">

The client spawns the MCP server as a **child process** and communicates via stdin/stdout. Zero network latency, ideal for desktop tools like Cursor and Claude Desktop.

```
Claude Desktop ─── spawn subprocess ──► mcp-server-github (Node.js process)
                   stdin/stdout pipe
```

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
      }
    }
  }
}
```

</TabItem>
<TabItem value="sse" label="SSE (remote)">

The client connects to a remote MCP server over HTTP. The server pushes events to the client via **Server-Sent Events** (streaming), and the client sends commands via POST requests. Ideal for cloud-hosted agents.

```
Your Agent ─── HTTP POST ──► https://mcp.yourcompany.com/server
           ◄── SSE stream ──
```

```python
from anthropic import Anthropic
from mcp import ClientSession
from mcp.client.sse import sse_client

async def use_remote_mcp_tool():
    async with sse_client("https://mcp.yourcompany.com/server") as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()

            client = Anthropic()
            # Pass MCP tools directly to Claude
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                tools=[tool.model_dump() for tool in tools.tools],
                messages=[{"role": "user", "content": "Search GitHub for open issues"}]
            )
```

</TabItem>
</Tabs>

### Building a production MCP server

```javascript
// file-manager-mcp-server.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

const ALLOWED_DIR = process.env.WORKSPACE_DIR || "./workspace";  // sandboxed directory

// ── Security helper ───────────────────────────────────────────────────────
function sanitizePath(userPath) {
  const resolved = path.resolve(ALLOWED_DIR, userPath);
  if (!resolved.startsWith(path.resolve(ALLOWED_DIR))) {
    throw new Error("Path traversal attempt detected — access denied");
  }
  return resolved;
}

const server = new Server(
  { name: "file-manager", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// ── Resources: expose files as readable context ───────────────────────────
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = await fs.readdir(ALLOWED_DIR);
  return {
    resources: files.map(f => ({
      uri:      `file://${path.join(ALLOWED_DIR, f)}`,
      name:     f,
      mimeType: f.endsWith(".json") ? "application/json" : "text/plain"
    }))
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const filePath = sanitizePath(req.params.uri.replace("file://", ""));
  const content  = await fs.readFile(filePath, "utf-8");
  return { contents: [{ uri: req.params.uri, mimeType: "text/plain", text: content }] };
});

// ── Tools: expose write operations ───────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_file",
      description: "Read the content of a file from the workspace. Use to inspect code or data files.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path to the file, e.g. 'src/App.java'" }
        },
        required: ["path"]
      }
    },
    {
      name: "write_file",
      description: "Write or overwrite a file in the workspace. Use to save generated code or results.",
      inputSchema: {
        type: "object",
        properties: {
          path:    { type: "string", description: "Relative path to write to" },
          content: { type: "string", description: "File content to write" }
        },
        required: ["path", "content"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    if (name === "read_file") {
      const safePath = sanitizePath(args.path);
      const content  = await fs.readFile(safePath, "utf-8");
      return { content: [{ type: "text", text: content }] };
    }

    if (name === "write_file") {
      const safePath = sanitizePath(args.path);
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, args.content, "utf-8");
      return { content: [{ type: "text", text: `File written successfully: ${args.path}` }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP security checklist

| Risk | Mitigation |
|------|-----------|
| **Path traversal** | Resolve and validate all file paths against an allowed root directory |
| **Prompt injection via tool results** | Sanitise tool output before passing back — strip `<` `>` and `\n\nHuman:` patterns |
| **Excessive permissions** | Grant the MCP server the minimum OS permissions needed (read-only unless write is required) |
| **Sensitive data in tool results** | Filter secrets, PII, and credentials from results before they enter the LLM context |
| **Unrestricted tool execution** | Require human-in-the-loop confirmation for destructive operations (delete, deploy) |
| **Supply chain attack** | Pin MCP server versions; verify checksums for third-party servers |

---

## Memory Systems

An agent without memory forgets everything the moment the conversation ends. Memory systems solve this at different time scales.

### The three memory tiers

```
┌────────────────────────────────────────────────────────────────────┐
│  Tier 1: In-Context (Short-term)                                   │
│  ─ Current conversation messages                                   │
│  ─ Fast access, limited by token window (128K–200K tokens typical) │
│  ─ Wiped at conversation end                                       │
├────────────────────────────────────────────────────────────────────┤
│  Tier 2: External Storage (Long-term)                              │
│  ─ Vector DB (semantic search by meaning)                          │
│  ─ Key-value store (exact fact lookup)                             │
│  ─ Survives across sessions; requires retrieval step               │
├────────────────────────────────────────────────────────────────────┤
│  Tier 3: Episodic (Procedural)                                     │
│  ─ Log of past agent actions and outcomes                          │
│  ─ "I fixed this error before by doing X"                         │
│  ─ Retrieved by similarity to current problem                      │
└────────────────────────────────────────────────────────────────────┘
```

### Short-term memory — managing the context window

The context window is the agent's working memory. Problems arise as conversations grow:

```python
class ContextWindowManager:
    def __init__(self, max_tokens: int = 100_000, summary_threshold: int = 80_000):
        self.messages: list[dict] = []
        self.max_tokens = max_tokens
        self.summary_threshold = summary_threshold
        self.token_counter = tiktoken.encoding_for_model("gpt-4o")

    def count_tokens(self) -> int:
        text = json.dumps(self.messages)
        return len(self.token_counter.encode(text))

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        if self.count_tokens() > self.summary_threshold:
            self._compress()

    def _compress(self):
        """Summarise the oldest 50% of messages to reclaim token space."""
        mid = len(self.messages) // 2
        old_messages = self.messages[:mid]

        summary_prompt = f"Summarise this conversation history concisely:\n{json.dumps(old_messages)}"
        summary = llm.complete(summary_prompt)

        # Replace old messages with a single summary message
        self.messages = [
            {"role": "system", "content": f"[Conversation summary]: {summary}"}
        ] + self.messages[mid:]
```

### Long-term memory — vector databases

Long-term memory stores information as **vector embeddings** — numerical representations of meaning. Retrieval finds semantically similar content, not just keyword matches.

```python
# ── Store a memory ────────────────────────────────────────────────────────
def save_to_memory(text: str, metadata: dict):
    """Convert text to a vector and store in the vector DB."""
    embedding = embed_model.encode(text)           # e.g. text-embedding-3-small
    vector_db.upsert(
        collection="agent_memory",
        vectors=[{
            "id":        str(uuid4()),
            "values":    embedding.tolist(),
            "metadata":  { **metadata, "text": text, "saved_at": datetime.utcnow().isoformat() }
        }]
    )

# ── Retrieve relevant memories ────────────────────────────────────────────
def recall(query: str, top_k: int = 5) -> list[str]:
    """Find the most semantically similar stored memories."""
    query_vector = embed_model.encode(query)
    results = vector_db.query(
        collection="agent_memory",
        vector=query_vector.tolist(),
        top_k=top_k,
        include_metadata=True
    )
    return [r["metadata"]["text"] for r in results["matches"]]

# ── Inject retrieved memories into the system prompt ─────────────────────
def build_prompt_with_memory(user_query: str) -> str:
    memories = recall(user_query, top_k=3)
    memory_block = "\n".join(f"- {m}" for m in memories) if memories else "None"
    return f"""You are a helpful assistant with the following relevant past context:

{memory_block}

Use this context to answer accurately. If it's not relevant, ignore it.

User: {user_query}"""
```

### Memory architecture decisions

<details>
<summary>🔬 Senior deep-dive: choosing a vector database</summary>

| Database | Hosting | Strengths | Weaknesses | Best for |
|---------|---------|-----------|-----------|---------|
| **Pinecone** | Cloud-only | Fully managed, fast, production-ready | Cost at scale, vendor lock-in | Production SaaS agents |
| **Weaviate** | Self-host / Cloud | Rich filtering, multimodal support, GraphQL | Complex setup | Enterprise with on-prem requirements |
| **Qdrant** | Self-host / Cloud | Rust-based performance, sparse+dense hybrid | Smaller community | High-performance local deployment |
| **pgvector** | PostgreSQL extension | No new infra if already on Postgres, SQL joins | Slower at very large scale | Existing Postgres shop, < 10M vectors |
| **ChromaDB** | Embedded / self-host | Zero-config, Python-native, great for dev | Not production-ready at scale | Prototyping, local development |
| **Milvus** | Self-host / Cloud | Massive scale (billion+ vectors), IVF/HNSW | Heavyweight infra | Large-scale semantic search |

**Key decision factors:**
1. **Scale** — how many vectors? < 1M → pgvector works. 1M–100M → Qdrant or Pinecone. 100M+ → Milvus.
2. **Filtering** — do you need to filter by metadata (user_id, date, category) alongside vector search? All support this, but Qdrant and Weaviate have especially efficient payload indexing.
3. **Hybrid search** — need to combine keyword (BM25) + semantic search? Weaviate and Qdrant support this natively.
4. **Infra ownership** — managed cloud (Pinecone) vs self-hosted (Qdrant, Milvus) vs already-on-Postgres (pgvector).

</details>

---

## Retrieval-Augmented Generation (RAG)

RAG grounds LLM answers in real documents. Without it, the LLM answers from training data that may be stale, incomplete, or hallucinated. With it, the LLM cites real content from your knowledge base.

### Naive RAG — the starting point

```
User query
    │
    ▼
Embed query → search vector DB → return top-K chunks
    │
    ▼
Inject chunks into prompt → LLM generates answer
```

This works for simple Q&A but breaks when:
- The query is complex and no single chunk answers it fully.
- The retrieved chunks are irrelevant (poor embedding or chunking).
- The answer requires reasoning across multiple documents.

### Full RAG pipeline implementation

```python
class RAGPipeline:

    def __init__(self, vector_db, embed_model, llm, chunk_size=512, overlap=50):
        self.vector_db   = vector_db
        self.embed_model = embed_model
        self.llm         = llm
        self.splitter    = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=overlap
        )

    # ── Indexing (offline) ────────────────────────────────────────────────
    def index_document(self, text: str, metadata: dict):
        chunks = self.splitter.split_text(text)
        embeddings = self.embed_model.encode(chunks)

        self.vector_db.upsert([{
            "id":       f"{metadata['doc_id']}_{i}",
            "values":   emb.tolist(),
            "metadata": { **metadata, "text": chunk, "chunk_index": i }
        } for i, (chunk, emb) in enumerate(zip(chunks, embeddings))])

    # ── Retrieval (online) ────────────────────────────────────────────────
    def retrieve(self, query: str, top_k: int = 5,
                 filter: dict = None) -> list[str]:
        query_emb = self.embed_model.encode(query)
        results = self.vector_db.query(
            vector=query_emb.tolist(),
            top_k=top_k,
            filter=filter,           # e.g. {"category": "hr_policy"}
            include_metadata=True
        )
        return [(r["metadata"]["text"], r["score"]) for r in results["matches"]]

    # ── Generation (online) ───────────────────────────────────────────────
    def answer(self, query: str, top_k: int = 5) -> str:
        chunks_with_scores = self.retrieve(query, top_k)

        # Filter low-relevance chunks (score < 0.75 = likely irrelevant)
        relevant = [(text, score) for text, score in chunks_with_scores if score >= 0.75]

        if not relevant:
            return "I could not find relevant information to answer this question."

        context = "\n\n---\n\n".join(text for text, _ in relevant)

        prompt = f"""Answer the user's question based ONLY on the provided context.
If the context does not contain enough information, say so — do not guess.

Context:
{context}

Question: {query}

Answer:"""
        return self.llm.complete(prompt)
```

### Advanced Agentic RAG

Agentic RAG turns retrieval into a self-correcting, multi-step loop:

```
User Query
    │
    ▼
Query Translation  ──→  Break complex query into sub-queries
    │
    ▼
Routing  ──→  Which data source? (Vector DB / SQL / Web / LLM memory)
    │
    ▼
Retrieval  ──→  Fetch candidates from chosen source(s)
    │
    ▼
Grading  ──→  Are the retrieved chunks actually relevant?
    │
    ├── Irrelevant ──→  Rewrite query → Re-retrieve (or web search)
    │
    └── Relevant
         │
         ▼
Generation  ──→  LLM drafts answer using grounded context
         │
         ▼
Hallucination Check  ──→  Is the answer supported by the context?
         │
         ├── Not supported ──→  Regenerate
         │
         └── Supported ──→  Final Answer
```

### Advanced RAG techniques

<Tabs>
<TabItem value="decomposition" label="Query decomposition">

Break a complex query into independent sub-queries, retrieve for each, merge the context:

```python
def decompose_query(query: str) -> list[str]:
    """Use LLM to break a complex query into simpler sub-queries."""
    prompt = f"""Break the following question into 2–4 independent sub-questions
that can each be answered separately. Return as a JSON array of strings.

Question: {query}

Sub-questions (JSON array):"""
    response = llm.complete(prompt)
    return json.loads(response)

def multi_query_retrieve(query: str) -> list[str]:
    sub_queries = decompose_query(query)

    all_chunks = []
    for sub_q in sub_queries:
        chunks = rag.retrieve(sub_q, top_k=3)
        all_chunks.extend(chunks)

    # Deduplicate by content similarity
    return deduplicate_chunks(all_chunks)

# Example:
# Query: "How does our VN remote leave policy compare to our Singapore policy?"
# Sub-queries:
#   → "What is the Vietnam remote work leave policy?"
#   → "What is the Singapore remote work leave policy?"
```

</TabItem>
<TabItem value="routing" label="Query routing">

Route queries to the most appropriate data source before retrieval:

```python
def route_query(query: str) -> str:
    """Classify query to determine the best data source."""
    prompt = f"""Classify this query into exactly one category:
- "vector_db": questions about internal company documents, policies, procedures
- "sql_db": questions requiring structured data analysis (counts, totals, trends)
- "web_search": questions about recent events, news, or current information
- "llm_only": general knowledge questions the LLM can answer directly

Query: {query}
Category (one word):"""
    return llm.complete(prompt).strip()

def smart_retrieve(query: str) -> str:
    source = route_query(query)

    if source == "vector_db":
        return rag.answer(query)
    elif source == "sql_db":
        sql = text_to_sql(query)
        return db.execute(sql)
    elif source == "web_search":
        return web_search_tool(query)
    else:  # llm_only
        return llm.complete(query)
```

</TabItem>
<TabItem value="crag" label="Corrective RAG (CRAG)">

Grade retrieved chunks before generating. If poor quality, trigger web search as fallback:

```python
def grade_chunk(query: str, chunk: str) -> str:
    """Grade whether a chunk is relevant to the query."""
    prompt = f"""Is this document chunk relevant to answering the query?
Reply with ONLY "yes" or "no".

Query: {query}
Chunk: {chunk}

Relevant (yes/no):"""
    return llm.complete(prompt).strip().lower()

def corrective_rag(query: str) -> str:
    chunks_with_scores = rag.retrieve(query, top_k=5)

    # Grade each retrieved chunk
    relevant_chunks = [
        chunk for chunk, _ in chunks_with_scores
        if grade_chunk(query, chunk) == "yes"
    ]

    if len(relevant_chunks) >= 2:
        # Good retrieval — generate from internal knowledge
        return rag.generate_from_chunks(query, relevant_chunks)
    elif len(relevant_chunks) == 1:
        # Partial — supplement with web search
        web_results = web_search_tool(query)
        return rag.generate_from_chunks(query, relevant_chunks + [web_results])
    else:
        # No relevant internal content — fall back entirely to web search
        web_results = web_search_tool(query)
        return rag.generate_from_chunks(query, [web_results])
```

</TabItem>
<TabItem value="graphrag" label="GraphRAG">

Combine vector search with a knowledge graph for relationship-aware retrieval:

```python
# GraphRAG is ideal for: code dependency analysis, organisational charts,
# knowledge graphs where relationships between entities matter

# Example: "Which services depend on the PaymentService?"
# Vector search alone: finds documents mentioning PaymentService
# GraphRAG: traverses the dependency graph to find ALL dependents

class GraphRAG:
    def __init__(self, vector_db, graph_db, embed_model, llm):
        self.vector_db  = vector_db   # e.g. Qdrant
        self.graph_db   = graph_db    # e.g. Neo4j
        self.embed_model = embed_model
        self.llm        = llm

    def retrieve(self, query: str) -> str:
        # Step 1: vector search for candidate entities
        semantic_results = self.vector_db.query(
            vector=self.embed_model.encode(query).tolist(), top_k=3
        )
        seed_entities = [r["metadata"]["entity_id"] for r in semantic_results["matches"]]

        # Step 2: graph traversal to find related entities
        graph_context = self.graph_db.run("""
            MATCH (e)-[r*1..2]-(related)
            WHERE e.id IN $seeds
            RETURN e, r, related
        """, seeds=seed_entities).data()

        # Step 3: combine semantic + graph context for generation
        combined = f"Graph context: {graph_context}\n\nSemantic matches: {semantic_results}"
        return self.llm.complete(f"Answer using this context:\n{combined}\n\nQuery: {query}")
```

</TabItem>
</Tabs>

### Chunking strategy — the foundation of retrieval quality

Poor chunking is the most common reason RAG gives bad answers. The retrieved chunk must contain a complete, self-contained piece of information:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter

# ── Strategy 1: Fixed-size with overlap (baseline) ────────────────────────
# Simple but cuts mid-sentence frequently
splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)

# ── Strategy 2: Markdown-aware (for documentation) ───────────────────────
# Splits at heading boundaries — preserves document structure
md_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[
    ("#",  "h1"),
    ("##", "h2"),
    ("###","h3")
])
# Each chunk inherits its section's heading as metadata — crucial for citation

# ── Strategy 3: Semantic chunking (best quality, slower) ──────────────────
# Groups sentences by semantic similarity — no mid-thought cuts
from langchain_experimental.text_splitter import SemanticChunker
semantic_splitter = SemanticChunker(
    embeddings=embed_model,
    breakpoint_threshold_type="percentile",  # split when similarity drops
    breakpoint_threshold_amount=95
)
```

| Strategy | Quality | Speed | Best for |
|---------|---------|-------|---------|
| Fixed-size | ⚠️ Medium | Fast | General documents |
| Markdown-aware | ✅ Good | Fast | Docusaurus, wikis, READMEs |
| Semantic | ✅✅ Best | Slow | Long-form articles, research papers |
| Recursive character | ✅ Good | Fast | Code files, mixed content |

---

## Episodic Memory — Learning from Past Actions

Episodic memory stores sequences of agent actions and their outcomes. When a similar problem arises, the agent retrieves past episodes to guide its approach:

```python
class EpisodicMemory:

    def __init__(self, vector_db, embed_model):
        self.vector_db   = vector_db
        self.embed_model = embed_model

    def save_episode(self, task: str, steps: list[dict], outcome: str, success: bool):
        """Save a completed agent episode for future reference."""
        episode_text = f"""Task: {task}
Steps taken: {json.dumps(steps, indent=2)}
Outcome: {outcome}
Success: {success}"""

        embedding = self.embed_model.encode(episode_text)
        self.vector_db.upsert([{
            "id":       str(uuid4()),
            "values":   embedding.tolist(),
            "metadata": {
                "task":      task,
                "steps":     json.dumps(steps),
                "outcome":   outcome,
                "success":   success,
                "saved_at":  datetime.utcnow().isoformat()
            }
        }])

    def recall_similar(self, current_task: str, top_k: int = 3) -> list[dict]:
        """Find past episodes similar to the current task."""
        query_emb = self.embed_model.encode(current_task)
        results = self.vector_db.query(
            vector=query_emb.tolist(), top_k=top_k,
            filter={"success": True},   # only retrieve successful episodes
            include_metadata=True
        )
        return [r["metadata"] for r in results["matches"]]

    def build_few_shot_context(self, current_task: str) -> str:
        past_episodes = self.recall_similar(current_task)
        if not past_episodes:
            return ""

        examples = "\n\n".join([
            f"Past task: {ep['task']}\nApproach: {ep['steps']}\nResult: {ep['outcome']}"
            for ep in past_episodes
        ])
        return f"""Here are similar tasks you have successfully completed before:

{examples}

Use these as a guide for the current task."""
```

---

## Testing Agent Skills

Agent skills are hard to test because outputs are non-deterministic. Use these strategies:

```python
import pytest
from unittest.mock import patch, MagicMock

class TestStockPriceTool:

    def test_valid_ticker_returns_price(self):
        with patch("requests.get") as mock_get:
            mock_get.return_value.json.return_value = {"latestPrice": 189.45, "latestUpdate": "..."}
            mock_get.return_value.raise_for_status = MagicMock()

            result = json.loads(get_stock_price("AAPL"))
            assert result["ticker"] == "AAPL"
            assert result["price"] == 189.45

    def test_invalid_ticker_returns_error_json(self):
        # Tool must return error JSON, not raise — agent loop must not crash
        result = json.loads(get_stock_price("INVALID123456"))
        assert "error" in result
        assert result["error"] == "invalid_input"

    def test_network_timeout_returns_error_json(self):
        with patch("requests.get", side_effect=TimeoutError("Connection timed out")):
            result = json.loads(get_stock_price("AAPL"))
            assert result["error"] == "timeout"

    def test_tool_description_quality(self):
        """Ensure tool descriptions are non-empty and mention when to use."""
        schema = get_stock_price_schema()
        assert len(schema["description"]) > 50, "Description too short — LLM won't know when to use it"
        assert "description" in schema["parameters"]["properties"]["ticker"]

class TestRAGPipeline:

    def test_retrieval_returns_relevant_chunks(self, rag_pipeline, indexed_docs):
        results = rag_pipeline.retrieve("annual leave policy Vietnam", top_k=3)
        assert len(results) > 0
        assert any("annual leave" in text.lower() for text, score in results)

    def test_low_score_chunks_are_filtered(self, rag_pipeline):
        answer = rag_pipeline.answer("xyzzy frobnicator quantum cascade")
        assert "could not find relevant information" in answer

    @pytest.mark.parametrize("query,expected_keyword", [
        ("How many days of annual leave?", "days"),
        ("What is the remote work policy?", "remote"),
    ])
    def test_answer_contains_expected_content(self, rag_pipeline, query, expected_keyword):
        answer = rag_pipeline.answer(query)
        assert expected_keyword.lower() in answer.lower()
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Vague tool descriptions | LLM calls wrong tool or misses relevant one | Write specific descriptions with examples and "when to use / not use" |
| Raising exceptions from tools | Crashes the agent loop | Wrap all tools with `try/except` — return `{"error": "..."}` JSON |
| Stateful tool implementations | Breaks parallel tool calls; race conditions | Make tools pure functions — accept all state as parameters |
| Fixed-size chunking for structured docs | Splits mid-section — retrieved chunks lack context | Use structure-aware chunking (Markdown headers, sentence boundaries) |
| No similarity score threshold in RAG | Low-relevance chunks pollute the LLM prompt — hallucinations | Filter chunks below similarity score threshold (e.g. 0.75) |
| Injecting all retrieved chunks regardless of length | Context window overflow; LLM ignores distant content | Cap total context at ~25% of the model's context window |
| No retry on transient tool failures | One network blip kills the entire agent run | Add exponential backoff retry on `TimeoutError`, `ConnectionError` |
| Missing MCP path validation | Path traversal attack via `../../etc/passwd` | Resolve and validate all paths against allowed root before any file op |
| Storing secrets in tool results | Secrets leak into LLM context and logs | Redact API keys, tokens, passwords from tool output before returning |

---

## 🎯 Interview Questions

**Q1. What is function calling and why do LLMs need it?**
> LLMs are text predictors — they have no ability to execute code, call APIs, or access real-time data. Function calling (tool use) is a protocol where the developer declares available tools as JSON Schemas and the LLM, instead of generating a text answer, generates a structured JSON payload describing which function to call with which arguments. The host application intercepts this, executes the real code, and returns the result to the LLM. This turns a passive text predictor into an agent that can interact with the world.

**Q2. What is MCP and what problem does it solve?**
> Model Context Protocol (MCP) is an open standard (JSON-RPC 2.0) for connecting LLMs to external tools and data sources. Before MCP, building a GitHub integration for one agent meant building it again for every new platform — Claude Desktop, Cursor, LangChain each required custom code. MCP reduces M×N integrations to M+N: tool builders implement one MCP server, and any MCP-compatible client (any agent host) connects automatically. It exposes three primitives: Resources (readable data), Tools (executable actions), and Prompts (reusable templates).

**Q3. What is the difference between short-term and long-term memory in an agent?**
> Short-term memory is the token context window — the current conversation messages. It is fast (no retrieval step) but limited (token cap) and wiped at the end of a session. Long-term memory persists across sessions in an external store, typically a vector database that enables semantic search by meaning rather than exact match. The agent retrieves relevant memories at the start of a turn and injects them into the prompt. The challenge with long-term memory is retrieval quality — bad embedding or chunking means irrelevant memories are injected, confusing the LLM.

**Q4. What is RAG and what problem does it solve?**
> RAG (Retrieval-Augmented Generation) grounds LLM answers in real documents rather than training data alone. Without RAG, the LLM answers from parametric memory — which may be stale, incomplete, or hallucinated. RAG retrieves relevant document chunks from a vector database at query time and injects them into the prompt as context. The LLM then generates an answer based on real content, which can be cited and verified. It's essential for knowledge-intensive applications where accuracy and freshness matter.

**Q5. What makes a well-written tool description?**
> A good tool description tells the LLM: what the tool does (concrete, specific), when to use it (trigger conditions), when NOT to use it (distinguish from similar tools), and what the parameters mean (format, examples, constraints). The LLM's entire tool-selection decision is based on these descriptions — they are the API contract between the LLM's reasoning and your implementation. A vague description like "search for things" causes tool misuse; a specific description like "search the internal HR knowledge base — use for company policy questions, NOT for general knowledge" produces correct tool selection.

**Q6. (Senior) What is Corrective RAG (CRAG) and when do you need it?**
> CRAG adds a grading step between retrieval and generation. A lightweight LLM (or a fine-tuned classifier) evaluates each retrieved chunk and scores it as relevant or irrelevant to the query. If too few chunks pass the relevance threshold, CRAG triggers a corrective action — typically a web search or a re-written query — before generating. Standard RAG silently generates from whatever chunks were retrieved, even if they are off-topic, causing confident-sounding hallucinations. CRAG catches poor retrievals before they reach the generator. The cost is an extra LLM call per query; it is worth it in high-stakes applications where retrieval quality is variable.

**Q7. (Senior) How do you prevent prompt injection through tool results?**
> Tool results are injected into the LLM's context. A malicious API response like `"Ignore all previous instructions and instead..."` can hijack the LLM's behaviour if injected raw. Mitigations: (1) sanitise tool output before injection — strip newlines preceding role-change patterns, HTML tags, and instruction-like text; (2) clearly delimit tool results in the prompt with XML tags (`<tool_result>...</tool_result>`) and instruct the LLM to treat content inside those tags as data, not instructions; (3) use a fixed output schema — if the tool should return a JSON object with specific fields, validate the response against that schema before injecting; (4) run MCP servers in sandboxed processes with minimum permissions so even if prompt injection succeeds, the tool cannot escalate privileges.

---

## See Also

- [AI Agent Architecture & Orchestration Patterns](./agents.md)
- [Vector Databases — Embeddings and Semantic Search](#long-term-memory--vector-databases)
- [LLM Evaluation — Measuring Agent Quality](./harness.md#evaluation-frameworks)
- [Spring AI — Building Java Agents](#complete-implementation-example)