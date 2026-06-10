---
id: logstash-kibana-integration
title: "Logstash & Kibana: Data Processing and Visualization"
sidebar_label: Logstash & Kibana Integration
description: A practical guide to configuring Logstash pipelines, indexing patterns in Kibana, and setting up a complete ELK stack integration with Spring Boot logs.
tags: [logstash, kibana, pipeline, gelf, logback, docker-compose, spring-boot, json-logs]
---

# Logstash & Kibana: Data Processing and Visualization

While Elasticsearch manages storage and search, **Logstash** and **Kibana** complete the pipeline by processing input logs and visualizing the results. This guide explores their internal architectures and provides a production-ready template to link them to a Spring Boot service.

---

## Logstash Architecture

Logstash operates as an event-driven processing pipeline, structured into three primary stages: **Inputs** → **Filters** → **Outputs**.

```
                ┌────────────────────────┐
                │        INPUTS          │  ◄── Beats, TCP/UDP, Kafka, HTTP
                └──────────┬─────────────┘
                           │
                 [Persistent Queue (PQ)]    ◄── Prevents data loss during peaks
                           │
                ┌──────────┴─────────────┐
                │        FILTERS         │  ◄── Grok, Mutate, Date, GeoIP
                └──────────┬─────────────┘
                           │
                ┌──────────┴─────────────┐
                │        OUTPUTS         │  ◄── Elasticsearch, S3, Email, Slack
                └────────────────────────┘
```

### 1. Persistent Queues (PQ)
By default, Logstash buffers events in memory. If the process crashes, data is lost. Enabling **Persistent Queues** writes incoming events to disk buffers before processing.
*   **Backpressure Control**: If Elasticsearch slows down under heavy load, Logstash PQ fills up, and Logstash signals downstream shippers (like Filebeat) to slow down, protecting the cluster from crash loops.

### 2. Filter Plugins (Parsing Engine)
Filters analyze, clean, and enrich incoming events:
*   **Grok**: Uses regular expressions to parse unstructured text into structured JSON variables.
*   **Mutate**: Cleans up fields (converts strings to integers, renames fields, drops unnecessary metadata).
*   **Date**: Parses dates from text and writes them directly into the standard `@timestamp` field, preventing sorting anomalies.
*   **GeoIP**: Adds geographic coordinates based on client IP addresses, allowing you to plot map visualizations.

---

## Kibana Mechanics

Kibana communicates with Elasticsearch nodes exclusively via the **REST API (Port 9200)**. It does not access index files directly from disk.

### Key Concepts
1.  **Index Patterns**: Before Kibana can search an index, you must create a matching index pattern (e.g., `app-logs-*`). This tells Kibana which fields are available and what their data types are (e.g., `status` is a keyword, `@timestamp` is a date).
2.  **Kibana Query Language (KQL)**: Used in the query bar to search logs.
    *   *Search status 500*: `status: 500`
    *   *Wildcard query*: `service: "payment-*"`
    *   *Range query*: `duration > 500`
    *   *Boolean logic*: `status: 500 AND NOT service: "auth"`
3.  **Dashboards**: Collects multiple visualization panels (pie charts, line graphs, geo-maps) into a single, real-time dashboard. When you filter by time or query in the main search bar, all panels update dynamically.

---

## Connecting the Stack: A Production-Grade Template

Let's build a working pipeline where a Spring Boot application writes logs to a local Logstash port, which structures them and ships them to Elasticsearch for visualization in Kibana.

### 1. Docker Compose Configuration (`docker-compose.yml`)

Save this configuration to launch a coordinated single-node ELK stack with resource limits and health checks:

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.1
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -q '\"status\":\"green\"\\|\"status\":\"yellow\"'"]
      interval: 10s
      timeout: 5s
      retries: 5

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.1
    container_name: logstash
    volumes:
      - ./logstash/config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
    ports:
      - "5044:5044" # TCP/Beats input
      - "5000:5000/tcp" # TCP Logback input
    environment:
      - "LS_JAVA_OPTS=-Xms256m -Xmx256m"
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.1
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  es_data:
    driver: local
```

### 2. Logstash Pipeline Configuration (`logstash/config/logstash.conf`)

Configure Logstash to accept structured JSON logs over TCP, extract variables, and route them to daily logs indices:

```ruby
input {
  tcp {
    port => 5000
    codec => json_lines
  }
}

filter {
  # Add custom metadata tags if missing
  if ![environment] {
    mutate {
      add_field => { "environment" => "production" }
    }
  }

  # Cast response duration to integer for range queries
  if [duration_ms] {
    mutate {
      convert => { "duration_ms" => "integer" }
    }
  }

  # Ensure dates are parsed correctly
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
    remove_field => [ "timestamp" ]
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "springboot-logs-%{+YYYY.MM.dd}"
  }
  
  # Also print to stdout for easy debugging
  stdout {
    codec => rubydebug
  }
}
```

### 3. Spring Boot Logback Setup (`src/main/resources/logback-spring.xml`)

Add the Logstash TCP appender to write structured JSON events directly to the pipeline.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- Include default Spring console appender -->
    <include resource="org/springframework/boot/logging/logback/defaults.xml" />
    <include resource="org/springframework/boot/logging/logback/console-appender.xml" />

    <!-- Logstash TCP Appender -->
    <appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <destination>localhost:5000</destination>
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp>
                    <timeZone>UTC</timeZone>
                </timestamp>
                <pattern>
                    <pattern>
                        {
                        "severity": "%level",
                        "service": "order-service",
                        "trace_id": "%mdc{traceId}",
                        "span_id": "%mdc{spanId}",
                        "thread": "%thread",
                        "class": "%logger{40}",
                        "message": "%message",
                        "exception": "%ex"
                        }
                    </pattern>
                </pattern>
            </providers>
        </encoder>
        <keepAliveDuration>5 minutes</keepAliveDuration>
    </appender>

    <!-- Configure profiles -->
    <springProfile name="dev">
        <root level="INFO">
            <appender-ref ref="CONSOLE" />
        </root>
    </springProfile>

    <springProfile name="prod">
        <root level="INFO">
            <appender-ref ref="CONSOLE" />
            <appender-ref ref="LOGSTASH" />
        </root>
    </springProfile>
</configuration>
```

:::tip[Encoder Configuration Details]
By using `net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder` instead of standard layout text formats, the application outputs pure, compact JSON. Elasticsearch is then able to index each field (`severity`, `service`, `trace_id`, `duration_ms`) directly without needing complex Grok regular expression parsing in Logstash, which saves significant CPU resources.
:::
