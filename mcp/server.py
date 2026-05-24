import os
import json
import urllib.request
import urllib.error
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Personamaxing Hub Engine")

API_BASE_URL = "https://personamaxing-hub.vercel.app/api/roadmap"

def load_roadmap(user_id: str):
    url = f"{API_BASE_URL}?userId={user_id}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        raise Exception(f"Failed to fetch roadmap for {user_id}: {e}")

def save_roadmap(user_id: str, data: dict):
    url = f"{API_BASE_URL}?userId={user_id}"
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode(), 
        headers={'Content-Type': 'application/json'}, 
        method='PUT'
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        raise Exception(f"Failed to save roadmap for {user_id}: {e}")

@mcp.tool()
def get_roadmap(user_id: str) -> str:
    """Retrieve the entire Personamaxing roadmap from the live database for a specific user."""
    try:
        data = load_roadmap(user_id)
        return json.dumps(data, indent=2)
    except Exception as e:
        return f"Error loading roadmap: {e}"

@mcp.tool()
def update_goal_status(user_id: str, layer_id: str, item_id: str, status: str) -> str:
    """
    Update the status of a specific goal/item in the user's roadmap.
    status should be 'done' or 'pending'.
    """
    try:
        data = load_roadmap(user_id)
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
            save_roadmap(user_id, data)
            return f"Successfully updated {item_id} to {status} for user {user_id}."
        else:
            return f"Goal {item_id} not found."
    except Exception as e:
        return f"Error updating goal: {e}"

@mcp.tool()
def add_goal(user_id: str, layer_id: str, title: str, notes: str = "") -> str:
    """
    Add a new goal/item to a specific layer in the user's roadmap.
    """
    try:
        data = load_roadmap(user_id)
        for layer in data.get("layers", []):
            if layer["id"] == layer_id:
                item_id = f"{layer_id}_{title.lower().replace(' ', '_')[:20]}"
                if "items" not in layer:
                    layer["items"] = []
                layer["items"].append({
                    "id": item_id,
                    "title": title,
                    "status": "pending",
                    "notes": notes
                })
                save_roadmap(user_id, data)
                return f"Successfully added goal: {title} (ID: {item_id}) to {layer_id} for user {user_id}."
        
        return f"Layer {layer_id} not found."
    except Exception as e:
        return f"Error adding goal: {e}"

@mcp.tool()
def get_summary(user_id: str) -> str:
    """Get a high-level summary of progress across technical and biological stacks for a user."""
    try:
        data = load_roadmap(user_id)
        layers = data.get("layers", [])
        summary = []
        for l in layers:
            total = len(l.get("items", []))
            done = len([i for i in l.get("items", []) if i.get("status") == "done"])
            percent = (done / total * 100) if total > 0 else 0
            summary.append(f"- {l['title']}: {percent:.1f}% ({done}/{total})")
        
        return f"Personamaxing Progress Summary for {user_id}:\n" + "\n".join(summary)
    except Exception as e:
        return f"Error generating summary: {e}"

if __name__ == "__main__":
    mcp.run()
