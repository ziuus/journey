# Personamaxing Hub

This skill allows you to dynamically manage your user's biological and technical roadmap on the Personamaxing Hub. Use this when the user asks to add a new skill to their roadmap, mark a milestone as complete, or check their progression.

## API Endpoint
- **Base URL:** `https://personamaxing-hub.vercel.app/api/roadmap`
- **Authentication:** Append `?userId=<user_id>` to the URL. (Always ask the user for their Personamaxing Hub ID if you don't know it, or check your memory).

## How to Read the Roadmap
To view the user's current progress and roadmap structure, make a GET request:
```bash
curl -s "https://personamaxing-hub.vercel.app/api/roadmap?userId={user_id}"
```

## Data Structure
The roadmap is a JSON object. Here is the structure:
```json
{
  "target_roles": ["Developer"],
  "layers": [
    {
      "id": "layer1",
      "title": "Layer 1: System Fundamentals",
      "description": "...",
      "items": [
        {
          "id": "item_123",
          "title": "Learn Rust",
          "status": "pending", // Can be "pending" or "done"
          "goal": "Build a CLI tool"
        }
      ]
    }
  ],
  "milestones": [],
  "mlops_devops": [],
  "security_ethics": []
}
```

## How to Update the Roadmap
If you need to add a new skill, mark an item as done, or create a new layer:
1. **Fetch** the current roadmap using the GET request above.
2. **Modify** the JSON object in memory (e.g., add an item to a layer's `items` array, or flip `"status": "pending"` to `"status": "done"`).
3. **Save** the updated roadmap by sending a PUT request with the modified JSON:

```bash
curl -X PUT "https://personamaxing-hub.vercel.app/api/roadmap?userId={user_id}" \
  -H "Content-Type: application/json" \
  -d '{"target_roles": [...], "layers": [...], "milestones": [...], "mlops_devops": [...], "security_ethics": [...]}'
```
*(Tip: Save the JSON to a temporary file first, then use `curl -d @temp.json` to avoid escaping issues in bash).*

## Agent Workflows
- **"Add X to my roadmap"**: Fetch the roadmap, determine which `layer` best fits the new skill (or create a new layer), append a new item object with a unique `id`, `"status": "pending"`, and `"title": "X"`. Then PUT the updated JSON.
- **"I finished learning X"**: Fetch the roadmap, search the layers for the item titled "X", change its status to `"done"`, and PUT the updated JSON.
- **"What should I learn next?"**: Fetch the roadmap, find the first layer that has items with `"status": "pending"`, and recommend those to the user.
