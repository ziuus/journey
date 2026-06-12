# Journey

This skill teaches you how to dynamically manage your user's biological and technical roadmap on the Journey. Use this when the user asks to add a new skill to their roadmap, mark a milestone as complete, or check their progression.

## MCP Tools Integration
The user has installed an MCP Server (`Journey Engine`) that gives you direct access to their live database. 

**Always ask the user for their Journey `user_id`** (e.g., their Google email or chosen username) if you don't already know it, or check your core memory.

### Available Tools:
1. `get_roadmap()`: Fetches the full JSON of your current roadmap. Use this to understand the structure, layers, and pending tasks.
2. `add_goal(layer_id, title, goal)`: Appends a new goal to a specific layer.
3. `update_item_status(type, itemId, status, layerId)`: Marks a goal or milestone as `"done"` or `"pending"`. `type` must be `"layer"` or `"milestone"`.

## Agent Workflows
- **"Add X to my roadmap"**: Call `get_roadmap` to see available layers, then `add_goal` with the new skill.
- **"I finished learning X"**: Find the `itemId` and `layerId` via `get_roadmap`, then call `update_item_status` with `status: "done"`.
- **"What should I learn next?"**: Call `get_roadmap`, find the first incomplete layer, and suggest its pending tasks.
