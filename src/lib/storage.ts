import fs from "node:fs/promises";
import path from "node:path";

type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

type FirestoreValue = {
  arrayValue?: { values?: FirestoreValue[] };
  booleanValue?: boolean;
  doubleValue?: number;
  integerValue?: string;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: null;
  stringValue?: string;
};

export interface RoadmapItem {
  id: string;
  title: string;
  status: "pending" | "done";
  goal?: string;
  notes?: string;
}

export interface LayerData {
  id: string;
  title: string;
  description: string;
  category?: string;
  items: RoadmapItem[];
}

export interface RoadmapData {
  target_roles: string[];
  layers: LayerData[];
  milestones: RoadmapItem[];
  mlops_devops: RoadmapItem[];
  security_ethics: RoadmapItem[];
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  command?: string;
  imagePreview?: string;
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryData {
  chats: ChatSession[];
  activeChatId?: string;
}

const DATA_DIR = process.env.JOURNEY_DATA_PATH || path.join(process.cwd(), "data");
const TEMPLATE_PATH = path.join(DATA_DIR, "roadmap.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const PROGRESS_HISTORY_PATH = path.join(DATA_DIR, "progress_history.json");
const HISTORY_TEMPLATE: HistoryData = { chats: [] };

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const collectionPrefix = process.env.FIREBASE_COLLECTION_PREFIX || "journ";

  if (!projectId || !apiKey) {
    return null;
  }

  return {
    apiKey,
    collectionHistory: `${collectionPrefix}_history`,
    collectionRoadmaps: `${collectionPrefix}_roadmaps`,
    projectId,
  };
}

function getDocumentId(userId: string) {
  const normalized = userId.trim().toLowerCase();
  return encodeURIComponent(normalized || "default");
}

async function readTemplateRoadmap(): Promise<RoadmapData> {
  const data = await fs.readFile(TEMPLATE_PATH, "utf-8");
  return JSON.parse(data) as RoadmapData;
}

function toFirestoreValue(value: JsonValue): FirestoreValue {
  if (value === null) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => toFirestoreValue(item)) } };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, toFirestoreValue(nestedValue)]),
        ),
      },
    };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  return { stringValue: String(value) };
}

function fromFirestoreValue(value?: FirestoreValue): JsonValue {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if ("nullValue" in value) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map((item) => fromFirestoreValue(item));
  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nestedValue]) => [key, fromFirestoreValue(nestedValue)]),
    );
  }
  return null;
}

function toFirestoreFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value as JsonValue)]),
  );
}

function fromFirestoreRoadmap(fields?: Record<string, FirestoreValue>): RoadmapData {
  return {
    layers: (fromFirestoreValue(fields?.layers) as unknown as LayerData[]) || [],
    milestones: (fromFirestoreValue(fields?.milestones) as unknown as RoadmapItem[]) || [],
    mlops_devops: (fromFirestoreValue(fields?.mlops_devops) as unknown as RoadmapItem[]) || [],
    security_ethics: (fromFirestoreValue(fields?.security_ethics) as unknown as RoadmapItem[]) || [],
    target_roles: (fromFirestoreValue(fields?.target_roles) as unknown as string[]) || [],
  };
}

function fromFirestoreHistory(fields?: Record<string, FirestoreValue>): HistoryData {
  const chats = (fromFirestoreValue(fields?.chats) as unknown as ChatSession[]) || [];
  const legacyMessages = (fromFirestoreValue(fields?.messages) as unknown as ChatMessage[]) || [];

  if (chats.length > 0) {
    return {
      activeChatId: (fromFirestoreValue(fields?.activeChatId) as string | null) || chats[0]?.id,
      chats,
    };
  }

  if (legacyMessages.length > 0) {
    const migratedChat: ChatSession = {
      createdAt: legacyMessages[0]?.timestamp || Date.now(),
      id: "chat_legacy",
      messages: legacyMessages,
      title: "Imported chat",
      updatedAt: legacyMessages.at(-1)?.timestamp || Date.now(),
    };

    return {
      activeChatId: migratedChat.id,
      chats: [migratedChat],
    };
  }

  return {
    activeChatId: (fromFirestoreValue(fields?.activeChatId) as string | null) || undefined,
    chats: [],
  };
}

async function readFirestoreDocument(collection: string, userId: string) {
  const config = getFirebaseConfig();
  if (!config) return null;

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${collection}/${getDocumentId(userId)}?key=${config.apiKey}`;
  const response = await fetch(url, { cache: "no-store", method: "GET" });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore read failed with status ${response.status}`);

  return (await response.json()) as { fields?: Record<string, FirestoreValue> };
}

async function writeFirestoreData(userId: string, collection: string, data: Record<string, unknown>) {
  const config = getFirebaseConfig();
  if (!config) return false;

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${collection}/${getDocumentId(userId)}?key=${config.apiKey}`;
  const response = await fetch(url, {
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Firestore write failed to ${collection}: ${response.status}`, errorBody);
    return false;
  }

  return true;
}

export async function getRoadmap(userId: string): Promise<RoadmapData> {
  const config = getFirebaseConfig();

  try {
    if (config) {
      const payload = await readFirestoreDocument(config.collectionRoadmaps, userId);
      if (payload) return fromFirestoreRoadmap(payload.fields);

      const template = await readTemplateRoadmap();
      await saveRoadmap(userId, template);
      return template;
    }
  } catch (err) {
    console.warn("Cloud read failed, falling back to local template", err);
  }

  return readTemplateRoadmap();
}

export async function saveRoadmap(userId: string, data: RoadmapData) {
  const config = getFirebaseConfig();
  const didWriteToFirestore = config
    ? await writeFirestoreData(userId, config.collectionRoadmaps, data as unknown as Record<string, unknown>)
    : false;

  if (didWriteToFirestore) return;

  try {
    await fs.writeFile(TEMPLATE_PATH, JSON.stringify(data, null, 2));
    return;
  } catch (err) {
    console.error("Failed to write to local storage:", err);
    throw new Error("Local storage unavailable.");
  }
}

export async function getHistory(userId: string): Promise<HistoryData> {
  const config = getFirebaseConfig();

  try {
    if (config) {
      const payload = await readFirestoreDocument(config.collectionHistory, userId);
      if (payload) return fromFirestoreHistory(payload.fields);
    }
  } catch (err) {
    console.warn("Cloud history read failed", err);
  }

  try {
    const historyPath = path.join(process.cwd(), "data", "history.json");
    const data = await fs.readFile(historyPath, "utf-8");
    return JSON.parse(data) as HistoryData;
  } catch (err) {
    return HISTORY_TEMPLATE;
  }
}

export async function saveHistory(userId: string, data: HistoryData) {
  const config = getFirebaseConfig();
  const didWriteToFirestore = config
    ? await writeFirestoreData(userId, config.collectionHistory, data as unknown as Record<string, unknown>)
    : false;

  if (didWriteToFirestore) return;

  try {
    const historyPath = path.join(process.cwd(), "data", "history.json");
    await fs.writeFile(historyPath, JSON.stringify(data, null, 2));
    return;
  } catch (err) {
    console.error("Failed to write history to local storage:", err);
    console.warn("Local history storage unavailable.");
  }
}
