---
name: Kimi Swarm
description: Guide for using Kimi K2.5's "Swarm" capabilities to execute complex tasks in parallel.
---

# Kimi Swarm (Agent Cluster)

This skill enables you to leverage the "Swarm" (or Agent Cluster) capability of the Kimi K2.5 model. This allows you to break down complex, multi-step, or parallelizable tasks into smaller sub-tasks and delegate them to autonomous sub-agents.

## When to use Swarm

Use this capability when:
- You have a task that can be parallelized (e.g., "Check these 5 websites", "Refactor these 3 files").
- You have a complex task that requires a fresh context or specific focus (e.g., "Write a comprehensive test suite for this module").
- You want to "think" about a problem without cluttering the main conversation history.
- You are explicitly asked to use "swarm", "cluster", or "enjambre" modes.

## How to use

The primary tool for Swarm behavior is `sessions_spawn`.

### 1. Decompose the Task
Analyze the user's request and identify independent components.

### 2. Spawn Sub-agents
Use the `sessions_spawn` tool for each sub-task.

```javascript
// Example: Spawning a sub-agent to analyze a file
sessions_spawn({
  task: "Analyze src/utils.ts and identify any security vulnerabilities.",
  label: "security-audit-utils",
  model: "kimi-code/kimi-k2.5" // Optional, as it is now the default
})
```

### 3. Synthesize Results
The `sessions_spawn` tool is asynchronous but the sub-agent will eventually report back. In many cases, you (the main agent) do not need to wait actively if the sub-agent is just performing an action. However, if you need the information to proceed, you can check the status or ask the user to wait.

## Best Practices

- **Clear Instructions**: The `task` parameter is the *only* context the sub-agent receives initially (plus the file system). Be extremely specific.
- **Labeling**: Use the `label` parameter to keep track of what each sub-agent is doing.
- **Model Selection**: The system is optimized for `kimi-code/kimi-k2.5`. Stick to this model for best results in coding and reasoning tasks.
