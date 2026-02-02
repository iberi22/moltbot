# Agent Index - clawdbot-new

## Agentes Disponibles

| Agente | Rol | Modelo | Estado |
|--------|-----|--------|--------|
| **Clawd** | Principal | MiniMax M2.1 | ✅ Activo |
| **Jules** | Orquestador | GitCore CLI | ⚪ En espera |
| **Gemini CLI** | Investigador | v0.26.0 | ⚪ Disponible |

## Canales Activos

| Canal | Estado | Configuración |
|-------|--------|---------------|
| Telegram | ✅ | Bot token configurado |
| WhatsApp | ✅ | Baileys Web |
| Discord | ✅ | Webhook integration |

## Skills Python

| Skill | Proposito |
|-------|-----------|
| desktop-automation | Control mouse/teclado |
| keyboard-shortcuts | Shortcuts + process manager |
| multi-agent-coordinator | Gemini, Qwen, parallel |
| obsidian-integration | Documentacion proyectos |

## GitCore Integration

```bash
# Clawd crea issue en GitHub
gh issue create --title "Tarea" --body "..."

# Jules trabaja
gc task start "Tarea"
gc finish
gc report
```

---
*Generado: 2026-02-01*
