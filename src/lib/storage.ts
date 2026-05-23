
export interface RoadmapData {
  target_roles: string[];
  layers: any[];
  milestones: any[];
  mlops_devops: any[];
  security_ethics: any[];
}

export async function getRoadmap(userId: string): Promise<RoadmapData | null> {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    const response = await fetch(`${KV_REST_API_URL}/get/roadmap:${userId}`, {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });
    const data = await response.json();
    return data.result ? JSON.parse(data.result) : null;
  }

  try {
    const fs = require('fs/promises');
    const path = require('path');
    const DATA_PATH = path.join(process.cwd(), 'data', 'roadmap.json');
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export async function saveRoadmap(userId: string, data: RoadmapData): Promise<void> {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;

  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    await fetch(`${KV_REST_API_URL}/set/roadmap:${userId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
      body: JSON.stringify(data),
    });
    return;
  }

  const fs = require('fs/promises');
  const path = require('path');
  const DATA_PATH = path.join(process.cwd(), 'data', 'roadmap.json');
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}
