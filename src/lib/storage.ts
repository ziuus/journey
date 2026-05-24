import fs from "node:fs/promises";
import path from "node:path";

type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

export interface RoadmapData {
  target_roles: string[];
  layers: JsonValue[];
  milestones: JsonValue[];
  mlops_devops: JsonValue[];
  security_ethics: JsonValue[];
}

type FirestoreValue = {
  arrayValue?: { values?: FirestoreValue[] };
  booleanValue?: boolean;
  doubleValue?: number;
  integerValue?: string;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: null;
  stringValue?: string;
};

const TEMPLATE_PATH = path.join(process.cwd(), "data", "roadmap.json");

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const collectionPrefix = process.env.FIREBASE_COLLECTION_PREFIX || "journ";

  if (!projectId || !apiKey) {
    return null;
  }

  return {
    apiKey,
    collectionName: `${collectionPrefix}_roadmaps`,
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
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
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
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  return { stringValue: value };
}

function fromFirestoreValue(value?: FirestoreValue): JsonValue {
  if (!value) {
    return null;
  }

  if ("stringValue" in value && value.stringValue !== undefined) {
    return value.stringValue;
  }

  if ("booleanValue" in value && value.booleanValue !== undefined) {
    return value.booleanValue;
  }

  if ("integerValue" in value && value.integerValue !== undefined) {
    return Number(value.integerValue);
  }

  if ("doubleValue" in value && value.doubleValue !== undefined) {
    return value.doubleValue;
  }

  if ("nullValue" in value) {
    return null;
  }

  if (value.arrayValue) {
    return (value.arrayValue.values || []).map((item) => fromFirestoreValue(item));
  }

  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nestedValue]) => [key, fromFirestoreValue(nestedValue)]),
    );
  }

  return null;
}

function toFirestoreFields(data: RoadmapData) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value as JsonValue)]),
  );
}

function fromFirestoreDocument(fields?: Record<string, FirestoreValue>): RoadmapData {
  return {
    layers: (fromFirestoreValue(fields?.layers) as JsonValue[]) || [],
    milestones: (fromFirestoreValue(fields?.milestones) as JsonValue[]) || [],
    mlops_devops: (fromFirestoreValue(fields?.mlops_devops) as JsonValue[]) || [],
    security_ethics: (fromFirestoreValue(fields?.security_ethics) as JsonValue[]) || [],
    target_roles: (fromFirestoreValue(fields?.target_roles) as string[]) || [],
  };
}

async function fetchFirestoreRoadmap(userId: string): Promise<RoadmapData | null> {
  const config = getFirebaseConfig();

  if (!config) {
    return null;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${config.collectionName}/${getDocumentId(userId)}?key=${config.apiKey}`;
  const response = await fetch(url, {
    cache: "no-store",
    method: "GET",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Firestore read failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { fields?: Record<string, FirestoreValue> };
  return fromFirestoreDocument(payload.fields);
}

async function writeFirestoreRoadmap(userId: string, data: RoadmapData) {
  const config = getFirebaseConfig();

  if (!config) {
    return false;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${config.collectionName}/${getDocumentId(userId)}?key=${config.apiKey}`;
  const response = await fetch(url, {
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(`Firestore write failed with status ${response.status}`);
  }

  return true;
}

export async function getRoadmap(userId: string): Promise<RoadmapData> {
  const firestoreRoadmap = await fetchFirestoreRoadmap(userId);

  if (firestoreRoadmap) {
    return firestoreRoadmap;
  }

  return readTemplateRoadmap();
}

export async function saveRoadmap(userId: string, data: RoadmapData): Promise<void> {
  const didWriteToFirestore = await writeFirestoreRoadmap(userId, data).catch(() => false);

  if (didWriteToFirestore) {
    return;
  }

  await fs.writeFile(TEMPLATE_PATH, JSON.stringify(data, null, 2));
}
