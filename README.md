# Engineering Knowledge Base

An internal engineering knowledge base built with [Docusaurus 3.6](https://docusaurus.io/). It provides structured technical documentation covering architecture, backend development, and Kafka patterns.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

### Installation

```sh
npm install
```

### Local Development

```sh
npm start
```

This starts a local dev server at `http://localhost:3000` with hot reload — most changes are reflected live without restarting.

### Production Build

```sh
npm run build
```

Generates static files into the `build/` directory.

### Serve Production Build

```sh
npm run serve
```

Serves the production build locally for testing before deployment.

## Project Structure

```
docs/               # Markdown documentation organized by topic
  architecture/     # Architecture patterns (e.g., microservices)
  backend/          # Backend frameworks (e.g., Spring Boot)
  kafka/            # Kafka and event-driven patterns (e.g., saga pattern)
src/
  components/       # Custom React components (e.g., CodeBlock)
  theme/            # Custom Prism syntax-highlighting theme
docusaurus.config.ts  # Site-wide Docusaurus configuration
sidebars.ts           # Sidebar navigation structure
```

## Adding Documentation

1. Create a `.md` file in the appropriate `docs/<category>/` folder with YAML frontmatter:

   ```markdown
   ---
   title: Your Page Title
   ---
   ```

2. Register the doc in `sidebars.ts` under the matching category:

   ```ts
   { type: 'category', label: 'Category Name', items: ['category/doc-id'] }
   ```

## License

This project is for internal use.
