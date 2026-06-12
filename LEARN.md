# 📖 Learning the Mastery Protocol

Journey is more than a tracker; it's a framework for high-altitude engineering. This guide explains the core concepts of the engine.

## 1. The HUD (Heads-Up Display)
The Home and Dashboard views function as your **Mission Control**.
- **Neural Map**: A 10-point radar chart. When you complete items in a specific layer (e.g., Systems), the corresponding vector on the map expands. Aim for a balanced, wide-reaching map.
- **Mastery Percent**: Calculated as the mathematical average of all nodes. This is your "Level" in the protocol.

## 2. The Goal Tree Architecture
Accessed via `/tree`, the Goal Tree is a visual representation of your dependencies.
- **Spine**: The vertical line connecting your Layers.
- **Branches**: The specific items (Nodes) within a layer.
- **Node Interaction**: In this view, clicking any node toggles its state. Use this to rapidly update your progress after a deep study session.

## 3. Data Sovereignty
Journey creates a `~/.journey` folder in your home directory on first run.
- `roadmap.json`: Your entire journey. You can back this up or manually edit it for bulk changes.
- `history.json`: Log of your achievements.
- **Syncing**: Because Journey is local-only, we recommend version-controlling your `~/.journey` directory in a private git repo if you want cross-device sync.

## 4. The Default Curriculum
The default template provides a generic starting point optimized for modern full-stack development:
- **Layer 1**: Web Fundamentals.
- **Layer 2**: Frontend Architecture.
- **Layer 3**: Backend & APIs.
- **Layer 4**: Infrastructure & Deployment.

## 5. UI Customization
Visit `/settings` to align the HUD with your cognitive preferences:
- **Accent Selection**: Switch between Cyber Cyan, Electric Purple, or Neon Green.
- **Density**: Use "Compact" for high-information density or "Comfortable" for a focus-centric view.

---

*Mastery is not a destination; it's a continuous optimization of your architectural interface with reality.*
