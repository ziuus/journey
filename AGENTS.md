# 🤖 AI Agent Setup Guide

Journey is built to be **Agent-Native**. This means your AI agents (Claude, Gemini, ChatGPT, etc.) can directly manage your roadmap while you chat.

## 1. The Journey Engine (MCP)
Journey provides a built-in **Model Context Protocol (MCP)** server. This is the bridge that allows agents to see your progress and update your goals.

### Quick Setup (Claude Desktop / Gemini CLI)
Add the following to your configuration:

```json
{
  "mcpServers": {
    "journey": {
      "command": "journey-mcp",
      "args": []
    }
  }
}
```

### Available Agent Tools
*   `get_roadmap`: Shows the agent your entire mastery tree.
*   `update_item_status`: Allows the agent to mark a task as `"done"` or `"pending"`.
*   `add_goal`: Allows the agent to dynamically expand your roadmap with new tasks.

## 2. Training your Agent
To give your agent the "Intelligence" of how to handle the Journey, point it to the skill file:

`agent-skills/journey/SKILL.md`

## 3. Recommended Workflow
Once set up, you can simply tell your agent:
> "Hey, I just finished the Rust Raft implementation. Check it off my roadmap and show me what's next."

The agent will use the MCP server to verify your state and update your local `roadmap.json` automatically.

---
*Built for the 2030 Engineering Frontier.*
