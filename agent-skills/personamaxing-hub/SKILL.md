# Personamaxing Hub

This skill teaches you how to dynamically manage your user's biological and technical roadmap on the Personamaxing Hub. Use this when the user asks to add a new skill to their roadmap, mark a milestone as complete, or check their progression.

## MCP Tools Integration
The user has installed an MCP Server (`Personamaxing Hub Engine`) that gives you direct access to their live database. 

**Always ask the user for their Personamaxing Hub `user_id`** (e.g., their Google email or chosen username) if you don't already know it, or check your core memory.

### Available Tools:
1. `get_roadmap(user_id)`: Fetches the full JSON of the user's roadmap. Use this to understand their current structure, what layers exist, and what goals are pending.
2. `get_summary(user_id)`: Fetches a quick percentage completion summary of all layers.
3. `add_goal(user_id, layer_id, title, notes)`: Appends a new goal to a specific layer.
4. `update_goal_status(user_id, layer_id, item_id, status)`: Marks a goal as `"done"` or `"pending"`.

## Agent Workflows
- **"Add X to my roadmap"**: First, call `get_roadmap` to see the available `layer_id`s. Find the most appropriate layer (e.g., `layer1` for tech, `layer2` for bio). Then call `add_goal` with the new skill.
- **"I finished learning X"**: First, call `get_roadmap` to find the exact `item_id` and `layer_id` for "X". Then call `update_goal_status` to mark it as `"done"`.
- **"What should I learn next?"**: Call `get_roadmap`, find the first layer that has items with `"status": "pending"`, and recommend those to the user.
- **"How am I doing?"**: Call `get_summary` and present the progress to the user.
