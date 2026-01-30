# Context Management

Moltbot introduces a powerful way to organize your digital life by separating different concerns into distinct chat contexts. This prevents "context pollution" where your coding session gets mixed up with your vacation planning.

## The Problem
When you talk to a single agent about everything—work, coding, family plans, groceries—the context window fills up with unrelated information. This can confuse the agent and makes it harder to retrieve specific details later.

## The Solution: Context Manager

The **Context Manager** skill enables your main agent to:
1. **Proactively suggest** creating a new chat when you switch topics.
2. **Spawn persistent sub-agents** dedicated to specific domains (e.g., "Work", "Travel", "Learning").
3. **Share memory** intelligently between sessions.

### How it works

- **Automatic Suggestions**: If you are coding and suddenly ask "Where should I go for dinner?", the agent might ask: *"Would you like to open a separate 'Personal' chat for that?"*
- **Manual Creation**: You can simply say: *"Create a new chat for my Project X"*.

## The Admin Assistant

For organizational tasks, we provide a specialized **Admin Assistant**.

- **Role**: Executive Assistant.
- **Tasks**: Organizing notes, planning schedules, breaking down goals, and summarizing messy discussions.
- **Protocol**: It generates a **"State of Affairs"** summary at the end of sessions, making it easy for the main agent to know what's happening without reading the entire log.

### Example Usage

**User**: "I'm overwhelmed with my tasks. Can you help me organize?"

**Agent**: "I can spawn an Admin Assistant for you. It will help you list everything and prioritize. Shall I do that?"

**User**: "Yes."

*(A new session 'Admin Assistant' starts)*

**Admin Agent**: "I'm ready. Dump all your tasks on me, and I'll structure them into a prioritized list."

## Shared Memory

Even though contexts are separate, they aren't isolated islands.
- The Main Agent can **search** other sessions if you ask "What did I decide in my Work chat?".
- When spawning a new agent, the Main Agent passes a **summary** of the current conversation so the new agent has context.
