#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const os = require('os');

// Use ~/.journey as the data home for consistency with start-roadmap
const JOURNEY_HOME = path.join(os.homedir(), '.journey');
const DATA_DIR = process.env.JOURNEY_DATA_PATH || path.join(JOURNEY_HOME, 'data');
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');

const ROADMAP_PATH = fs.existsSync(path.join(DATA_DIR, 'roadmap.json')) 
  ? path.join(DATA_DIR, 'roadmap.json') 
  : path.join(LOCAL_DATA_DIR, 'roadmap.json');

const PROGRESS_HISTORY_PATH = fs.existsSync(path.join(DATA_DIR, 'progress_history.json'))
  ? path.join(DATA_DIR, 'progress_history.json')
  : path.join(LOCAL_DATA_DIR, 'progress_history.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

async function readRoadmap() {
  const data = await fs.readFile(ROADMAP_PATH, 'utf-8');
  return JSON.parse(data);
}

async function writeRoadmap(data) {
  await fs.writeFile(ROADMAP_PATH, JSON.stringify(data, null, 2));
}

async function appendProgressHistory(action, details) {
  try {
    let history = [];
    try {
      const data = await fs.readFile(PROGRESS_HISTORY_PATH, 'utf-8');
      history = JSON.parse(data);
    } catch (err) {
    }
    history.push({
      timestamp: new Date().toISOString(),
      action,
      details
    });
    await fs.writeFile(PROGRESS_HISTORY_PATH, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Failed to append progress history:', err);
  }
}

const tools = {
  get_roadmap: async () => {
    return await readRoadmap();
  },
  update_item_status: async ({ type, itemId, status, layerId }) => {
    const data = await readRoadmap();
    let found = false;
    let itemTitle = '';

    if (type === 'milestone') {
      const milestone = data.milestones.find((m) => m.id === itemId);
      if (milestone) {
        milestone.status = status;
        itemTitle = milestone.title;
        found = true;
      }
    } else if (type === 'layer' && layerId) {
      const layer = data.layers.find((l) => l.id === layerId);
      if (layer) {
        const item = layer.items.find((i) => i.id === itemId);
        if (item) {
          item.status = status;
          itemTitle = item.title;
          found = true;
        }
      }
    }

    if (!found) {
      return { error: `Item ${itemId} not found` };
    }

    await writeRoadmap(data);
    await appendProgressHistory('update_status', { type, itemId, title: itemTitle, status, layerId });
    return { success: true, message: `Updated ${itemId} to ${status}` };
  },
  add_goal: async ({ layerId, title, goal }) => {
    const data = await readRoadmap();
    const layer = data.layers.find((l) => l.id === layerId);

    if (!layer) {
      return { error: `Layer ${layerId} not found` };
    }

    const newItem = {
      id: `item_${layer.id}_${layer.items.length + 1}_${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
      title: title.trim(),
      status: 'pending',
      goal: goal || undefined,
    };

    layer.items.push(newItem);
    await writeRoadmap(data);
    await appendProgressHistory('add_goal', { layerId, itemId: newItem.id, title: newItem.title, status: newItem.status, goal: newItem.goal });

    return { success: true, item: newItem };
  }
};

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    
    // Basic MCP/JSON-RPC handling
    if (request.method === 'initialize') {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: { name: 'journey-mcp', version: '0.1.0' }
        }
      }));
    } else if (request.method === 'listTools') {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'get_roadmap',
              description: 'Get the current Journey roadmap data',
              inputSchema: { type: 'object', properties: {} }
            },
            {
              name: 'update_item_status',
              description: 'Update status of an item (done/pending)',
              inputSchema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['layer', 'milestone'] },
                  itemId: { type: 'string' },
                  status: { type: 'string', enum: ['pending', 'done'] },
                  layerId: { type: 'string' }
                },
                required: ['type', 'itemId', 'status']
              }
            },
            {
              name: 'add_goal',
              description: 'Add a new goal to a layer',
              inputSchema: {
                type: 'object',
                properties: {
                  layerId: { type: 'string' },
                  title: { type: 'string' },
                  goal: { type: 'string' }
                },
                required: ['layerId', 'title']
              }
            }
          ]
        }
      }));
    } else if (request.method === 'callTool') {
      const { name, arguments: args } = request.params;
      if (tools[name]) {
        const result = await tools[name](args);
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: { content: [{ type: 'text', text: JSON.stringify(result) }] }
        }));
      } else {
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: 'Method not found' }
        }));
      }
    }
  } catch (err) {
    // Silent catch for invalid JSON or other errors to keep stdio clean
  }
});
