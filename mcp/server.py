import os
import json
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Personamaxing Hub Engine")

# Path relative to script location
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROADMAP_PATH = os.path.join(BASE_DIR, "data", "roadmap.json")

def load_roadmap():
    with open(ROADMAP_PATH, "r") as f:
        return json.load(f)

def save_roadmap(data):
    with open(ROADMAP_PATH, "w") as f:
        json.dump(data, f, indent=2)

@mcp.tool()
def get_roadmap() -> str:
    """Retrieve the entire Personamaxing roadmap, including all technical and biological layers."""
    try:
        data = load_roadmap()
        return json.dumps(data, indent=2)
    except Exception as e:
        return f"Error loading roadmap: {e}"

@mcp.tool()
def update_goal_status(layer_id: str, item_id: str, status: str) -> str:
    """
    Update the status of a specific goal/item in the roadmap.
    status should be 'done' or 'pending'.
    """
    try:
        data = load_roadmap()
        found = False
        for layer in data.get("layers", []):
            if layer["id"] == layer_id:
                for item in layer.get("items", []):
                    if item["id"] == item_id:
                        item["status"] = status
                        found = True
                        break
        
        if not found:
            for milestone in data.get("milestones", []):
                if milestone["id"] == item_id:
                    milestone["status"] = status
                    found = True
                    break

        if found:
            save_roadmap(data)
            return f"Successfully updated {item_id} to {status}."
        else:
            return f"Goal {item_id} not found."
    except Exception as e:
        return f"Error updating goal: {e}"

@mcp.tool()
def add_goal(layer_id: str, title: str, notes: str = "") -> str:
    """
    Add a new goal/item to a specific layer in the roadmap.
    """
    try:
        data = load_roadmap()
        for layer in data.get("layers", []):
            if layer["id"] == layer_id:
                item_id = f"{layer_id}_{title.lower().replace(' ', '_')[:20]}"
                layer["items"].append({
                    "id": item_id,
                    "title": title,
                    "status": "pending",
                    "notes": notes
                })
                save_roadmap(data)
                return f"Successfully added goal: {title} (ID: {item_id}) to {layer_id}."
        
        return f"Layer {layer_id} not found."
    except Exception as e:
        return f"Error adding goal: {e}"

@mcp.tool()
def get_summary() -> str:
    """Get a high-level summary of progress across technical and biological stacks."""
    try:
        data = load_roadmap()
        layers = data.get("layers", [])
        summary = []
        for l in layers:
            total = len(l.get("items", []))
            done = len([i for i in l.get("items", []) if i.status == "done"])
            percent = (done / total * 100) if total > 0 else 0
            summary.append(f"- {l['title']}: {percent:.1f}% ({done}/{total})")
        
        return "Personamaxing Progress Summary:\n" + "\n".join(summary)
    except Exception as e:
        return f"Error generating summary: {e}"

if __name__ == "__main__":
    mcp.run()
