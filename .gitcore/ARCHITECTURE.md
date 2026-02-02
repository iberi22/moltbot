# Architecture - clawdbot-new

## CRITICAL DECISIONS - READ FIRST

| # | Category | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Migration | Gradual TS→Rust | No downtime |
| 2 | Channels | Multi-platform | Telegram, WhatsApp, Discord |
| 3 | Skills | Python scripts | Extensibilidad |

---

## Stack Actual
- **Language:** TypeScript (Node.js v22)
- **Channels:** Telegram (grammy), WhatsApp (Baileys), Discord (discord.js)
- **Gateway:** Puerto 18789, WebSocket + HTTP
- **Memory:** Archivos MD + MEMORY.md

## Arquitectura Actual

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Canales       │────▶│   Gateway       │────▶│   Skills        │
│ Telegram/WhatsApp│     │ (Puerto 18789)  │     │ Python scripts  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   OpenClaw Daemon   │
                    │   (TypeScript)      │
                    └─────────────────────┘
```

## Migration a synapse-agentic

- **Bridge Layer:** MCP Server para comunicación TS↔Rust
- **Decision Engine:** Consensus voting entre LLMs
- **Memory Store:** SurrealDB (reemplazar archivos MD)

## Componentes a Migrar (prioridad)

1. Memory Store → SurrealDB
2. Decision Engine → Rust
3. Agent Orchestration → Jules
4. MCP Server → Exponer herramientas

---
*Last updated: 2026-02-01*
