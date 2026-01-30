---
name: context-manager
description: Manage separate chat contexts (agents) for different topics (Work, Personal, Admin, etc.). Proactively suggest splitting chats when topics mix.
---

# Context Manager

This skill allows you to help the user organize their digital life by separating concerns into different agents/sessions.

## When to use
- When the user asks to "create an agent" or "separate chat".
- **PROACTIVELY**: If the user switches topics frequently (e.g. from coding to planning a trip), suggest: "Would you like to continue this in a separate 'Travel' chat to keep your main context clean?"

## How to create a new context
Use the `sessions_spawn` tool to create a persistent sub-agent session.

1. **task**: The initial prompt or instruction for the new agent.
2. **label**: A user-friendly name (e.g., "Work Chat", "Vacation Planner").
3. **cleanup**: Set to `"keep"` so the session persists and can be returned to.
4. **agentId**: (Optional) Use a specific specialized agent profile if available (e.g., "coding-agent" for coding tasks). Otherwise, it defaults to the current agent structure.

## Shared Memory / Context Passing
When creating a new context, ensure the new agent has the necessary background:
1. Summarize the relevant information from the current conversation.
2. Pass this summary in the `task` field or append it to the `extraSystemPrompt` so the new agent starts with memory.

## Retrieving Context
To access memory from other sessions:
- Use `sessions_list` to find active sessions.
- Use `sessions_history` to read the logs of a specific session if you need to recall details discussed in a different context.
